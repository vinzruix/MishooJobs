import { useEffect, useState } from "react";

/**
 * Custom hook running a single interval ticker emitting updated Date reference.
 * Default interval is 60,000ms (60 seconds).
 */
export function useDateTicker(intervalMs: number = 60_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
