// Đảo nổi (cỏ trên, đá dưới) làm bục vinh danh — dùng ở trang chủ khách và bảng xếp hạng.
export default function FloatingIsland({ place, scale = 1, className = "" }) {
  return (
    <svg viewBox="0 0 200 150" className={`mx-auto w-full max-w-[12rem] ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: "top center" }} aria-hidden>
      <defs>
        <linearGradient id={`rock-${place}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0612b" />
          <stop offset="100%" stopColor="#5b3412" />
        </linearGradient>
        <linearGradient id={`grass-${place}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6f05a" />
          <stop offset="100%" stopColor="#4fae2f" />
        </linearGradient>
      </defs>
      <path d="M12 26 L188 26 L160 70 L132 112 L104 146 L84 118 L58 96 L30 62 Z" fill={`url(#rock-${place})`} />
      <path d="M40 40 L70 60 L60 90" stroke="#3f230b" strokeWidth="3" fill="none" opacity="0.35" />
      <path d="M140 38 L120 70" stroke="#3f230b" strokeWidth="3" fill="none" opacity="0.35" />
      <ellipse cx="100" cy="24" rx="92" ry="20" fill={`url(#grass-${place})`} />
      <ellipse cx="100" cy="20" rx="80" ry="12" fill="#c9f77a" opacity="0.6" />
      <text x="100" y="92" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="40" fill="#fff" opacity="0.92">
        {place}
      </text>
    </svg>
  );
}
