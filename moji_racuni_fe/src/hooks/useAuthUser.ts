import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const useAuthUser = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || null;
  const userId = user?.user_id || null;
  const username = user?.username || "";

  return {
    user,
    userRole,
    userId,
    username,
    isAdmin: userRole === "ADMIN",
    isRegular: userRole === "REGULAR",
    isAuthenticated: Boolean(user),
  };
};

export default useAuthUser;
