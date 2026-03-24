import express from "express";
import {
  createShipment,
  getMyShipments,
  getShipmentById,
  updateShipmentStatus,
} from "../controllers/shipmentController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", authorize("farmer"), createShipment);
router.get("/", getMyShipments);
router.get("/:id", getShipmentById);
router.patch("/:id/status", authorize("farmer"), updateShipmentStatus);

export default router;
