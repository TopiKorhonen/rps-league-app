import { historyCheckpoints } from "./historyCheckpoints";

export function getStartPathForDate(targetDate: string): string {
  const dates = Object.keys(historyCheckpoints).sort((a, b) => b.localeCompare(a));

  for (const date of dates) {
    if (date >= targetDate) {
      return historyCheckpoints[date];
    }
  }

  return "/history";
}