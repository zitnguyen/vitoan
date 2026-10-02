import OwlMascot from "../illustrations/OwlMascot.jsx";
import { Confetti } from "../landing/LandingFx.jsx";
import { cn } from "../../lib/utils";

// Bộ giao diện "anime" dùng chung cho các trang của bé (theo phong cách ViChess): bầu trời có tia sáng,
// cú ViToan + bong bóng thoại, tiêu đề chữ viền đậm, nhãn tròn, tiêu đề mục dạng ruy băng, con dấu
// và màn hình nhận thưởng. CSS đi kèm: các lớp .anime-* trong index.css.

export const INK = "#2b1a4a";

// Bầu trời theo tông màu của từng trang (math = xanh dương cho Toán, viet = cam cho Tiếng Việt)
const SKIES = {
  pink: "linear-gradient(135deg, #ff9ed1 0%, #c59bff 45%, #7cc7ff 100%)",
  gold: "linear-gradient(135deg, #ffd66b 0%, #ffa94d 45%, #ff7eb6 100%)",
  mint: "linear-gradient(135deg, #8ce99a 0%, #66d9e8 50%, #748ffc 100%)",
  night: "linear-gradient(135deg, #5f3dc4 0%, #9c36b5 50%, #f06595 100%)",
  sky: "linear-gradient(135deg, #74c0fc 0%, #4dabf7 45%, #9775fa 100%)",
  sunset: "linear-gradient(135deg, #ffc078 0%, #ff922b 45%, #f06595 100%)",
  math: "linear-gradient(135deg, #66d9e8 0%, #339af0 50%, #7950f2 100%)",
  viet: "linear-gradient(135deg, #ffd43b 0%, #ff922b 50%, #f06595 100%)",
};

export function skyBackground(tone = "pink") {
  return `radial-gradient(120% 90% at 85% 0%, rgba(255,255,255,0.5) 0%, transparent 45%), ${SKIES[tone] || SKIES.pink}`;
}

/** Cú ViToan có bóng đổ kiểu sticker. */
export function Mascot({ className, shake = false, covering = false }) {
  return (
    <span className={cn("inline-block shrink-0 drop-shadow-[0_6px_0_rgba(43,26,74,0.35)]", className)}>
      <OwlMascot className="h-full w-full" shake={shake} covering={covering} />
    </span>
  );
}

export function AnimeSky({ tone = "pink", className, children, style }) {
  return (
    <section
      className={cn("relative overflow-hidden rounded-[2rem] border-[3px]", className)}
      style={{ borderColor: INK, boxShadow: `0 6px 0 0 ${INK}`, background: skyBackground(tone), ...style }}
    >
      <div className="anime-rays" />
      <div className="anime-dots absolute inset-0" />
      {["top-4 left-[46%] text-2xl", "top-10 right-8 text-3xl", "bottom-6 left-[38%] text-xl", "bottom-10 right-[30%] text-2xl", "top-6 left-6 text-lg"].map((pos, i) => (
        <span key={i} className={cn("anime-twinkle pointer-events-none absolute text-white drop-shadow", pos)} style={{ animationDelay: `${i * 0.45}s` }}>
          ✦
        </span>
      ))}
      <div className="relative">{children}</div>
    </section>
  );
}

export function SpeechBubble({ children, className }) {
  return (
    <div className={cn("anime-bubble w-fit max-w-md px-4 py-2.5 text-left font-extrabold", className)} style={{ color: INK }}>
      {children}
    </div>
  );
}

/** Đầu trang anime: cú ViToan + bong bóng thoại + tiêu đề viền đậm + các nhãn (children). */
export function AnimeHero({ tone, say, title, children }) {
  return (
    <AnimeSky tone={tone} className="px-5 pb-6 pt-6 sm:px-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <Mascot className="h-32 w-32 sm:h-40 sm:w-40" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {say && <SpeechBubble className="mx-auto mb-4 sm:mx-0">{say}</SpeechBubble>}
          <h1 className="anime-title font-display text-4xl font-black sm:text-5xl">{title}</h1>
          {children && <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">{children}</div>}
        </div>
      </div>
    </AnimeSky>
  );
}

export function HeroChip({ icon, label, value }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border-[3px] bg-white px-3 py-1 font-extrabold" style={{ borderColor: INK, color: INK, boxShadow: `0 3px 0 0 ${INK}` }}>
      {icon}
      {label && <span className="text-xs font-bold opacity-60">{label}</span>}
      <span className="whitespace-nowrap">{value}</span>
    </span>
  );
}

export function AnimeSectionTitle({ children, tint = "bg-pink-400", right, className }) {
  return (
    <div className={cn("mb-4 mt-8 flex flex-wrap items-center justify-between gap-2", className)}>
      <h2 className={cn("rounded-full border-[3px] px-4 py-1 font-display text-xl font-black text-white", tint)} style={{ borderColor: INK, boxShadow: `0 3px 0 0 ${INK}` }}>
        ★ {children}
      </h2>
      {right}
    </div>
  );
}

/** Nút tab / lọc tròn kiểu anime */
export function AnimePill({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-1.5 rounded-full border-[3px] px-4 py-1.5 font-extrabold transition", active ? "bg-pink-400 text-white" : "bg-white hover:-translate-y-0.5", className)}
      style={{ borderColor: INK, color: active ? undefined : INK, boxShadow: `0 3px 0 0 ${INK}` }}
    >
      {children}
    </button>
  );
}

export function Stamp({ children = "ĐÃ NHẬN", animate = false, className }) {
  return <span className={cn("anime-stamp whitespace-nowrap rounded-full font-black leading-none", !animate && "[animation:none] -rotate-12", className)}>{children}</span>;
}

/** Màn hình nhận thưởng: tia sáng xoay, pháo giấy, cú ViToan, số điểm to. reward = { key, title, points, sub, badges } */
export function RewardOverlay({ reward, onClose }) {
  if (!reward) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#2b1a4a]/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="anime-rays !opacity-25" />
      <div className="relative w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <Confetti burst={reward.key} count={40} />
        <Mascot className="anime-pop mx-auto h-40 w-40" />
        <p className="anime-title anime-pop mt-1 font-display text-3xl font-black" style={{ animationDelay: "0.1s" }}>
          {reward.title}
        </p>
        {reward.points != null && (
          <p className="anime-title anime-pop mt-2 font-display text-6xl font-black" style={{ animationDelay: "0.2s", color: "#ffe066" }}>
            +{reward.points} 💎
          </p>
        )}
        {reward.sub && <p className="mt-3 font-extrabold text-white">{reward.sub}</p>}
        {reward.badges?.length > 0 && (
          <SpeechBubble className="anime-pop mx-auto mt-4">🏅 Huy hiệu mới: {reward.badges.map((b) => `${b.iconUrl || ""} ${b.name}`.trim()).join(", ")}!</SpeechBubble>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-full border-[3px] bg-gradient-to-r from-pink-500 to-violet-500 px-10 py-3 font-display text-xl font-black text-white"
          style={{ borderColor: "#fff", boxShadow: "0 5px 0 0 rgba(0,0,0,0.35)" }}
        >
          {reward.button || "Yeah! ✦"}
        </button>
      </div>
    </div>
  );
}
