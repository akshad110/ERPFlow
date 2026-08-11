import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api.type";
import type { DashboardStats } from "@/types/dashboard.types";

export const dashboardService = {
  async getStats() {
    const { data } = await api.get<ApiSuccess<DashboardStats>>(
      "/dashboard/stats"
    );
    return data.data;
  },
};
