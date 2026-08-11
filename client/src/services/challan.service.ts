import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api.type";
import type {
  Challan,
  ChallanListParams,
  ChallanListResponse,
} from "@/types/challan.types";
import type { ChallanFormValues } from "@/schemas/challan.schema";

const toItemsPayload = (items: ChallanFormValues["items"]) =>
  items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

export const challanService = {
  async list(params: ChallanListParams = {}) {
    const { data } = await api.get<ApiSuccess<ChallanListResponse>>(
      "/challans",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search || undefined,
          status: params.status || undefined,
          customerId: params.customerId || undefined,
        },
      }
    );
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<Challan>>(`/challans/${id}`);
    return data.data;
  },

  async create(values: ChallanFormValues) {
    const { data } = await api.post<ApiSuccess<Challan>>("/challans", {
      customerId: values.customerId,
      items: toItemsPayload(values.items),
      status: values.status,
    });
    return data.data;
  },

  async update(id: string, values: Pick<ChallanFormValues, "customerId" | "items">) {
    const { data } = await api.patch<ApiSuccess<Challan>>(`/challans/${id}`, {
      customerId: values.customerId,
      items: toItemsPayload(values.items),
    });
    return data.data;
  },

  async confirm(id: string) {
    const { data } = await api.post<ApiSuccess<Challan>>(
      `/challans/${id}/confirm`
    );
    return data.data;
  },

  async cancel(id: string) {
    const { data } = await api.post<ApiSuccess<Challan>>(
      `/challans/${id}/cancel`
    );
    return data.data;
  },
};
