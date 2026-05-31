import express from "express";
import {
  createShipment,
  getMyShipments,
  getShipmentById,
  updateShipmentStatus,
} from "../controllers/shipmentController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", authorize("farmer"), createShipment);
router.get("/", getMyShipments);
router.get("/:shipmentId", getShipmentById);
router.get("/:id", getShipmentById);
router.patch("/:shipmentId", authorize("farmer"), updateShipmentStatus);
router.patch("/:id/status", authorize("farmer"), updateShipmentStatus);

export default router;