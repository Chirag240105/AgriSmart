import express from "express";
import { getMe, updateMe } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/me", getMe);
router.patch("/me", updateMe);

export default router;
