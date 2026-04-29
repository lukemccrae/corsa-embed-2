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
  elapsedMin: number;
  altitude?: number;
}



function buildChartData(waypoints: Waypoint[]): ChartPoint[] {
  if (waypoints.length === 0) return [];
  const t0 = new Date(waypoints[0].timestamp).getTime();
  return waypoints.map((w) => {
    const t = new Date(w.timestamp).getTime();
    const elapsedMin = (t - t0) / 60000; // minutes
    return {
      elapsedMin: Math.round(elapsedMin * 10) / 10, // 1 decimal place
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
            dataKey="elapsedMin"
            label={{ value: "Elapsed (min)", position: "insideBottomRight", offset: -4 }}
            tick={{ fontSize: 11, fill: "#999" }}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#999" }} />
          <Tooltip
            contentStyle={{ background: "#1e1e1e", border: "1px solid #333", borderRadius: "8px" }}
            labelFormatter={(v) => `${v as number} min`}
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
