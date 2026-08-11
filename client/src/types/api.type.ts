export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: Record<string, string[] | undefined>;
  availableStock?: number;
  requestedQuantity?: number;
};

export type Paginated<T> = {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} & T;
