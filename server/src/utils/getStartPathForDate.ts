import { historyCheckpoints } from "./historyCheckpoints";

const discoveredCheckpoints = new Map<string, string>();

export function registerCheckpoint(date: string, path: string): void {
  if (!discoveredCheckpoints.has(date)) {
    discoveredCheckpoints.set(date, path);
  }
}

export function getStartPathForDate(targetDate: string): string {
  const mergedCheckpoints: Record<string, string> = {
    ...historyCheckpoints,
    ...Object.fromEntries(discoveredCheckpoints.entries()),
  };

  const dates = Object.keys(mergedCheckpoints).sort((a, b) =>
    b.localeCompare(a)
  );

  for (const date of dates) {
    if (date >= targetDate) {
      return mergedCheckpoints[date];
    }
  }

  return "/history";
}