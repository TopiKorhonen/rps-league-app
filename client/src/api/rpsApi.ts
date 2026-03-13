import type { Match, LeaderboardEntry } from "../types";

const API_BASE_URL = "http://localhost:4000/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed";

    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch {
      // ignore JSON parse failure
    }

    throw new Error(message);
  }

  return response.json();
}

export async function fetchLatestResults(): Promise<Match[]> {
  const response = await fetch(`${API_BASE_URL}/results/latest`);
  return handleResponse<Match[]>(response);
}

export async function fetchResultsByDay(date: string): Promise<Match[]> {
  const response = await fetch(`${API_BASE_URL}/results/by-day?date=${date}`);
  return handleResponse<Match[]>(response);
}

export async function fetchResultsByPlayer(
  player: string,
  start?: string,
  end?: string
): Promise<Match[]> {
  const params = new URLSearchParams();
  params.set("player", player);

  if (start) {
    params.set("start", start);
  }

  if (end) {
    params.set("end", end);
  }

  const response = await fetch(
    `${API_BASE_URL}/results/by-player?${params.toString()}`
  );

  return handleResponse<Match[]>(response);
}

export async function fetchTodayLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${API_BASE_URL}/leaderboard/today`);
  return handleResponse<LeaderboardEntry[]>(response);
}

export async function fetchLeaderboardByRange(
  start: string,
  end: string
): Promise<LeaderboardEntry[]> {
  const response = await fetch(
    `${API_BASE_URL}/leaderboard/range?start=${start}&end=${end}`
  );
  return handleResponse<LeaderboardEntry[]>(response);
}