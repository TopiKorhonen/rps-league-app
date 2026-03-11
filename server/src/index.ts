import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { fetchHistoryPage } from "./services/historyService";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/test-history", async (_req, res) => {
  try {
    const result = await fetchHistoryPage();
    res.json(result);
  } catch (error: any) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      message: "Failed to fetch history",
      status: error.response?.status,
      data: error.response?.data,
      error: error.message,
    });
  }
});

app.get("/api/results/latest", async (_req, res) => {
  try {
    const result = await fetchHistoryPage("/history");
    res.json(result.matches);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch latest results",
      error: error.response?.data || error.message,
    });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});