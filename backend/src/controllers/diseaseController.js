import { Crop } from "../models/Crop.models.js";
import { CropHealth } from "../models/CropHealth.models.js";
import { detectDiseaseFromImage } from "../services/diseaseDetectionService.js";

export const detectCropDisease = async (req, res) => {
  try {
    const { cropId, imageUrl } = req.body;
    if (!cropId || !imageUrl) {
      return res.status(400).json({ success: false, message: "cropId and imageUrl are required" });
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }
    if (crop.farmerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized for this crop" });
    }

    const result = await detectDiseaseFromImage({ imageUrl });
    const record = await CropHealth.create({
      farmerId: req.user.id,
      cropId,
      imageUrl,
      diseaseName: result.diseaseName,
      confidence: result.confidence,
      suggestions: result.suggestions,
      status: "pending",
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyDiseaseDetections = async (req, res) => {
  try {
    const records = await CropHealth.find({ farmerId: req.user.id })
      .populate("cropId", "cropName variety")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
