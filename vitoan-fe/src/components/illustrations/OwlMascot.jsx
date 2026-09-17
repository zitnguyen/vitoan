export default function OwlMascot({ className, animated = true, covering = false, shake = false }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={`${className || ""} ${animated ? "owl-float" : ""} ${shake ? "owl-shake" : ""}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="120" cy="222" rx="62" ry="10" fill="#0f172a" opacity="0.08" />

      {/* ears */}
      <path d="M76 62c-9-22 3-36 18-31 7-14 29-14 36 0 15-5 27 9 18 31" fill="#f59e0b" />

      {/* body */}
      <ellipse cx="120" cy="122" rx="68" ry="74" fill="#fb923c" />
      <ellipse cx="120" cy="130" rx="50" ry="56" fill="#ffedd5" />

      {/* face */}
      <circle cx="97" cy="110" r="23" fill="white" />
      <circle cx="143" cy="110" r="23" fill="white" />
      {!covering && (
        <g className={animated ? "owl-blink" : ""}>
          <circle cx="99" cy="112" r="14" fill="#1e293b" />
          <circle cx="141" cy="112" r="14" fill="#1e293b" />
          <circle cx="104" cy="106" r="4.5" fill="white" />
          <circle cx="146" cy="106" r="4.5" fill="white" />
        </g>
      )}
      {covering && (
        <>
          <path d="M84 110 Q97 100 110 110" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M130 110 Q143 100 156 110" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      <path d="M110 128 L120 140 L130 128 Z" fill="#f97316" />

      {/* blush */}
      <ellipse cx="82" cy="128" rx="7" ry="4.5" fill="#fb7185" opacity="0.55" />
      <ellipse cx="158" cy="128" rx="7" ry="4.5" fill="#fb7185" opacity="0.55" />

      {/* feet */}
      <ellipse cx="100" cy="184" rx="9" ry="12" fill="#f59e0b" />
      <ellipse cx="140" cy="184" rx="9" ry="12" fill="#f59e0b" />

      {/* wings — swing up to cover eyes when `covering` is true */}
      <path
        d="M50 126c-16 10-22 28-13 32 9 4 27-10 31-24z"
        fill="#f97316"
        className={`owl-wing-cover ${animated && !covering ? "owl-wing-left" : ""}`}
        style={covering ? { transform: "translate(30px, -78px) rotate(60deg)" } : undefined}
      />
      <path
        d="M190 126c16 10 22 28 13 32-9 4-27-10-31-24z"
        fill="#f97316"
        className={`owl-wing-cover ${animated && !covering ? "owl-wing-right" : ""}`}
        style={covering ? { transform: "translate(-30px, -78px) rotate(-60deg)" } : undefined}
      />

      {/* graduation cap */}
      <g transform="translate(120 46) rotate(-8)" className={animated ? "owl-cap" : ""}>
        <rect x="-30" y="-4" width="60" height="10" rx="3" fill="#0b2340" />
        <path d="M-34 1 L0 -14 L34 1 L0 16 Z" fill="#0f2c52" />
        <circle cx="30" cy="3" r="3" fill="#00b14f" />
        <path d="M30 3 L30 22" stroke="#00b14f" strokeWidth="2" />
      </g>
    </svg>
  );
}
