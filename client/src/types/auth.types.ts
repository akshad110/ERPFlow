export type UserRole = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  user: AuthUser;
  token: string;
};
