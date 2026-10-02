import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Search, Eye, ChevronDown } from "../../components/ui/icons.jsx";
import { articleService } from "../../api/services";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { CATEGORY_LABELS, NewsImage, formatNewsDate } from "../../components/news/newsUtils.jsx";

const PAGE_SIZE = 12;

function Meta({ article }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
      {article.sourceName && <span className="font-bold text-primary">{article.sourceName}</span>}
      <span>{formatNewsDate(article.publishedAt)}</span>
      {article.viewCount > 0 && (
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {article.viewCount}
        </span>
      )}
    </p>
  );
}

function FeaturedCard({ article }) {
  return (
    <Link
      to={`/tin-tuc/${article._id}`}
      className="group grid overflow-hidden rounded-3xl bg-white shadow-elevation-1 transition hover:shadow-elevation-2 md:grid-cols-5"
    >
      <NewsImage src={article.imageUrl} alt={article.title} className="aspect-video h-full w-full md:col-span-3" />
      <div className="flex flex-col justify-center gap-2 p-5 md:col-span-2">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
          {CATEGORY_LABELS[article.category] || "Tin tức"}
        </span>
        <h2 className="font-display text-h3 leading-snug text-slate-800 group-hover:text-primary">{article.title}</h2>
        <p className="line-clamp-4 text-slate-600">{article.summary}</p>
        <Meta article={article} />
      </div>
    </Link>
  );
}

function NewsCard({ article }) {
  return (
    <Link
      to={`/tin-tuc/${article._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-elevation-1 transition hover:-translate-y-0.5 hover:shadow-elevation-2"
    >
      <NewsImage src={article.imageUrl} alt={article.title} className="aspect-video w-full" />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-800 group-hover:text-primary">{article.title}</h3>
        <p className="line-clamp-2 flex-1 text-slate-500">{article.summary}</p>
        <Meta article={article} />
      </div>
    </Link>
  );
}

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState([]);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Đổi bộ lọc → tải lại từ trang 1.
  useEffect(() => {
    setLoading(true);
    setPage(1);
    articleService
      .list({ page: 1, limit: PAGE_SIZE, source: source || undefined, q: search || undefined })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
        setSources(res.sources || []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [source, search]);

  function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    articleService
      .list({ page: next, limit: PAGE_SIZE, source: source || undefined, q: search || undefined })
      .then((res) => {
        setItems((prev) => [...prev, ...res.data]);
        setPage(next);
      })
      .finally(() => setLoadingMore(false));
  }

  const [featured, ...rest] = items;

  return (
    <div className="min-h-screen">
      <div className="page">
        <PageHeader
          icon={Newspaper}
          tone="blue"
          title="Tin tức giáo dục"
          subtitle="Tin mới về giáo dục, tiểu học và góc phụ huynh — tổng hợp từ các báo chính thống."
        />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {["", ...sources].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setSource(s)}
              className={cn(
                "rounded-full px-4 py-1.5 font-bold transition",
                source === s ? "bg-secondary text-white shadow-elevation-1" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-secondary/40"
              )}
            >
              {s || "Tất cả"}
            </button>
          ))}
          <form
            className="relative ml-auto w-full sm:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(query.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) setSearch("");
              }}
              placeholder="Tìm bài viết…"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </form>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-400 shadow-elevation-1">
            {search ? `Không tìm thấy bài viết nào với "${search}".` : "Chưa có bài viết nào."}
          </p>
        ) : (
          <>
            <div className="mt-5">
              <FeaturedCard article={featured} />
            </div>
            {rest.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <NewsCard key={a._id} article={a} />
                ))}
              </div>
            )}
            {items.length < total && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 rounded-full bg-white px-6 py-2.5 font-bold text-secondary shadow-elevation-1 hover:ring-secondary/40 disabled:opacity-60"
                >
                  {loadingMore ? "Đang tải…" : `Xem thêm (${total - items.length} bài)`}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
