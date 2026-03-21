import { createContext, useState, useEffect, ReactNode } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

type AuthContextValue = {
  user: any;
  setUser: (user: any) => void;
  authTokens: any;
  setAuthTokens: (tokens: any) => void;
  loginUser: (e: any) => Promise<number | undefined>;
  registerUser: (e: any) => Promise<number | undefined>;
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

const decodeAccessToken = (tokens) => {
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

  const callLogin = async (username, password) => {
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

  const checkUsername = async (username) => {
    try {
      if (!isNaN(username)) {
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

  const loginUser = async (e) => {
    e.preventDefault();
    const usernameCheck = await checkUsername(e.target.username.value);

    if (usernameCheck === 200) {
      return await callLogin(e.target.username.value, e.target.password.value);
    }

    if (usernameCheck === 404) {
      return 404;
    }

    return 0;
  };

  const registerUser = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/users/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: e.target.regEmail.value,
            username: e.target.regUsername.value,
            password: e.target.regPassword.value,
            role: "REGULAR",
            date_joined: "2022-11-12",
            is_active: true,
          }),
        },
      );

      if (response.status === 201) {
        await callLogin(e.target.regUsername.value, e.target.regPassword.value);
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
