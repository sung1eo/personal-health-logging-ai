"use client";

import { useEffect } from "react";

export type FontSize = "normal" | "large" | "xlarge";
const KEY = "health_font_size";

export function getFontSize(): FontSize {
  if (typeof window === "undefined") return "normal";
  return (localStorage.getItem(KEY) as FontSize) ?? "normal";
}

export function applyFontSize(size: FontSize) {
  document.documentElement.setAttribute("data-font-size", size);
  localStorage.setItem(KEY, size);
}

export default function FontSizeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", getFontSize());
  }, []);
  return <>{children}</>;
}
