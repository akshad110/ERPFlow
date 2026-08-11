import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImagePlus,
  ImageOff,
  Pencil,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { NativeSelect } from "@/components/common/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import {
  stockAdjustSchema,
  type StockAdjustValues,
} from "@/schemas/product.schema";
import { productService } from "@/services/product.service";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

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

export default function StockMovements() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "WAREHOUSE");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productQuery = useQuery({
    queryKey: ["products", id],
    queryFn: () => productService.getById(id!),
    enabled: Boolean(id),
  });

  const movementsQuery = useQuery({
    queryKey: ["products", id, "stock-movements"],
    queryFn: () => productService.listMovements(id!),
    enabled: Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockAdjustValues>({
    resolver: zodResolver(stockAdjustSchema),
    defaultValues: {
      quantity: 1,
      movementType: "IN",
      reason: "",
    },
  });

  const stockMutation = useMutation({
    mutationFn: (values: StockAdjustValues) =>
      productService.adjustStock(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      queryClient.invalidateQueries({
        queryKey: ["products", id, "stock-movements"],
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      reset({ quantity: 1, movementType: "IN", reason: "" });
      toast.success("Stock updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update stock"));
    },
  });

  const imageMutation = useMutation({
    mutationFn: (file: File) => productService.uploadImage(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product image updated");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to upload image"));
    },
  });

  if (productQuery.isLoading) {
    return <LoadingState label="Loading product..." />;
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getErrorMessage(productQuery.error, "Product not found")}
      </div>
    );
  }

  const product = productQuery.data;
  const movements = movementsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`${product.sku} · ${product.category}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/products"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>
            {canManage ? (
              <Link
                to={`/products/${product.id}/edit`}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="size-3.5" />
                Edit
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex size-28 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageOff className="size-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap gap-2">
                  <StatusBadge
                    label={product.isLowStock ? "LOW STOCK" : "IN STOCK"}
                    tone={product.isLowStock ? "warning" : "success"}
                  />
                </div>
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {product.currentStock}
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    units
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Alert at {product.minStockAlert} ·{" "}
                  {formatMoney(product.unitPrice)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Location: {product.warehouseLocation || "—"}
                </p>

                {canManage ? (
                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) imageMutation.mutate(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-slate-200 bg-white"
                      disabled={imageMutation.isPending}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="size-3.5" />
                      {imageMutation.isPending ? "Uploading..." : "Upload image"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {canManage ? (
            <form
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={handleSubmit((values) => stockMutation.mutate(values))}
              noValidate
            >
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Adjust stock
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  IN adds stock. OUT reduces stock and cannot go negative.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Movement</Label>
                  <NativeSelect {...register("movementType")}>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    className="bg-white"
                    {...register("quantity", { valueAsNumber: true })}
                  />
                  {errors.quantity ? (
                    <p className="text-xs text-red-600">
                      {errors.quantity.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Input
                  className="bg-white"
                  placeholder="New purchase / Damaged / Correction"
                  {...register("reason")}
                />
                {errors.reason ? (
                  <p className="text-xs text-red-600">{errors.reason.message}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                className="bg-teal-700 text-white hover:bg-teal-800"
                disabled={stockMutation.isPending}
              >
                {stockMutation.isPending ? "Updating..." : "Update stock"}
              </Button>
            </form>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Stock movement log
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Every IN/OUT change is recorded with reason and user.
          </p>

          <div className="mt-4 space-y-3">
            {movementsQuery.isLoading ? (
              <LoadingState label="Loading movements..." className="py-8" />
            ) : null}

            {!movementsQuery.isLoading && movements.length === 0 ? (
              <EmptyState
                title="No movements yet"
                description="Stock changes will appear here after IN/OUT updates."
                icon={Package}
                className="py-8"
              />
            ) : null}

            {movements.map((movement) => (
              <article
                key={movement.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={movement.movementType}
                        tone={
                          movement.movementType === "IN" ? "success" : "warning"
                        }
                      />
                      <span className="text-sm font-semibold tabular-nums text-slate-800">
                        {movement.quantity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{movement.reason}</p>
                  </div>
                  <p className="text-right text-xs text-slate-500">
                    {movement.createdByName || "User"}
                    <br />
                    {formatDateTime(movement.createdAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
