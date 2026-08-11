import { ResultSetHeader, RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { pool } from "../config/database.js";
import { Product } from "../types/product.types.js";

interface ProductRow extends RowDataPacket {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number | string;
  current_stock: number;
  min_stock_alert: number;
  warehouse_location: string | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

const PRODUCT_COLUMNS = `
  id,
  name,
  sku,
  category,
  unit_price,
  current_stock,
  min_stock_alert,
  warehouse_location,
  image_url,
  created_at,
  updated_at
`;

export const mapProduct = (row: ProductRow): Product => {
  const currentStock = Number(row.current_stock);
  const minStockAlert = Number(row.min_stock_alert);

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    unitPrice: Number(row.unit_price),
    currentStock,
    minStockAlert,
    warehouseLocation: row.warehouse_location,
    imageUrl: row.image_url,
    isLowStock: currentStock <= minStockAlert,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const findProducts = async (filters: {
  search?: string;
  category?: string;
  lowStock?: boolean;
  limit: number;
  offset: number;
}): Promise<{ products: Product[]; total: number }> => {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.search) {
    where.push(`(name LIKE ? OR sku LIKE ? OR category LIKE ?)`);
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (filters.category) {
    where.push(`category = ?`);
    params.push(filters.category);
  }

  if (filters.lowStock === true) {
    where.push(`current_stock <= min_stock_alert`);
  }

  if (filters.lowStock === false) {
    where.push(`current_stock > min_stock_alert`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM products ${whereSql}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.execute<ProductRow[]>(
    `
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ${filters.limit} OFFSET ${filters.offset}
    `,
    params
  );

  return {
    products: rows.map(mapProduct),
    total,
  };
};

export const findProductById = async (
  id: string,
  connection?: PoolConnection
): Promise<Product | null> => {
  const db = connection || pool;

  const [rows] = await db.execute<ProductRow[]>(
    `
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows.length > 0 ? mapProduct(rows[0]) : null;
};

export const findProductByIdForUpdate = async (
  id: string,
  connection: PoolConnection
): Promise<Product | null> => {
  const [rows] = await connection.execute<ProductRow[]>(
    `
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    WHERE id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [id]
  );

  return rows.length > 0 ? mapProduct(rows[0]) : null;
};

export const findProductBySku = async (
  sku: string
): Promise<Product | null> => {
  const [rows] = await pool.execute<ProductRow[]>(
    `
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    WHERE sku = ?
    LIMIT 1
    `,
    [sku]
  );

  return rows.length > 0 ? mapProduct(rows[0]) : null;
};

export const createProduct = async (data: {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation: string | null;
}): Promise<void> => {
  await pool.execute(
    `
    INSERT INTO products (
      id,
      name,
      sku,
      category,
      unit_price,
      current_stock,
      min_stock_alert,
      warehouse_location
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.id,
      data.name,
      data.sku,
      data.category,
      data.unitPrice,
      data.currentStock,
      data.minStockAlert,
      data.warehouseLocation,
    ]
  );
};

export const updateProductById = async (
  id: string,
  data: Partial<{
    name: string;
    sku: string;
    category: string;
    unitPrice: number;
    minStockAlert: number;
    warehouseLocation: string | null;
    imageUrl: string | null;
  }>
): Promise<boolean> => {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.sku !== undefined) {
    fields.push("sku = ?");
    values.push(data.sku);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    values.push(data.category);
  }
  if (data.unitPrice !== undefined) {
    fields.push("unit_price = ?");
    values.push(data.unitPrice);
  }
  if (data.minStockAlert !== undefined) {
    fields.push("min_stock_alert = ?");
    values.push(data.minStockAlert);
  }
  if (data.warehouseLocation !== undefined) {
    fields.push("warehouse_location = ?");
    values.push(data.warehouseLocation);
  }
  if (data.imageUrl !== undefined) {
    fields.push("image_url = ?");
    values.push(data.imageUrl);
  }

  if (fields.length === 0) {
    return false;
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `
    UPDATE products
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    [...values, id]
  );

  return result.affectedRows > 0;
};

export const updateProductStock = async (
  id: string,
  newStock: number,
  connection: PoolConnection
): Promise<void> => {
  await connection.execute(
    `
    UPDATE products
    SET current_stock = ?
    WHERE id = ?
    `,
    [newStock, id]
  );
};

export const deleteProductById = async (id: string): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM products WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
};

export const deleteStockMovementsByProductId = async (
  productId: string
): Promise<void> => {
  await pool.execute(`DELETE FROM stock_movements WHERE product_id = ?`, [
    productId,
  ]);
};
