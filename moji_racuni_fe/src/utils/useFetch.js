import { useContext } from "react";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";

const useFetch = () => {
  const { authTokens, setAuthTokens, setUser, logoutUser } =
    useContext(AuthContext);

  const baseURL = "http://127.0.0.1:8000";

  const originalRequest = async (url, config) => {
    url = `${baseURL}${url}`;
    const response = await fetch(url, config);
    const data = await response.json();
    return { response, data };
  };

  const refreshToken = async (authTokens) => {
    const response = await fetch(`${baseURL}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: authTokens.refresh }),
    });
    const data = await response.json();

    if (response.status === 401) {
      logoutUser();
      return null;
    }

    localStorage.setItem("authTokens", JSON.stringify(data));
    setAuthTokens(data);
    setUser(jwt_decode(data.access));
    return data;
  };

  const callFetch = async (url, config = {}) => {
    const user = jwt_decode(authTokens.access);
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;
    let at = authTokens;

    if (isExpired) {
      at = await refreshToken(authTokens);
    }

    config["headers"] = {
      Authorization: `Bearer ${at?.access}`,
    };

    const { response, data } = await originalRequest(url, config);
    return { response, data };
  };

  return callFetch;
};

export default useFetch;
