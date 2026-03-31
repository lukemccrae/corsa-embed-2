import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Waypoint } from "../generated/schema";

// Fix Leaflet default icon resolution (no bundler plugin needed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface BoundsUpdaterProps {
  positions: [number, number][];
}

/** Automatically fits the map to the polyline bounds whenever positions change. */
function BoundsUpdater({ positions }: BoundsUpdaterProps) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [24, 24] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    }
  }, [map, positions]);
  return null;
}

interface GeoJsonLine {
  /** Array of [lng, lat, alt?] coordinate tuples from a GeoJSON file */
  coordinates: [number, number, number?][];
}

export interface CoverMapProps {
  /** Public (non-private) waypoints to display */
  waypoints?: Waypoint[];
  /** Optional GeoJSON route line (e.g. from a pre-planned route) */
  routeGeoJson?: GeoJsonLine | null;
  isLive?: boolean;
  /** Map height in pixels, defaults to 360 */
  height?: number;
}

export function CoverMap({
  waypoints = [],
  routeGeoJson,
  isLive,
  height = 360,
}: CoverMapProps) {
  const waypointPositions = useMemo<[number, number][]>(
    () => waypoints.map((w) => [w.lat, w.lng]),
    [waypoints]
  );

  const routePositions = useMemo<[number, number][]>(
    () =>
      routeGeoJson
        ? routeGeoJson.coordinates.map(([lng, lat]) => [lat, lng])
        : [],
    [routeGeoJson]
  );

  const trackerPos: [number, number] | null =
    waypointPositions.length > 0
      ? waypointPositions[waypointPositions.length - 1]
      : null;

  // Default center when nothing is loaded yet
  const defaultCenter: [number, number] = [37.77, -122.42];

  const allPositions = waypointPositions.length
    ? waypointPositions
    : routePositions;

  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allPositions.length > 0 && (
          <BoundsUpdater positions={allPositions} />
        )}

        {/* Reference route polyline (e.g. pre-planned GeoJSON route) */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: "#6366f1", weight: 3, opacity: 0.6, dashArray: "6 4" }}
          />
        )}

        {/* Live waypoint trail */}
        {waypointPositions.length > 1 && (
          <Polyline
            positions={waypointPositions}
            pathOptions={{ color: "#ef4444", weight: 4, opacity: 0.9 }}
          />
        )}

        {/* Live tracker dot at current position */}
        {trackerPos && isLive && (
          <CircleMarker
            center={trackerPos}
            radius={8}
            pathOptions={{
              color: "#fff",
              fillColor: "#ef4444",
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}

        {/* Start/end markers when not live */}
        {waypointPositions.length > 0 && !isLive && (
          <>
            <CircleMarker
              center={waypointPositions[0]}
              radius={6}
              pathOptions={{
                color: "#fff",
                fillColor: "#22c55e",
                fillOpacity: 1,
                weight: 2,
              }}
            />
            {waypointPositions.length > 1 && (
              <CircleMarker
                center={waypointPositions[waypointPositions.length - 1]}
                radius={6}
                pathOptions={{
                  color: "#fff",
                  fillColor: "#3b82f6",
                  fillOpacity: 1,
                  weight: 2,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
