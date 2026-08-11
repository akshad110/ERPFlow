import { LogOut, Menu, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type TopbarProps = {
  onMenuClick: () => void;
  title?: string;
};

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  SALES: "Sales",
  WAREHOUSE: "Warehouse",
  ACCOUNTS: "Accounts",
};

export function Topbar({ onMenuClick, title = "Workspace" }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-[#f3f5f7]/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-200/70 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <p className="text-sm font-medium text-slate-800">{title}</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Manage customers, stock and challans
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 sm:flex">
          <UserRound className="size-4 text-slate-400" />
          <div className="leading-tight">
            <p className="text-xs font-medium text-slate-800">{user?.name}</p>
            <p className="text-[11px] text-slate-500">
              {user ? roleLabel[user.role] ?? user.role : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={logout}
          className="border-slate-200 bg-white"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
