import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Boxes, Plus, Search } from "lucide-react";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") || 1);
  const searchFromUrl = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const lowStockParam = searchParams.get("lowStock") || "";
  const hasFilters = Boolean(searchFromUrl || category || lowStockParam);

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

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput("");
  };

  const products = productsQuery.data?.products ?? [];
  const pagination = productsQuery.data?.pagination;
  const showInitialLoading = productsQuery.isLoading && !productsQuery.data;
  const isRefetching =
    productsQuery.isFetching &&
    !productsQuery.isLoading &&
    Boolean(productsQuery.data);

  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog, stock levels and warehouse locations."
        breadcrumbs={[
          { label: "Inventory", to: "/products" },
          { label: "Products" },
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
              to="/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-700 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-teal-800"
            >
              <Plus className="size-4" />
              New product
            </Link>
          ) : null
        }
      />

      {showInitialLoading ? (
        <LoadingState label="Loading products..." />
      ) : null}

      {productsQuery.isError ? (
        <ErrorState
          title="Could not load products"
          message={getErrorMessage(
            productsQuery.error,
            "Failed to load products"
          )}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 bg-white"
              onClick={() => productsQuery.refetch()}
            >
              Try again
            </Button>
          }
        />
      ) : null}

      {!showInitialLoading &&
      !productsQuery.isError &&
      products.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching products" : "No products yet"}
          description={
            hasFilters
              ? "Try clearing search or stock filters."
              : "Add a product to start tracking warehouse stock."
          }
          icon={Boxes}
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
                to="/products/new"
                className="inline-flex h-9 items-center rounded-xl bg-teal-700 px-3 text-sm text-white hover:bg-teal-800"
              >
                New product
              </Link>
            ) : null
          }
        />
      ) : null}

      {products.length > 0 ? (
        <ListPanel
          dimmed={isRefetching}
          toolbar={
            <>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Product list
                </p>
                <p className="text-xs text-slate-400">
                  {products.length} on this page
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search name, SKU or category..."
                    className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9"
                  />
                </div>
                <Input
                  value={category}
                  onChange={(e) => updateParam("category", e.target.value)}
                  placeholder="Category"
                  className="h-9 min-w-36 rounded-xl border-slate-200 bg-slate-50"
                />
                <NativeSelect
                  value={lowStockParam}
                  onChange={(e) => updateParam("lowStock", e.target.value)}
                  className="h-9 min-w-36 rounded-xl"
                >
                  <option value="">All stock</option>
                  <option value="true">Low stock only</option>
                  <option value="false">Healthy stock</option>
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
              <p>{pagination?.total ?? products.length} products</p>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EntityAvatar
                          name={product.name}
                          imageUrl={product.imageUrl}
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/products/${product.id}/stock`}
                            className="font-semibold text-slate-800 hover:text-teal-700"
                          >
                            {product.name}
                          </Link>
                          <p className="truncate text-xs text-slate-400">
                            {product.warehouseLocation || "No location"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {formatMoney(product.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-1.5 rounded-full ${
                            product.isLowStock ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        <span className="tabular-nums text-slate-700">
                          {product.currentStock}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={product.isLowStock ? "LOW" : "OK"}
                        tone={product.isLowStock ? "warning" : "success"}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: "View stock",
                            onSelect: () =>
                              navigate(`/products/${product.id}/stock`),
                          },
                          ...(canManage
                            ? [
                                {
                                  label: "Edit item",
                                  onSelect: () =>
                                    navigate(`/products/${product.id}/edit`),
                                },
                                {
                                  label: "Delete item",
                                  destructive: true,
                                  separatorBefore: true,
                                  onSelect: () => {
                                    const confirmed = window.confirm(
                                      `Delete ${product.name}?`
                                    );
                                    if (confirmed) {
                                      deleteMutation.mutate(product.id);
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
