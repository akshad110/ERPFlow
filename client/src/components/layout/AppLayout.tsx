import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/customers": "Customers",
  "/products": "Products",
  "/challans": "Sales Challans",
};

const COLLAPSE_KEY = "erpflow.sidebar.collapsed";

function resolveTitle(pathname: string) {
  const match = Object.keys(titleMap)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));
  return match ? titleMap[match] : "Workspace";
}

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  return (
    <div className="app-shell flex min-h-svh text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={resolveTitle(location.pathname)} />
        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-5">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
