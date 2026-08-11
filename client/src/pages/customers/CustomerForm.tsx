import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { NativeSelect } from "@/components/common/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/schemas/customer.schema";
import { customerService } from "@/services/customer.service";

const defaultValues: CustomerFormValues = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  followUpDate: "",
  notes: "",
};

type CustomerFormProps = {
  mode: "create" | "edit";
};

export default function CustomerForm({ mode }: CustomerFormProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = mode === "edit";

  const customerQuery = useQuery({
    queryKey: ["customers", id],
    queryFn: () => customerService.getById(id!),
    enabled: isEdit && Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (customerQuery.data) {
      const customer = customerQuery.data;
      reset({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email ?? "",
        businessName: customer.businessName ?? "",
        gstNumber: customer.gstNumber ?? "",
        customerType: customer.customerType,
        address: customer.address ?? "",
        status: customer.status,
        followUpDate: customer.followUpDate ?? "",
        notes: customer.notes ?? "",
      });
    }
  }, [customerQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      isEdit && id
        ? customerService.update(id, values)
        : customerService.create(values),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast.success(isEdit ? "Customer updated" : "Customer created");
      navigate(`/customers/${customer.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save customer"));
    },
  });

  const onSubmit = handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  if (isEdit && customerQuery.isLoading) {
    return <LoadingState label="Loading customer..." />;
  }

  if (isEdit && customerQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getErrorMessage(customerQuery.error, "Customer not found")}
      </div>
    );
  }

  const backTo = isEdit && id ? `/customers/${id}` : "/customers";

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit customer" : "Add customer"}
        description={
          isEdit
            ? "Update contact details, status and follow-up information."
            : "Create a new lead or active customer record."
        }
        actions={
          <Link
            to={backTo}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-[#b7d9cb] bg-[#f4fbf7] px-3 text-sm text-[#2d4f47] hover:bg-[#eaf7f1]"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        }
      />

      <form
        onSubmit={onSubmit}
        className="max-w-3xl space-y-5 surface-panel rounded-2xl p-5 sm:p-6"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name" error={errors.name?.message}>
            <Input className="bg-[#f7fcf9]" {...register("name")} />
          </Field>
          <Field label="Mobile" error={errors.mobile?.message}>
            <Input className="bg-[#f7fcf9]" {...register("mobile")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" className="bg-[#f7fcf9]" {...register("email")} />
          </Field>
          <Field label="Business name" error={errors.businessName?.message}>
            <Input className="bg-[#f7fcf9]" {...register("businessName")} />
          </Field>
          <Field label="GST number" error={errors.gstNumber?.message}>
            <Input className="bg-[#f7fcf9]" {...register("gstNumber")} />
          </Field>
          <Field label="Follow-up date" error={errors.followUpDate?.message}>
            <Input type="date" className="bg-[#f7fcf9]" {...register("followUpDate")} />
          </Field>
          <Field label="Customer type" error={errors.customerType?.message}>
            <NativeSelect {...register("customerType")}>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </NativeSelect>
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <NativeSelect {...register("status")}>
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </NativeSelect>
          </Field>
        </div>

        <Field label="Address" error={errors.address?.message}>
          <Textarea className="min-h-20 bg-[#f7fcf9]" {...register("address")} />
        </Field>

        <Field label="Notes" error={errors.notes?.message}>
          <Textarea className="min-h-24 bg-[#f7fcf9]" {...register("notes")} />
        </Field>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <Button
            type="submit"
            className="bg-erp-dark text-white hover:bg-erp-dark/90"
            disabled={saveMutation.isPending || (isEdit && !isDirty)}
          >
            {saveMutation.isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Create customer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[#b7d9cb] bg-[#f4fbf7]"
            onClick={() => navigate(backTo)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
