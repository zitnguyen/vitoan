import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";

export default function ComingSoonPage({ title = "Tính năng", description }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <OwlMascot className="h-28 w-28" covering />
      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-vietnamese/10 px-4 py-1.5 text-caption font-bold uppercase tracking-wide text-vietnamese">
        Đang phát triển
      </span>
      <h1 className="mt-4 font-display text-h2 text-slate-800">{title}</h1>
      <p className="mt-2 max-w-md text-body text-slate-500">
        {description || `${title} đang được ViToan xây dựng và sẽ sớm ra mắt. Cảm ơn bạn đã ghé thăm!`}
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-elevation-2 transition hover:-translate-y-0.5 hover:bg-primary-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Về trang chủ
      </Link>
    </div>
  );
}
