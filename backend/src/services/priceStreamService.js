import { PricePrediction } from "../models/Price.models.js";

const STREAM_INTERVAL_MS = 5000;

const mandiDataset = [
  { cropName: "Wheat", basePrice: 2200, trend: "increase", location: [77.209, 28.6139] },
  { cropName: "Rice", basePrice: 2450, trend: "stable", location: [72.8777, 19.076] },
  { cropName: "Maize", basePrice: 1980, trend: "decrease", location: [88.3639, 22.5726] },
  { cropName: "Potato", basePrice: 1650, trend: "increase", location: [80.9462, 26.8467] },
  { cropName: "Tomato", basePrice: 1400, trend: "stable", location: [78.4867, 17.385] },
];

let timerRef = null;
let cursor = 0;

const nextTrend = (value) => {
  if (value > 0.6) return "increase";
  if (value < -0.6) return "decrease";
  return "stable";
};

const generateForecast = (row) => {
  const randomSwing = Number((Math.random() * 140 - 70).toFixed(2));
  const predictedPrice = Math.max(100, Number((row.basePrice + randomSwing).toFixed(2)));

  // TODO(ai-model): Call your forecasting model here and replace simulated values.
  const confidence = Number((0.55 + Math.random() * 0.4).toFixed(2));
  const trend = nextTrend((predictedPrice - row.basePrice) / row.basePrice);

  return {
    predictedPrice,
    confidence,
    trend,
    insights: `Predicted ${trend} movement from recent mandi trend.`,
    historicalPrices: [
      { date: new Date(Date.now() - 86400000), price: row.basePrice - 20 },
      { date: new Date(Date.now() - 43200000), price: row.basePrice + 15 },
      { date: new Date(), price: row.basePrice },
    ],
  };
};

export const pushNextPricePoint = async () => {
  const row = mandiDataset[cursor % mandiDataset.length];
  cursor += 1;
  const forecast = generateForecast(row);

  const record = await PricePrediction.create({
    cropName: row.cropName,
    location: {
      type: "Point",
      coordinates: row.location,
    },
    date: new Date(),
    predictedPrice: forecast.predictedPrice,
    unit: "quintal",
    confidance: forecast.confidence,
    trend: forecast.trend,
    insights: forecast.insights,
    historicalPrices: forecast.historicalPrices,
  });

  return record;
};

export const startPriceStream = () => {
  if (timerRef) {
    return;
  }

  timerRef = setInterval(async () => {
    try {
      await pushNextPricePoint();
    } catch (error) {
      console.error("Price stream tick failed:", error.message);
    }
  }, STREAM_INTERVAL_MS);
};

export const stopPriceStream = () => {
  if (!timerRef) {
    return;
  }
  clearInterval(timerRef);
  timerRef = null;
};
