import { NextFunction, Request, Response, Router } from "express";
import {
  createProduct,
  createStockMovement,
  deleteProduct,
  getProduct,
  getProducts,
  getStockMovements,
  patchProduct,
  uploadImage,
} from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { uploadProductImage } from "../middlewares/upload.middleware";

const router = Router();

const handleUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadProductImage(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    const message =
      error instanceof Error ? error.message : "Failed to upload file";

    return res.status(400).json({
      success: false,
      message,
    });
  });
};

router.use(authenticate);

router.get("/", getProducts);
router.post("/", authorizeRoles("ADMIN", "WAREHOUSE"), createProduct);

router.get("/:id/stock-movements", getStockMovements);
router.post(
  "/:id/stock",
  authorizeRoles("ADMIN", "WAREHOUSE"),
  createStockMovement
);
router.post(
  "/:id/image",
  authorizeRoles("ADMIN", "WAREHOUSE"),
  handleUpload,
  uploadImage
);

router.get("/:id", getProduct);
router.patch("/:id", authorizeRoles("ADMIN", "WAREHOUSE"), patchProduct);
router.delete("/:id", authorizeRoles("ADMIN", "WAREHOUSE"), deleteProduct);

export default router;
