// Linh vật cú ViToan — vector vẽ riêng (kiểu "kawaii": tròn, mắt to long lanh, má hồng, đội mũ tốt nghiệp).
// animated: nhún nhẹ + chớp mắt; covering: nhắm mắt cười, cánh che (khi bé nhập mật khẩu / làm sai);
// shake: lắc lư khi đang nghĩ; cap={false}: bỏ mũ (khi tự đặt mũ khác lên trên).
export default function OwlMascot({ className, animated = true, covering = false, shake = false, cap = true }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`${className || ""} ${animated ? "owl-float" : ""} ${shake ? "owl-shake" : ""}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="100" cy="188" rx="52" ry="7" fill="#0b2340" opacity="0.1" />

      {/* tai */}
      <path d="M48 62 L40 24 L76 48 Z" fill="#f59e0b" />
      <path d="M152 62 L160 24 L124 48 Z" fill="#f59e0b" />

      {/* thân + bụng */}
      <ellipse cx="100" cy="112" rx="66" ry="70" fill="#fb923c" />
      <ellipse cx="100" cy="132" rx="44" ry="46" fill="#fff1dc" />
      <path d="M80 128q6 6 12 0M108 128q6 6 12 0M94 146q6 6 12 0" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" />

      {/* cánh: che lên mặt khi covering */}
      {covering ? (
        <>
          <ellipse cx="66" cy="96" rx="20" ry="30" fill="#f97316" transform="rotate(38 66 96)" />
          <ellipse cx="134" cy="96" rx="20" ry="30" fill="#f97316" transform="rotate(-38 134 96)" />
        </>
      ) : (
        <>
          <g className={animated ? "owl-wing-left" : undefined}>
            <ellipse cx="38" cy="120" rx="14" ry="30" fill="#f97316" transform="rotate(14 38 120)" />
          </g>
          <g className={animated ? "owl-wing-right" : undefined}>
            <ellipse cx="162" cy="120" rx="14" ry="30" fill="#f97316" transform="rotate(-14 162 120)" />
          </g>
        </>
      )}

      {/* mắt */}
      {covering ? (
        <>
          <path d="M58 92 Q74 78 90 92" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          <path d="M110 92 Q126 78 142 92" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="74" cy="88" r="26" fill="#fff" />
          <circle cx="126" cy="88" r="26" fill="#fff" />
          <g className={animated ? "owl-blink" : undefined}>
            <circle cx="76" cy="90" r="17" fill="#1e293b" />
            <circle cx="124" cy="90" r="17" fill="#1e293b" />
            <circle cx="82" cy="83" r="6.5" fill="#fff" />
            <circle cx="130" cy="83" r="6.5" fill="#fff" />
            <circle cx="71" cy="96" r="3" fill="#fff" opacity="0.8" />
            <circle cx="119" cy="96" r="3" fill="#fff" opacity="0.8" />
          </g>
        </>
      )}

      {/* má hồng + mỏ */}
      <ellipse cx="52" cy="112" rx="10" ry="6" fill="#fb7185" opacity="0.55" />
      <ellipse cx="148" cy="112" rx="10" ry="6" fill="#fb7185" opacity="0.55" />
      <path d="M92 106 Q100 100 108 106 Q100 118 92 106 Z" fill="#f59e0b" />

      {/* chân */}
      <ellipse cx="82" cy="181" rx="11" ry="6" fill="#f59e0b" />
      <ellipse cx="118" cy="181" rx="11" ry="6" fill="#f59e0b" />

      {/* mũ tốt nghiệp */}
      {cap && (
        <g>
          <path d="M100 16 L148 32 L100 48 L52 32 Z" fill="#1e3a8a" />
          <path d="M72 38 V50 Q100 62 128 50 V38 L100 48 Z" fill="#1e40af" />
          <path d="M148 32 V56" stroke="#facc15" strokeWidth="3" />
          <circle cx="148" cy="58" r="5" fill="#facc15" />
        </g>
      )}
    </svg>
  );
}
