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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "AgriSmart backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

connectDB();
const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
