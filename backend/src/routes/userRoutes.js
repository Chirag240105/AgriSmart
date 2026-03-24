import express from "express";
import { getMe, updateMe, uploadProfileImage } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.use(protect);
router.get("/me", getMe);
router.patch("/me", updateMe);

router.patch("/upload-profile", upload.single("profileImage"), uploadProfileImage)
export default router;
