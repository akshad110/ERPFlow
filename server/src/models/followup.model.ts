import { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import { FollowUp } from "../types/customer.types.js";

interface FollowUpRow extends RowDataPacket {
  id: string;
  customer_id: string;
  note: string;
  follow_up_date: Date | string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: Date;
}

const formatDate = (value: Date | string | null): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
};

const mapFollowUp = (row: FollowUpRow): FollowUp => ({
  id: row.id,
  customerId: row.customer_id,
  note: row.note,
  followUpDate: formatDate(row.follow_up_date),
  createdBy: row.created_by,
  createdByName: row.created_by_name || undefined,
  createdAt: row.created_at,
});

export const findFollowUpsByCustomerId = async (
  customerId: string
): Promise<FollowUp[]> => {
  const [rows] = await pool.execute<FollowUpRow[]>(
    `
    SELECT
      f.id,
      f.customer_id,
      f.note,
      f.follow_up_date,
      f.created_by,
      u.name AS created_by_name,
      f.created_at
    FROM follow_ups f
    LEFT JOIN users u ON u.id = f.created_by
    WHERE f.customer_id = ?
    ORDER BY f.created_at DESC
    `,
    [customerId]
  );

  return rows.map(mapFollowUp);
};

export const createFollowUp = async (data: {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string | null;
  createdBy: string;
}): Promise<void> => {
  await pool.execute(
    `
    INSERT INTO follow_ups (
      id,
      customer_id,
      note,
      follow_up_date,
      created_by
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      data.id,
      data.customerId,
      data.note,
      data.followUpDate,
      data.createdBy,
    ]
  );
};
