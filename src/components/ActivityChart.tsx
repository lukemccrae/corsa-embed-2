import type { Waypoint } from "../generated/schema";
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
  waypoints: Waypoint[];
}

interface ChartPoint {
  dist: number;
  altitude?: number;
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

function buildChartData(waypoints: Waypoint[]): ChartPoint[] {
  let cumDist = 0;
  return waypoints.map((w, i) => {
    if (i > 0) {
      const prev = waypoints[i - 1];
      cumDist += haversine(prev.lat, prev.lng, w.lat, w.lng);
    }
    return {
      dist: Math.round(cumDist / 100) / 10, // km, 1 decimal place
      altitude: w.altitude ?? undefined,
    };
  });
}

export function ActivityChart({ waypoints }: ActivityChartProps) {
  if (waypoints.length < 2) {
    return (
      <div className="p-4 text-center text-sm text-[#666]">
        Not enough data to show chart.
      </div>
    );
  }

  const data = buildChartData(waypoints);
  const hasAltitude = data.some((d) => d.altitude !== undefined);

  return (
    <div className="ce-activity-chart">
      <div className="ce-section-header">
        <i className="pi pi-chart-line ce-section-icon" />
        <span className="ce-section-title">Elevation Profile</span>
      </div>
      <div className="ce-activity-chart-body">
        <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="dist"
            label={{ value: "km", position: "insideBottomRight", offset: -4 }}
            tick={{ fontSize: 11, fill: "#999" }}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#999" }} />
          <Tooltip
            contentStyle={{ background: "#1e1e1e", border: "1px solid #333", borderRadius: "8px" }}
            labelFormatter={(v) => `${v as number} km`}
            labelStyle={{ color: "#aaa" }}
            itemStyle={{ color: "#4fc3f7" }}
          />
          <Legend wrapperStyle={{ color: "#aaa", fontSize: "12px" }} />
          {hasAltitude && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="altitude"
              name="Altitude (m)"
              stroke="#4fc3f7"
              dot={false}
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
