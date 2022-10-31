import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);

  return (
    <div>
      <Link to="/">Home</Link>
      <span> | </span>
      {user ? (
        <span onClick={logoutUser}>Logout</span>
      ) : (
        <Link to="/Login">Login</Link>
      )}

      {user && <span className="pl-1">Hello {user.username}</span>}
    </div>
  );
};

export default Header;
