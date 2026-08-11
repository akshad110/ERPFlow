export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type ChallanItem = {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

export type Challan = {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName?: string;
  businessName?: string | null;
  customerMobile?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerGstNumber?: string | null;
  totalQuantity: number;
  status: ChallanStatus;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  items?: ChallanItem[];
};

export type ChallanListResponse = {
  challans: Challan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ChallanListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: ChallanStatus | "";
  customerId?: string;
};
