import { useEffect, useState } from "react";
import { toDDHHMMSS, parseDateTime } from "../utils/time";

type ElapsedTimeProps = {
  startTime: string | Date;
  finishTime?: string | null;
  intervalMs?: number;
  delayInSeconds?: number | null;
};

export function ElapsedTime({
  startTime,
  finishTime,
  intervalMs = 1000,
  delayInSeconds = 0,
}: ElapsedTimeProps) {
  // Apply delay by shifting the start time forward
  const rawStart = parseDateTime(startTime);
  const start = rawStart !== null && delayInSeconds ? rawStart + delayInSeconds * 1000 : rawStart;

  const getElapsedSecs = (): number | null => {
    if (start === null) return null;
    if (finishTime) {
      const end = parseDateTime(finishTime);
      return end !== null ? (end - start) / 1000 : null;
    }
    return (Date.now() - start) / 1000;
  };

  const [elapsedSecs, setElapsedSecs] = useState<number | null>(getElapsedSecs);
  useEffect(() => {
    if (finishTime || start === null) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSecs((Date.now() - start) / 1000);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [start, finishTime, intervalMs, delayInSeconds]);

  if (elapsedSecs === null) return <span>—</span>;
  return <span>{toDDHHMMSS(elapsedSecs)}</span>;
}
