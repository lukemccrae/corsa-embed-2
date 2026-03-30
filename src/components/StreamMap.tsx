import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog } from "primereact/dialog";
import type { Waypoint, Post, StatusPost } from "../generated/schema";
import { resolveImageUrl } from "../utils/userImages";
import { formatTimestamp } from "../utils/time";

// Leaflet must be imported dynamically-safe for IIFE bundling
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths broken by bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function isStatusPost(post: Post): post is StatusPost {
  return (post as StatusPost).__typename === "StatusPost";
}

interface PostMarkerInfo {
  post: StatusPost;
  lat: number;
  lng: number;
}

/**
 * Spread overlapping post markers slightly so they don't stack exactly on top
 * of each other. Uses a small angular offset (similar to corsa-next CoverMap
 * spreadOverlappingPosts pattern).
 */
function spreadOverlappingPosts(posts: PostMarkerInfo[]): PostMarkerInfo[] {
  const THRESHOLD = 0.0003; // ~30 m
  const SPREAD = 0.0002;

  return posts.map((p, i) => {
    const overlapping = posts
      .slice(0, i)
      .filter(
        (other) =>
          Math.abs(other.lat - p.lat) < THRESHOLD &&
          Math.abs(other.lng - p.lng) < THRESHOLD
      );
    if (overlapping.length === 0) return p;
    const angle = (overlapping.length * (2 * Math.PI)) / 8;
    return {
      ...p,
      lat: p.lat + SPREAD * Math.cos(angle),
      lng: p.lng + SPREAD * Math.sin(angle),
    };
  });
}

interface StreamMapProps {
  waypoints: Waypoint[];
  /** The most recent tracked position (for live tracking marker) */
  trackerPosition?: Waypoint;
  /** Stream posts to display as markers on the map */
  posts?: Post[];
}

interface PostPopupState {
  post: StatusPost;
  lightboxUrl: string | null;
}

export function StreamMap({
  waypoints,
  trackerPosition,
  posts = [],
}: StreamMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const trackerMarkerRef = useRef<L.Marker | null>(null);
  const postMarkersRef = useRef<L.Marker[]>([]);
  const [popupState, setPopupState] = useState<PostPopupState | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw/update route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || waypoints.length === 0) return;

    const latlngs: L.LatLngExpression[] = waypoints.map((w) => [w.lat, w.lng]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latlngs);
    } else {
      polylineRef.current = L.polyline(latlngs, {
        color: "#e53935",
        weight: 4,
        opacity: 0.9,
      }).addTo(map);
    }

    // Fit bounds on first draw
    if (latlngs.length > 0) {
      map.fitBounds(polylineRef.current.getBounds(), { padding: [20, 20] });
    }
  }, [waypoints]);

  // Update tracker marker (live position)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !trackerPosition) return;

    const latlng: L.LatLngExpression = [
      trackerPosition.lat,
      trackerPosition.lng,
    ];

    const trackerIcon = L.divIcon({
      className: "ce-tracker-icon",
      html: `<div class="ce-tracker-dot"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (trackerMarkerRef.current) {
      trackerMarkerRef.current.setLatLng(latlng);
    } else {
      trackerMarkerRef.current = L.marker(latlng, { icon: trackerIcon }).addTo(
        map
      );
    }
  }, [trackerPosition]);

  // Render post markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old post markers
    postMarkersRef.current.forEach((m) => m.remove());
    postMarkersRef.current = [];

    // Build list of status posts with valid location
    const postInfos: PostMarkerInfo[] = posts
      .filter(isStatusPost)
      .filter((p): p is StatusPost & { location: NonNullable<StatusPost["location"]> } =>
        p.location != null
      )
      .map((p) => ({ post: p, lat: p.location.lat, lng: p.location.lng }));

    const spread = spreadOverlappingPosts(postInfos);

    spread.forEach(({ post, lat, lng }) => {
      const hasImage = Boolean(post.imagePath);
      const icon = L.divIcon({
        className: "",
        html: `
          <div class="ce-post-marker${hasImage ? " ce-post-marker--image" : ""}">
            <i class="${hasImage ? "pi pi-image" : "pi pi-comment"}"></i>
          </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on("click", () => {
        setPopupState({ post, lightboxUrl: null });
      });
      postMarkersRef.current.push(marker);
    });

    return () => {
      postMarkersRef.current.forEach((m) => m.remove());
      postMarkersRef.current = [];
    };
  }, [posts]);

  const popupImageUrl =
    popupState?.post.imagePath
      ? resolveImageUrl(popupState.post.imagePath)
      : null;

  return (
    <div className="ce-map-wrapper">
      <div ref={mapContainerRef} className="ce-map" />

      {/* Post detail dialog – rendered via portal to avoid Leaflet z-index issues */}
      {typeof document !== "undefined" &&
        createPortal(
          <Dialog
            visible={popupState !== null}
            onHide={() => setPopupState(null)}
            header={
              popupState ? (
                <span className="text-sm text-[#aaa]">
                  {formatTimestamp(popupState.post.createdAt)}
                </span>
              ) : undefined
            }
            className="!w-[360px] !max-w-[95vw]"
            contentClassName="!p-0 !bg-[#1e1e1e]"
            headerClassName="!bg-[#1e1e1e] !text-white !border-b !border-[#2a2a2a] !py-2 !px-4"
          >
            {popupState && (
              <div>
                {popupState.post.text && (
                  <p className="px-4 py-3 text-sm text-[#ddd] m-0">
                    {popupState.post.text}
                  </p>
                )}
                {popupImageUrl && (
                  <button
                    type="button"
                    className="w-full border-0 p-0 bg-transparent cursor-pointer"
                    onClick={() =>
                      setPopupState((s) =>
                        s ? { ...s, lightboxUrl: popupImageUrl } : s
                      )
                    }
                    aria-label="View full image"
                  >
                    <img
                      src={popupImageUrl}
                      alt="Post"
                      className="w-full object-cover max-h-64 hover:opacity-90 transition-opacity"
                    />
                    <span className="block text-center text-[11px] text-[#888] py-1.5">
                      <i className="pi pi-search-plus mr-1" />
                      Tap to enlarge
                    </span>
                  </button>
                )}
              </div>
            )}
          </Dialog>,
          document.body
        )}

      {/* Lightbox */}
      {typeof document !== "undefined" &&
        createPortal(
          <Dialog
            visible={popupState?.lightboxUrl !== null && popupState?.lightboxUrl !== undefined}
            onHide={() =>
              setPopupState((s) => (s ? { ...s, lightboxUrl: null } : s))
            }
            header="Post Image"
            maximizable
            className="!w-auto !max-w-[95vw]"
            contentClassName="!p-0 !bg-[#121212]"
            headerClassName="!bg-[#1e1e1e] !text-white !border-b !border-[#2a2a2a]"
          >
            {popupState?.lightboxUrl && (
              <img
                src={popupState.lightboxUrl}
                alt="Full size post"
                className="max-w-full max-h-[85vh] block"
              />
            )}
          </Dialog>,
          document.body
        )}
    </div>
  );
}
