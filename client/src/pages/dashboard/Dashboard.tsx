import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Package,
  Plus,
  RefreshCw,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dashboardService } from "@/services/dashboard.service";

const statusTone = {
  DRAFT: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
} as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const canManageChallans = hasRole("ADMIN", "SALES");
  const canManageStock = hasRole("ADMIN", "WAREHOUSE");

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardService.getStats,
  });

  const stats = statsQuery.data;

  const cards = [
    {
      label: "Customers",
      value: stats?.customersCount,
      hint: hasRole("ADMIN", "SALES")
        ? "CRM records & follow-ups"
        : "Customer directory (read-only)",
      icon: Users,
      to: "/customers",
      emphasize: false,
    },
    {
      label: "Products",
      value: stats?.productsCount,
      hint: canManageStock
        ? "Catalog and warehouse stock"
        : "Catalog and stock levels",
      icon: Package,
      to: "/products",
      emphasize: canManageStock,
    },
    {
      label: "Low stock",
      value: stats?.lowStockCount,
      hint: "Items at or below alert level",
      icon: TriangleAlert,
      to: "/products?lowStock=true",
      warn: (stats?.lowStockCount ?? 0) > 0,
      emphasize: canManageStock,
    },
    {
      label: "Challans",
      value: stats?.challansCount,
      hint: `${stats?.draftChallansCount ?? 0} draft · ${stats?.confirmedChallansCount ?? 0} confirmed`,
      icon: ClipboardList,
      to: "/challans",
      emphasize: canManageChallans,
    },
  ];

  const recentHint = canManageChallans
    ? "Latest 5 sales challans"
    : canManageStock
      ? "Recent challans that may affect stock"
      : "Latest challans for review";

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(" ")[0] ?? "there"}`}
        description={
          canManageChallans
            ? "Track customers, stock and challan activity."
            : canManageStock
              ? "Watch inventory levels and stock-impacting challans."
              : "Live snapshot of customers, inventory and challans."
        }
        breadcrumbs={[{ label: "Overview" }, { label: "Dashboard" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canManageChallans ? (
              <Link
                to="/challans/new"
                className="inline-flex h-8 items-center gap-2 rounded-xl bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800"
              >
                <Plus className="size-3.5" />
                New challan
              </Link>
            ) : null}
            {canManageStock && (stats?.lowStockCount ?? 0) > 0 ? (
              <Link
                to="/products?lowStock=true"
                className="inline-flex h-8 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                <TriangleAlert className="size-3.5" />
                Low stock
              </Link>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white rounded-xl"
              onClick={() => statsQuery.refetch()}
              disabled={statsQuery.isFetching}
            >
              <RefreshCw
                className={`size-3.5 ${statsQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {statsQuery.isLoading ? (
        <LoadingState label="Loading dashboard..." />
      ) : null}

      {statsQuery.isError ? (
        <ErrorState
          title="Could not load dashboard"
          message={getErrorMessage(
            statsQuery.error,
            "Failed to load dashboard stats"
          )}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 bg-white"
              onClick={() => statsQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  to={card.to}
                  className={cn(
                    "rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors",
                    card.warn
                      ? "border-amber-200 hover:border-amber-300 hover:bg-amber-50/40"
                      : card.emphasize
                        ? "border-teal-200 hover:border-teal-300 hover:bg-teal-50/40"
                        : "border-slate-200/80 hover:border-teal-200 hover:bg-teal-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{card.label}</p>
                      <p
                        className={`mt-2 text-2xl font-semibold tabular-nums ${
                          card.warn ? "text-amber-700" : "text-slate-900"
                        }`}
                      >
                        {card.value ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
                    </div>
                    <div
                      className={`rounded-lg p-2 ${
                        card.warn
                          ? "bg-amber-50 text-amber-700"
                          : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Recent challans
                </h2>
                <p className="text-xs text-slate-400">{recentHint}</p>
              </div>
              <Link
                to="/challans"
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                View all
              </Link>
            </div>

            {stats.recentChallans.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No challans yet"
                  description={
                    canManageChallans
                      ? "Create a draft challan to start shipping."
                      : "When sales creates challans, the latest ones will show up here."
                  }
                  action={
                    canManageChallans ? (
                      <Link
                        to="/challans/new"
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm text-white hover:bg-teal-800"
                      >
                        <Plus className="size-4" />
                        New challan
                      </Link>
                    ) : null
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Challan</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentChallans.map((challan) => (
                      <tr
                        key={challan.id}
                        className="border-t border-slate-100 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <Link
                            to={`/challans/${challan.id}`}
                            className="hover:text-teal-700"
                          >
                            {challan.challanNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{challan.customerName ?? "—"}</div>
                          {challan.businessName ? (
                            <div className="text-xs text-slate-400">
                              {challan.businessName}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">
                          {challan.totalQuantity}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={challan.status}
                            tone={statusTone[challan.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(challan.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
