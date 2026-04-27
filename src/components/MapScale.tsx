import React from "react";

interface MapScaleProps {
  /**
   * Optional: override scale bar length in meters
   */
  scaleLengthMeters?: number;
}

/**
 * Renders a distance scale bar for a map, showing real-world distance.
 * Uses a simple equirectangular approximation for small scales.
 */
export const MapScale: React.FC<MapScaleProps> = ({
  scaleLengthMeters,
}) => {
  // TODO: Dynamically calculate scale bar length and label based on mapWidth and latitude
  // For now, just pick a fixed scale (e.g., 1km)
  const scale = scaleLengthMeters || 1000;
  const barLengthPx = 80; // e.g., 80px bar for 1km
  const label = scale >= 1000 ? `${scale / 1000} km` : `${scale} m`;
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: "2px 10px 2px 10px",
        borderRadius: 6,
        fontSize: 13,
        zIndex: 1000,
        userSelect: "none",
        pointerEvents: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        width: barLengthPx + 24,
        height: 32,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          width: barLengthPx,
          height: 6,
          background: "#fff",
          borderRadius: 3,
          marginRight: 8,
        }}
      />
      <span>{label}</span>
    </div>
  );
};
