export default function SkyScene({ className }) {
  return (
    <svg viewBox="0 0 800 500" className={className} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#bef2d6" />
          <stop offset="100%" stopColor="#eafaf1" />
        </linearGradient>
        <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#sky2)" />

      {/* sun with soft rays */}
      <g className="animate-spin-slow" style={{ transformOrigin: "690px 90px", animationDuration: "24s" }} opacity="0.55">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="686" y="30" width="8" height="26" rx="4" fill="#fde68a" transform={`rotate(${i * 45} 690 90)`} />
        ))}
      </g>
      <circle cx="690" cy="90" r="42" fill="#fbbf24" />

      {/* clouds */}
      <g fill="#ffffff" className="animate-cloud-drift" style={{ animationDuration: "14s" }}>
        <ellipse cx="110" cy="70" rx="65" ry="28" />
        <ellipse cx="160" cy="60" rx="46" ry="22" />
      </g>
      <g fill="#ffffff" className="animate-cloud-drift" style={{ animationDuration: "11s", animationDelay: "-4s" }}>
        <ellipse cx="480" cy="60" rx="55" ry="24" />
        <ellipse cx="430" cy="50" rx="38" ry="18" />
      </g>
      <g fill="#ffffff" opacity="0.85" className="animate-cloud-drift" style={{ animationDuration: "16s", animationDelay: "-8s" }}>
        <ellipse cx="250" cy="110" rx="40" ry="16" />
      </g>

      {/* rolling hills */}
      <path d="M0 340 C120 300 220 300 340 335 C460 370 560 300 800 330 L800 500 L0 500 Z" fill="url(#hill-back)" opacity="0.7" />
      <path d="M0 380 C140 420 260 400 400 380 C540 360 660 420 800 390 L800 500 L0 500 Z" fill="#4fd18c" />
    </svg>
  );
}
