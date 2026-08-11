import { useEffect, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth.types";

type RoleRoutesProps = {
  allowedRoles: UserRole[];
};

export function RoleRoutes({ allowedRoles }: RoleRoutesProps) {
  const { user, hasRole } = useAuth();
  const notified = useRef(false);
  const denied = Boolean(user && !hasRole(...allowedRoles));

  useEffect(() => {
    if (denied && !notified.current) {
      notified.current = true;
      toast.error("You don’t have access to that page");
    }
  }, [denied]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (denied) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
