import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Boxes,
  Eye,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { NativeSelect } from "@/components/common/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api";
import { productService } from "@/services/product.service";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function Products() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "WAREHOUSE");
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const searchFromUrl = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const lowStockParam = searchParams.get("lowStock") || "";

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

  const productsQuery = useQuery({
    queryKey: [
      "products",
      {
        page,
        search: searchFromUrl,
        category,
        lowStock: lowStockParam,
      },
    ],
    queryFn: () =>
      productService.list({
        page,
        limit: 10,
        search: searchFromUrl,
        category,
        lowStock:
          lowStockParam === "true"
            ? true
            : lowStockParam === "false"
              ? false
              : "",
      }),
    placeholderData: (previous) => previous,
  });

  const deleteMutation = useMutation({
    mutationFn: productService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      toast.success("Product deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete product"));
    },
  });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const products = productsQuery.data?.products ?? [];
  const pagination = productsQuery.data?.pagination;

  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog, stock levels and warehouse locations."
        actions={
          canManage ? (
            <Link
              to="/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800"
            >
              <Plus className="size-4" />
              Add product
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
            placeholder="Search name, SKU or category..."
            className="bg-white pl-9"
          />
        </div>
        <Input
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
          placeholder="Category"
          className="min-w-40 bg-white"
        />
        <NativeSelect
          value={lowStockParam}
          onChange={(e) => updateParam("lowStock", e.target.value)}
          className="min-w-40"
        >
          <option value="">All stock</option>
          <option value="true">Low stock only</option>
          <option value="false">Healthy stock</option>
        </NativeSelect>
      </div>

      {productsQuery.isLoading ? <LoadingState label="Loading products..." /> : null}

      {productsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(productsQuery.error, "Failed to load products")}
        </div>
      ) : null}

      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try another filter, or add a product to the catalog."
          icon={Boxes}
          action={
            canManage ? (
              <Link
                to="/products/new"
                className="inline-flex h-9 items-center rounded-md bg-teal-700 px-3 text-sm text-white hover:bg-teal-800"
              >
                Add product
              </Link>
            ) : null
          }
        />
      ) : null}

      {products.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-slate-100 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageOff className="size-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/products/${product.id}/stock`}
                            className="font-medium text-slate-800 hover:text-teal-700"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-slate-400">
                            {product.warehouseLocation || "No location"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.category}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {formatMoney(product.unitPrice)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {product.currentStock}
                      <span className="text-xs text-slate-400">
                        {" "}
                        / alert {product.minStockAlert}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={product.isLowStock ? "LOW" : "OK"}
                        tone={product.isLowStock ? "warning" : "success"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/products/${product.id}/stock`}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Stock"
                        >
                          <Eye className="size-4" />
                        </Link>
                        {canManage ? (
                          <>
                            <Link
                              to={`/products/${product.id}/edit`}
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
                                  `Delete ${product.name}?`
                                );
                                if (confirmed) deleteMutation.mutate(product.id);
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
                  onClick={() => updateParam("page", String(pagination.page + 1))}
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
