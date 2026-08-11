import { ResultSetHeader, RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { pool } from "../config/database.js";
import {
  Challan,
  ChallanItem,
  ChallanStatus,
} from "../types/challan.types.js";

interface ChallanRow extends RowDataPacket {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name: string | null;
  business_name: string | null;
  total_quantity: number;
  status: ChallanStatus;
  created_by: string;
  created_by_name: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ChallanItemRow extends RowDataPacket {
  id: string;
  challan_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number | string;
  quantity: number;
  total_price: number | string;
}

export const mapChallan = (row: ChallanRow): Challan => ({
  id: row.id,
  challanNumber: row.challan_number,
  customerId: row.customer_id,
  customerName: row.customer_name || undefined,
  businessName: row.business_name,
  totalQuantity: Number(row.total_quantity),
  status: row.status,
  createdBy: row.created_by,
  createdByName: row.created_by_name || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapChallanItem = (row: ChallanItemRow): ChallanItem => ({
  id: row.id,
  challanId: row.challan_id,
  productId: row.product_id,
  productName: row.product_name,
  sku: row.sku,
  unitPrice: Number(row.unit_price),
  quantity: Number(row.quantity),
  totalPrice: Number(row.total_price),
});

export const findChallans = async (filters: {
  search?: string;
  status?: ChallanStatus;
  customerId?: string;
  limit: number;
  offset: number;
}): Promise<{ challans: Challan[]; total: number }> => {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.search) {
    where.push(
      `(ch.challan_number LIKE ? OR c.name LIKE ? OR c.business_name LIKE ?)`
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (filters.status) {
    where.push(`ch.status = ?`);
    params.push(filters.status);
  }

  if (filters.customerId) {
    where.push(`ch.customer_id = ?`);
    params.push(filters.customerId);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM challans ch
    LEFT JOIN customers c ON c.id = ch.customer_id
    ${whereSql}
    `,
    params
  );

  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.execute<ChallanRow[]>(
    `
    SELECT
      ch.id,
      ch.challan_number,
      ch.customer_id,
      c.name AS customer_name,
      c.business_name,
      ch.total_quantity,
      ch.status,
      ch.created_by,
      u.name AS created_by_name,
      ch.created_at,
      ch.updated_at
    FROM challans ch
    LEFT JOIN customers c ON c.id = ch.customer_id
    LEFT JOIN users u ON u.id = ch.created_by
    ${whereSql}
    ORDER BY ch.created_at DESC
    LIMIT ${filters.limit} OFFSET ${filters.offset}
    `,
    params
  );

  return {
    challans: rows.map(mapChallan),
    total,
  };
};

export const findChallanById = async (
  id: string,
  connection?: PoolConnection
): Promise<Challan | null> => {
  const db = connection || pool;

  const [rows] = await db.execute<ChallanRow[]>(
    `
    SELECT
      ch.id,
      ch.challan_number,
      ch.customer_id,
      c.name AS customer_name,
      c.business_name,
      ch.total_quantity,
      ch.status,
      ch.created_by,
      u.name AS created_by_name,
      ch.created_at,
      ch.updated_at
    FROM challans ch
    LEFT JOIN customers c ON c.id = ch.customer_id
    LEFT JOIN users u ON u.id = ch.created_by
    WHERE ch.id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows.length > 0 ? mapChallan(rows[0]) : null;
};

export const findChallanItems = async (
  challanId: string,
  connection?: PoolConnection
): Promise<ChallanItem[]> => {
  const db = connection || pool;

  const [rows] = await db.execute<ChallanItemRow[]>(
    `
    SELECT
      id,
      challan_id,
      product_id,
      product_name,
      sku,
      unit_price,
      quantity,
      total_price
    FROM challan_items
    WHERE challan_id = ?
    ORDER BY product_name ASC
    `,
    [challanId]
  );

  return rows.map(mapChallanItem);
};

export const insertChallan = async (
  data: {
    id: string;
    challanNumber: string;
    customerId: string;
    totalQuantity: number;
    status: ChallanStatus;
    createdBy: string;
  },
  connection: PoolConnection
): Promise<void> => {
  await connection.execute(
    `
    INSERT INTO challans (
      id,
      challan_number,
      customer_id,
      total_quantity,
      status,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      data.id,
      data.challanNumber,
      data.customerId,
      data.totalQuantity,
      data.status,
      data.createdBy,
    ]
  );
};

export const insertChallanItems = async (
  items: Array<{
    id: string;
    challanId: string;
    productId: string;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>,
  connection: PoolConnection
): Promise<void> => {
  for (const item of items) {
    await connection.execute(
      `
      INSERT INTO challan_items (
        id,
        challan_id,
        product_id,
        product_name,
        sku,
        unit_price,
        quantity,
        total_price
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        item.id,
        item.challanId,
        item.productId,
        item.productName,
        item.sku,
        item.unitPrice,
        item.quantity,
        item.totalPrice,
      ]
    );
  }
};

export const deleteChallanItems = async (
  challanId: string,
  connection: PoolConnection
): Promise<void> => {
  await connection.execute(`DELETE FROM challan_items WHERE challan_id = ?`, [
    challanId,
  ]);
};

export const updateChallanRecord = async (
  id: string,
  data: Partial<{
    customerId: string;
    totalQuantity: number;
    status: ChallanStatus;
  }>,
  connection?: PoolConnection
): Promise<boolean> => {
  const db = connection || pool;
  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (data.customerId !== undefined) {
    fields.push("customer_id = ?");
    values.push(data.customerId);
  }
  if (data.totalQuantity !== undefined) {
    fields.push("total_quantity = ?");
    values.push(data.totalQuantity);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }

  if (fields.length === 0) {
    return false;
  }

  const [result] = await db.execute<ResultSetHeader>(
    `
    UPDATE challans
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    [...values, id]
  );

  return result.affectedRows > 0;
};
