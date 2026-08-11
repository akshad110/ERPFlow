import type { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service.js";

export const getStats = async (_req: Request, res: Response) => {
  try {
    const data = await getDashboardStats();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
