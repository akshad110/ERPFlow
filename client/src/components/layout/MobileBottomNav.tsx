import { NavLink } from "react-router-dom";
import { Boxes, ClipboardList, LayoutDashboard, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", to: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", to: "/customers", icon: UsersRound },
  { label: "Products", to: "/products", icon: Boxes },
  { label: "Challans", to: "/challans", icon: ClipboardList },
] as const;

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#b7d9cb] bg-[#f4fbf7]/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
                    isActive
                      ? "bg-erp-dark text-white"
                      : "text-[#45685f] hover:bg-erp-light/30 hover:text-erp-dark"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "size-5",
                        isActive ? "text-white" : "text-[#2fa084]"
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
