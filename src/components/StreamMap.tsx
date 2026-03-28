import { useEffect, useRef } from "react";
import type { Coordinate } from "../types";

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

interface StreamMapProps {
  coordinates: Coordinate[];
  /** The most recent tracked position (for live tracking marker) */
  trackerPosition?: Coordinate;
}

export function StreamMap({ coordinates, trackerPosition }: StreamMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const trackerMarkerRef = useRef<L.Marker | null>(null);

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
    if (!map || coordinates.length === 0) return;

    const latlngs: L.LatLngExpression[] = coordinates.map((c) => [
      c.lat,
      c.lng,
    ]);

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
  }, [coordinates]);

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

  return (
    <div className="ce-map-wrapper">
      <div ref={mapContainerRef} className="ce-map" />
    </div>
  );
}
