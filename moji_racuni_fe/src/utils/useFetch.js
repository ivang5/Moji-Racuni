import { useContext } from "react";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import { BASE_URL } from "./utils";

const useFetch = () => {
  const { authTokens, setAuthTokens, setUser, logoutUser } =
    useContext(AuthContext);
  let isRefreshing = false;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  const originalRequest = async (url, config) => {
    url = `${BASE_URL}${url}`;
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
    const response = await fetch(`${BASE_URL}/api/token/refresh/`, {
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
    isRefreshing = false;
    return data;
  };

  const callFetch = async (url, config = {}) => {
    const user = jwt_decode(
      JSON.parse(localStorage.getItem("authTokens")).access
    );
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;
    let at = JSON.parse(localStorage.getItem("authTokens"));

    if (isExpired) {
      if (!isRefreshing) {
        at = await refreshToken(JSON.parse(localStorage.getItem("authTokens")));
      } else {
        while (isRefreshing) {
          await delay(200);
        }
      }
    }

    if (config === {} || config.headers) {
      config["headers"] = {
        Authorization: `Bearer ${
          JSON.parse(localStorage.getItem("authTokens"))?.access
        }`,
      };
    } else {
      config["headers"] = {
        Authorization: `Bearer ${
          JSON.parse(localStorage.getItem("authTokens"))?.access
        }`,
        "Content-Type": "application/json",
      };
    }

    const { response, data } = await originalRequest(url, config);
    return { response, data };
  };

  return callFetch;
};

export default useFetch;
