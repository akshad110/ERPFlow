import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import {
  Customer,
  CustomerStatus,
  CustomerType,
} from "../types/customer.types.js";

interface CustomerRow extends RowDataPacket {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  business_name: string | null;
  gst_number: string | null;
  customer_type: CustomerType;
  address: string | null;
  status: CustomerStatus;
  follow_up_date: Date | string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const formatDate = (value: Date | string | null): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
};

export const mapCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  name: row.name,
  mobile: row.mobile,
  email: row.email,
  businessName: row.business_name,
  gstNumber: row.gst_number,
  customerType: row.customer_type,
  address: row.address,
  status: row.status,
  followUpDate: formatDate(row.follow_up_date),
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findCustomers = async (filters: {
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  limit: number;
  offset: number;
}): Promise<{ customers: Customer[]; total: number }> => {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.search) {
    where.push(
      `(name LIKE ? OR mobile LIKE ? OR email LIKE ? OR business_name LIKE ?)`
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  if (filters.status) {
    where.push(`status = ?`);
    params.push(filters.status);
  }

  if (filters.customerType) {
    where.push(`customer_type = ?`);
    params.push(filters.customerType);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM customers ${whereSql}`,
    params
  );

  const total = Number(countRows[0]?.total || 0);

  // LIMIT/OFFSET are already sanitized integers from Zod
  const [rows] = await pool.execute<CustomerRow[]>(
    `
    SELECT
      id,
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
      created_at,
      updated_at
    FROM customers
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ${filters.limit} OFFSET ${filters.offset}
    `,
    params
  );

  return {
    customers: rows.map(mapCustomer),
    total,
  };
};

export const findCustomerById = async (
  id: string
): Promise<Customer | null> => {
  const [rows] = await pool.execute<CustomerRow[]>(
    `
    SELECT
      id,
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
      created_at,
      updated_at
    FROM customers
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows.length > 0 ? mapCustomer(rows[0]) : null;
};

export const createCustomer = async (data: {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string | null;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
}): Promise<void> => {
  await pool.execute(
    `
    INSERT INTO customers (
      id,
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.id,
      data.name,
      data.mobile,
      data.email,
      data.businessName,
      data.gstNumber,
      data.customerType,
      data.address,
      data.status,
      data.followUpDate,
      data.notes,
    ]
  );
};

export const updateCustomerById = async (
  id: string,
  data: Partial<{
    name: string;
    mobile: string;
    email: string | null;
    businessName: string | null;
    gstNumber: string | null;
    customerType: CustomerType;
    address: string | null;
    status: CustomerStatus;
    followUpDate: string | null;
    notes: string | null;
  }>
): Promise<boolean> => {
  const fields: string[] = [];
  const values: Array<string | null> = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.mobile !== undefined) {
    fields.push("mobile = ?");
    values.push(data.mobile);
  }
  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.businessName !== undefined) {
    fields.push("business_name = ?");
    values.push(data.businessName);
  }
  if (data.gstNumber !== undefined) {
    fields.push("gst_number = ?");
    values.push(data.gstNumber);
  }
  if (data.customerType !== undefined) {
    fields.push("customer_type = ?");
    values.push(data.customerType);
  }
  if (data.address !== undefined) {
    fields.push("address = ?");
    values.push(data.address);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }
  if (data.followUpDate !== undefined) {
    fields.push("follow_up_date = ?");
    values.push(data.followUpDate);
  }
  if (data.notes !== undefined) {
    fields.push("notes = ?");
    values.push(data.notes);
  }

  if (fields.length === 0) {
    return false;
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `
    UPDATE customers
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
    [...values, id]
  );

  return result.affectedRows > 0;
};

export const deleteCustomerById = async (id: string): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM customers WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
};
