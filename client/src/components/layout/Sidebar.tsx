import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth.types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
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

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "CRM",
    items: [{ label: "Customers", to: "/customers", icon: UsersRound }],
  },
  {
    label: "Inventory",
    items: [{ label: "Products", to: "/products", icon: Boxes }],
  },
  {
    label: "Sales",
    items: [{ label: "Challans", to: "/challans", icon: ClipboardList }],
  },
];

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { hasRole } = useAuth();
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
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-[#c5e6d8] bg-[#eaf7f1] text-erp-ink transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.5rem]" : "w-[17.5rem]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 pt-4 pb-3",
          collapsed ? "justify-center" : "justify-between px-4"
        )}
      >
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <img
            src="/ERPFlow_Green___White_Logo-removebg-preview.png"
            alt="ERPFlow"
            className={cn(
              "shrink-0 object-contain",
              collapsed ? "size-9" : "h-10 w-10"
            )}
          />
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold tracking-tight text-erp-ink">
                ERPFlow
              </p>
              <p className="text-[11px] text-[#5b8a7c]">Wholesale ops</p>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-lg p-2 text-[#5b8a7c] hover:bg-[#d8f3e4] hover:text-erp-ink"
            aria-label="Collapse sidebar"
            title="Collapse"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex justify-center pb-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-lg p-2 text-[#5b8a7c] hover:bg-[#d8f3e4] hover:text-erp-ink"
            aria-label="Expand sidebar"
            title="Expand"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      ) : (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#6a9a8a]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools"
              className="h-9 rounded-xl border-[#b7d9cb] bg-[#f7fcf9] pl-9 text-sm text-erp-ink placeholder:text-[#7aa394] shadow-none focus-visible:border-[#6fcf97] focus-visible:ring-[#6fcf97]/25"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-wide text-[#6a9a8a] uppercase">
                {group.label}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center rounded-xl text-sm font-medium transition-colors",
                        collapsed
                          ? "justify-center px-2 py-2.5"
                          : "gap-2.5 px-2.5 py-2",
                        isActive
                          ? "bg-[#6fcf97]/55 text-erp-ink shadow-sm"
                          : "text-[#3d6b5d] hover:bg-[#d8f3e4] hover:text-erp-ink"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            isActive ? "text-[#1f6f5f]" : "text-[#2fa084]"
                          )}
                        />
                        {!collapsed ? item.label : null}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
