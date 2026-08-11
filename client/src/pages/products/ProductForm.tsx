import { useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api";
import {
  productEditSchema,
  productFormSchema,
  type ProductEditValues,
  type ProductFormValues,
} from "@/schemas/product.schema";
import { productService } from "@/services/product.service";

type ProductFormProps = {
  mode: "create" | "edit";
};

export default function ProductForm({ mode }: ProductFormProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = mode === "edit";

  const productQuery = useQuery({
    queryKey: ["products", id],
    queryFn: () => productService.getById(id!),
    enabled: isEdit && Boolean(id),
  });

  const createForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 0,
      warehouseLocation: "",
    },
  });

  const editForm = useForm<ProductEditValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      unitPrice: 0,
      minStockAlert: 0,
      warehouseLocation: "",
    },
  });

  useEffect(() => {
    if (productQuery.data && isEdit) {
      const product = productQuery.data;
      editForm.reset({
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
        minStockAlert: product.minStockAlert,
        warehouseLocation: product.warehouseLocation ?? "",
      });
    }
  }, [productQuery.data, isEdit, editForm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit && id) {
        const values = editForm.getValues();
        return productService.update(id, values);
      }
      const values = createForm.getValues();
      return productService.create(values);
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast.success(isEdit ? "Product updated" : "Product created");
      navigate(`/products/${product.id}/stock`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to save product"));
    },
  });

  if (isEdit && productQuery.isLoading) {
    return <LoadingState label="Loading product..." />;
  }

  if (isEdit && productQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getErrorMessage(productQuery.error, "Product not found")}
      </div>
    );
  }

  const backTo = isEdit && id ? `/products/${id}/stock` : "/products";

  const onSubmit = isEdit
    ? editForm.handleSubmit(() => saveMutation.mutate())
    : createForm.handleSubmit(() => saveMutation.mutate());

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit product" : "Add product"}
        description={
          isEdit
            ? "Update pricing, category and alert levels. Use stock page for IN/OUT."
            : "Create a catalog item. Initial stock creates an IN movement."
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
        className="max-w-3xl space-y-5 surface-panel rounded-2xl p-5 sm:p-6"
        noValidate
        onSubmit={onSubmit}
      >
        {isEdit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" error={editForm.formState.errors.name?.message}>
              <Input className="bg-[#f7fcf9]" {...editForm.register("name")} />
            </Field>
            <Field label="SKU" error={editForm.formState.errors.sku?.message}>
              <Input className="bg-[#f7fcf9]" {...editForm.register("sku")} />
            </Field>
            <Field label="Category" error={editForm.formState.errors.category?.message}>
              <Input className="bg-[#f7fcf9]" {...editForm.register("category")} />
            </Field>
            <Field label="Unit price" error={editForm.formState.errors.unitPrice?.message}>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="bg-[#f7fcf9]"
                {...editForm.register("unitPrice", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Min stock alert"
              error={editForm.formState.errors.minStockAlert?.message}
            >
              <Input
                type="number"
                min="0"
                className="bg-[#f7fcf9]"
                {...editForm.register("minStockAlert", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Warehouse location"
              error={editForm.formState.errors.warehouseLocation?.message}
            >
              <Input
                className="bg-[#f7fcf9]"
                {...editForm.register("warehouseLocation")}
              />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" error={createForm.formState.errors.name?.message}>
              <Input className="bg-[#f7fcf9]" {...createForm.register("name")} />
            </Field>
            <Field label="SKU" error={createForm.formState.errors.sku?.message}>
              <Input className="bg-[#f7fcf9]" {...createForm.register("sku")} />
            </Field>
            <Field label="Category" error={createForm.formState.errors.category?.message}>
              <Input className="bg-[#f7fcf9]" {...createForm.register("category")} />
            </Field>
            <Field label="Unit price" error={createForm.formState.errors.unitPrice?.message}>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="bg-[#f7fcf9]"
                {...createForm.register("unitPrice", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Initial stock"
              error={createForm.formState.errors.currentStock?.message}
            >
              <Input
                type="number"
                min="0"
                className="bg-[#f7fcf9]"
                {...createForm.register("currentStock", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Min stock alert"
              error={createForm.formState.errors.minStockAlert?.message}
            >
              <Input
                type="number"
                min="0"
                className="bg-[#f7fcf9]"
                {...createForm.register("minStockAlert", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Warehouse location"
              error={createForm.formState.errors.warehouseLocation?.message}
            >
              <Input
                className="bg-[#f7fcf9]"
                {...createForm.register("warehouseLocation")}
              />
            </Field>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button
            type="submit"
            className="bg-erp-dark text-white hover:bg-erp-dark/90"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Create product"}
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
