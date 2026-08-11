import { Request, Response } from "express";
import {
  createCustomerSchema,
  createFollowUpSchema,
  customerQuerySchema,
  updateCustomerSchema,
} from "../schemas/customer.schema.js";
import {
  addCustomerFollowUp,
  createNewCustomer,
  getCustomerById,
  listCustomerFollowUps,
  listCustomers,
  removeCustomer,
  updateCustomer,
} from "../services/customer.service.js";

const getParamId = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const parsed = customerQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = await listCustomers(parsed.data);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await getCustomerById(getParamId(req.params.id));

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Customer not found";

    if (message === "Customer not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Get customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const parsed = createCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const customer = await createNewCustomer(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const patchCustomer = async (req: Request, res: Response) => {
  try {
    const parsed = updateCustomerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const customer = await updateCustomer(
      getParamId(req.params.id),
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Customer not found";

    if (message === "Customer not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Update customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const data = await removeCustomer(getParamId(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Customer not found";

    if (message === "Customer not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Delete customer error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getFollowUps = async (req: Request, res: Response) => {
  try {
    const followUps = await listCustomerFollowUps(getParamId(req.params.id));

    return res.status(200).json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Customer not found";

    if (message === "Customer not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Get follow-ups error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createFollowUp = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = createFollowUpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const followUp = await addCustomerFollowUp(
      getParamId(req.params.id),
      req.user.id,
      parsed.data
    );

    return res.status(201).json({
      success: true,
      message: "Follow-up added successfully",
      data: followUp,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Customer not found";

    if (message === "Customer not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Create follow-up error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
