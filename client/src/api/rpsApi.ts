import axios from "axios";
import type { Match, LeaderboardEntry } from "../types";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

export async function fetchLatestResults(): Promise<Match[]> {
  const response = await api.get<Match[]>("/results/latest");
  return response.data;
}

export async function fetchResultsByDay(date: string): Promise<Match[]> {
  const response = await api.get<Match[]>("/results/by-day", {
    params: { date },
  });
  return response.data;
}

export async function fetchResultsByPlayer(player: string): Promise<Match[]> {
  const response = await api.get<Match[]>("/results/by-player", {
    params: { player },
  });
  return response.data;
}

export async function fetchTodayLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await api.get<LeaderboardEntry[]>("/leaderboard/today");
  return response.data;
}

export async function fetchLeaderboardByRange(
  start: string,
  end: string
): Promise<LeaderboardEntry[]> {
  const response = await api.get<LeaderboardEntry[]>("/leaderboard/range", {
    params: { start, end },
  });
  return response.data;
}