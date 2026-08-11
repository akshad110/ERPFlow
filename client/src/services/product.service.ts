import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api.type";
import type {
  Product,
  ProductListParams,
  ProductListResponse,
  StockAdjustResponse,
  StockMovement,
} from "@/types/product.types";
import type {
  ProductEditValues,
  ProductFormValues,
  StockAdjustValues,
} from "@/schemas/product.schema";

const emptyToNull = (value?: string) => {
  if (!value || value.trim() === "") return null;
  return value.trim();
};

export const productService = {
  async list(params: ProductListParams = {}) {
    const { data } = await api.get<ApiSuccess<ProductListResponse>>(
      "/products",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search || undefined,
          category: params.category || undefined,
          lowStock:
            params.lowStock === "" || params.lowStock === undefined
              ? undefined
              : String(params.lowStock),
        },
      }
    );
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<Product>>(`/products/${id}`);
    return data.data;
  },

  async create(values: ProductFormValues) {
    const { data } = await api.post<ApiSuccess<Product>>("/products", {
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category.trim(),
      unitPrice: values.unitPrice,
      currentStock: values.currentStock,
      minStockAlert: values.minStockAlert,
      warehouseLocation: emptyToNull(values.warehouseLocation),
    });
    return data.data;
  },

  async update(id: string, values: ProductEditValues) {
    const { data } = await api.patch<ApiSuccess<Product>>(`/products/${id}`, {
      name: values.name.trim(),
      sku: values.sku.trim(),
      category: values.category.trim(),
      unitPrice: values.unitPrice,
      minStockAlert: values.minStockAlert,
      warehouseLocation: emptyToNull(values.warehouseLocation),
    });
    return data.data;
  },

  async remove(id: string) {
    const { data } = await api.delete<ApiSuccess<{ id: string }>>(
      `/products/${id}`
    );
    return data.data;
  },

  async listMovements(id: string) {
    const { data } = await api.get<ApiSuccess<StockMovement[]>>(
      `/products/${id}/stock-movements`
    );
    return data.data;
  },

  async adjustStock(id: string, values: StockAdjustValues) {
    const { data } = await api.post<ApiSuccess<StockAdjustResponse>>(
      `/products/${id}/stock`,
      values
    );
    return data.data;
  },

  async uploadImage(id: string, file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await api.post<ApiSuccess<Product>>(
      `/products/${id}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data.data;
  },
};
