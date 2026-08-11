import crypto from "crypto";
import { pool } from "../config/database.js";
import {
  createProduct,
  deleteProductById,
  deleteStockMovementsByProductId,
  findProductById,
  findProductByIdForUpdate,
  findProductBySku,
  findProducts,
  updateProductById,
  updateProductStock,
} from "../models/product.model.js";
import {
  createStockMovement,
  findStockMovementsByProductId,
} from "../models/stock-movement.model.js";
import {
  CreateProductInput,
  ProductQueryInput,
  StockMovementInput,
  UpdateProductInput,
} from "../schemas/product.schema.js";
import {
  deleteObjectFromS3,
  uploadProductImageToS3,
} from "../utils/s3.js";

const emptyToNull = (
  value: string | null | undefined
): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
};

export class InsufficientStockError extends Error {
  availableStock: number;
  requestedQuantity: number;
  sku: string;

  constructor(sku: string, availableStock: number, requestedQuantity: number) {
    super(`Insufficient stock for product ${sku}`);
    this.name = "InsufficientStockError";
    this.sku = sku;
    this.availableStock = availableStock;
    this.requestedQuantity = requestedQuantity;
  }
}

export const listProducts = async (query: ProductQueryInput) => {
  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;

  const { products, total } = await findProducts({
    search: query.search,
    category: query.category,
    lowStock: query.lowStock,
    limit,
    offset,
  });

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

export const getProductById = async (id: string) => {
  const product = await findProductById(id);

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const createNewProduct = async (
  input: CreateProductInput,
  userId: string
) => {
  const existingSku = await findProductBySku(input.sku);

  if (existingSku) {
    throw new Error("SKU already exists");
  }

  const id = crypto.randomUUID();
  const currentStock = input.currentStock || 0;

  await createProduct({
    id,
    name: input.name,
    sku: input.sku,
    category: input.category,
    unitPrice: input.unitPrice,
    currentStock,
    minStockAlert: input.minStockAlert || 0,
    warehouseLocation: emptyToNull(input.warehouseLocation),
  });

  if (currentStock > 0) {
    await createStockMovement({
      id: crypto.randomUUID(),
      productId: id,
      quantity: currentStock,
      movementType: "IN",
      reason: "Initial stock",
      createdBy: userId,
    });
  }

  const product = await findProductById(id);

  if (!product) {
    throw new Error("Failed to create product");
  }

  return product;
};

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  const existing = await findProductById(id);

  if (!existing) {
    throw new Error("Product not found");
  }

  if (input.sku && input.sku !== existing.sku) {
    const skuOwner = await findProductBySku(input.sku);
    if (skuOwner && skuOwner.id !== id) {
      throw new Error("SKU already exists");
    }
  }

  const payload: Parameters<typeof updateProductById>[1] = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.sku !== undefined) payload.sku = input.sku;
  if (input.category !== undefined) payload.category = input.category;
  if (input.unitPrice !== undefined) payload.unitPrice = input.unitPrice;
  if (input.minStockAlert !== undefined) {
    payload.minStockAlert = input.minStockAlert;
  }
  if (input.warehouseLocation !== undefined) {
    payload.warehouseLocation = emptyToNull(input.warehouseLocation);
  }

  if (Object.keys(payload).length > 0) {
    await updateProductById(id, payload);
  }

  const product = await findProductById(id);

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const removeProduct = async (id: string) => {
  const existing = await findProductById(id);

  if (!existing) {
    throw new Error("Product not found");
  }

  try {
    await deleteStockMovementsByProductId(id);
    await deleteProductById(id);

    if (existing.imageUrl) {
      await deleteObjectFromS3(existing.imageUrl);
    }
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code)
        : "";

    if (
      code === "ER_ROW_IS_REFERENCED_2" ||
      code === "ER_ROW_IS_REFERENCED"
    ) {
      throw new Error(
        "Product cannot be deleted because it is used in challans"
      );
    }

    throw error;
  }

  return { id };
};

export const uploadProductImage = async (
  productId: string,
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }
) => {
  const product = await findProductById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const uploaded = await uploadProductImageToS3(file);
  const previousImageUrl = product.imageUrl;

  await updateProductById(productId, { imageUrl: uploaded.url });

  if (previousImageUrl) {
    await deleteObjectFromS3(previousImageUrl);
  }

  const updated = await findProductById(productId);

  if (!updated) {
    throw new Error("Product not found");
  }

  return updated;
};

export const listProductStockMovements = async (productId: string) => {
  const product = await findProductById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  return findStockMovementsByProductId(productId);
};

export const adjustProductStock = async (
  productId: string,
  userId: string,
  input: StockMovementInput
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const product = await findProductByIdForUpdate(productId, connection);

    if (!product) {
      throw new Error("Product not found");
    }

    let newStock = product.currentStock;

    if (input.movementType === "IN") {
      newStock = product.currentStock + input.quantity;
    } else {
      if (product.currentStock < input.quantity) {
        throw new InsufficientStockError(
          product.sku,
          product.currentStock,
          input.quantity
        );
      }
      newStock = product.currentStock - input.quantity;
    }

    await updateProductStock(productId, newStock, connection);

    const movementId = crypto.randomUUID();

    await createStockMovement(
      {
        id: movementId,
        productId,
        quantity: input.quantity,
        movementType: input.movementType,
        reason: input.reason,
        createdBy: userId,
      },
      connection
    );

    await connection.commit();

    const updatedProduct = await findProductById(productId);
    const movements = await findStockMovementsByProductId(productId);
    const movement = movements.find((item) => item.id === movementId);

    return {
      product: updatedProduct,
      movement,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
