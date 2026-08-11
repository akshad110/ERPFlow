import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import {
  followUpFormSchema,
  type FollowUpFormValues,
} from "@/schemas/customer.schema";
import { customerService } from "@/services/customer.service";

const statusTone = {
  LEAD: "info",
  ACTIVE: "success",
  INACTIVE: "neutral",
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

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "SALES");

  const customerQuery = useQuery({
    queryKey: ["customers", id],
    queryFn: () => customerService.getById(id!),
    enabled: Boolean(id),
  });

  const followUpsQuery = useQuery({
    queryKey: ["customers", id, "follow-ups"],
    queryFn: () => customerService.listFollowUps(id!),
    enabled: Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: { note: "", followUpDate: "" },
  });

  const followUpMutation = useMutation({
    mutationFn: (values: FollowUpFormValues) =>
      customerService.addFollowUp(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", id] });
      queryClient.invalidateQueries({
        queryKey: ["customers", id, "follow-ups"],
      });
      reset({ note: "", followUpDate: "" });
      toast.success("Follow-up added");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to add follow-up"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerService.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast.success("Customer deleted");
      navigate("/customers");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete customer"));
    },
  });

  if (customerQuery.isLoading) {
    return <LoadingState label="Loading customer..." />;
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getErrorMessage(customerQuery.error, "Customer not found")}
      </div>
    );
  }

  const customer = customerQuery.data;
  const followUps = followUpsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.businessName || "Customer detail & CRM follow-ups"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/customers"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
            {canManage ? (
              <>
                <Link
                  to={`/customers/${customer.id}/edit`}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Delete ${customer.name}? This cannot be undone.`
                    );
                    if (confirmed) deleteMutation.mutate();
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge
              label={customer.status}
              tone={statusTone[customer.status]}
            />
            <StatusBadge label={customer.customerType} tone="neutral" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Info
              icon={Phone}
              label="Mobile"
              value={customer.mobile}
            />
            <Info
              icon={Mail}
              label="Email"
              value={customer.email || "—"}
            />
            <Info
              icon={Building2}
              label="Business"
              value={customer.businessName || "—"}
            />
            <Info
              icon={CalendarDays}
              label="Follow-up date"
              value={customer.followUpDate || "—"}
            />
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                GST
              </p>
              <p className="mt-1 text-slate-700">{customer.gstNumber || "—"}</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                <MapPin className="size-3.5" />
                Address
              </p>
              <p className="text-slate-700 whitespace-pre-wrap">
                {customer.address || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Notes
              </p>
              <p className="mt-1 text-slate-700 whitespace-pre-wrap">
                {customer.notes || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Follow-up history</h2>
          <p className="mt-1 text-xs text-slate-500">
            Keep a running CRM log for this customer.
          </p>

          {canManage ? (
            <form
              className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              onSubmit={handleSubmit((values) => followUpMutation.mutate(values))}
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  className="min-h-20 bg-white"
                  placeholder="Called regarding bulk order..."
                  {...register("note")}
                />
                {errors.note ? (
                  <p className="text-xs text-red-600">{errors.note.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="followUpDate">Next follow-up date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  className="bg-white"
                  {...register("followUpDate")}
                />
                {errors.followUpDate ? (
                  <p className="text-xs text-red-600">
                    {errors.followUpDate.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-700 text-white hover:bg-teal-800"
                disabled={followUpMutation.isPending}
              >
                {followUpMutation.isPending ? "Saving..." : "Add follow-up"}
              </Button>
            </form>
          ) : null}

          <div className="mt-4 space-y-3">
            {followUpsQuery.isLoading ? (
              <LoadingState label="Loading follow-ups..." className="py-8" />
            ) : null}

            {!followUpsQuery.isLoading && followUps.length === 0 ? (
              <EmptyState
                title="No follow-ups yet"
                description="Add the first note when you speak with this customer."
                className="py-8"
              />
            ) : null}

            {followUps.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {item.note}
                  </p>
                  {item.followUpDate ? (
                    <StatusBadge label={item.followUpDate} tone="warning" />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {item.createdByName || "User"} · {formatDateTime(item.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
