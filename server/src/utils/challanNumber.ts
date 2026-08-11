import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { pool } from "../config/database.js";

export const generateChallanNumber = async (
  connection?: PoolConnection
): Promise<string> => {
  const db = connection || pool;
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const [rows] = await db.execute<RowDataPacket[]>(
    `
    SELECT challan_number
    FROM challans
    WHERE challan_number LIKE ?
    ORDER BY challan_number DESC
    LIMIT 1
    `,
    [`${prefix}%`]
  );

  let nextNumber = 1;

  if (rows.length > 0) {
    const last = String(rows[0].challan_number);
    const parts = last.split("-");
    const parsed = Number(parts[2]);
    if (!Number.isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
};
