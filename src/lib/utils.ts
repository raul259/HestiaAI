import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "text-white bg-red-600 border-red-600";
    case "high":
      return "text-[#C2410C] bg-[#FFF7ED] border-[#FDBA74]";
    case "medium":
      return "text-[#A16207] bg-[#FEFCE8] border-[#FDE047]";
    case "low":
      return "text-[#0E7490] bg-[#ECFEFF] border-[#A5F3FC]";
    default:
      return "text-gray-500 bg-gray-50 border-gray-200";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "open":
      return "text-[#4338CA] bg-[#EEF2FF] border-[#A5B4FC]";
    case "in_progress":
      return "text-[#B45309] bg-[#FFFBEB] border-[#FCD34D]";
    case "resolved":
      return "text-white bg-[#1B3022] border-[#1B3022]";
    case "closed":
      return "text-gray-500 bg-gray-100 border-gray-300";
    default:
      return "text-gray-500 bg-gray-50 border-gray-200";
  }
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Abierta",
    in_progress: "En proceso",
    resolved: "Resuelta",
    closed: "Cerrada",
  };
  return labels[status] ?? status;
}

export function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  };
  return labels[priority] ?? priority;
}

export function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    tv: "📺",
    ac: "❄️",
    washer: "👕",
    dryer: "🌀",
    oven: "🍳",
    dishwasher: "🫧",
    water_heater: "🚿",
    wifi: "📶",
    electricity: "⚡",
    water: "💧",
    other: "🔧",
  };
  return icons[category] ?? "🔧";
}
