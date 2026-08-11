import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Pencil,
  UserRound,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import { challanService } from "@/services/challan.service";
import type { Challan } from "@/types/challan.types";

const statusTone = {
  DRAFT: "warning",
  CONFIRMED: "success",
  CANCELLED: "neutral",
} as const;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ChallanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "SALES");

  const challanQuery = useQuery({
    queryKey: ["challans", id],
    queryFn: () => challanService.getById(id!),
    enabled: Boolean(id),
  });

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ["challans"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => challanService.confirm(id!),
    onSuccess: (challan: Challan) => {
      queryClient.setQueryData(["challans", id], challan);
      invalidateRelated();
      toast.success("Challan confirmed — stock deducted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to confirm challan"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => challanService.cancel(id!),
    onSuccess: (challan: Challan) => {
      queryClient.setQueryData(["challans", id], challan);
      invalidateRelated();
      toast.success(
        challanQuery.data?.status === "CONFIRMED"
          ? "Challan cancelled — stock restored"
          : "Challan cancelled"
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to cancel challan"));
    },
  });

  if (challanQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Challan" description="Loading details..." />
        <LoadingState label="Loading challan..." />
      </div>
    );
  }

  if (challanQuery.isError || !challanQuery.data) {
    return (
      <div>
        <PageHeader
          title="Challan"
          actions={
            <Link
              to="/challans"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[#b7d9cb] bg-[#f4fbf7] px-3 text-sm text-[#2d4f47] hover:bg-[#eaf7f1]"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          }
        />
        <EmptyState
          title="Challan not found"
          description={getErrorMessage(
            challanQuery.error,
            "This challan may have been deleted or the link is invalid."
          )}
          action={
            <Link
              to="/challans"
              className="inline-flex h-9 items-center rounded-md bg-erp-dark px-3 text-sm text-white hover:bg-erp-dark/90"
            >
              Back to challans
            </Link>
          }
        />
      </div>
    );
  }

  const challan = challanQuery.data;
  const items = challan.items ?? [];
  const valueTotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const actionPending = confirmMutation.isPending || cancelMutation.isPending;

  return (
    <div>
      <PageHeader
        title={challan.challanNumber}
        description={
          challan.customerName
            ? `${challan.customerName}${
                challan.businessName ? ` · ${challan.businessName}` : ""
              }`
            : "Challan detail"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/challans"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[#b7d9cb] bg-[#f4fbf7] px-3 text-sm text-[#2d4f47] hover:bg-[#eaf7f1]"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
            {canManage && challan.status === "DRAFT" ? (
              <Link
                to={`/challans/${challan.id}/edit`}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-[#b7d9cb] bg-[#f4fbf7] px-3 text-sm text-[#2d4f47] hover:bg-[#eaf7f1]"
              >
                <Pencil className="size-3.5" />
                Edit
              </Link>
            ) : null}
            {canManage && challan.status === "DRAFT" ? (
              <Button
                type="button"
                size="sm"
                className="bg-erp-dark text-white hover:bg-erp-dark/90"
                disabled={actionPending || items.length === 0}
                onClick={() => {
                  const confirmed = window.confirm(
                    `Confirm ${challan.challanNumber}? This will deduct stock for all line items.`
                  );
                  if (confirmed) confirmMutation.mutate();
                }}
              >
                <CheckCircle2 className="size-3.5" />
                {confirmMutation.isPending ? "Confirming..." : "Confirm"}
              </Button>
            ) : null}
            {canManage && challan.status !== "CANCELLED" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                disabled={actionPending}
                onClick={() => {
                  const wasConfirmed = challan.status === "CONFIRMED";
                  const confirmed = window.confirm(
                    wasConfirmed
                      ? `Cancel ${challan.challanNumber}? Stock will be restored for confirmed items.`
                      : `Cancel draft ${challan.challanNumber}?`
                  );
                  if (confirmed) cancelMutation.mutate();
                }}
              >
                <XCircle className="size-3.5" />
                {cancelMutation.isPending ? "Cancelling..." : "Cancel challan"}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge label={challan.status} tone={statusTone[challan.status]} />
        <span className="text-sm text-slate-500">
          Created {formatDateTime(challan.createdAt)}
          {challan.createdByName ? ` · ${challan.createdByName}` : ""}
        </span>
      </div>

      {!canManage ? (
        <div className="mb-4 rounded-xl border border-[#b7d9cb] bg-[#eaf7f1] px-4 py-3 text-sm text-slate-600">
          You can view challans. Confirm / cancel actions require Sales or Admin.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <section className="surface-panel overflow-hidden rounded-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Line items</h2>
            <p className="text-xs text-slate-500">
              Product names and prices are snapshotted on save.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No line items"
                description="Edit this draft to add products before confirming."
                action={
                  canManage && challan.status === "DRAFT" ? (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-erp-dark text-white hover:bg-erp-dark/90"
                      onClick={() => navigate(`/challans/${challan.id}/edit`)}
                    >
                      Edit draft
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.sku}</td>
                      <td className="px-4 py-3 tabular-nums text-[#2d4f47]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">
                        {formatMoney(Number(item.unitPrice))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-800">
                        {formatMoney(Number(item.totalPrice))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="surface-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-800">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Total quantity</dt>
                <dd className="font-semibold tabular-nums text-slate-800">
                  {challan.totalQuantity}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Value</dt>
                <dd className="font-semibold tabular-nums text-slate-800">
                  {formatMoney(valueTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <dt className="text-slate-500">Updated</dt>
                <dd className="text-[#2d4f47]">
                  {formatDateTime(challan.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="surface-panel rounded-2xl p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserRound className="size-4 text-slate-400" />
              Customer
            </h2>
            <p className="font-medium text-slate-800">
              {challan.customerName || "—"}
            </p>
            {challan.businessName ? (
              <p className="mt-1 text-sm text-slate-500">{challan.businessName}</p>
            ) : null}
            <Link
              to={`/customers/${challan.customerId}`}
              className="mt-3 inline-flex text-sm font-medium text-erp-dark hover:underline"
            >
              Open customer
            </Link>
          </section>

          {challan.status === "DRAFT" ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Draft challans do not change stock. Confirm when ready to ship.
            </section>
          ) : null}
          {challan.status === "CONFIRMED" ? (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Confirmed — stock has been deducted. Cancelling will restore it.
            </section>
          ) : null}
          {challan.status === "CANCELLED" ? (
            <section className="rounded-xl border border-[#b7d9cb] bg-[#eaf7f1] p-4 text-sm text-slate-600">
              This challan is cancelled and cannot be confirmed again.
            </section>
          ) : null}

          {confirmMutation.isError ? (
            <ErrorState
              title="Confirm failed"
              message={getErrorMessage(
                confirmMutation.error,
                "Failed to confirm challan"
              )}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
