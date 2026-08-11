export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";

export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export interface Customer {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string | null;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
}
