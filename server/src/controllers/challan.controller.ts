import { Request, Response } from "express";
import {
  challanQuerySchema,
  createChallanSchema,
  updateChallanSchema,
} from "../schemas/challan.schema.js";
import {
  cancelChallan,
  confirmChallan,
  createNewChallan,
  getChallanById,
  listChallans,
  updateDraftChallan,
} from "../services/challan.service.js";
import { InsufficientStockError } from "../services/product.service.js";

const getParamId = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getChallans = async (req: Request, res: Response) => {
  try {
    const parsed = challanQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await listChallans(parsed.data);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get challans error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getChallan = async (req: Request, res: Response) => {
  try {
    const challan = await getChallanById(getParamId(req.params.id));

    return res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Challan not found";

    if (message === "Challan not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Get challan error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createChallan = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = createChallanSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const challan = await createNewChallan(parsed.data, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Challan created successfully",
      data: challan,
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
      error instanceof Error ? error.message : "Failed to create challan";

    if (
      message === "Customer not found" ||
      message.startsWith("Product not found")
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Create challan error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const patchChallan = async (req: Request, res: Response) => {
  try {
    const parsed = updateChallanSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const challan = await updateDraftChallan(
      getParamId(req.params.id),
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Challan updated successfully",
      data: challan,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update challan";

    if (message === "Challan not found" || message === "Customer not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "Only draft challans can be updated") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message.startsWith("Product not found")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Update challan error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const confirmChallanById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const challan = await confirmChallan(
      getParamId(req.params.id),
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Challan confirmed successfully",
      data: challan,
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
      error instanceof Error ? error.message : "Failed to confirm challan";

    if (message === "Challan not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message === "Challan is already confirmed" ||
      message === "Cancelled challan cannot be confirmed" ||
      message === "Challan has no items"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Confirm challan error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const cancelChallanById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const challan = await cancelChallan(getParamId(req.params.id), req.user.id);

    return res.status(200).json({
      success: true,
      message: "Challan cancelled successfully",
      data: challan,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel challan";

    if (message === "Challan not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "Challan is already cancelled") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Cancel challan error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
