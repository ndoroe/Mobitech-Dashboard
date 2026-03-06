import { FC } from "react";

interface SimCardSvgProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

export const SimCardSvg: FC<SimCardSvgProps> = ({
  width = 200,
  height = 300,
  color = "#1976d2",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 300"
    fill="none"
    width={width}
    height={height}
  >
    <defs>
      {/* Card gradient */}
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="1" />
        <stop offset="50%" stopColor={color} stopOpacity="0.85" />
        <stop offset="100%" stopColor="#0d47a1" stopOpacity="1" />
      </linearGradient>

      {/* Chip gold gradient */}
      <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5e6a3" />
        <stop offset="30%" stopColor="#ffd700" />
        <stop offset="60%" stopColor="#daa520" />
        <stop offset="100%" stopColor="#b8860b" />
      </linearGradient>

      {/* Chip contact gradient */}
      <linearGradient id="contactGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e6c84d" />
        <stop offset="100%" stopColor="#a67c00" />
      </linearGradient>

      {/* Card shadow */}
      <filter id="cardShadow" x="-5%" y="-3%" width="110%" height="110%">
        <feDropShadow
          dx="2"
          dy="4"
          stdDeviation="4"
          floodColor="#000"
          floodOpacity="0.3"
        />
      </filter>

      {/* Chip inset shadow */}
      <filter id="chipShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow
          dx="1"
          dy="2"
          stdDeviation="2"
          floodColor="#000"
          floodOpacity="0.2"
        />
      </filter>

      {/* Holographic shimmer */}
      <linearGradient id="holoShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff6ec7" stopOpacity="0" />
        <stop offset="25%" stopColor="#7df9ff" stopOpacity="0.08" />
        <stop offset="50%" stopColor="#ff6ec7" stopOpacity="0.12" />
        <stop offset="75%" stopColor="#7df9ff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#ff6ec7" stopOpacity="0" />
      </linearGradient>

      {/* Circuit pattern */}
      <pattern
        id="circuitPattern"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M0 20 H15 M25 20 H40 M20 0 V15 M20 25 V40"
          stroke="#fff"
          strokeWidth="0.5"
          opacity="0.06"
        />
        <circle cx="20" cy="20" r="2" fill="#fff" opacity="0.04" />
      </pattern>
    </defs>

    {/* Card body with gradient and shadow */}
    <path
      d="M26,10 L160,10 Q190,10 190,26 L190,274 Q190,290 174,290 L26,290 Q10,290 10,274 L10,50 Z"
      fill="url(#cardGrad)"
      filter="url(#cardShadow)"
    />

    {/* Corner cut accent */}
    <path d="M10,50 L26,10" stroke="#fff" strokeWidth="0.8" opacity="0.3" />

    {/* Circuit pattern overlay */}
    <rect
      x="10"
      y="10"
      width="180"
      height="280"
      rx="16"
      ry="16"
      fill="url(#circuitPattern)"
    />

    {/* Holographic shimmer overlay */}
    <rect
      x="10"
      y="10"
      width="180"
      height="280"
      rx="16"
      ry="16"
      fill="url(#holoShimmer)"
    />

    {/* Top edge highlight */}
    <path
      d="M30,12 L160,12 Q186,12 188,28"
      stroke="#fff"
      strokeWidth="1"
      fill="none"
      opacity="0.2"
    />

    {/* Chip body */}
    <rect
      x="40"
      y="88"
      width="120"
      height="84"
      rx="10"
      ry="10"
      fill="url(#chipGrad)"
      filter="url(#chipShadow)"
      stroke="#b8860b"
      strokeWidth="1.5"
    />

    {/* Chip contact pads — 2×3 grid */}
    {/* Top-left */}
    <rect
      x="48"
      y="96"
      width="32"
      height="22"
      rx="3"
      fill="url(#contactGrad)"
      stroke="#9a7b0a"
      strokeWidth="0.8"
    />
    {/* Top-center */}
    <rect
      x="88"
      y="96"
      width="24"
      height="22"
      rx="3"
      fill="url(#contactGrad)"
      stroke="#9a7b0a"
      strokeWidth="0.8"
    />
    {/* Top-right */}
    <rect
      x="120"
      y="96"
      width="32"
      height="22"
      rx="3"
      fill="url(#contactGrad)"
      stroke="#9a7b0a"
      strokeWidth="0.8"
    />
    {/* Bottom-left */}
    <rect
      x="48"
      y="126"
      width="32"
      height="22"
      rx="3"
      fill="url(#contactGrad)"
      stroke="#9a7b0a"
      strokeWidth="0.8"
    />
    {/* Bottom-center */}
    <rect
      x="88"
      y="126"
      width="24"
      height="22"
      rx="3"
      fill="url(#contactGrad)"
      stroke="#9a7b0a"
      strokeWidth="0.8"
    />
    {/* Bottom-right */}
    <rect
      x="120"
      y="126"
      width="32"
      height="22"
      rx="3"
      fill="url(#contactGrad)"
      stroke="#9a7b0a"
      strokeWidth="0.8"
    />

    {/* Chip cross lines */}
    <line x1="48" y1="121" x2="152" y2="121" stroke="#9a7b0a" strokeWidth="2" />
    <line x1="100" y1="96" x2="100" y2="148" stroke="#9a7b0a" strokeWidth="2" />

    {/* Chip notch (bottom-right corner) */}
    <path
      d="M148,160 L152,172 L140,172 Z"
      fill="url(#chipGrad)"
      stroke="#b8860b"
      strokeWidth="1"
    />

    {/* Chip inner glow */}
    <rect
      x="42"
      y="90"
      width="116"
      height="80"
      rx="9"
      ry="9"
      fill="none"
      stroke="#f5e6a3"
      strokeWidth="0.5"
      opacity="0.5"
    />

    {/* Signal icon (top-right) */}
    <g transform="translate(152, 30)" opacity="0.7">
      <path
        d="M0,18 Q10,8 20,18"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-5,24 Q10,4 25,24"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M-10,30 Q10,0 30,30"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.3"
      />
      <circle cx="10" cy="22" r="2.5" fill="#fff" opacity="0.9" />
    </g>

    {/* Carrier name */}
    <text
      x="100"
      y="210"
      textAnchor="middle"
      fontFamily="'Segoe UI', Arial, Helvetica, sans-serif"
      fontSize="20"
      fontWeight="700"
      fill="#fff"
      letterSpacing="3"
      opacity="0.95"
    >
      MOBITECH
    </text>

    {/* Tagline */}
    <text
      x="100"
      y="228"
      textAnchor="middle"
      fontFamily="'Segoe UI', Arial, Helvetica, sans-serif"
      fontSize="8"
      fill="#fff"
      letterSpacing="4"
      opacity="0.5"
    >
      SIM DASHBOARD
    </text>

    {/* Decorative separator */}
    <line
      x1="55"
      y1="240"
      x2="145"
      y2="240"
      stroke="#fff"
      strokeWidth="0.5"
      opacity="0.25"
    />

    {/* ICCID text */}
    <text
      x="100"
      y="258"
      textAnchor="middle"
      fontFamily="'Courier New', monospace"
      fontSize="8.5"
      fill="#fff"
      letterSpacing="1.5"
      opacity="0.45"
    >
      8927 0100 0000 0000 0000
    </text>

    {/* 5G badge */}
    <g transform="translate(26, 30)">
      <rect
        x="0"
        y="0"
        width="30"
        height="16"
        rx="4"
        fill="#fff"
        opacity="0.15"
      />
      <text
        x="15"
        y="12"
        textAnchor="middle"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="#fff"
        opacity="0.7"
      >
        5G
      </text>
    </g>

    {/* Bottom-left NFC icon */}
    <g transform="translate(28, 262)" opacity="0.3">
      <path
        d="M0,12 A12,12 0 0,1 12,0"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M0,18 A18,18 0 0,1 18,0"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="0" cy="12" r="1.5" fill="#fff" />
    </g>
  </svg>
);
