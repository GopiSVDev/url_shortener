import type { JSX } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = true;
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

export default ProtectedRoute;
