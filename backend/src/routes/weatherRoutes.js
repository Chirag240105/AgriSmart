import express from "express";
import { getCurrentWeather, getLatestWeather } from "../controllers/weatherController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/current", getCurrentWeather);
router.get("/latest", getLatestWeather);

export default router;