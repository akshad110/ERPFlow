import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { customerService } from "@/services/customer.service";
import type { CustomerStatus, CustomerType } from "@/types/customer.types";

const statusTone = {
  LEAD: "info",
  ACTIVE: "success",
  INACTIVE: "neutral",
} as const;

export default function Customers() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "SALES");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const searchFromUrl = searchParams.get("search") || "";
  const status = (searchParams.get("status") || "") as CustomerStatus | "";
  const customerType = (searchParams.get("customerType") || "") as
    | CustomerType
    | "";
  const hasFilters = Boolean(searchFromUrl || status || customerType);

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

  const customersQuery = useQuery({
    queryKey: ["customers", { page, search: searchFromUrl, status, customerType }],
    queryFn: () =>
      customerService.list({
        page,
        limit: 10,
        search: searchFromUrl,
        status,
        customerType,
      }),
    placeholderData: (previous) => previous,
  });

  const deleteMutation = useMutation({
    mutationFn: customerService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast.success("Customer deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete customer"));
    },
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

  const pagination = customersQuery.data?.pagination;
  const customers = customersQuery.data?.customers ?? [];
  const showInitialLoading = customersQuery.isLoading && !customersQuery.data;
  const isRefetching =
    customersQuery.isFetching &&
    !customersQuery.isLoading &&
    Boolean(customersQuery.data);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Search leads and accounts, then open a record for follow-ups."
        breadcrumbs={[
          { label: "CRM", to: "/customers" },
          { label: "Customers" },
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
              to="/customers/new"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-700 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800"
            >
              <Plus className="size-4" />
              New customer
            </Link>
          ) : null
        }
      />

      {showInitialLoading ? (
        <LoadingState label="Loading customers..." />
      ) : null}

      {customersQuery.isError ? (
        <ErrorState
          title="Could not load customers"
          message={getErrorMessage(
            customersQuery.error,
            "Failed to load customers"
          )}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 bg-white"
              onClick={() => customersQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      ) : null}

      {!showInitialLoading &&
      !customersQuery.isError &&
      customers.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching customers" : "No customers yet"}
          description={
            hasFilters
              ? "Try clearing search or filters."
              : "Add a lead or active account to get started."
          }
          action={
            hasFilters ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200 bg-white"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : canManage ? (
              <Link
                to="/customers/new"
                className="inline-flex h-9 items-center rounded-xl bg-teal-700 px-3 text-sm text-white hover:bg-teal-800"
              >
                New customer
              </Link>
            ) : null
          }
        />
      ) : null}

      {customers.length > 0 ? (
        <ListPanel
          dimmed={isRefetching}
          toolbar={
            <>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Customer list
                </p>
                <p className="text-xs text-slate-400">
                  {customers.length} on this page
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search name, mobile, email..."
                    className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9"
                  />
                </div>
                <NativeSelect
                  value={status}
                  onChange={(e) => updateParam("status", e.target.value)}
                  className="h-9 min-w-32 rounded-xl"
                >
                  <option value="">All statuses</option>
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </NativeSelect>
                <NativeSelect
                  value={customerType}
                  onChange={(e) => updateParam("customerType", e.target.value)}
                  className="h-9 min-w-36 rounded-xl"
                >
                  <option value="">All types</option>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
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
                    className="rounded-xl border-slate-200 bg-white"
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
                    className="rounded-xl border-slate-200 bg-white"
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
              <p>{pagination?.total ?? customers.length} customers</p>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={customer.name} />
                        <div className="min-w-0">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="font-semibold text-slate-800 hover:text-teal-700"
                          >
                            {customer.name}
                          </Link>
                          <p className="truncate text-xs text-slate-400">
                            {customer.businessName ||
                              customer.email ||
                              customer.customerType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {customer.customerType}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={customer.status}
                        tone={statusTone[customer.status]}
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {customer.mobile}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {customer.followUpDate || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: "View details",
                            onSelect: () =>
                              navigate(`/customers/${customer.id}`),
                          },
                          ...(canManage
                            ? [
                                {
                                  label: "Edit item",
                                  onSelect: () =>
                                    navigate(`/customers/${customer.id}/edit`),
                                },
                                {
                                  label: "Delete item",
                                  destructive: true,
                                  separatorBefore: true,
                                  onSelect: () => {
                                    const confirmed = window.confirm(
                                      `Delete ${customer.name}? This cannot be undone.`
                                    );
                                    if (confirmed) {
                                      deleteMutation.mutate(customer.id);
                                    }
                                  },
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
