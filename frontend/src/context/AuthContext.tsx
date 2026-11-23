"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser, LoginCredentials, RegisterData, AuthResponse, UserRole } from "../types";

function formatApiError(data: any, fallback: string): string {
  if (!data) return fallback;
  const detail = data.detail ?? data.message ?? data.error;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const field = Array.isArray(item.loc) ? item.loc.slice(-1)[0] : "";
          const msg = item.msg || item.message || JSON.stringify(item);
          return field ? `${field}: ${msg}` : msg;
        }
        return String(item);
      })
      .join("; ");
  }
  if (typeof detail === "object" && detail !== null) {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  currentRole: UserRole | null;
  isAuthModalOpen: boolean;
  authModalMode: "signin" | "register";
  authModalRole: UserRole;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  openAuthModal: (role?: UserRole, mode?: "signin" | "register") => void;
  closeAuthModal: () => void;
  selectDashboardRole: (targetRole: UserRole) => boolean;
  canAccessRole: (role: UserRole) => boolean;
  rbacError: string | null;
  clearRbacError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "register">("signin");
  const [authModalRole, setAuthModalRole] = useState<UserRole>("patient");
  const [rbacError, setRbacError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("healthshield_token") || sessionStorage.getItem("healthshield_token");
        const storedUser = localStorage.getItem("healthshield_user") || sessionStorage.getItem("healthshield_user");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setAccessToken(storedToken);
          setUser(parsedUser);
          setCurrentRole(parsedUser.role);

          if (typeof document !== "undefined") {
            document.cookie = `healthshield_role=${parsedUser.role}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `healthshield_logged_in=true; path=/; max-age=604800; SameSite=Lax`;
          }

          // Verify token silently
          try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setUser(data.user);
                setCurrentRole(data.user.role);
              }
            } else if (res.status === 401) {
              // Token expired, clear
              clearSession();
            }
          } catch (err) {
            console.warn("Backend offline or unreachable, keeping local session cache:", err);
          }
        }
      } catch (e) {
        console.error("Failed to restore auth session:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearSession = () => {
    localStorage.removeItem("healthshield_token");
    localStorage.removeItem("healthshield_user");
    sessionStorage.removeItem("healthshield_token");
    sessionStorage.removeItem("healthshield_user");
    if (typeof document !== "undefined") {
      document.cookie = "healthshield_role=; path=/; max-age=0";
      document.cookie = "healthshield_logged_in=; path=/; max-age=0";
      document.cookie = "refresh_token=; path=/; max-age=0";
    }
    setAccessToken(null);
    setUser(null);
    setCurrentRole(null);
  };

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setRbacError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
          role: credentials.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(data, "Authentication failed"));
      }

      const authData = data as AuthResponse;
      const storage = credentials.remember_me ? localStorage : sessionStorage;
      storage.setItem("healthshield_token", authData.access_token);
      storage.setItem("healthshield_user", JSON.stringify(authData.user));

      if (typeof document !== "undefined") {
        document.cookie = `healthshield_role=${authData.user.role}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `healthshield_logged_in=true; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `refresh_token=${authData.refresh_token || "active"}; path=/; max-age=604800; SameSite=Lax`;
      }

      setAccessToken(authData.access_token);
      setUser(authData.user);
      setCurrentRole(authData.user.role);
      setIsAuthModalOpen(false);

      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthUser> => {
    setIsLoading(true);
    setRbacError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(formatApiError(resData, "Registration failed"));
      }

      const authData = resData as AuthResponse;
      sessionStorage.setItem("healthshield_token", authData.access_token);
      sessionStorage.setItem("healthshield_user", JSON.stringify(authData.user));

      if (typeof document !== "undefined") {
        document.cookie = `healthshield_role=${authData.user.role}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `healthshield_logged_in=true; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `refresh_token=${authData.refresh_token || "active"}; path=/; max-age=604800; SameSite=Lax`;
      }

      setAccessToken(authData.access_token);
      setUser(authData.user);
      setCurrentRole(authData.user.role);
      setIsAuthModalOpen(false);

      return authData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (e) {
      console.warn("Logout notification error:", e);
    } finally {
      clearSession();
    }
  };

  const openAuthModal = (role?: UserRole, mode: "signin" | "register" = "signin") => {
    if (role) setAuthModalRole(role);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
    setRbacError(null);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const canAccessRole = (targetRole: UserRole): boolean => {
    if (!user) return false;
    return user.role === targetRole;
  };

  const selectDashboardRole = (targetRole: UserRole): boolean => {
    if (!user) {
      // Prompt user to sign in for this target role
      openAuthModal(targetRole, "signin");
      return false;
    }

    if (user.role !== targetRole) {
      setRbacError(
        `Access Denied: You are authenticated as '${user.role.toUpperCase()}'. Your cryptographic credentials do not permit access to the '${targetRole.toUpperCase()}' workspace.`
      );
      return false;
    }

    setCurrentRole(targetRole);
    setRbacError(null);
    return true;
  };

  const clearRbacError = () => {
    setRbacError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        currentRole,
        isAuthModalOpen,
        authModalMode,
        authModalRole,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
        selectDashboardRole,
        canAccessRole,
        rbacError,
        clearRbacError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
