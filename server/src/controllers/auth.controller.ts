import { Request, Response } from "express";
import { loginSchema } from "../schemas/auth.schema.js";
import {
  getCurrentUser,
  loginUser,
} from "../services/auth.service.js";

export const login = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const data = await loginUser(result.data);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";

    if (message === "Invalid email or password") {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await getCurrentUser(req.user.id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "User not found";

    if (message === "User not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Me error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};