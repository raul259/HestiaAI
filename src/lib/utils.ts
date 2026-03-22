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
      return "text-red-600 bg-red-50 border-red-200";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-slate-body bg-gray-50 border-gray-200";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "open":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "in_progress":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "resolved":
      return "text-green-600 bg-green-50 border-green-200";
    case "closed":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-slate-body bg-gray-50 border-gray-200";
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
