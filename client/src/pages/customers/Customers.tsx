import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
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
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const searchFromUrl = searchParams.get("search") || "";
  const status = (searchParams.get("status") || "") as CustomerStatus | "";
  const customerType = (searchParams.get("customerType") || "") as
    | CustomerType
    | "";

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

  const pagination = customersQuery.data?.pagination;
  const customers = customersQuery.data?.customers ?? [];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Search leads and accounts, then open a record for follow-ups."
        actions={
          canManage ? (
            <Link
              to="/customers/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Plus className="size-4" />
              Add customer
            </Link>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, mobile, email, business..."
            className="bg-white pl-9"
          />
        </div>
        <NativeSelect
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="min-w-36"
        >
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </NativeSelect>
        <NativeSelect
          value={customerType}
          onChange={(e) => updateParam("customerType", e.target.value)}
          className="min-w-40"
        >
          <option value="">All types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </NativeSelect>
      </div>

      {customersQuery.isLoading ? (
        <LoadingState label="Loading customers..." />
      ) : null}

      {customersQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(customersQuery.error, "Failed to load customers")}
        </div>
      ) : null}

      {!customersQuery.isLoading && !customersQuery.isError && customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Try another search, or add a new customer to get started."
          action={
            canManage ? (
              <Link
                to="/customers/new"
                className="inline-flex h-9 items-center rounded-md bg-teal-700 px-3 text-sm text-white hover:bg-teal-800"
              >
                Add customer
              </Link>
            ) : null
          }
        />
      ) : null}

      {customers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t border-slate-100 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="font-medium text-slate-800 hover:text-teal-700"
                      >
                        {customer.name}
                      </Link>
                      {customer.email ? (
                        <p className="text-xs text-slate-400">{customer.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {customer.businessName || "—"}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="View"
                        >
                          <Eye className="size-4" />
                        </Link>
                        {canManage ? (
                          <>
                            <Link
                              to={`/customers/${customer.id}/edit`}
                              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              title="Edit"
                            >
                              <Pencil className="size-4" />
                            </Link>
                            <button
                              type="button"
                              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `Delete ${customer.name}? This cannot be undone.`
                                );
                                if (confirmed) {
                                  deleteMutation.mutate(customer.id);
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
              <p>
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} total
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-200 bg-white"
                  disabled={pagination.page <= 1}
                  onClick={() => updateParam("page", String(pagination.page - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-200 bg-white"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("page", String(pagination.page + 1));
                    setSearchParams(next);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
