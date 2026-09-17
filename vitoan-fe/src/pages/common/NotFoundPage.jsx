import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="h-8 w-8" strokeWidth={1.75} />
      </span>
      <p className="mt-4 font-display text-h1 text-primary">404</p>
      <p className="mt-2 text-body text-slate-500">Không tìm thấy trang bạn yêu cầu.</p>
      <Link
        to="/"
        className="mt-6 flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-semibold text-white shadow-elevation-1 hover:bg-primary-dark"
      >
        <Home className="h-4 w-4" /> Về trang chủ
      </Link>
    </div>
  );
}
