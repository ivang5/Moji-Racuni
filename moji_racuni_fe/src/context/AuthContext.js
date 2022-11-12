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
    const response = await fetch("http://127.0.0.1:8000/api/token/", {
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
      // TODO: Prikazati gresku na lepsi nacin
      alert("Doslo je do greske");
    }
  };

  const loginUser = async (e) => {
    e.preventDefault();
    await callLogin(e.target.username.value, e.target.password.value);
  };

  const registerUser = async (e) => {
    e.preventDefault();

    if (e.target.password.value !== e.target.password1.value) {
      // TODO: Prikazati gresku na lepsi nacin
      alert("Lozinke moraju biti iste!");
    }

    const response = await fetch("http://127.0.0.1:8000/api/users/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: e.target.name.value,
        last_name: e.target.lastname.value,
        email: e.target.email.value,
        username: e.target.username.value,
        password: e.target.password.value,
        role: "REGULAR",
        date_joined: "2022-11-12",
        is_active: true,
      }),
    });

    if (response.status === 201) {
      await callLogin(e.target.username.value, e.target.password.value);
    } else {
      // TODO: Prikazati gresku na lepsi nacin
      alert("Doslo je do greske");
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/login");
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
