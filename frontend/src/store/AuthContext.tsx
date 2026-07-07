import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { authApi } from "../services/authApi";
import type { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("chess_auth");
    if (!raw) {
      setIsLoading(false);
      return;
    }
    authApi
      .getProfile()
      .then((profile) => setUser(profile))
      .catch(() => localStorage.removeItem("chess_auth"))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string, rememberMe = false) {
    const result = await authApi.login(email, password, rememberMe);
    localStorage.setItem(
      "chess_auth",
      JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        rememberMe,
      }),
    );
    setUser(result.user);
    toast.success(`Welcome back, ${result.user.name.split(" ")[0]}!`);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout - clear local state regardless
    }
    localStorage.removeItem("chess_auth");
    setUser(null);
    toast.success("Logged out successfully");
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
