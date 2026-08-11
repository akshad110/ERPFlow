import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EntityAvatar } from "@/components/common/EntityAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="hidden text-xs text-slate-400 sm:block">
            Customers · stock · challans
          </p>
        </div>
      </div>

      <div className="hidden max-w-sm flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            readOnly
            placeholder="Quick find coming soon"
            className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:inline-flex"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 sm:flex">
          <EntityAvatar name={user?.name || "User"} size="sm" />
          <div className="pr-1 leading-tight">
            <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
            <p className="text-[11px] text-slate-400">
              {user ? roleLabel[user.role] ?? user.role : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={logout}
          className="rounded-xl border-slate-200 bg-white"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
