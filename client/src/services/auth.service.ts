import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api.type";
import type { AuthUser, LoginResponse } from "@/types/auth.types";
import type { LoginFormValues } from "@/schemas/auth.schema";

export const authService = {
  async login(payload: LoginFormValues) {
    const { data } = await api.post<ApiSuccess<LoginResponse>>(
      "/auth/login",
      payload
    );
    return data.data;
  },

  async me() {
    const { data } = await api.get<ApiSuccess<AuthUser>>("/auth/me");
    return data.data;
  },
};
