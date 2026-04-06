import { useEffect, useState } from "react";
import type { Route, User } from "../generated/schema";
import { appsyncRequest } from "../helpers/appsync.helper";
import { ROUTE_QUERY } from "../helpers/queries";
import { useUser } from "../context/useUser";
import { domain } from "../context/domain.context";
import { CoverMap } from "./CoverMap";
import { ElevationProfile } from "./ElevationProfile";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { useTheme } from "./ThemeProvider";

interface RoutePageProps {
  /** Username of the route owner */
  username: string;
  /** The routeId to display */
  routeId: string;
  /** Component visibility settings */
  components?: {
    map?: boolean;
    posts?: boolean;
    elevation?: boolean;
    route?: boolean;
    profile?: boolean;
  };
}

interface GeoJsonCoordinate {
  coordinates: [number, number, number?][];
}

interface GeoJsonFeature {
  geometry: GeoJsonCoordinate;
}

interface GeoJsonFeatureCollection {
  features: GeoJsonFeature[];
}

interface RouteQueryResponse {
  getUserByUserName: User;
}

function formatDistance(miles: number | null | undefined): string {
  if (miles == null) return "—";
  return `${miles.toFixed(1)} mi`;
}

function formatGain(feet: number | null | undefined): string {
  if (feet == null) return "—";
  return `${feet.toLocaleString()} ft`;
}

export function RoutePage({ username, routeId, components = {} }: RoutePageProps) {
  const { apiToken, isReady, error: authError } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [route, setRoute] = useState<Route | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJsonFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default all components to visible if not explicitly set
  const showMap = components.map !== false;
  const showElevation = components.elevation !== false;
  const showRoute = components.route !== false;

  const cardBg = isDark
    ? "bg-gray-900/95 border-gray-700"
    : "bg-white/95 border-gray-200";
  const textColor = isDark ? "text-gray-100" : "text-gray-900";
  const mutedColor = isDark ? "text-gray-400" : "text-gray-500";

  // Fetch route metadata via GraphQL
  useEffect(() => {
    if (!isReady || !apiToken) return;

    async function load() {
      try {
        const data = await appsyncRequest<RouteQueryResponse>(
          ROUTE_QUERY(username),
          {},
          apiToken!
        );
        const matchedRoute =
          data.getUserByUserName?.routes?.find(
            (r): r is Route => r?.routeId === routeId
          ) ?? null;
        setRoute(matchedRoute);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load route data"
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [apiToken, isReady, username, routeId]);

  // Fetch GeoJSON from CDN once we have the storagePath
  useEffect(() => {
    if (!route?.storagePath) return;
    setGeoLoading(true);

    fetch(`${domain.geoJsonCdnBaseUrl}/${route.storagePath}`)
      .then((r) => r.json())
      .then((json) => setGeoJson(json as GeoJsonFeatureCollection))
      .catch(() => {
        // GeoJSON fetch failure is non-fatal; the map just won't render
      })
      .finally(() => setGeoLoading(false));
  }, [route?.storagePath]);

  if (authError) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Auth error: {authError}
      </div>
    );
  }

  if (!isReady || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Error: {error}
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-6 text-red-300 bg-gray-900 rounded-lg text-center text-sm">
        Route not found.
      </div>
    );
  }

  const coords = geoJson?.features?.[0]?.geometry?.coordinates ?? [];

  // Build altitude profile from GeoJSON coordinates using distance-based sampling.
  // We sample every ~100m along the route to preserve the elevation shape.
  const altitudeProfile: number[] = [];
  const distanceLabels: number[] = [];
  let cumDistKm = 0;
  let lastSampleDistKm = -Infinity;
  const sampleIntervalKm = 0.1; // 100 m

  for (let i = 0; i < coords.length; i++) {
    const [lng, lat, alt] = coords[i];
    if (i > 0) {
      const [prevLng, prevLat] = coords[i - 1];
      // Haversine distance
      const R = 6371;
      const dLat = ((lat - prevLat) * Math.PI) / 180;
      const dLng = ((lng - prevLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((prevLat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      cumDistKm += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    if (alt != null && cumDistKm - lastSampleDistKm >= sampleIntervalKm) {
      altitudeProfile.push(Math.round(alt));
      distanceLabels.push(Math.round(cumDistKm * 10) / 10);
      lastSampleDistKm = cumDistKm;
    }
  }

  const routeGeoJson =
    coords.length > 0
      ? { coordinates: coords }
      : null;

  return (
    <div className={`ce-route-page flex flex-col gap-4`}>
      {/* Route header card */}
      {showRoute && (
        <div className={`${cardBg} border rounded-lg shadow-lg p-4`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
              <i className="pi pi-map text-red-400 text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-bold ${textColor} truncate`}>
                {route.name}
              </h2>
              <p className={`text-sm ${mutedColor}`}>{username}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm ${mutedColor}`}>
            {route.distanceInMiles != null && (
              <div className="flex items-center gap-1">
                <i className="pi pi-arrows-h text-xs" />
                <span>{formatDistance(route.distanceInMiles)}</span>
              </div>
            )}
            {route.gainInFeet != null && (
              <div className="flex items-center gap-1">
                <i className="pi pi-arrow-up text-xs" />
                <span>{formatGain(route.gainInFeet)} gain</span>
              </div>
            )}
            {route.uom && (
              <div className="flex items-center gap-1">
                <i className="pi pi-tag text-xs" />
                <span>{route.uom}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map + Elevation */}
      {(showMap || showElevation) && (
        <div className={`${cardBg} border rounded-lg shadow-lg overflow-hidden`}>
          {/* Map */}
          {showMap && (
            <div className="border-b border-gray-700">
              {geoLoading ? (
                <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                  Loading map…
                </div>
              ) : (
                <CoverMap routeGeoJson={routeGeoJson} height={320} />
              )}
            </div>
          )}

          {/* Elevation Profile */}
          {altitudeProfile.length >= 2 && showElevation && (
            <div>
              <ElevationProfile
                waypoints={[]}
                altitudeProfile={altitudeProfile}
                distanceLabels={distanceLabels}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
