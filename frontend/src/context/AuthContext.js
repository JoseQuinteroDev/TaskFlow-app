import { createContext, useContext, useState, useEffect, useCallback } from "react";

import { formatApiError } from "../api/client";
import { authApi } from "../api/taskflowApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const data = await authApi.login({ email, password });
      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiError(error, error.message) };
    }
  };

  const register = async (email, password, name) => {
    try {
      const data = await authApi.register({ email, password, name });
      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiError(error, error.message) };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // noop
    }
    setUser(false);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
