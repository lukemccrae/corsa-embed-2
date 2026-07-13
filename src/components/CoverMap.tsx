import { useEffect, useMemo, useRef, useState } from "react";
import { toDDHHMMSS } from "../utils/time";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Post, StatusPost, Waypoint } from "../generated/schema";
import { getPostImageUrl } from "../utils/userImages";

// Leaflet scale control in bottom-right corner
function LeafletScaleControl() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({
      maxWidth: 120,
      metric: true,
      imperial: true,
      updateWhenIdle: false,
      position: "bottomright",
    });
    scale.addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);
  return null;
}

// Fix Leaflet default icon resolution (no bundler plugin needed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

/**
 * Watches the map's container element for size changes and calls
 * `invalidateSize()` so Leaflet redraws tiles correctly after a resize.
 */
function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
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
  /** Map height in pixels. When omitted, height is controlled by CSS (e.g. via wrapperClassName). */
  height?: number;
  /** Stream posts to render as map markers (only those with a location are shown) */
  posts?: Post[];
  /**
   * Optional CSS class(es) to apply to the outer wrapper div.
   * When provided the `height` prop is ignored and height is expected to come
   * from the class (useful for container-query-driven responsive heights).
   */
  wrapperClassName?: string;
  /** Athlete profile picture URL – used for the live position marker */
  profilePicture?: string | null;
  /** Unit of measure for distance display ("METRIC" or "IMPERIAL") */
  unitOfMeasure?: "METRIC" | "IMPERIAL";
}

export function CoverMap({
  waypoints = [],
  routeGeoJson,
  isLive,
  height = 360,
  posts = [],
  wrapperClassName,
  profilePicture,
  unitOfMeasure,
}: CoverMapProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  console.log(unitOfMeasure, "unitOfMeasure prop in CoverMap");
  // Ref to map container div (no longer used for scale)
  const mapDivRef = useRef<HTMLDivElement>(null);

  const waypointPositions = useMemo<[number, number][]>(
    () => waypoints.map((w) => [w.lat, w.lng]),
    [waypoints],
  );

  const routePositions = useMemo<[number, number][]>(
    () =>
      routeGeoJson?.coordinates
        ? routeGeoJson.coordinates.map(([lng, lat]) => [lat, lng])
        : [],
    [routeGeoJson],
  );

  const trackerPos: [number, number] | null =
    waypointPositions.length > 0
      ? waypointPositions[waypointPositions.length - 1]
      : null;

  // Default center when nothing is loaded yet
  const defaultCenter: [number, number] = [37.77, -122.42];

  // Posts with GPS coordinates – spread overlapping pins by a tiny offset
  // JITTER_DEGREES is ~9 m per overlapping post, enough to visually separate pins
  const JITTER_DEGREES = 0.00008;
  const locatedPosts = useMemo(() => {
    const seen = new Map<string, number>();
    return posts
      .filter((p) => p.location?.lat != null && p.location?.lng != null)
      .map((p) => {
        const key = `${p.location!.lat.toFixed(6)},${p.location!.lng.toFixed(6)}`;
        const count = seen.get(key) ?? 0;
        seen.set(key, count + 1);
        const jitter = count * JITTER_DEGREES;
        return {
          post: p,
          position: [p.location!.lat + jitter, p.location!.lng + jitter] as [
            number,
            number,
          ],
        };
      });
  }, [posts]);

  const postPositions = locatedPosts.map(({ position }) => position);
  const allPositions = waypointPositions.length
    ? waypointPositions
    : routePositions.length
      ? routePositions
      : postPositions;

  // Debug logging
  console.log("[CoverMap] Debug:", {
    postsCount: posts.length,
    locatedPostsCount: locatedPosts.length,
    postPositionsCount: postPositions.length,
    waypointPositionsCount: waypointPositions.length,
    routePositionsCount: routePositions.length,
    allPositionsCount: allPositions.length,
    allPositions: allPositions.slice(0, 2), // First 2 positions for inspection
  });

  // Build custom DivIcons for post markers (text-only = blue, image = photo thumbnail)
  const makePostIcon = (imageUrl: string | null) =>
    L.divIcon({
      className: "",
      html: imageUrl
        ? `<div class="ce-post-marker ce-post-marker--image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`
        : `<div class="ce-post-marker"><i class="pi pi-comment"></i></div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24],
    });

  // Profile photo DivIcon for the live tracker position
  const profileMarkerIcon = profilePicture
    ? L.divIcon({
        className: "",
        html: `<div class="ce-profile-map-marker" style="background-image: url('${encodeURI(profilePicture)}');"></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -24],
      })
    : null;

  return (
    <>
      <div
        ref={mapDivRef}
        className={["w-full rounded-lg overflow-hidden", wrapperClassName]
          .filter(Boolean)
          .join(" ")}
        style={wrapperClassName ? undefined : { height }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={11}
          scrollWheelZoom={true}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
          {allPositions.length > 0 && (
            <BoundsUpdater positions={allPositions} />
          )}
          <MapInvalidator />

          {/* Reference route polyline (e.g. pre-planned GeoJSON route) - draw first, behind waypoints */}
          {routePositions.length > 1 && (
                  <Polyline
                    positions={routePositions}
                    pathOptions={{
                      color: "#000",
                      weight: 3,
                      opacity: 0.9,
                      dashArray: undefined,
                    }}
                    pane="shadowPane"
                  />
          )}

          {/* Waypoint dot markers (all waypoints, with popup details) */}
          {waypoints.map((w, idx) => {
            // Elapsed time from first waypoint
            let elapsed: string | null = null;
            if (waypoints.length > 0 && w.timestamp) {
              const start = new Date(waypoints[0].timestamp).getTime();
              const curr = new Date(w.timestamp).getTime();
              let rawElapsed = toDDHHMMSS((curr - start) / 1000);
              // Remove days part if 00d
              elapsed = rawElapsed.replace(/^0{0,2}0?0?d\s*/, "");
            }
            return (
              <CircleMarker
                key={`wp-dot-${idx}`}
                center={[w.lat, w.lng]}
                radius={5}
                pathOptions={{
                  color: "#fff",
                  fillColor: "#000",
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="ce-wp-popup">
                    {w.mileMarker != null && (
                      <div className="ce-wp-popup-row">
                        <span className="ce-wp-popup-label">Distance</span>
                        <span className="ce-wp-popup-value">
                          {unitOfMeasure === "METRIC"
                            ? (w.mileMarker * 1.60934).toFixed(2) + " km"
                            : w.mileMarker.toFixed(2) + " mi"}
                        </span>
                      </div>
                    )}
                    {w.cumulativeVert != null && (
                      <div className="ce-wp-popup-row">
                        <span className="ce-wp-popup-label">Gain</span>
                        <span className="ce-wp-popup-value">
                          {Math.round(w.cumulativeVert)} ft
                        </span>
                      </div>
                    )}
                    {elapsed && (
                      <div className="ce-wp-popup-row">
                        <span className="ce-wp-popup-label">Elapsed</span>
                        <span className="ce-wp-popup-value">{elapsed}</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Live tracker: profile photo marker (or fallback circle) at current position */}
          {trackerPos &&
            isLive &&
            (profileMarkerIcon ? (
              <Marker position={trackerPos} icon={profileMarkerIcon}>
                {/* Popup with stats: mile and time, styled like waypoint popups */}
                {waypoints.length > 0 && (
                  <Popup>
                    <div className="ce-wp-popup">
                      {waypoints[waypoints.length - 1].mileMarker != null && (
                        <div className="ce-wp-popup-row">
                          <span className="ce-wp-popup-label">Distance</span>
                          {unitOfMeasure === "METRIC" ? (
                            <span className="ce-wp-popup-value">
                              {(waypoints[waypoints.length - 1].mileMarker! * 1.60934).toFixed(2)}{" "}
                              km
                            </span>
                          ) : (
                            <span className="ce-wp-popup-value">
                              {waypoints[waypoints.length - 1].mileMarker!.toFixed(2)}{" "}
                              mi
                            </span>
                          )}
                        </div>
                      )}
                      {waypoints[waypoints.length - 1].cumulativeVert !=
                        null && (
                        <div className="ce-wp-popup-row">
                          <span className="ce-wp-popup-label">Gain</span>
                          <span className="ce-wp-popup-value">
                            {/* @ts-ignore */}
                            {Math.round(waypoints[waypoints.length - 1].cumulativeVert,
                            )}{" "}
                            ft
                          </span>
                        </div>
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            ) : (
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
            ))}

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

          {/* Post markers */}
          {locatedPosts.map(({ post, position }, idx) => {
            const sp = post as StatusPost;
            const hasImage = !!sp.imagePath;
            const imageUrl = hasImage ? getPostImageUrl(sp.imagePath!) : null;
            // Try to get distance, altitude, and elapsed time from the closest waypoint
            let distance: number | null = null;
            let altitude: number | null = null;
            let elapsed: string | null = null;
            if (waypoints && waypoints.length > 0 && post.createdAt) {
              // Find the closest waypoint by timestamp
              const postTime = new Date(post.createdAt).getTime();
              let minDiff = Infinity;
              let closest: Waypoint | null = null;
              for (const w of waypoints) {
                if (!w.timestamp) continue;
                const wTime = new Date(w.timestamp).getTime();
                const diff = Math.abs(wTime - postTime);
                if (diff < minDiff) {
                  minDiff = diff;
                  closest = w;
                }
              }
              if (closest) {
                distance = closest.mileMarker ?? null;
                altitude = closest.altitude ?? null;
                // Elapsed time from first waypoint
                const start = new Date(waypoints[0].timestamp).getTime();
                let rawElapsed = toDDHHMMSS((postTime - start) / 1000);
                elapsed = rawElapsed.replace(/^0{0,2}0?0?d\s*/, "");
              }
            }
            return (
              <Marker
                key={`post-${post.createdAt}-${idx}`}
                position={position}
                icon={makePostIcon(imageUrl)}
              >
                <Popup>
                  <div style={{ maxWidth: 220, fontFamily: "sans-serif" }}>
                    {sp.text && (
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: 13,
                          color: "#ccc",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: 120,
                          overflowY: "auto",
                        }}
                      >
                        {sp.text}
                      </p>
                    )}
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Post image"
                        style={{
                          width: "100%",
                          borderRadius: 6,
                          cursor: "zoom-in",
                          display: "block",
                          maxHeight: 160,
                          objectFit: "cover",
                        }}
                        onClick={() => setLightboxSrc(imageUrl)}
                      />
                    )}
                    <div style={{ marginTop: 8, fontSize: 13, color: "#eee" }}>
                      {routeGeoJson && distance !== null && (
                        <div>
                          <strong>Distance:</strong> {unitOfMeasure === "METRIC"
                            ? (distance * 1.60934).toFixed(2) + " km"
                            : distance.toFixed(2) + " mi"}
                        </div>
                      )}
                      {altitude !== null && (
                        <div>
                          <strong>Altitude:</strong> {Math.round(altitude)} ft
                        </div>
                      )}
                      {elapsed && (
                        <div>
                          <strong>Elapsed:</strong> {elapsed}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Distance scale overlay using Leaflet's built-in control */}
          <LeafletScaleControl />
        </MapContainer>
      </div>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Full size"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 8,
              boxShadow: "0 4px 32px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            aria-label="Close"
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 32,
              cursor: "pointer",
              lineHeight: 1,
            }}
            onClick={() => setLightboxSrc(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
