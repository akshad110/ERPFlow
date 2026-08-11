import { findUserByEmail, findUserById } from "../models/user.model.js";
import { comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { LoginInput } from "../schemas/auth.schema.js";
import { AuthUser } from "../types/auth.types.js";

export const loginUser = async (
  data: LoginInput
) => {
  const user = await findUserByEmail(data.email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await comparePassword(
    data.password,
    user.password_hash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(authUser);

  return {
    user: authUser,
    token,
  };
};

export const getCurrentUser = async (
  userId: string
) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};