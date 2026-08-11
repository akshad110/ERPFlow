import { Bell, LogOut, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { EntityAvatar } from "@/components/common/EntityAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TopbarProps = {
  title?: string;
};

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  SALES: "Sales",
  WAREHOUSE: "Warehouse",
  ACCOUNTS: "Accounts",
};

export function Topbar({ title = "Workspace" }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#b7d9cb]/80 bg-[#f4fbf7]/85 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src="/ERPFlow_Green___White_Logo-removebg-preview.png"
          alt="ERPFlow"
          className="size-8 shrink-0 object-contain lg:hidden"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-erp-ink">{title}</p>
          <p className="hidden text-xs text-[#45685f] sm:block">
            Customers · stock · challans
          </p>
        </div>
      </div>

      <div className="hidden max-w-sm flex-1 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#45685f]" />
          <Input
            readOnly
            placeholder="Quick find coming soon"
            className="h-9 rounded-xl border-[#b7d9cb] bg-[#eaf7f1]/80 pl-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex rounded-xl p-2 text-[#45685f] hover:bg-erp-light/35 hover:text-erp-dark"
          aria-label="Notifications"
          onClick={() => toast.info("Coming soon feature")}
        >
          <Bell className="size-4" />
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-[#b7d9cb] bg-[#eaf7f1]/90 px-2 py-1">
          <EntityAvatar name={user?.name || "User"} size="sm" />
          <div className="hidden pr-1 leading-tight sm:block">
            <p className="text-xs font-semibold text-erp-ink">{user?.name}</p>
            <p className="text-[11px] text-[#45685f]">
              {user ? roleLabel[user.role] ?? user.role : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={logout}
          className="rounded-xl border-[#b7d9cb] bg-[#eaf7f1] text-erp-dark hover:bg-erp-light/40"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
