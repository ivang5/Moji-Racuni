import { useContext } from "react";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import type { AuthTokens, JwtPayload } from "../types/models";
import { API_BASE_URL } from "../config";

type RequestConfig = RequestInit & {
  headers?: HeadersInit;
};

const useFetch = () => {
  const { setAuthTokens, setUser, logoutUser } = useContext(AuthContext);
  let isRefreshing = false;

  const getStoredTokens = () => {
    try {
      const rawTokens = localStorage.getItem("authTokens");
      return rawTokens ? JSON.parse(rawTokens) : null;
    } catch {
      localStorage.removeItem("authTokens");
      return null;
    }
  };

  function delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

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

  const refreshToken = async (authTokens: AuthTokens) => {
    isRefreshing = true;
    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: authTokens.refresh }),
    });
    const data = await response.json();

    if (response.status !== 200 || !data?.access) {
      isRefreshing = false;
      logoutUser();
      return null;
    }

    localStorage.setItem("authTokens", JSON.stringify(data));
    setAuthTokens(data);
    setUser(jwt_decode(data.access));
    isRefreshing = false;
    return data;
  };

  const callFetch = async (url: string, config: RequestConfig = {}) => {
    const storedTokens = getStoredTokens();
    if (!storedTokens?.access || !storedTokens?.refresh) {
      logoutUser();
      return { response: { status: 401 } as Response, data: null as any };
    }

    let user: JwtPayload;
    try {
      user = jwt_decode<JwtPayload>(storedTokens.access);
    } catch {
      logoutUser();
      return { response: { status: 401 } as Response, data: null as any };
    }

    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

    if (isExpired) {
      if (!isRefreshing) {
        const refreshedTokens = await refreshToken(storedTokens);
        if (!refreshedTokens?.access) {
          return { response: { status: 401 } as Response, data: null as any };
        }
      } else {
        while (isRefreshing) {
          await delay(200);
        }
      }
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
