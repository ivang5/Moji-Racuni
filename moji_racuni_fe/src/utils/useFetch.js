import { useContext } from "react";
import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";

const useFetch = () => {
  const { authTokens, setAuthTokens, setUser, logoutUser } =
    useContext(AuthContext);

  const baseURL = "http://192.168.1.11:8000";

  const originalRequest = async (url, config) => {
    url = `${baseURL}${url}`;
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
    const user = jwt_decode(
      JSON.parse(localStorage.getItem("authTokens")).access
    );
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;
    let at = JSON.parse(localStorage.getItem("authTokens"));

    if (isExpired) {
      at = await refreshToken(JSON.parse(localStorage.getItem("authTokens")));
    }

    if (config === {}) {
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
