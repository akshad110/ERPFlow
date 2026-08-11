import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authStorage } from "@/lib/authStorage";
import { authService } from "@/services/auth.service";
import type { AuthUser, LoginResponse } from "@/types/auth.types";
import type { UserRole } from "@/types/auth.types";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (payload: LoginResponse) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [user, setUser] = useState<AuthUser | null>(
    () => authStorage.getUser<AuthUser>()
  );

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
      authStorage.setUser(meQuery.data);
    }
  }, [meQuery.data]);

  useEffect(() => {
    if (meQuery.isError) {
      authStorage.clearAll();
      setToken(null);
      setUser(null);
    }
  }, [meQuery.isError]);

  const login = useCallback(
    (payload: LoginResponse) => {
      authStorage.setToken(payload.token);
      authStorage.setUser(payload.user);
      setToken(payload.token);
      setUser(payload.user);
      queryClient.setQueryData(["auth", "me"], payload.user);
    },
    [queryClient]
  );

  const logout = useCallback(() => {
    authStorage.clearAll();
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const isBootstrapping = Boolean(token) && meQuery.isLoading && !user;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      login,
      logout,
      hasRole,
    }),
    [user, token, isBootstrapping, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
