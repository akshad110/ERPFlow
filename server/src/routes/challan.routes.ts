import { Router } from "express";
import {
  cancelChallanById,
  confirmChallanById,
  createChallan,
  getChallan,
  getChallans,
  patchChallan,
} from "../controllers/challan.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getChallans);
router.get("/:id", getChallan);

router.post("/", authorizeRoles("ADMIN", "SALES"), createChallan);
router.patch("/:id", authorizeRoles("ADMIN", "SALES"), patchChallan);
router.post(
  "/:id/confirm",
  authorizeRoles("ADMIN", "SALES"),
  confirmChallanById
);
router.post(
  "/:id/cancel",
  authorizeRoles("ADMIN", "SALES"),
  cancelChallanById
);

export default router;
