import { useEffect, useState } from "react";
import { toDDHHMMSS, parseDateTime } from "../utils/time";

type ElapsedTimeProps = {
  startTime: string | Date;
  finishTime?: string | null;
  intervalMs?: number;
};

export function ElapsedTime({
  startTime,
  finishTime,
  intervalMs = 1000,
}: ElapsedTimeProps) {
  const start = parseDateTime(startTime);

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
  }, [start, finishTime, intervalMs]);

  if (elapsedSecs === null) return <span>—</span>;
  return <span>{toDDHHMMSS(elapsedSecs)}</span>;
}
