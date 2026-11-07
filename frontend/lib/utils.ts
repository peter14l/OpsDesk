import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeRemaining(deadlineStr: string | null | undefined): {
  text: string;
  isBreached: boolean;
  isAtRisk: boolean;
  minutesRemaining: number;
} {
  if (!deadlineStr) {
    return { text: "No SLA", isBreached: false, isAtRisk: false, minutesRemaining: 9999 };
  }

  const now = new Date().getTime();
  const deadline = new Date(deadlineStr).getTime();
  const diffMs = deadline - now;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 0) {
    const overdueMin = Math.abs(diffMinutes);
    const overdueHours = Math.floor(overdueMin / 60);
    const remM = overdueMin % 60;
    const text = overdueHours > 0 ? `-${overdueHours}h ${remM}m` : `-${remM}m`;
    return { text, isBreached: true, isAtRisk: false, minutesRemaining: diffMinutes };
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const text = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const isAtRisk = diffMinutes <= 60;

  return { text, isBreached: false, isAtRisk, minutesRemaining: diffMinutes };
}
