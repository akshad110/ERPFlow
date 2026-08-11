import crypto from "crypto";
import { pool } from "../config/database.js";
import { findCustomerById } from "../models/customer.model.js";
import {
  deleteChallanItems,
  findChallanById,
  findChallanItems,
  findChallans,
  insertChallan,
  insertChallanItems,
  updateChallanRecord,
} from "../models/challan.model.js";
import {
  findProductById,
  findProductByIdForUpdate,
  updateProductStock,
} from "../models/product.model.js";
import { createStockMovement } from "../models/stock-movement.model.js";
import {
  ChallanItemInput,
  ChallanQueryInput,
  CreateChallanInput,
  UpdateChallanInput,
} from "../schemas/challan.schema.js";
import { InsufficientStockError } from "./product.service.js";
import { generateChallanNumber } from "../utils/challanNumber.js";
import { PoolConnection } from "mysql2/promise";

const buildSnapshotItems = async (
  challanId: string,
  items: ChallanItemInput[]
) => {
  const snapshotItems = [];
  let totalQuantity = 0;

  for (const item of items) {
    const product = await findProductById(item.productId);

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const totalPrice = Number((product.unitPrice * item.quantity).toFixed(2));
    totalQuantity += item.quantity;

    snapshotItems.push({
      id: crypto.randomUUID(),
      challanId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice: product.unitPrice,
      quantity: item.quantity,
      totalPrice,
    });
  }

  return { snapshotItems, totalQuantity };
};

const applyStockOutForItems = async (
  items: Array<{ productId: string; sku: string; quantity: number }>,
  userId: string,
  reason: string,
  connection: PoolConnection
) => {
  for (const item of items) {
    const product = await findProductByIdForUpdate(item.productId, connection);

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (product.currentStock < item.quantity) {
      throw new InsufficientStockError(
        product.sku,
        product.currentStock,
        item.quantity
      );
    }

    const newStock = product.currentStock - item.quantity;
    await updateProductStock(product.id, newStock, connection);

    await createStockMovement(
      {
        id: crypto.randomUUID(),
        productId: product.id,
        quantity: item.quantity,
        movementType: "OUT",
        reason,
        createdBy: userId,
      },
      connection
    );
  }
};

const restoreStockForItems = async (
  items: Array<{ productId: string; quantity: number }>,
  userId: string,
  reason: string,
  connection: PoolConnection
) => {
  for (const item of items) {
    const product = await findProductByIdForUpdate(item.productId, connection);

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const newStock = product.currentStock + item.quantity;
    await updateProductStock(product.id, newStock, connection);

    await createStockMovement(
      {
        id: crypto.randomUUID(),
        productId: product.id,
        quantity: item.quantity,
        movementType: "IN",
        reason,
        createdBy: userId,
      },
      connection
    );
  }
};

const getChallanDetails = async (id: string) => {
  const challan = await findChallanById(id);

  if (!challan) {
    throw new Error("Challan not found");
  }

  const items = await findChallanItems(id);

  return {
    ...challan,
    items,
  };
};

export const listChallans = async (query: ChallanQueryInput) => {
  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;

  const { challans, total } = await findChallans({
    search: query.search,
    status: query.status,
    customerId: query.customerId,
    limit,
    offset,
  });

  return {
    challans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

export const getChallanById = async (id: string) => {
  return getChallanDetails(id);
};

export const createNewChallan = async (
  input: CreateChallanInput,
  userId: string
) => {
  const customer = await findCustomerById(input.customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const challanId = crypto.randomUUID();
    const challanNumber = await generateChallanNumber(connection);
    const { snapshotItems, totalQuantity } = await buildSnapshotItems(
      challanId,
      input.items
    );

    const status = input.status || "DRAFT";

    if (status === "CONFIRMED") {
      await applyStockOutForItems(
        snapshotItems,
        userId,
        `Sales challan ${challanNumber}`,
        connection
      );
    }

    await insertChallan(
      {
        id: challanId,
        challanNumber,
        customerId: input.customerId,
        totalQuantity,
        status,
        createdBy: userId,
      },
      connection
    );

    await insertChallanItems(snapshotItems, connection);

    await connection.commit();

    return getChallanDetails(challanId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateDraftChallan = async (
  id: string,
  input: UpdateChallanInput
) => {
  const existing = await findChallanById(id);

  if (!existing) {
    throw new Error("Challan not found");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Only draft challans can be updated");
  }

  if (input.customerId) {
    const customer = await findCustomerById(input.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let totalQuantity = existing.totalQuantity;

    if (input.items) {
      const { snapshotItems, totalQuantity: qty } = await buildSnapshotItems(
        id,
        input.items
      );
      totalQuantity = qty;

      await deleteChallanItems(id, connection);
      await insertChallanItems(snapshotItems, connection);
    }

    await updateChallanRecord(
      id,
      {
        customerId: input.customerId,
        totalQuantity: input.items ? totalQuantity : undefined,
      },
      connection
    );

    await connection.commit();

    return getChallanDetails(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const confirmChallan = async (id: string, userId: string) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const challan = await findChallanById(id, connection);

    if (!challan) {
      throw new Error("Challan not found");
    }

    if (challan.status === "CONFIRMED") {
      throw new Error("Challan is already confirmed");
    }

    if (challan.status === "CANCELLED") {
      throw new Error("Cancelled challan cannot be confirmed");
    }

    const items = await findChallanItems(id, connection);

    if (items.length === 0) {
      throw new Error("Challan has no items");
    }

    await applyStockOutForItems(
      items,
      userId,
      `Sales challan ${challan.challanNumber}`,
      connection
    );

    await updateChallanRecord(id, { status: "CONFIRMED" }, connection);

    await connection.commit();

    return getChallanDetails(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const cancelChallan = async (id: string, userId: string) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const challan = await findChallanById(id, connection);

    if (!challan) {
      throw new Error("Challan not found");
    }

    if (challan.status === "CANCELLED") {
      throw new Error("Challan is already cancelled");
    }

    if (challan.status === "CONFIRMED") {
      const items = await findChallanItems(id, connection);

      await restoreStockForItems(
        items,
        userId,
        `Challan cancelled ${challan.challanNumber}`,
        connection
      );
    }

    await updateChallanRecord(id, { status: "CANCELLED" }, connection);

    await connection.commit();

    return getChallanDetails(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
