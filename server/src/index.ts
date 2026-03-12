import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import {
  fetchHistoryPage,
  fetchMatchesForDate,
  fetchMatchesForPlayer,
  fetchMatchesForDateRange,
  fetchMatchesForDateDebug,
  inspectHistoryDepth,
} from "./services/historyService";
import { buildLeaderboard } from "./utils/buildLeaderboard";

const app = express();

app.use(cors());
app.use(express.json());

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/test-history", async (_req, res) => {
  try {
    const result = await fetchHistoryPage();
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to fetch history",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to fetch history",
        error: "Unknown error",
      });
    }
  }
});

app.get("/api/results/latest", async (_req, res) => {
  try {
    const result = await fetchHistoryPage("/history");
    res.json(result.matches.sort((a, b) => b.playedAtMs - a.playedAtMs));
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

    const matches = await fetchMatchesForDate(date);
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
    const matches = await fetchMatchesForDate(today);
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

    const matches = await fetchMatchesForDateRange(start, end);
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

app.get("/api/debug/history-progress", async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const maxPages = req.query.maxPages
      ? Number(req.query.maxPages)
      : undefined;
    const maxDurationMs = req.query.maxDurationMs
      ? Number(req.query.maxDurationMs)
      : undefined;
    const startPath = req.query.startPath as string | undefined;

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

    const result = await fetchMatchesForDateDebug(date, {
      maxPages,
      maxDurationMs,
      startPath,
    });

    res.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to debug historical paging",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to debug historical paging",
        error: "Unknown error",
      });
    }
  }
});

app.get("/api/debug/history-oldest", async (req, res) => {
  try {
    const maxPages = req.query.maxPages
      ? Number(req.query.maxPages)
      : undefined;
    const maxDurationMs = req.query.maxDurationMs
      ? Number(req.query.maxDurationMs)
      : undefined;
    const delayMs = req.query.delayMs
      ? Number(req.query.delayMs)
      : undefined;

    const result = await inspectHistoryDepth({
      maxPages,
      maxDurationMs,
      delayMs,
    });

    res.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        message: "Failed to inspect history depth",
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: "Failed to inspect history depth",
        error: "Unknown error",
      });
    }
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});