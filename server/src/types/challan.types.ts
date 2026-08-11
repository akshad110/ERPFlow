export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName?: string;
  businessName?: string | null;
  totalQuantity: number;
  status: ChallanStatus;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ChallanItem[];
}
