import { useContext } from "react";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";

const useFetch = () => {
  const { setAuthTokens, setUser, logoutUser } = useContext(AuthContext);
  let isRefreshing = false;

  const getStoredTokens = () => {
    try {
      const rawTokens = localStorage.getItem("authTokens");
      return rawTokens ? JSON.parse(rawTokens) : null;
    } catch (error) {
      localStorage.removeItem("authTokens");
      return null;
    }
  };

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const originalRequest = async (url, config) => {
    url = `${process.env.REACT_APP_BASE_URL}${url}`;
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }
    return { response, data };
  };

  const refreshToken = async (authTokens) => {
    isRefreshing = true;
    const response = await fetch(
      `${process.env.REACT_APP_BASE_URL}/api/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: authTokens.refresh }),
      },
    );
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

  const callFetch = async (url, config = {}) => {
    const storedTokens = getStoredTokens();
    if (!storedTokens?.access || !storedTokens?.refresh) {
      logoutUser();
      return { response: { status: 401 }, data: null };
    }

    let user;
    try {
      user = jwt_decode(storedTokens.access);
    } catch (error) {
      logoutUser();
      return { response: { status: 401 }, data: null };
    }

    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

    if (isExpired) {
      if (!isRefreshing) {
        const refreshedTokens = await refreshToken(storedTokens);
        if (!refreshedTokens?.access) {
          return { response: { status: 401 }, data: null };
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
      return { response: { status: 401 }, data: null };
    }

    config["headers"] = {
      ...(config.headers || {}),
      Authorization: `Bearer ${latestTokens.access}`,
    };

    const { response, data } = await originalRequest(url, config);
    return { response, data };
  };

  return callFetch;
};

export default useFetch;
