import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { pool } from "../config/database.js";
import {
  StockMovement,
  StockMovementType,
} from "../types/product.types.js";

interface StockMovementRow extends RowDataPacket {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: StockMovementType;
  reason: string;
  created_by: string;
  created_by_name: string | null;
  created_at: Date;
}

const mapStockMovement = (row: StockMovementRow): StockMovement => ({
  id: row.id,
  productId: row.product_id,
  quantity: Number(row.quantity),
  movementType: row.movement_type,
  reason: row.reason,
  createdBy: row.created_by,
  createdByName: row.created_by_name || undefined,
  createdAt: row.created_at,
});

export const findStockMovementsByProductId = async (
  productId: string
): Promise<StockMovement[]> => {
  const [rows] = await pool.execute<StockMovementRow[]>(
    `
    SELECT
      sm.id,
      sm.product_id,
      sm.quantity,
      sm.movement_type,
      sm.reason,
      sm.created_by,
      u.name AS created_by_name,
      sm.created_at
    FROM stock_movements sm
    LEFT JOIN users u ON u.id = sm.created_by
    WHERE sm.product_id = ?
    ORDER BY sm.created_at DESC
    `,
    [productId]
  );

  return rows.map(mapStockMovement);
};

export const createStockMovement = async (
  data: {
    id: string;
    productId: string;
    quantity: number;
    movementType: StockMovementType;
    reason: string;
    createdBy: string;
  },
  connection?: PoolConnection
): Promise<void> => {
  const db = connection || pool;

  await db.execute(
    `
    INSERT INTO stock_movements (
      id,
      product_id,
      quantity,
      movement_type,
      reason,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      data.id,
      data.productId,
      data.quantity,
      data.movementType,
      data.reason,
      data.createdBy,
    ]
  );
};
