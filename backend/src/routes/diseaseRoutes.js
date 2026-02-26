import express from "express";
import { detectCropDisease, getMyDiseaseDetections } from "../controllers/diseaseController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/detect", authorize("farmer"), detectCropDisease);
router.get("/my", authorize("farmer"), getMyDiseaseDetections);

export default router;
