import jwt, { type SignOptions } from "jsonwebtoken";
import { AuthUser } from "../types/auth.types";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured. Add JWT_SECRET to server/.env and restart."
    );
  }

  return secret;
};

export const generateToken = (user: AuthUser): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    options
  );
};

export const verifyToken = (token: string): AuthUser => {
  return jwt.verify(token, getJwtSecret()) as AuthUser;
};
