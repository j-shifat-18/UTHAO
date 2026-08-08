import React from 'react'

export function LogoIcon({ className = 'w-9 h-9' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Box Right Side (Darker Red) */}
      <path
        d="M50 50L90 30V70L50 90V50Z"
        fill="#DC2626"
        stroke="#B91C1C"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Box Left Side (Medium Red) */}
      <path
        d="M10 30L50 50V90L10 70V30Z"
        fill="#EF4444"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Box Top Side (Light Red) */}
      <path
        d="M50 10L90 30L50 50L10 30L50 10Z"
        fill="#F87171"
        stroke="#EF4444"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Inner Box Highlight/Flaps */}
      <path
        d="M50 10L10 30L30 40L70 20L50 10Z"
        fill="#FCA5A5"
        stroke="none"
      />
    </svg>
  )
}
