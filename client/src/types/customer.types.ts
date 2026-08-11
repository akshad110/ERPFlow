export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string | null;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FollowUp = {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string | null;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
};

export type CustomerListResponse = {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CustomerListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus | "";
  customerType?: CustomerType | "";
};
