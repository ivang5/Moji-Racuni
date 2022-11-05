import React, { useState, useEffect } from "react";
import useFetch from "../utils/useFetch";

const Home = () => {
  const [users, setUsers] = useState([]);
  const api = useFetch();

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    const { response, data } = await api("/api/users/");

    if (response.status === 200) {
      setUsers(data);
    }
  };

  return (
    <div>
      <h1 className="py-1">Welcome to home page</h1>

      {users.length !== 0 ? (
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
