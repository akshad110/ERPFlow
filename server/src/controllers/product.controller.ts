import { Request, Response } from "express";
import {
  createProductSchema,
  productQuerySchema,
  stockMovementSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import {
  adjustProductStock,
  createNewProduct,
  getProductById,
  InsufficientStockError,
  listProducts,
  listProductStockMovements,
  removeProduct,
  updateProduct,
  uploadProductImage,
} from "../services/product.service.js";

const getParamId = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getProducts = async (req: Request, res: Response) => {
  try {
    const parsed = productQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await listProducts(parsed.data);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await getProductById(getParamId(req.params.id));

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product not found";

    if (message === "Product not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Get product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = createProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const product = await createNewProduct(parsed.data, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";

    if (message === "SKU already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const patchProduct = async (req: Request, res: Response) => {
  try {
    const parsed = updateProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const product = await updateProduct(getParamId(req.params.id), parsed.data);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product not found";

    if (message === "Product not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "SKU already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Update product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const data = await removeProduct(getParamId(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product not found";

    if (message === "Product not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message.includes("cannot be deleted")) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Delete product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const movements = await listProductStockMovements(
      getParamId(req.params.id)
    );

    return res.status(200).json({
      success: true,
      data: movements,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product not found";

    if (message === "Product not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Get stock movements error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createStockMovement = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = stockMovementSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await adjustProductStock(
      getParamId(req.params.id),
      req.user.id,
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data,
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        availableStock: error.availableStock,
        requestedQuantity: error.requestedQuantity,
      });
    }

    const message =
      error instanceof Error ? error.message : "Product not found";

    if (message === "Product not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Create stock movement error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required. Use form-data field name: image",
      });
    }

    const product = await uploadProductImage(getParamId(req.params.id), {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    return res.status(200).json({
      success: true,
      message: "Product image uploaded successfully",
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload image";

    if (message === "Product not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message.includes("is not configured")) {
      return res.status(500).json({
        success: false,
        message:
          "AWS S3 is not configured. Add AWS credentials to server/.env",
      });
    }

    console.error("Upload product image error:", error);
    return res.status(500).json({
      success: false,
      message: message || "Internal server error",
    });
  }
};
