'use client';
import React from 'react';

export interface LiveDotProps {
  size?: number;          // in pixels
  color?: string;         // any CSS color
  pulseInterval?: number; // seconds for full cycle (pulse + pause)
}

export const LiveDot: React.FC<LiveDotProps> = ({
  size = 8,
  color = '#f56565',
  pulseInterval = 5, // default: pulse every 5 seconds
}) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: color,
    display: 'block',
    animation: `pulseCycle ${pulseInterval}s ease-in-out infinite`,
  };

  return (
    <>
      <span style={style} aria-hidden="true" />
      <style>{`
        @keyframes pulseCycle {
          0%, 80%, 100% { transform: scale(1); opacity: 1; }   /* idle */
          85%, 90% { transform: scale(1.6); opacity: 0.4; }    /* quick pulse */
        }
      `}</style>
    </>
  );
};
