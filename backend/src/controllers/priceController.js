import { PricePrediction } from "../models/Price.models.js";
import { pushNextPricePoint } from "../services/priceStreamService.js";

export const getLatestPrices = async (req, res) => {
  try {
    const { cropName, limit = 20 } = req.query;
    const query = cropName ? { cropName: { $regex: cropName, $options: "i" } } : {};

    const prices = await PricePrediction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: prices.length, data: prices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const simulatePriceTick = async (_req, res) => {
  try {
    const record = await pushNextPricePoint();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
