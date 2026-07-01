import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Edited just now";
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `Edited ${interval}y ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `Edited ${interval}mo ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `Edited ${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `Edited ${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `Edited ${interval}m ago`;
  return "Edited just now";
};

export const GRADIENTS = [
  "from-red-500/10 via-orange-500/10 to-yellow-500/5",
  "from-indigo-500/10 via-purple-500/10 to-pink-500/5",
  "from-emerald-500/10 via-teal-500/10 to-cyan-500/5",
  "from-blue-500/10 via-sky-500/10 to-indigo-500/5",
] as const;
