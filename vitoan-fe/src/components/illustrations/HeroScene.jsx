import { Award, BookOpenText, PenLine, Star } from "lucide-react";
import OwlHero from "./OwlHero.jsx";

function PropCard({ className, style, children }) {
  return (
    <div
      className={`animate-bounce-soft absolute flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-elevation-3 ring-1 ring-slate-100 ${className || ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

export default function HeroScene({ className }) {
  return (
    <div className={`relative flex items-center justify-center ${className || ""}`}>
      {/* back-layer floating book, sits partly behind the owl */}
      <div
        className="animate-blob-float absolute left-2 top-8 z-0 flex h-16 w-16 -rotate-12 items-center justify-center rounded-2xl bg-secondary text-white shadow-elevation-2 sm:h-20 sm:w-20"
        style={{ animationDuration: "8s" }}
      >
        <BookOpenText className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.75} />
      </div>

      <div
        className="animate-blob-float absolute bottom-6 right-0 z-0 flex h-14 w-14 rotate-12 items-center justify-center rounded-2xl bg-vietnamese text-white shadow-elevation-2 sm:h-16 sm:w-16"
        style={{ animationDuration: "7s", animationDelay: "-2s" }}
      >
        <Award className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
      </div>

      {/* owl, front and center */}
      <OwlHero className="relative z-10 h-full w-full" />

      {/* front-layer prop cards, overlapping the owl for depth */}
      <PropCard className="-left-2 top-4 rotate-[-8deg] sm:left-2 sm:top-6" style={{ animationDelay: "0.4s" }}>
        <PenLine className="h-4 w-4 text-primary" strokeWidth={2.5} />
        <span className="font-display text-sm font-extrabold text-rose-500">10</span>
      </PropCard>

      <PropCard className="-right-1 top-1/3 rotate-[6deg] sm:right-1" style={{ animationDelay: "1s" }}>
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="text-xs font-bold text-slate-600">Giỏi</span>
      </PropCard>
    </div>
  );
}
