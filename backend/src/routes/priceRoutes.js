import express from "express";
import { getLatestPrices, simulatePriceTick } from "../controllers/priceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getLatestPrices);
router.post("/simulate-tick", simulatePriceTick);

export default router;
