import OwlMascot from "./OwlMascot.jsx";

const SPARKLES = [
  { top: "6%", left: "4%", size: 16, delay: "0s", duration: "3.4s" },
  { top: "18%", left: "88%", size: 12, delay: "0.6s", duration: "4s" },
  { top: "72%", left: "90%", size: 18, delay: "1.2s", duration: "3.8s" },
  { top: "82%", left: "10%", size: 13, delay: "0.3s", duration: "3.2s" },
  { top: "48%", left: "-2%", size: 10, delay: "1.6s", duration: "4.4s" },
];

function Sparkle({ top, left, size, delay, duration }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ top, left, width: size, height: size, animationDelay: delay, animationDuration: duration }}
      className="owl-hero-sparkle absolute text-secondary"
      fill="currentColor"
    >
      <path d="M12 0c1 5.2 2.8 7 8 8-5.2 1-7 2.8-8 8-1-5.2-2.8-7-8-8 5.2-1 7-2.8 8-8z" />
    </svg>
  );
}

export default function OwlHero({ className }) {
  return (
    <div className={`relative flex items-center justify-center ${className || ""}`}>
      <div className="owl-hero-glow absolute h-4/5 w-4/5 rounded-full bg-primary/30 blur-3xl" />
      {SPARKLES.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}
      <OwlMascot className="relative h-full w-full drop-shadow-xl" />
    </div>
  );
}
