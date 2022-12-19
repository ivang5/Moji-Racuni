import { createContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem("authTokens")
      ? jwt_decode(localStorage.getItem("authTokens"))
      : null
  );
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (authTokens) {
      setUser(jwt_decode(authTokens.access));
    }
    setLoading(false);
  }, [authTokens, loading]);

  const callLogin = async (username, password) => {
    try {
      const response = await fetch("http://192.168.1.11:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
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
        `http://192.168.1.11:8000/api/users/${username}/`
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
      const response = await fetch("http://192.168.1.11:8000/api/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: e.target.regName.value,
          last_name: e.target.regLastname.value,
          email: e.target.regEmail.value,
          username: e.target.regUsername.value,
          password: e.target.regPassword.value,
          role: "REGULAR",
          date_joined: "2022-11-12",
          is_active: true,
        }),
      });

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
