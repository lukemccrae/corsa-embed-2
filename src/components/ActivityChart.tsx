import type { Coordinate } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ActivityChartProps {
  coordinates: Coordinate[];
}

interface ChartPoint {
  dist: number;
  elevation?: number;
  pace?: number;
  heartRate?: number;
}

/** Haversine distance in meters between two lat/lng points */
function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildChartData(coordinates: Coordinate[]): ChartPoint[] {
  let cumDist = 0;
  return coordinates.map((c, i) => {
    if (i > 0) {
      const prev = coordinates[i - 1];
      cumDist += haversine(prev.lat, prev.lng, c.lat, c.lng);
    }
    return {
      dist: Math.round(cumDist / 100) / 10, // km, 1 decimal place
      elevation: c.elevation,
      pace: c.pace,
      heartRate: c.heartRate,
    };
  });
}

export function ActivityChart({ coordinates }: ActivityChartProps) {
  if (coordinates.length < 2) {
    return (
      <div className="ce-chart-empty">Not enough data to show chart.</div>
    );
  }

  const data = buildChartData(coordinates);
  const hasElevation = data.some((d) => d.elevation !== undefined);
  const hasPace = data.some((d) => d.pace !== undefined);
  const hasHR = data.some((d) => d.heartRate !== undefined);

  return (
    <div className="ce-activity-chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="dist"
            label={{ value: "km", position: "insideBottomRight", offset: -4 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid #444" }}
            labelFormatter={(v) => `${v as number} km`}
          />
          <Legend />
          {hasElevation && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="elevation"
              name="Elevation (m)"
              stroke="#4fc3f7"
              dot={false}
              strokeWidth={2}
            />
          )}
          {hasPace && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pace"
              name="Pace (s/km)"
              stroke="#a5d6a7"
              dot={false}
              strokeWidth={2}
            />
          )}
          {hasHR && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="heartRate"
              name="HR (bpm)"
              stroke="#ef9a9a"
              dot={false}
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
