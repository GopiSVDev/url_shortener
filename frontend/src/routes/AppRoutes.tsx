import MainLayout from "@/layouts/MainLayout";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
