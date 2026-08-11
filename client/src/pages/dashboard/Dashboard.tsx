import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
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
  const { hasRole } = useAuth();
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
        title="Operations overview"
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
                className="inline-flex h-8 items-center gap-2 rounded-xl bg-erp-dark px-3 text-sm font-medium text-white hover:bg-erp-dark/90"
              >
                <Plus className="size-3.5" />
                New challan
              </Link>
            ) : null}
            {canManageStock && (stats?.lowStockCount ?? 0) > 0 ? (
              <Link
                to="/products?lowStock=true"
                className="inline-flex h-8 items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50 px-3 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                <TriangleAlert className="size-3.5" />
                Low stock
              </Link>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-[#b7d9cb] bg-[#f4fbf7]"
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
          <div className="surface-panel overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#b7d9cb]/70 bg-[#eaf7f1]/60 px-4 py-2.5">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#5b8a7c] uppercase">
                Live snapshot
              </p>
              <p className="text-[11px] text-[#6a9a8a]">Tap any metric to open</p>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.label}
                    to={card.to}
                    className={cn(
                      "group relative flex min-h-[148px] flex-col justify-between gap-5 p-5 transition-colors",
                      "hover:bg-[#dff5ea]/70",
                      index > 0 && "border-t border-[#b7d9cb]/55 sm:border-t-0",
                      index % 2 === 1 && "sm:border-l sm:border-[#b7d9cb]/55",
                      index > 1 && "xl:border-t-0",
                      index > 0 && "xl:border-l xl:border-[#b7d9cb]/55",
                      card.warn && "bg-gradient-to-br from-amber-50/90 to-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-y-4 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100",
                        card.warn ? "bg-amber-500" : "bg-[#6fcf97]"
                      )}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "inline-flex size-9 items-center justify-center rounded-xl",
                            card.warn
                              ? "bg-amber-100 text-amber-700"
                              : "bg-[#d8f3e4] text-[#1f6f5f]"
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-erp-ink">
                            {card.label}
                          </p>
                          <p className="text-[11px] text-[#6a9a8a]">
                            0{index + 1} / 04
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="size-4 text-[#9bb8ad] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#1f6f5f]" />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-3xl font-semibold tracking-tight tabular-nums",
                          card.warn ? "text-amber-700" : "text-erp-ink"
                        )}
                      >
                        {card.value ?? 0}
                      </p>
                      <p className="mt-1.5 max-w-[16rem] text-xs leading-relaxed text-[#5b736c]">
                        {card.hint}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="surface-panel mt-6 overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#b7d9cb]/70 bg-[#eaf7f1]/70 px-4 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-erp-ink">
                  Recent challans
                </h2>
                <p className="text-xs text-[#45685f]">{recentHint}</p>
              </div>
              <Link
                to="/challans"
                className="text-xs font-medium text-erp-dark hover:underline"
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
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-erp-dark px-3 text-sm text-white hover:bg-erp-dark/90"
                      >
                        <Plus className="size-4" />
                        New challan
                      </Link>
                    ) : null
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto bg-[#f7fcf9]/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#eaf7f1] text-xs uppercase tracking-wide text-[#45685f]">
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
                        className="border-t border-[#b7d9cb]/50 hover:bg-[#eaf7f1]/70"
                      >
                        <td className="px-4 py-3 font-medium text-erp-ink">
                          <Link
                            to={`/challans/${challan.id}`}
                            className="hover:text-erp-dark"
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
