// Bộ avatar cú mặc định của ViToan: 8 kiểu cú khác màu, khác phụ kiện (mũ, kính, nơ…).
// Học sinh chưa có ảnh thì được gán 1 kiểu theo mã tài khoản (mỗi bé một kiểu cố định), và có thể tự chọn lại ở Hồ sơ.
// avatarUrl dạng "owl:3" = đã chọn kiểu số 3.

export const OWLS = [
  { name: "Cú Tốt nghiệp", bg: "#dbeafe", body: "#fb923c", belly: "#fff1dc", wing: "#f97316", ear: "#f59e0b", beak: "#f59e0b" },
  { name: "Cú Biển xanh", bg: "#cffafe", body: "#38bdf8", belly: "#e0f7ff", wing: "#0ea5e9", ear: "#0284c7", beak: "#fbbf24" },
  { name: "Cú Phù thủy", bg: "#ede9fe", body: "#a78bfa", belly: "#f3edff", wing: "#8b5cf6", ear: "#7c3aed", beak: "#fbbf24" },
  { name: "Cú Công chúa", bg: "#fce7f3", body: "#f9a8d4", belly: "#fff0f7", wing: "#f472b6", ear: "#ec4899", beak: "#fb923c" },
  { name: "Cú Mọt sách", bg: "#dcfce7", body: "#4ade80", belly: "#f0fff4", wing: "#22c55e", ear: "#16a34a", beak: "#f59e0b" },
  { name: "Cú Phi hành gia", bg: "#e0e7ff", body: "#fbbf24", belly: "#fffbe6", wing: "#f59e0b", ear: "#d97706", beak: "#fb923c" },
  { name: "Cú Ninja", bg: "#e2e8f0", body: "#64748b", belly: "#e2e8f0", wing: "#475569", ear: "#334155", beak: "#fbbf24" },
  { name: "Cú Tuyết", bg: "#f0f9ff", body: "#bae6fd", belly: "#ffffff", wing: "#7dd3fc", ear: "#38bdf8", beak: "#fb923c" },
];

export const OWL_COUNT = OWLS.length;

// Chuỗi → số nguyên cố định (để mỗi tài khoản luôn ra đúng 1 kiểu cú).
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export const isOwlAvatar = (url) => typeof url === "string" && /^owl:\d+$/.test(url);

// Kiểu cú của 1 người dùng: đã chọn ("owl:N") hoặc tự gán theo mã tài khoản.
export function owlIndexFor(user) {
  if (isOwlAvatar(user?.avatarUrl)) return Number(user.avatarUrl.slice(4)) % OWL_COUNT;
  const key = String(user?.id || user?._id || user?.username || user?.fullName || "owl");
  return hash(key) % OWL_COUNT;
}

function Accessory({ idx }) {
  switch (idx) {
    case 0: // mũ tốt nghiệp
      return (
        <g>
          <path d="M100 14 L150 31 L100 48 L50 31 Z" fill="#1e3a8a" />
          <path d="M72 38 V51 Q100 63 128 51 V38 L100 48 Z" fill="#1e40af" />
          <path d="M150 31 V56" stroke="#facc15" strokeWidth="3" />
          <circle cx="150" cy="58" r="5" fill="#facc15" />
        </g>
      );
    case 1: // tai nghe
      return (
        <g>
          <path d="M42 84 Q100 -2 158 84" stroke="#0369a1" strokeWidth="9" fill="none" strokeLinecap="round" />
          <rect x="30" y="78" width="20" height="34" rx="9" fill="#0c4a6e" />
          <rect x="150" y="78" width="20" height="34" rx="9" fill="#0c4a6e" />
        </g>
      );
    case 2: // mũ phù thủy
      return (
        <g>
          <ellipse cx="100" cy="46" rx="62" ry="9" fill="#4c1d95" />
          <path d="M66 46 L100 -6 L134 46 Z" fill="#6d28d9" />
          <rect x="68" y="36" width="64" height="9" fill="#fbbf24" />
          <path d="M104 14 l3 7 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1z" fill="#fde68a" />
        </g>
      );
    case 3: // vương miện + nơ
      return (
        <g>
          <path d="M66 40 L72 14 L88 30 L100 8 L112 30 L128 14 L134 40 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="100" cy="20" r="5" fill="#ec4899" />
          <path d="M82 150 L100 142 L118 150 L118 164 L100 156 L82 164 Z" fill="#ec4899" />
          <circle cx="100" cy="153" r="6" fill="#be185d" />
        </g>
      );
    case 4: // kính tròn
      return (
        <g fill="none" stroke="#14532d" strokeWidth="5">
          <circle cx="74" cy="88" r="29" />
          <circle cx="126" cy="88" r="29" />
          <path d="M103 88 Q100 82 97 88" />
          <path d="M45 82 L36 74 M155 82 L164 74" strokeLinecap="round" />
        </g>
      );
    case 5: // mũ phi hành gia
      return (
        <g>
          <circle cx="100" cy="86" r="76" fill="#bae6fd" fillOpacity="0.28" stroke="#e2e8f0" strokeWidth="7" />
          <path d="M44 56 Q60 24 100 20" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7" />
          <rect x="88" y="150" width="24" height="10" rx="5" fill="#e2e8f0" />
        </g>
      );
    case 6: // băng đô ninja
      return (
        <g>
          <path d="M34 58 Q100 40 166 58 L166 74 Q100 56 34 74 Z" fill="#dc2626" />
          <path d="M166 62 L190 52 M166 70 L188 80" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
          <rect x="88" y="50" width="24" height="18" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" transform="rotate(-3 100 59)" />
        </g>
      );
    case 7: // mũ len + khăn
      return (
        <g>
          <path d="M52 52 Q54 14 100 12 Q146 14 148 52 Z" fill="#ef4444" />
          <rect x="48" y="46" width="104" height="14" rx="7" fill="#fecaca" />
          <circle cx="100" cy="10" r="9" fill="#fff" />
          <path d="M60 150 Q100 170 140 150 L140 166 Q100 186 60 166 Z" fill="#3b82f6" />
          <path d="M124 160 L132 190 L146 186 L138 158 Z" fill="#2563eb" />
        </g>
      );
    default:
      return null;
  }
}

/** Mặt + thân cú theo kiểu `idx`, vẽ vừa khung tròn (dùng làm ảnh đại diện). */
export function OwlAvatarArt({ idx = 0, className }) {
  const c = OWLS[idx % OWL_COUNT];
  return (
    <svg viewBox="14 6 172 172" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="0" y="0" width="200" height="200" fill={c.bg} />
      {/* tai */}
      <path d="M48 62 L40 24 L76 48 Z" fill={c.ear} />
      <path d="M152 62 L160 24 L124 48 Z" fill={c.ear} />
      {/* thân + bụng */}
      <ellipse cx="100" cy="112" rx="66" ry="70" fill={c.body} />
      <ellipse cx="100" cy="132" rx="44" ry="46" fill={c.belly} />
      <path d="M80 128q6 6 12 0M108 128q6 6 12 0M94 146q6 6 12 0" stroke={c.wing} strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* cánh */}
      <ellipse cx="38" cy="120" rx="14" ry="30" fill={c.wing} transform="rotate(14 38 120)" />
      <ellipse cx="162" cy="120" rx="14" ry="30" fill={c.wing} transform="rotate(-14 162 120)" />
      {/* mắt */}
      <circle cx="74" cy="88" r="26" fill="#fff" />
      <circle cx="126" cy="88" r="26" fill="#fff" />
      <circle cx="76" cy="90" r="17" fill="#1e293b" />
      <circle cx="124" cy="90" r="17" fill="#1e293b" />
      <circle cx="82" cy="83" r="6.5" fill="#fff" />
      <circle cx="130" cy="83" r="6.5" fill="#fff" />
      <circle cx="71" cy="96" r="3" fill="#fff" opacity="0.8" />
      <circle cx="119" cy="96" r="3" fill="#fff" opacity="0.8" />
      {/* má hồng + mỏ */}
      <ellipse cx="52" cy="112" rx="10" ry="6" fill="#fb7185" opacity="0.55" />
      <ellipse cx="148" cy="112" rx="10" ry="6" fill="#fb7185" opacity="0.55" />
      <path d="M92 106 Q100 100 108 106 Q100 118 92 106 Z" fill={c.beak} />
      <Accessory idx={idx % OWL_COUNT} />
    </svg>
  );
}
