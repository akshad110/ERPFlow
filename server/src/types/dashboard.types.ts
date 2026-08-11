export type DashboardRecentChallan = {
  id: string;
  challanNumber: string;
  customerName: string | null;
  businessName: string | null;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  totalQuantity: number;
  createdAt: Date;
};

export type DashboardStats = {
  customersCount: number;
  productsCount: number;
  lowStockCount: number;
  challansCount: number;
  draftChallansCount: number;
  confirmedChallansCount: number;
  recentChallans: DashboardRecentChallan[];
};
