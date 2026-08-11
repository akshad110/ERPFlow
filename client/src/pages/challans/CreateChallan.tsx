import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { NativeSelect } from "@/components/common/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api";
import {
  challanFormSchema,
  type ChallanFormValues,
} from "@/schemas/challan.schema";
import { challanService } from "@/services/challan.service";
import { customerService } from "@/services/customer.service";
import { productService } from "@/services/product.service";
import type { Product } from "@/types/product.types";

const defaultValues: ChallanFormValues = {
  customerId: "",
  status: "DRAFT",
  items: [{ productId: "", quantity: 1 }],
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

type CreateChallanProps = {
  mode: "create" | "edit";
};

export default function CreateChallan({ mode }: CreateChallanProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = mode === "edit";

  const challanQuery = useQuery({
    queryKey: ["challans", id],
    queryFn: () => challanService.getById(id!),
    enabled: isEdit && Boolean(id),
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "picker", "ACTIVE"],
    queryFn: () =>
      customerService.list({ page: 1, limit: 100, status: "ACTIVE" }),
  });

  const productsQuery = useQuery({
    queryKey: ["products", "picker"],
    queryFn: () => productService.list({ page: 1, limit: 100 }),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ChallanFormValues>({
    resolver: zodResolver(challanFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" });
  const watchedStatus = useWatch({ control, name: "status" });

  useEffect(() => {
    if (!challanQuery.data || !isEdit) return;

    if (challanQuery.data.status !== "DRAFT") {
      toast.error("Only draft challans can be edited");
      navigate(`/challans/${challanQuery.data.id}`, { replace: true });
      return;
    }

    reset({
      customerId: challanQuery.data.customerId,
      status: "DRAFT",
      items:
        challanQuery.data.items && challanQuery.data.items.length > 0
          ? challanQuery.data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            }))
          : [{ productId: "", quantity: 1 }],
    });
  }, [challanQuery.data, isEdit, navigate, reset]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    productsQuery.data?.products.forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [productsQuery.data]);

  const customers = useMemo(() => {
    const list = customersQuery.data?.customers ?? [];
    if (!isEdit || !challanQuery.data) return list;

    const exists = list.some((c) => c.id === challanQuery.data.customerId);
    if (exists) return list;

    return [
      {
        id: challanQuery.data.customerId,
        name: challanQuery.data.customerName || "Current customer",
        businessName: challanQuery.data.businessName ?? null,
        mobile: "",
        email: null,
        gstNumber: null,
        customerType: "RETAIL" as const,
        address: null,
        status: "ACTIVE" as const,
        followUpDate: null,
        notes: null,
        createdAt: "",
        updatedAt: "",
      },
      ...list,
    ];
  }, [customersQuery.data, challanQuery.data, isEdit]);

  const products = productsQuery.data?.products ?? [];

  const linePreview = useMemo(() => {
    return (watchedItems ?? []).map((item) => {
      const product = item?.productId
        ? productsById.get(item.productId)
        : undefined;
      const quantity = Number(item?.quantity) || 0;
      const unitPrice = product?.unitPrice ?? 0;
      const exceedsStock =
        Boolean(product) && quantity > (product?.currentStock ?? 0);
      return {
        product,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
        exceedsStock,
      };
    });
  }, [watchedItems, productsById]);

  const estimatedTotal = linePreview.reduce(
    (sum, line) => sum + line.lineTotal,
    0
  );
  const estimatedQty = linePreview.reduce((sum, line) => sum + line.quantity, 0);
  const hasStockShortage = linePreview.some((line) => line.exceedsStock);
  const confirmingNow = !isEdit && watchedStatus === "CONFIRMED";

  const saveMutation = useMutation({
    mutationFn: (values: ChallanFormValues) =>
      isEdit && id
        ? challanService.update(id, {
            customerId: values.customerId,
            items: values.items,
          })
        : challanService.create(values),
    onSuccess: (challan) => {
      queryClient.invalidateQueries({ queryKey: ["challans"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast.success(
        isEdit
          ? "Draft challan updated"
          : challan.status === "CONFIRMED"
            ? "Challan created and confirmed"
            : "Draft challan created"
      );
      navigate(`/challans/${challan.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save challan"));
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (values.status === "CONFIRMED" && hasStockShortage) {
      toast.error("Reduce quantities that exceed available stock before confirming");
      return;
    }
    saveMutation.mutate(values);
  });

  const pickersLoading =
    customersQuery.isLoading || productsQuery.isLoading;
  const pickersReady = !pickersLoading && !customersQuery.isError && !productsQuery.isError;

  if (isEdit && challanQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Edit draft challan" description="Loading challan..." />
        <LoadingState label="Loading challan..." />
      </div>
    );
  }

  if (isEdit && (challanQuery.isError || !challanQuery.data)) {
    return (
      <div>
        <PageHeader
          title="Edit draft challan"
          actions={
            <Link
              to="/challans"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
          }
        />
        <ErrorState
          title="Challan not found"
          message={getErrorMessage(challanQuery.error, "Challan not found")}
          action={
            <Link
              to="/challans"
              className="inline-flex h-8 items-center rounded-md border border-red-200 bg-white px-3 text-sm text-red-700 hover:bg-red-50"
            >
              Back to challans
            </Link>
          }
        />
      </div>
    );
  }

  const backTo = isEdit && id ? `/challans/${id}` : "/challans";
  const selectedProductIds = new Set(
    (watchedItems ?? []).map((item) => item?.productId).filter(Boolean)
  );

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit draft challan" : "New challan"}
        description={
          isEdit
            ? "Update customer or line items before confirming stock."
            : "Build a draft, or confirm immediately to deduct stock."
        }
        actions={
          <Link
            to={backTo}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        }
      />

      {pickersLoading ? <LoadingState label="Loading customers & products..." /> : null}

      {customersQuery.isError || productsQuery.isError ? (
        <ErrorState
          title="Could not load form data"
          message={getErrorMessage(
            customersQuery.error || productsQuery.error,
            "Failed to load customers or products"
          )}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 bg-white"
              onClick={() => {
                customersQuery.refetch();
                productsQuery.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      ) : null}

      {pickersReady && customers.length === 0 ? (
        <EmptyState
          title="No active customers"
          description="Activate a customer first, then create a challan."
          action={
            <Link
              to="/customers/new"
              className="inline-flex h-9 items-center rounded-md bg-teal-700 px-3 text-sm text-white hover:bg-teal-800"
            >
              Add customer
            </Link>
          }
        />
      ) : null}

      {pickersReady && products.length === 0 ? (
        <EmptyState
          title="No products in catalog"
          description="Add products before creating a sales challan."
          action={
            <Link
              to="/products"
              className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              View products
            </Link>
          }
        />
      ) : null}

      {pickersReady && customers.length > 0 && products.length > 0 ? (
        <form
          onSubmit={onSubmit}
          className="max-w-4xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer" error={errors.customerId?.message}>
              <NativeSelect {...register("customerId")}>
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.businessName ? ` — ${customer.businessName}` : ""}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-slate-500">
                Showing active customers only.
              </p>
            </Field>

            {!isEdit ? (
              <Field label="Save as" error={errors.status?.message}>
                <NativeSelect {...register("status")}>
                  <option value="DRAFT">Draft (no stock change)</option>
                  <option value="CONFIRMED">Confirmed (deduct stock now)</option>
                </NativeSelect>
              </Field>
            ) : (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                Editing draft{" "}
                <span className="font-medium">
                  {challanQuery.data?.challanNumber}
                </span>
                . Confirm from the detail page when ready.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Line items
                </h2>
                <p className="text-xs text-slate-500">
                  Prices snapshot when the challan is saved.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-200 bg-white"
                onClick={() => append({ productId: "", quantity: 1 })}
              >
                <Plus className="size-3.5" />
                Add line
              </Button>
            </div>

            {errors.items?.message || errors.items?.root?.message ? (
              <p className="text-xs text-red-600">
                {errors.items.message || errors.items.root?.message}
              </p>
            ) : null}

            <div className="space-y-3">
              {fields.map((field, index) => {
                const preview = linePreview[index];
                const product = preview?.product;
                const productError = errors.items?.[index]?.productId?.message;
                const quantityError = errors.items?.[index]?.quantity?.message;

                return (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-[1.4fr_0.5fr_auto]"
                  >
                    <Field label="Product" error={productError}>
                      <NativeSelect {...register(`items.${index}.productId`)}>
                        <option value="">Select product</option>
                        {products.map((option) => {
                          const taken =
                            selectedProductIds.has(option.id) &&
                            watchedItems?.[index]?.productId !== option.id;
                          return (
                            <option
                              key={option.id}
                              value={option.id}
                              disabled={taken}
                            >
                              {option.name} ({option.sku}) · stock{" "}
                              {option.currentStock}
                            </option>
                          );
                        })}
                      </NativeSelect>
                      {product ? (
                        <p
                          className={`text-xs ${
                            preview?.exceedsStock
                              ? "text-amber-700"
                              : "text-slate-500"
                          }`}
                        >
                          {formatMoney(product.unitPrice)} · stock{" "}
                          {product.currentStock}
                          {product.isLowStock ? " · low stock" : ""}
                          {preview?.exceedsStock
                            ? " · quantity exceeds stock"
                            : ""}
                        </p>
                      ) : null}
                    </Field>

                    <Field label="Qty" error={quantityError}>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        className="bg-white"
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>

                    <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-stretch sm:justify-between">
                      <div className="text-sm">
                        <p className="text-xs text-slate-400">Line total</p>
                        <p className="font-medium tabular-nums text-slate-800">
                          {formatMoney(preview?.lineTotal ?? 0)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="text-slate-600">
              Est. qty{" "}
              <span className="font-semibold tabular-nums text-slate-800">
                {estimatedQty}
              </span>
              <span className="mx-2 text-slate-300">·</span>
              Est. value{" "}
              <span className="font-semibold tabular-nums text-slate-800">
                {formatMoney(estimatedTotal)}
              </span>
            </div>
            {confirmingNow && hasStockShortage ? (
              <p className="text-xs text-amber-700">
                Fix over-stock quantities before confirming.
              </p>
            ) : confirmingNow ? (
              <p className="text-xs text-amber-700">
                Confirming now will deduct stock for each line.
              </p>
            ) : hasStockShortage ? (
              <p className="text-xs text-amber-700">
                Draft OK — reduce qty before you confirm later.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <Button
              type="submit"
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={
                saveMutation.isPending ||
                (isEdit && !isDirty) ||
                (confirmingNow && hasStockShortage)
              }
            >
              {saveMutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save draft"
                  : confirmingNow
                    ? "Create & confirm"
                    : "Create draft"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white"
              onClick={() => navigate(backTo)}
            >
              Cancel
            </Button>
            {!isEdit && watchedStatus === "CONFIRMED" ? (
              <Button
                type="button"
                variant="ghost"
                className="text-slate-600"
                onClick={() => setValue("status", "DRAFT")}
              >
                Switch to draft
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
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
