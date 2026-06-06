export function WaveSVG() {
  return (
    <svg
      width="52"
      height="36"
      viewBox="0 0 52 36"
      fill="none"
      className="text-primary/30 shrink-0"
    >
      <path
        d="M2 18 Q8 6, 14 18 T26 18 T38 18 T50 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-primary/40"
      >
        <animate
          attributeName="d"
          values="
            M2 18 Q8 6, 14 18 T26 18 T38 18 T50 18;
            M2 18 Q8 30, 14 18 T26 18 T38 18 T50 18;
            M2 18 Q8 6, 14 18 T26 18 T38 18 T50 18"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M2 24 Q8 14, 14 24 T26 24 T38 24 T50 24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-primary/20"
      >
        <animate
          attributeName="d"
          values="
            M2 24 Q8 14, 14 24 T26 24 T38 24 T50 24;
            M2 24 Q8 34, 14 24 T26 24 T38 24 T50 24;
            M2 24 Q8 14, 14 24 T26 24 T38 24 T50 24"
          dur="3.5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  )
}
