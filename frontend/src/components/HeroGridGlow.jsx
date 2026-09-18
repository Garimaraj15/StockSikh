import React from "react";

export default function HeroGridGlow() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* SVG Coordinate Grid */}
      <svg
        className="w-full h-full opacity-40"
        viewBox="0 0 1200 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="grid-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id="grid-mask">
            <rect width="1200" height="600" fill="url(#grid-fade)" />
          </mask>
        </defs>

        <g mask="url(#grid-mask)">
          {Array.from({ length: 34 }).map((_, col) =>
            Array.from({ length: 16 }).map((_, row) => (
              <rect
                key={`grid-${col}-${row}`}
                x={col * 36}
                y={row * 36}
                width="35"
                height="35"
                stroke="#00D09C"
                strokeOpacity="0.12"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            ))
          )}
        </g>
      </svg>

      {/* Radial Spotlight Flares */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-[#00D09C]/20 via-[#00D09C]/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] bg-[#7C3AED]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[350px] h-[350px] bg-[#38BDF8]/15 rounded-full blur-[110px] pointer-events-none" />
    </div>
  );
}
