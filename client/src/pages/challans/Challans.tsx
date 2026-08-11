import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EntityAvatar } from "@/components/common/EntityAvatar";
import { ListPanel } from "@/components/common/ListPanel";
import { RowActionsMenu } from "@/components/common/RowActionsMenu";
import { NativeSelect } from "@/components/common/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import { challanService } from "@/services/challan.service";
import type { ChallanStatus } from "@/types/challan.types";

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

export default function Challans() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "SALES");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const searchFromUrl = searchParams.get("search") || "";
  const status = (searchParams.get("status") || "") as ChallanStatus | "";
  const hasFilters = Boolean(searchFromUrl || status);

  const [searchInput, setSearchInput] = useState(searchFromUrl);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === searchFromUrl) return;

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set("search", trimmed);
        else next.delete("search");
        next.set("page", "1");
        return next;
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchFromUrl, setSearchParams]);

  const challansQuery = useQuery({
    queryKey: ["challans", { page, search: searchFromUrl, status }],
    queryFn: () =>
      challanService.list({
        page,
        limit: 10,
        search: searchFromUrl,
        status,
      }),
    placeholderData: (previous) => previous,
  });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput("");
  };

  const pagination = challansQuery.data?.pagination;
  const challans = challansQuery.data?.challans ?? [];
  const showInitialLoading = challansQuery.isLoading && !challansQuery.data;
  const isRefetching =
    challansQuery.isFetching &&
    !challansQuery.isLoading &&
    Boolean(challansQuery.data);

  return (
    <div>
      <PageHeader
        title="Sales Challans"
        description="Create drafts, confirm stock-safe deliveries, or cancel when needed."
        breadcrumbs={[
          { label: "Sales", to: "/challans" },
          { label: "Challans" },
        ]}
        meta={
          pagination ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {pagination.total} total
            </span>
          ) : null
        }
        actions={
          canManage ? (
            <Link
              to="/challans/new"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-erp-dark px-3.5 text-sm font-medium text-white shadow-sm hover:bg-erp-dark/90"
            >
              <Plus className="size-4" />
              New challan
            </Link>
          ) : null
        }
      />

      {showInitialLoading ? (
        <LoadingState label="Loading challans..." />
      ) : null}

      {challansQuery.isError ? (
        <ErrorState
          title="Could not load challans"
          message={getErrorMessage(challansQuery.error, "Failed to load challans")}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 bg-white"
              onClick={() => challansQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      ) : null}

      {!showInitialLoading &&
      !challansQuery.isError &&
      challans.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching challans" : "No challans yet"}
          description={
            hasFilters
              ? "Try clearing search or status filters."
              : "Create a draft challan when you’re ready to ship."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-[#b7d9cb] bg-[#f4fbf7]"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : canManage ? (
              <Link
                to="/challans/new"
                className="inline-flex h-9 items-center rounded-xl bg-erp-dark px-3 text-sm text-white hover:bg-erp-dark/90"
              >
                New challan
              </Link>
            ) : null
          }
        />
      ) : null}

      {challans.length > 0 ? (
        <ListPanel
          dimmed={isRefetching}
          toolbar={
            <>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Challan list
                </p>
                <p className="text-xs text-slate-400">
                  {challans.length} on this page
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search challan or customer..."
                    className="h-9 rounded-xl border-[#b7d9cb] bg-[#eaf7f1] pl-9"
                  />
                </div>
                <NativeSelect
                  value={status}
                  onChange={(e) => updateParam("status", e.target.value)}
                  className="h-9 min-w-40 rounded-xl"
                >
                  <option value="">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </NativeSelect>
              </div>
            </>
          }
          footer={
            pagination && pagination.totalPages > 1 ? (
              <>
                <p>
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#b7d9cb] bg-[#f4fbf7]"
                    disabled={pagination.page <= 1 || isRefetching}
                    onClick={() =>
                      updateParam("page", String(pagination.page - 1))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#b7d9cb] bg-[#f4fbf7]"
                    disabled={
                      pagination.page >= pagination.totalPages || isRefetching
                    }
                    onClick={() =>
                      updateParam("page", String(pagination.page + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <p>{pagination?.total ?? challans.length} challans</p>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
                  <th className="px-4 py-3 font-medium">Challan</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {challans.map((challan) => (
                  <tr
                    key={challan.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-[#eaf7f1]/80"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EntityAvatar
                          name={challan.challanNumber}
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/challans/${challan.id}`}
                            className="font-semibold text-slate-800 hover:text-erp-dark"
                          >
                            {challan.challanNumber}
                          </Link>
                          {challan.createdByName ? (
                            <p className="truncate text-xs text-slate-400">
                              by {challan.createdByName}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#2d4f47]">
                        {challan.customerName || "—"}
                      </div>
                      {challan.businessName ? (
                        <div className="text-xs text-slate-400">
                          {challan.businessName}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#2d4f47]">
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
                    <td className="px-4 py-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: "View details",
                            onSelect: () =>
                              navigate(`/challans/${challan.id}`),
                          },
                          ...(canManage && challan.status === "DRAFT"
                            ? [
                                {
                                  label: "Edit draft",
                                  onSelect: () =>
                                    navigate(`/challans/${challan.id}/edit`),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ListPanel>
      ) : null}
    </div>
  );
}
