import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import axios from "axios";
import {
  fetchHistoryPage,
  fetchMatchesForDate,
  fetchMatchesForPlayer,
  fetchMatchesForDateRange,
} from "./services/historyService";
import { buildLeaderboard } from "./utils/buildLeaderboard";
import { getStartPathForDate } from "./utils/getStartPathForDate";
import { sortMatchesNewestFirst } from "./utils/sortMatchesNewestFirst";
import { mapLiveItemToMatch } from "./utils/mapLiveItemToMatch";

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

app.get("/api/live", async (req, res) => {
  const baseUrl = process.env.RPS_API_BASE_URL;
  const token = process.env.RPS_API_TOKEN;

  if (!baseUrl || !token) {
    return res.status(500).json({
      message: "Missing legacy API configuration",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const heartbeat = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15000);

  let upstreamClosed = false;

  try {
    const response = await axios.get(`${baseUrl}/live`, {
      responseType: "stream",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
    });

    let buffer = "";

    response.data.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventBlock of events) {
        const lines = eventBlock.split("\n");
        const dataLines = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s?/, ""));

        if (dataLines.length === 0) {
          continue;
        }

        const rawData = dataLines.join("\n");

        try {
          const parsed = JSON.parse(rawData);
          const match = mapLiveItemToMatch(parsed);

          res.write(`data: ${JSON.stringify(match)}\n\n`);
        } catch {
          // Ignore malformed upstream events
        }
      }
    });

    response.data.on("end", () => {
      upstreamClosed = true;
      clearInterval(heartbeat);
      res.end();
    });

    response.data.on("error", () => {
      if (!upstreamClosed) {
        clearInterval(heartbeat);
        res.end();
      }
    });

    req.on("close", () => {
      upstreamClosed = true;
      clearInterval(heartbeat);
      response.data.destroy();
      res.end();
    });
  } catch (error: unknown) {
    clearInterval(heartbeat);

    if (!res.headersSent) {
      if (error instanceof Error) {
        res.status(500).json({
          message: "Failed to connect to live stream",
          error: error.message,
        });
      } else {
        res.status(500).json({
          message: "Failed to connect to live stream",
          error: "Unknown error",
        });
      }
    } else {
      res.end();
    }
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});