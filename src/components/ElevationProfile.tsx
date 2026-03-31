import type { Waypoint } from "../generated/schema";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ElevationProfileProps {
  waypoints: Waypoint[];
  /** Array of raw altitude values extracted from a GeoJSON coordinate list */
  altitudeProfile?: number[];
  /** Corresponding distance labels (in km) for altitudeProfile.
   *  When omitted, the x-axis shows a unitless point index. */
  distanceLabels?: number[];
}

interface ChartPoint {
  dist: number;
  altitude: number;
}

/** Haversine distance in metres */
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

function buildFromWaypoints(waypoints: Waypoint[]): ChartPoint[] {
  let cumDist = 0;
  return waypoints
    .filter((w) => w.altitude != null)
    .map((w, i, arr) => {
      if (i > 0) {
        cumDist += haversine(arr[i - 1].lat, arr[i - 1].lng, w.lat, w.lng);
      }
      return {
        dist: Math.round((cumDist / 1000) * 10) / 10,
        altitude: Math.round(w.altitude!),
      };
    });
}

function buildFromProfile(
  altitudes: number[],
  distances?: number[]
): ChartPoint[] {
  return altitudes.map((alt, i) => ({
    // When explicit distance labels are not provided, use index as a unitless
    // x-axis position (not labelled as km in this case).
    dist: distances ? distances[i] : i,
    altitude: Math.round(alt),
  }));
}

export function ElevationProfile({
  waypoints,
  altitudeProfile,
  distanceLabels,
}: ElevationProfileProps) {
  // Use distance labels when provided; otherwise fall back to waypoint-derived data
  const useDistLabels = altitudeProfile && altitudeProfile.length > 0 && !!distanceLabels;
  const data: ChartPoint[] =
    altitudeProfile && altitudeProfile.length > 0
      ? buildFromProfile(altitudeProfile, distanceLabels)
      : waypoints.length >= 2
      ? buildFromWaypoints(waypoints)
      : [];

  // When the x-axis represents real distances, show "km" label
  const showKmLabel = useDistLabels || (!altitudeProfile && waypoints.length >= 2);

  if (data.length < 2) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        Not enough elevation data to display profile.
      </div>
    );
  }

  const minAlt = Math.min(...data.map((d) => d.altitude));
  const maxAlt = Math.max(...data.map((d) => d.altitude));
  const padding = Math.max(20, (maxAlt - minAlt) * 0.1);

  return (
    <div className="px-4 pt-2 pb-4">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="dist"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#374151" }}
            label={
              showKmLabel
                ? {
                    value: "km",
                    position: "insideBottomRight",
                    offset: -4,
                    fill: "#6b7280",
                    fontSize: 11,
                  }
                : undefined
            }
          />
          <YAxis
            domain={[minAlt - padding, maxAlt + padding]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `${v}m`}
          />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(v) => (showKmLabel ? `${v as number} km` : `Point ${v as number}`)}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color: "#ef4444" }}
            formatter={(v) => [`${v} m`, "Altitude"]}
          />
          <Area
            type="monotone"
            dataKey="altitude"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#elevGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#ef4444" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
