export default function CloudScene({ className }) {
  return (
    <svg viewBox="0 0 800 400" className={className} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eafaf1" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#sky)" />
      <g fill="#ffffff" className="animate-cloud-drift" style={{ animationDuration: "14s" }}>
        <ellipse cx="110" cy="70" rx="65" ry="28" />
        <ellipse cx="160" cy="60" rx="46" ry="22" />
      </g>
      <g fill="#ffffff" className="animate-cloud-drift" style={{ animationDuration: "11s", animationDelay: "-4s" }}>
        <ellipse cx="660" cy="90" rx="75" ry="30" />
        <ellipse cx="610" cy="120" rx="46" ry="20" />
      </g>
      <g fill="#ffffff" opacity="0.7" className="animate-cloud-drift" style={{ animationDuration: "16s", animationDelay: "-8s" }}>
        <ellipse cx="380" cy="40" rx="40" ry="16" />
      </g>
    </svg>
  );
}
