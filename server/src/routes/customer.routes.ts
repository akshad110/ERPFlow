import { Router } from "express";
import {
  createCustomer,
  createFollowUp,
  deleteCustomer,
  getCustomer,
  getCustomers,
  getFollowUps,
  patchCustomer,
} from "../controllers/customer.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getCustomers);
router.get("/:id", getCustomer);

router.post("/", authorizeRoles("ADMIN", "SALES"), createCustomer);
router.patch("/:id", authorizeRoles("ADMIN", "SALES"), patchCustomer);
router.delete("/:id", authorizeRoles("ADMIN", "SALES"), deleteCustomer);

router.get("/:id/follow-ups", getFollowUps);
router.post(
  "/:id/follow-ups",
  authorizeRoles("ADMIN", "SALES"),
  createFollowUp
);

export default router;
