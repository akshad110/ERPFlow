import { pool } from "../config/database.js";
import { UserRole } from "../types/auth.types.js";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export const findUserByEmail = async (
  email: string
): Promise<UserRecord | null> => {
  const [rows] = await pool.execute(
    `
    SELECT
      id,
      name,
      email,
      password_hash,
      role,
      created_at,
      updated_at
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  const users = rows as UserRecord[];

  return users.length > 0 ? users[0] : null;
};

export const findUserById = async (
  id: string
): Promise<UserRecord | null> => {
  const [rows] = await pool.execute(
    `
    SELECT
      id,
      name,
      email,
      password_hash,
      role,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  const users = rows as UserRecord[];

  return users.length > 0 ? users[0] : null;
};