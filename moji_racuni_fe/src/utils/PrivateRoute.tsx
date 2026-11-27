import { Outlet, Navigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";

const PrivateRoute = () => {
  const { isAuthenticated } = useAuthUser();
  return isAuthenticated ? <Outlet /> : <Navigate to="/prijava" />;
};

export default PrivateRoute;
