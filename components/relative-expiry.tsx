"use client";

import { useCallback, useEffect, useState } from "react";

function formatNum(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded);
}

function formatRelativeExpiry(expiryAt: string): string {
  const now = Date.now();
  const expiry = new Date(expiryAt).getTime();
  const diffMs = expiry - now;

  if (diffMs <= 0) {
    // Past: show how long ago it expired
    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / 86_400_000);
    const hours = Math.floor(absDiffMs / 3_600_000);
    const minutes = Math.floor(absDiffMs / 60_000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  // Future
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return "in less than a day";
  if (diffDays < 14)
    return `in ${Math.round(diffDays)} day${Math.round(diffDays) === 1 ? "" : "s"}`;
  const diffMonths = diffDays / 30.44;
  if (diffMonths < 1) {
    const diffWeeks = diffDays / 7;
    return `in ${formatNum(diffWeeks)} weeks`;
  }
  if (diffMonths < 12)
    return `in ${formatNum(diffMonths)} month${Math.round(diffMonths * 10) / 10 === 1 ? "" : "s"}`;
  const diffYears = diffDays / 365.25;
  return `in ${formatNum(diffYears)} year${Math.round(diffYears * 10) / 10 === 1 ? "" : "s"}`;
}

/**
 * Renders a relative expiry label that updates every minute.
 *
 * - Future dates: "in 3 days", "in 1.5 months"
 * - Past dates:   "5 minutes ago", "2 days ago"
 */
export function RelativeExpiry({ date }: { date: string }) {
  const [, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return <>{formatRelativeExpiry(date)}</>;
}
