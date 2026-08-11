import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  Search,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth.types";
import { EntityAvatar } from "@/components/common/EntityAvatar";
import { Input } from "@/components/ui/input";
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

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "CRM",
    items: [{ label: "Customers", to: "/customers", icon: Users }],
  },
  {
    label: "Inventory",
    items: [{ label: "Products", to: "/products", icon: Package }],
  },
  {
    label: "Sales",
    items: [{ label: "Challans", to: "/challans", icon: ClipboardList }],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, hasRole } = useAuth();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.roles && !hasRole(...item.roles)) return false;
          if (!q) return true;
          return item.label.toLowerCase().includes(q);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [hasRole, query]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/25 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-slate-200/80 bg-[#f8fafb] text-slate-700 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white shadow-sm">
              EF
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                ERPFlow
              </p>
              <p className="text-[11px] text-slate-400">Wholesale ops</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/70 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools"
              className="h-9 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                            : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-teal-600" />
                          ) : null}
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              isActive ? "text-teal-700" : "text-slate-400"
                            )}
                          />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200/80 px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 ring-1 ring-slate-200/80">
            <EntityAvatar name={user?.name || "User"} size="sm" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold text-slate-800">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {user?.role || "Role"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
