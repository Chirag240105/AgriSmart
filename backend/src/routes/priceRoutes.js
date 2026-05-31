import express from "express";
import { getLatestPrices, predictPrice, simulatePriceTick } from "../controllers/priceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getLatestPrices);
router.get("/current", getLatestPrices);
router.post("/predict", predictPrice);
router.post("/simulate-tick", protect, simulatePriceTick);

export default router;