import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth.types";
import { cn } from "@/lib/utils";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", to: "/customers", icon: Users },
  { label: "Products", to: "/products", icon: Package },
  { label: "Challans", to: "/challans", icon: ClipboardList },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { hasRole } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(...item.roles)
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#15202b] text-slate-100 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">
              ERPFlow
            </p>
            <p className="text-xs text-slate-400">Operations Portal</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-700 text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <Icon className="size-4 shrink-0 opacity-90" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-500">
          Internal wholesale ops
        </div>
      </aside>
    </>
  );
}
