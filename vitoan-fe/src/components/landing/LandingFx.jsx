import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

// Hiệu ứng dùng cho trang giới thiệu & các trang "anime" (chép từ ViChess, bỏ phần cờ vua).

// ---------- Hiện dần khi cuộn tới ----------
export function Reveal({ children, className, delay = 0, as: Tag = "div", style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={cn("reveal", shown && "reveal-in", className)} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

// ---------- Chữ đổi luân phiên ----------
export function RotatingWord({ words, className, interval = 2200 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  return (
    <span className={cn("relative inline-block", className)}>
      <span key={i} className="word-flip inline-block">
        {words[i]}
      </span>
    </span>
  );
}

// ---------- Số đếm tăng dần khi cuộn tới ----------
export function CountUp({ to, suffix = "", duration = 1400 }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {v.toLocaleString("vi-VN")}
      {suffix}
    </span>
  );
}

// ---------- Pháo giấy ----------
const CONFETTI_COLORS = ["#ffc83d", "#58a731", "#2f80ed", "#ec4899", "#8b5cf6", "#ff8a1f"];
export function Confetti({ burst, count = 28 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 520,
        y: -(120 + Math.random() * 260),
        r: Math.random() * 720 - 360,
        c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        d: Math.random() * 120,
        w: 6 + Math.random() * 6,
      })),
    [burst, count] // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!burst) return null;
  return (
    <span key={burst} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-20">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute block rounded-sm"
          style={{ width: p.w, height: p.w * 0.45, background: p.c, "--x": `${p.x}px`, "--y": `${p.y}px`, "--r": `${p.r}deg`, animationDelay: `${p.d}ms` }}
        />
      ))}
    </span>
  );
}


/** Theo dõi vị trí chuột trong 1 vùng: trả về { ref, px, py } với px, py trong [-1, 1]. */
export function useParallax() {
  const ref = useRef(null);
  const [pos, setPos] = useState({ px: 0, py: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setPos({ px: ((e.clientX - r.left) / r.width - 0.5) * 2, py: ((e.clientY - r.top) / r.height - 0.5) * 2 });
      });
    };
    const onLeave = () => setPos({ px: 0, py: 0 });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return { ref, ...pos };
}

// ---------- Thẻ nghiêng 3D theo chuột ----------
export function TiltCard({ children, className }) {
  const ref = useRef(null);
  const [t, setT] = useState({ x: 0, y: 0 });
  return (
    <div
      ref={ref}
      className={cn("transition-transform duration-200 ease-out [transform-style:preserve-3d]", className)}
      style={{ transform: `perspective(900px) rotateX(${t.y * -5}deg) rotateY(${t.x * 6}deg)` }}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        setT({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
      }}
      onPointerLeave={() => setT({ x: 0, y: 0 })}
    >
      {children}
    </div>
  );
}

// ---------- Chữ số, phép tính, chữ cái bay lơ lửng (trang trí nền) ----------
const FLOATERS = [
  ["1 + 2", "left-[4%] top-[18%]", "text-3xl", 0],
  ["Aa", "left-[42%] top-[6%]", "text-2xl", 1.2],
  ["×", "right-[3%] top-[12%]", "text-4xl", 2.1],
  ["Ă Â", "left-[8%] bottom-[12%]", "text-2xl", 0.6],
  ["½", "right-[6%] bottom-[8%]", "text-4xl", 1.7],
  ["Ư Ơ", "left-[48%] bottom-[4%]", "text-2xl", 2.6],
];
export function FloatingSymbols({ px = 0, py = 0 }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLOATERS.map(([s, pos, size, delay], i) => (
        <span key={s} className={cn("absolute opacity-25", pos)} style={{ transform: `translate(${px * (8 + i * 3)}px, ${py * (8 + i * 3)}px)` }}>
          <span className={cn("drift block font-display font-black text-white", size)} style={{ animationDelay: `${delay}s` }}>
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}
