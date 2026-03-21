import { createContext, useState, useEffect, ReactNode } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import type { AuthTokens, JwtPayload } from "../types/models";

type LoginForm = HTMLFormElement & {
  username: HTMLInputElement;
  password: HTMLInputElement;
};

type RegisterForm = HTMLFormElement & {
  regEmail: HTMLInputElement;
  regUsername: HTMLInputElement;
  regPassword: HTMLInputElement;
};

type AuthContextValue = {
  user: JwtPayload | null;
  setUser: (user: JwtPayload | null) => void;
  authTokens: AuthTokens | null;
  setAuthTokens: (tokens: AuthTokens | null) => void;
  loginUser: (
    e: React.FormEvent<HTMLFormElement>,
  ) => Promise<number | undefined>;
  registerUser: (
    e: React.FormEvent<HTMLFormElement>,
  ) => Promise<number | undefined>;
  logoutUser: () => void;
};

const defaultAuthContext: AuthContextValue = {
  user: null,
  setUser: () => undefined,
  authTokens: null,
  setAuthTokens: () => undefined,
  loginUser: async () => 0,
  registerUser: async () => 0,
  logoutUser: () => undefined,
};

const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

export default AuthContext;

const getStoredTokens = () => {
  try {
    const rawTokens = localStorage.getItem("authTokens");
    return rawTokens ? JSON.parse(rawTokens) : null;
  } catch (error) {
    localStorage.removeItem("authTokens");
    return null;
  }
};

const decodeAccessToken = (tokens: AuthTokens | null): JwtPayload | null => {
  if (!tokens?.access) {
    return null;
  }

  try {
    return jwt_decode(tokens.access);
  } catch (error) {
    localStorage.removeItem("authTokens");
    return null;
  }
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

  const callLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        },
      );
      const data = await response.json();

      if (response.status === 200) {
        setAuthTokens(data);
        setUser(jwt_decode(data.access));
        localStorage.setItem("authTokens", JSON.stringify(data));
        navigate("/");
      } else {
        return response.status;
      }
    } catch (error) {
      return 0;
    }
  };

  const checkUsername = async (username: string) => {
    try {
      if (!Number.isNaN(Number(username))) {
        return 404;
      }
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/users/${username}/`,
      );
      return response.status;
    } catch (error) {
      return 0;
    }
  };

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as LoginForm;
    const usernameCheck = await checkUsername(form.username.value);

    if (usernameCheck === 200) {
      return await callLogin(form.username.value, form.password.value);
    }

    if (usernameCheck === 404) {
      return 404;
    }

    return 0;
  };

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as RegisterForm;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/users/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.regEmail.value,
            username: form.regUsername.value,
            password: form.regPassword.value,
            role: "REGULAR",
            date_joined: "2022-11-12",
            is_active: true,
          }),
        },
      );

      if (response.status === 201) {
        await callLogin(form.regUsername.value, form.regPassword.value);
      } else {
        return response.status;
      }
    } catch (error) {
      return 0;
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/prijava");
  };

  const contextData = {
    user: user,
    setUser: setUser,
    authTokens: authTokens,
    setAuthTokens: setAuthTokens,
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
