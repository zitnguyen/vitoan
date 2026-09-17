export default function WaveDivider({ color = "#ffffff", flip = false, className = "" }) {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      className={`block h-10 w-full sm:h-14 ${flip ? "-scale-y-100" : ""} ${className}`}
    >
      <path
        d="M0 30 C150 60 350 0 600 20 C850 40 1050 0 1200 25 L1200 60 L0 60 Z"
        fill={color}
      />
    </svg>
  );
}
