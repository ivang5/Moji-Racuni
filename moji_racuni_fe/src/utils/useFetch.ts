import { useContext } from "react";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import type { AuthTokens, JwtPayload } from "../types/models";
import { API_BASE_URL } from "../config";

type RequestConfig = RequestInit & {
  headers?: HeadersInit;
};

// Access token se osvežava malo pre isteka, da ne istekne dok je zahtev na putu do BE-a
const EXPIRY_MARGIN_MS = 10_000;

const getStoredTokens = (): AuthTokens | null => {
  try {
    const rawTokens = localStorage.getItem("authTokens");
    return rawTokens ? JSON.parse(rawTokens) : null;
  } catch {
    localStorage.removeItem("authTokens");
    return null;
  }
};

// Refresh token se posle upotrebe poništava (rotacija), pa svi zahtevi kojima je istekao access
// token čekaju isti refresh umesto da svaki pošalje svoj (zakasneli bi dobili 401 i odjavu).
// Novi tokeni se upisuju u localStorage pre nego što se refresh završi, da zahtev pokrenut posle
// toga ne bi pročitao stare tokene i krenuo u nov refresh sa već poništenim tokenom.
let refreshInFlight: Promise<AuthTokens | null> | null = null;

const refreshTokens = (refresh: string): Promise<AuthTokens | null> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh }),
        });
        const data = await response.json().catch(() => null);
        if (response.status !== 200 || !data?.access || !data?.refresh) {
          return null;
        }
        localStorage.setItem("authTokens", JSON.stringify(data));
        return data as AuthTokens;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const useFetch = () => {
  const { storeAuthTokens, logoutUser } = useContext(AuthContext);

  const originalRequest = async (url: string, config: RequestConfig) => {
    url = `${API_BASE_URL}${url}`;
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    return { response, data };
  };

  const callFetch = async (url: string, config: RequestConfig = {}) => {
    const storedTokens = getStoredTokens();
    if (!storedTokens?.access || !storedTokens?.refresh) {
      logoutUser();
      return { response: { status: 401 } as Response, data: null as any };
    }

    let user: JwtPayload;
    try {
      user = jwtDecode<JwtPayload>(storedTokens.access);
    } catch {
      logoutUser();
      return { response: { status: 401 } as Response, data: null as any };
    }

    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < EXPIRY_MARGIN_MS;

    if (isExpired) {
      const refreshedTokens = await refreshTokens(storedTokens.refresh);
      if (!refreshedTokens) {
        logoutUser();
        return { response: { status: 401 } as Response, data: null as any };
      }
      storeAuthTokens(refreshedTokens);
    }

    const latestTokens = getStoredTokens();
    if (!latestTokens?.access) {
      logoutUser();
      return { response: { status: 401 } as Response, data: null as any };
    }

    const headers = new Headers(config.headers || {});

    // Default JSON content type for string payloads unless caller set one explicitly.
    if (typeof config.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    headers.set("Authorization", `Bearer ${latestTokens.access}`);
    config.headers = headers;

    const { response, data } = await originalRequest(url, config);
    return { response, data };
  };

  return callFetch;
};

export default useFetch;
