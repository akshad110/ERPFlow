export type StockMovementType = "IN" | "OUT";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation: string | null;
  imageUrl: string | null;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  quantity: number;
  movementType: StockMovementType;
  reason: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
};

export type ProductListResponse = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean | "";
};

export type StockAdjustResponse = {
  product: Product | null;
  movement?: StockMovement;
};
