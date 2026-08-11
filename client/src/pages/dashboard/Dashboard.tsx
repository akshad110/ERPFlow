import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Package,
  RefreshCw,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
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
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardService.getStats,
  });

  const stats = statsQuery.data;

  const cards = [
    {
      label: "Customers",
      value: stats?.customersCount,
      hint: "CRM records & follow-ups",
      icon: Users,
      to: "/customers",
    },
    {
      label: "Products",
      value: stats?.productsCount,
      hint: "Catalog and warehouse stock",
      icon: Package,
      to: "/products",
    },
    {
      label: "Low stock",
      value: stats?.lowStockCount,
      hint: "Items at or below alert level",
      icon: TriangleAlert,
      to: "/products",
      warn: (stats?.lowStockCount ?? 0) > 0,
    },
    {
      label: "Challans",
      value: stats?.challansCount,
      hint: `${stats?.draftChallansCount ?? 0} draft · ${stats?.confirmedChallansCount ?? 0} confirmed`,
      icon: ClipboardList,
      to: "/challans",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Live snapshot of customers, inventory and challan activity."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white"
            onClick={() => statsQuery.refetch()}
            disabled={statsQuery.isFetching}
          >
            <RefreshCw
              className={`size-3.5 ${statsQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {statsQuery.isLoading ? <LoadingState label="Loading dashboard..." /> : null}

      {statsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(statsQuery.error, "Failed to load dashboard stats")}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 border-red-200 bg-white"
            onClick={() => statsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
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
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/30"
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

          <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Recent challans
                </h2>
                <p className="text-xs text-slate-500">Latest 5 sales challans</p>
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
                  description="When sales creates challans, the latest ones will show up here."
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
                          {challan.challanNumber}
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
