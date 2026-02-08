"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

/**
 * Renders a relative expiry label that updates every minute.
 *
 * - Future dates: "in 3 days", "in about 2 months"
 * - Past dates:   "5 minutes ago", "2 days ago"
 */
export function RelativeExpiry({ date }: { date: string }) {
  const [, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return <>{formatDistanceToNow(new Date(date), { addSuffix: true })}</>;
}
