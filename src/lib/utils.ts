import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    const diffSeconds = Math.floor((now - then) / 1000);

    if (diffSeconds < 60) return "just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function generateReferenceCode(type: 'lost' | 'found'): string {
  const prefix = type === 'lost' ? 'FIC-L' : 'FIC-F';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}`;
}

export function getScoreColor(score: number): { text: string; bg: string; border: string; ring: string } {
  if (score >= 80) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "ring-emerald-500",
    };
  }
  if (score >= 60) {
    return {
      text: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
      ring: "ring-blue-500",
    };
  }
  if (score >= 40) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "ring-amber-500",
    };
  }
  return {
    text: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    ring: "ring-slate-400",
  };
}
