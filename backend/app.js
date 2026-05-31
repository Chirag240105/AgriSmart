import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import cropRoutes from "./src/routes/cropRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import shipmentRoutes from "./src/routes/shipmentRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import weatherRoutes from "./src/routes/weatherRoutes.js";
import weatherAdviceRoutes from "./src/routes/weatherAdvice.js";
import priceRoutes from "./src/routes/priceRoutes.js";
import diseaseRoutes from "./src/routes/diseaseRoutes.js";
import chatbotRoutes from "./src/routes/chatbotRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import { startPriceStream } from "./src/services/priceStreamService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow any localhost port in development
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      // Allow Vercel production and preview deployments
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
      // Allow custom production domain if set
      const prodDomain = process.env.FRONTEND_URL;
      if (prodDomain && origin === prodDomain) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "AgriSmart backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/weather", weatherAdviceRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

connectDB();
startPriceStream();
const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});