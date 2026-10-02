import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ExternalLink, Eye, CalendarDays } from "../../components/ui/icons.jsx";
import { articleService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { CATEGORY_LABELS, NewsImage, formatNewsDate } from "../../components/news/newsUtils.jsx";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setArticle(null);
    setError("");
    window.scrollTo(0, 0);
    articleService
      .getOne(id)
      .then((res) => {
        setArticle(res.data);
        setRelated(res.related || []);
      })
      .catch((err) => setError(err.apiMessage || "Không tải được bài viết"));
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <p className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-elevation-1">{error}</p>
        <Link to="/tin-tuc" className="mt-4 inline-flex items-center gap-1 font-bold text-secondary hover:underline">
          <ChevronLeft className="h-4 w-4" /> Về trang tin tức
        </Link>
      </div>
    );
  }
  if (!article) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const date = new Date(article.publishedAt);

  return (
    <div className="min-h-screen">
      <div className="page">
        <Link to="/tin-tuc" className="inline-flex items-center gap-1 font-bold text-secondary hover:underline">
          <ChevronLeft className="h-4 w-4" /> Tin tức
        </Link>

        {/* Màn rộng: bài viết bên trái, tin liên quan bên phải */}
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <article className="overflow-hidden rounded-3xl bg-white shadow-elevation-1">
            <div className="p-5 sm:p-7">
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
                {CATEGORY_LABELS[article.category] || "Tin tức"}
              </span>
              <h1 className="mt-3 font-display text-h2 leading-tight text-slate-800">{article.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
                {article.sourceName && <span className="font-bold text-primary">{article.sourceName}</span>}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {article.viewCount} lượt xem
                </span>
              </p>
            </div>

            {article.imageUrl && <NewsImage src={article.imageUrl} alt={article.title} className="aspect-video max-h-[70vh] w-full" />}

            <div className="space-y-4 p-5 sm:p-7">
              {article.summary && <p className="text-body-lg font-semibold leading-relaxed text-slate-700">{article.summary}</p>}
              {article.content && (
                <div className="space-y-3 whitespace-pre-line leading-relaxed text-slate-700">{article.content}</div>
              )}

              {article.sourceUrl && (
                <div className="rounded-2xl bg-secondary/5 p-4 ring-1 ring-secondary/20">
                  <p className="text-slate-600">
                    Đây là phần tóm tắt. Nội dung đầy đủ thuộc bản quyền của báo <b>{article.sourceName || "gốc"}</b>.
                  </p>
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 font-bold text-white shadow-elevation-1 hover:bg-blue-600"
                  >
                    Đọc toàn bộ bài viết tại {article.sourceName || "báo gốc"} <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </article>

          {related.length > 0 && (
            <aside className="lg:sticky lg:top-36">
              <h2 className="section-title">Tin liên quan</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {related.map((r) => (
                  <Link
                    key={r._id}
                    to={`/tin-tuc/${r._id}`}
                    className="group flex gap-3 rounded-2xl bg-white p-3 shadow-elevation-1 hover:ring-secondary/30"
                  >
                    <NewsImage src={r.imageUrl} alt={r.title} className="aspect-video w-32 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-bold leading-snug text-slate-800 group-hover:text-secondary">{r.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {r.sourceName} · {formatNewsDate(r.publishedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
