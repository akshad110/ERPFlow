import { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { DashboardStats } from "../types/dashboard.types.js";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [[counts]] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      (SELECT COUNT(*) FROM customers) AS customersCount,
      (SELECT COUNT(*) FROM products) AS productsCount,
      (SELECT COUNT(*) FROM products WHERE current_stock <= min_stock_alert) AS lowStockCount,
      (SELECT COUNT(*) FROM challans) AS challansCount,
      (SELECT COUNT(*) FROM challans WHERE status = 'DRAFT') AS draftChallansCount,
      (SELECT COUNT(*) FROM challans WHERE status = 'CONFIRMED') AS confirmedChallansCount
    `
  );

  const [recentRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      ch.id,
      ch.challan_number AS challanNumber,
      c.name AS customerName,
      c.business_name AS businessName,
      ch.status,
      ch.total_quantity AS totalQuantity,
      ch.created_at AS createdAt
    FROM challans ch
    LEFT JOIN customers c ON c.id = ch.customer_id
    ORDER BY ch.created_at DESC
    LIMIT 5
    `
  );

  return {
    customersCount: Number(counts.customersCount || 0),
    productsCount: Number(counts.productsCount || 0),
    lowStockCount: Number(counts.lowStockCount || 0),
    challansCount: Number(counts.challansCount || 0),
    draftChallansCount: Number(counts.draftChallansCount || 0),
    confirmedChallansCount: Number(counts.confirmedChallansCount || 0),
    recentChallans: recentRows.map((row) => ({
      id: String(row.id),
      challanNumber: String(row.challanNumber),
      customerName: row.customerName ? String(row.customerName) : null,
      businessName: row.businessName ? String(row.businessName) : null,
      status: row.status,
      totalQuantity: Number(row.totalQuantity || 0),
      createdAt: row.createdAt,
    })),
  };
};
