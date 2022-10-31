import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";

const Home = () => {
  const [users, setUsers] = useState([]);
  const { authTokens, logoutUser } = useContext(AuthContext);

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    const response = await fetch("http://127.0.0.1:8000/api/users/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authTokens.access}`,
      },
    });
    const data = await response.json();

    if (response.status === 200) {
      setUsers(data);
    } else if (response.statusText === "Unauthorized") {
      logoutUser();
    }
  };

  return (
    <div>
      <p>Welcome to home page</p>

      {users.length != 0 ? (
        <ul>
          {users.map((user) => (
            <li key={user.id}>{user.username}</li>
          ))}
        </ul>
      ) : (
        <p>Empty</p>
      )}
    </div>
  );
};

export default Home;
