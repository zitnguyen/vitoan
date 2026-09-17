export function BlobBackground({ className }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-math/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-vietnamese/20 blur-3xl" />
    </div>
  );
}

export function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z" />
    </svg>
  );
}
