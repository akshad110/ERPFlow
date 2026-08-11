export type StockMovementType = "IN" | "OUT";

export interface Product {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: StockMovementType;
  reason: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
}
