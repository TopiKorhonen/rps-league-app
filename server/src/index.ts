import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import {
  fetchHistoryPage,
  fetchMatchesForDate,
  fetchMatchesForPlayer,
  fetchMatchesForDateRange,
} from "./services/historyService";
import { buildLeaderboard } from "./utils/buildLeaderboard";
import { getStartPathForDate } from "./utils/getStartPathForDate";
import { sortMatchesNewestFirst } from "./utils/sortMatchesNewestFirst";

const app = express();

app.use(cors());
app.use(express.json());

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/results/latest", async (_req, res) => {
  try {
    const result = await fetchHistoryPage("/history");
    res.json(sortMatchesNewestFirst(result.matches));
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to fetch latest results",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to fetch latest results",
        error: "Unknown error",
      });
    }
  }
});

app.get("/api/results/by-day", async (req, res) => {
  try {
    const date = req.query.date as string | undefined;

    if (!date) {
      return res.status(400).json({
        message: "Query param 'date' is required",
      });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({
        message: "Date must be in YYYY-MM-DD format",
      });
    }

    const startPath = getStartPathForDate(date);
    const matches = await fetchMatchesForDate(date, 2000, startPath);

    res.json(matches);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to fetch results by day",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to fetch results by day",
        error: "Unknown error",
      });
    }
  }
});

app.get("/api/results/by-player", async (req, res) => {
  try {
    const player = req.query.player as string | undefined;

    if (!player) {
      return res.status(400).json({
        message: "Query param 'player' is required",
      });
    }

    const matches = await fetchMatchesForPlayer(player);
    res.json(matches);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to fetch results by player",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to fetch results by player",
        error: "Unknown error",
      });
    }
  }
});

app.get("/api/leaderboard/today", async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const startPath = getStartPathForDate(today);
    const matches = await fetchMatchesForDate(today, 2000, startPath);
    const leaderboard = buildLeaderboard(matches);

    res.json(leaderboard);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to build today's leaderboard",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to build today's leaderboard",
        error: "Unknown error",
      });
    }
  }
});

app.get("/api/leaderboard/range", async (req, res) => {
  try {
    const start = req.query.start as string | undefined;
    const end = req.query.end as string | undefined;

    if (!start || !end) {
      return res.status(400).json({
        message: "Query params 'start' and 'end' are required",
      });
    }

    if (!isValidDateString(start) || !isValidDateString(end)) {
      return res.status(400).json({
        message: "Dates must be in YYYY-MM-DD format",
      });
    }

    if (start > end) {
      return res.status(400).json({
        message: "'start' date must be before or equal to 'end' date",
      });
    }

    const startPath = getStartPathForDate(start);
    const matches = await fetchMatchesForDateRange(start, end, 2000, startPath);
    const leaderboard = buildLeaderboard(matches);

    res.json(leaderboard);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to build historical leaderboard",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to build historical leaderboard",
        error: "Unknown error",
      });
    }
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});