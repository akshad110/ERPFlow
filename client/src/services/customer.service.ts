import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api.type";
import type {
  Customer,
  CustomerListParams,
  CustomerListResponse,
  FollowUp,
} from "@/types/customer.types";
import type {
  CustomerFormValues,
  FollowUpFormValues,
} from "@/schemas/customer.schema";

const emptyToNull = (value?: string) => {
  if (!value || value.trim() === "") return null;
  return value.trim();
};

const toPayload = (values: CustomerFormValues) => ({
  name: values.name.trim(),
  mobile: values.mobile.trim(),
  email: emptyToNull(values.email),
  businessName: emptyToNull(values.businessName),
  gstNumber: emptyToNull(values.gstNumber),
  customerType: values.customerType,
  address: emptyToNull(values.address),
  status: values.status,
  followUpDate: emptyToNull(values.followUpDate),
  notes: emptyToNull(values.notes),
});

export const customerService = {
  async list(params: CustomerListParams = {}) {
    const { data } = await api.get<ApiSuccess<CustomerListResponse>>(
      "/customers",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search || undefined,
          status: params.status || undefined,
          customerType: params.customerType || undefined,
        },
      }
    );
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiSuccess<Customer>>(`/customers/${id}`);
    return data.data;
  },

  async create(values: CustomerFormValues) {
    const { data } = await api.post<ApiSuccess<Customer>>(
      "/customers",
      toPayload(values)
    );
    return data.data;
  },

  async update(id: string, values: CustomerFormValues) {
    const { data } = await api.patch<ApiSuccess<Customer>>(
      `/customers/${id}`,
      toPayload(values)
    );
    return data.data;
  },

  async remove(id: string) {
    const { data } = await api.delete<ApiSuccess<{ id: string }>>(
      `/customers/${id}`
    );
    return data.data;
  },

  async listFollowUps(id: string) {
    const { data } = await api.get<ApiSuccess<FollowUp[]>>(
      `/customers/${id}/follow-ups`
    );
    return data.data;
  },

  async addFollowUp(id: string, values: FollowUpFormValues) {
    const { data } = await api.post<ApiSuccess<FollowUp>>(
      `/customers/${id}/follow-ups`,
      {
        note: values.note.trim(),
        followUpDate: emptyToNull(values.followUpDate),
      }
    );
    return data.data;
  },
};
