import axios, { AxiosError, isAxiosError } from "axios";
import type { ApiErrorBody } from "@/types/api.type";
import { authStorage } from "@/lib/authStorage";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  console.warn("VITE_API_URL is not set in client/.env");
}

export const api = axios.create({
  baseURL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthRoute = url.includes("/auth/login");

      if (!isAuthRoute) {
        authStorage.clearAll();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    if (data?.errors) {
      const firstFieldError = Object.values(data.errors)
        .flat()
        .find(Boolean);
      if (firstFieldError) return firstFieldError;
    }

    if (data?.message) {
      if (
        typeof data.availableStock === "number" &&
        typeof data.requestedQuantity === "number"
      ) {
        return `${data.message} (available: ${data.availableStock}, requested: ${data.requestedQuantity})`;
      }
      return data.message;
    }

    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Check if the API is running.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
