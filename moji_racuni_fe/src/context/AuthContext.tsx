import {
  createContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router";
import type { AuthTokens, JwtPayload } from "../types/models";
import { API_BASE_URL } from "../config";

type LoginForm = HTMLFormElement & {
  username: HTMLInputElement;
  password: HTMLInputElement;
};

type RegisterForm = HTMLFormElement & {
  regEmail: HTMLInputElement;
  regUsername: HTMLInputElement;
  regPassword: HTMLInputElement;
};

// Greške validacije sa BE-a po poljima, npr. { password: ["Ova lozinka je prekratka..."] }
export type FieldErrors = Record<string, string[]>;

export type RegistrationResult = {
  status: number;
  errors: FieldErrors;
};

type AuthContextValue = {
  user: JwtPayload | null;
  authTokens: AuthTokens | null;
  storeAuthTokens: (tokens: AuthTokens) => void;
  loginUser: (
    e: React.FormEvent<HTMLFormElement>,
  ) => Promise<number | undefined>;
  registerUser: (
    e: React.FormEvent<HTMLFormElement>,
  ) => Promise<RegistrationResult | undefined>;
  logoutUser: () => void;
};

const defaultAuthContext: AuthContextValue = {
  user: null,
  authTokens: null,
  storeAuthTokens: () => undefined,
  loginUser: async () => 0,
  registerUser: async () => ({ status: 0, errors: {} }),
  logoutUser: () => undefined,
};

const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

export default AuthContext;

const getStoredTokens = () => {
  try {
    const rawTokens = localStorage.getItem("authTokens");
    return rawTokens ? JSON.parse(rawTokens) : null;
  } catch {
    localStorage.removeItem("authTokens");
    return null;
  }
};

const decodeAccessToken = (tokens: AuthTokens | null): JwtPayload | null => {
  if (!tokens?.access) {
    return null;
  }

  try {
    return jwtDecode(tokens.access);
  } catch {
    localStorage.removeItem("authTokens");
    return null;
  }
};

const readFieldErrors = async (response: Response): Promise<FieldErrors> => {
  try {
    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(data).filter(([, messages]) => Array.isArray(messages)),
    ) as FieldErrors;
  } catch {
    return {};
  }
};

// Odjava poništava refresh token na BE-u; ishod se ne čeka (korisnik se odjavljuje u svakom slučaju)
const revokeRefreshToken = (refresh: string) => {
  fetch(`${API_BASE_URL}/api/token/blacklist/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
    keepalive: true,
  }).catch(() => undefined);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authTokens, setAuthTokens] = useState(() => getStoredTokens());
  const [user, setUser] = useState(() => decodeAccessToken(getStoredTokens()));
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    setUser(decodeAccessToken(authTokens));
    setLoading(false);
  }, [authTokens]);

  const storeAuthTokens = useCallback((tokens: AuthTokens) => {
    localStorage.setItem("authTokens", JSON.stringify(tokens));
    setAuthTokens(tokens);
    setUser(jwtDecode(tokens.access));
  }, []);

  const callLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.status === 200) {
        storeAuthTokens(await response.json());
        navigate("/");
      } else {
        return response.status;
      }
    } catch {
      return 0;
    }
  };

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as LoginForm;
    return await callLogin(form.username.value, form.password.value);
  };

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as RegisterForm;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.regEmail.value,
          username: form.regUsername.value,
          password: form.regPassword.value,
        }),
      });

      if (response.status === 201) {
        await callLogin(form.regUsername.value, form.regPassword.value);
      } else {
        return {
          status: response.status,
          errors:
            response.status === 400 ? await readFieldErrors(response) : {},
        };
      }
    } catch {
      return { status: 0, errors: {} };
    }
  };

  const logoutUser = () => {
    const refresh = getStoredTokens()?.refresh;
    if (refresh) {
      revokeRefreshToken(refresh);
    }
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/prijava");
  };

  const contextData = {
    user: user,
    authTokens: authTokens,
    storeAuthTokens: storeAuthTokens,
    loginUser: loginUser,
    registerUser: registerUser,
    logoutUser: logoutUser,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
