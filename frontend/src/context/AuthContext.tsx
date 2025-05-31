import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp?: number;
}

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);

  const isTokenValid = (token: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded.exp) return false;

      const expiry = decoded.exp * 1000;
      return Date.now() < expiry;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken && isTokenValid(savedToken)) {
      setToken(savedToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
