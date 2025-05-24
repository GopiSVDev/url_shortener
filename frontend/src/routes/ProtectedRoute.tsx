import type { JSX } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: JSX.Element;
}) => {
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

export default ProtectedRoute;
