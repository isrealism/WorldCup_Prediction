import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

// Continental colors mapping
export const continentColors: Record<string, string> = {
  Europe: "bg-europe",
  "South America": "bg-south-america",
  Asia: "bg-asia",
  Africa: "bg-africa",
  "North America": "bg-north-america",
  Oceania: "bg-oceania",
};

export const continentTextColors: Record<string, string> = {
  Europe: "text-europe",
  "South America": "text-south-america",
  Asia: "text-asia",
  Africa: "text-africa",
  "North America": "text-north-america",
  Oceania: "text-oceania",
};
