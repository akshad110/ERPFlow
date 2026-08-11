import { Router } from "express";
import {
  createProduct,
  createStockMovement,
  deleteProduct,
  getProduct,
  getProducts,
  getStockMovements,
  patchProduct,
} from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getProducts);
router.post("/", authorizeRoles("ADMIN", "WAREHOUSE"), createProduct);

router.get("/:id/stock-movements", getStockMovements);
router.post(
  "/:id/stock",
  authorizeRoles("ADMIN", "WAREHOUSE"),
  createStockMovement
);

router.get("/:id", getProduct);
router.patch("/:id", authorizeRoles("ADMIN", "WAREHOUSE"), patchProduct);
router.delete("/:id", authorizeRoles("ADMIN", "WAREHOUSE"), deleteProduct);

export default router;
