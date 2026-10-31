import { Link } from "react-router-dom";
import SiteHeader from "../layout/SiteHeader.jsx";
import SiteFooter from "../layout/SiteFooter.jsx";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

const TYPE_LABEL = { topic: "Kiểm tra chủ đề", midterm: "Kiểm tra giữa kỳ", final: "Kiểm tra cuối kỳ" };

// Trang hiện khi em mở một bài kiểm tra chưa đủ điều kiện. Chia 2 cột: bên trái là tình trạng mở khoá + nút hành động,
// bên phải là danh sách bài còn thiếu (bấm là học ngay). Không có `lock` thì là lỗi chung (đề không tồn tại…).
export default function TestLockedView({ lock, message, backTo = "/kiem-tra" }) {
  const pct = lock && lock.required ? Math.round((lock.learned / lock.required) * 100) : 0;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="page">
          {lock ? (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]">
              {/* Trái: tình trạng */}
              <section className="relative overflow-clip rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-50 to-pink-100 p-7 text-center shadow-elevation-2 lg:self-start">
                <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/50 blur-2xl" />
                <Img3D name="lock" className="relative mx-auto h-24 w-24 animate-[float-soft_4s_ease-in-out_infinite]" />
                <p className="relative mt-3 text-sm font-black uppercase tracking-wide text-amber-700">{TYPE_LABEL[lock.testType] || "Bài kiểm tra"}</p>
                <h1 className="relative mt-1 font-display text-3xl font-black text-[#0b2340]">Đề này chưa mở</h1>
                <p className="relative mt-1 font-semibold text-slate-600">{lock.title}</p>

                <div className="relative mt-6 rounded-2xl bg-white/80 p-4 text-left backdrop-blur">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-black uppercase tracking-wide text-slate-500">Tiến độ mở khoá</span>
                    <span className="font-display text-2xl font-black text-amber-600">
                      {lock.learned}/{lock.required}
                      <span className="ml-1 text-sm text-slate-400">bài</span>
                    </span>
                  </div>
                  <div className="mt-2 h-3.5 overflow-clip rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Học xong các bài bên cạnh (đạt từ <b>80%</b> ở bài luyện tập) rồi quay lại làm bài kiểm tra nhé!
                  </p>
                </div>

                <div className="relative mt-5 flex flex-col gap-3">
                  {lock.missing[0] && (
                    <Link to={`/bai/${lock.missing[0]._id}`} className="rounded-full bg-primary px-7 py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5">
                      Học bài tiếp theo
                    </Link>
                  )}
                  <Link to={backTo} className="rounded-full bg-white px-7 py-3 font-display text-lg font-black text-slate-700 ring-1 ring-slate-200 transition hover:text-primary">
                    Về danh sách kiểm tra
                  </Link>
                </div>
              </section>

              {/* Phải: các bài cần học */}
              <section className="rounded-[2rem] bg-white p-6 shadow-elevation-1 sm:p-7">
                <h2 className="flex items-center gap-2 font-display text-2xl font-black text-[#0b2340]">
                  <Img3D name="books" className="h-8 w-8" /> Các bài em cần học ({lock.missing.length})
                </h2>
                <p className="mt-1 font-semibold text-slate-500">Bấm “Học” để xem video và kiến thức, “Luyện tập” để làm bài và đạt từ 80%.</p>
                <ul className="mt-4 grid grid-cols-1 gap-3 2xl:grid-cols-2">
                  {lock.missing.map((l, i) => (
                    <li key={l._id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-display text-lg font-black text-slate-500 shadow-sm">{i + 1}</span>
                      <span className="min-w-0 flex-1 text-[17px] font-bold leading-snug text-slate-800">{l.title}</span>
                      <Link to={`/bai/${l._id}`} className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-black text-white shadow-[0_3px_0_0_#049245] transition hover:-translate-y-0.5">
                        Học
                      </Link>
                      <Link to={`/bai/${l._id}/luyen-tap`} className="hidden shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-primary ring-1 ring-primary/30 transition hover:bg-primary/5 sm:block">
                        Luyện tập
                      </Link>
                    </li>
                  ))}
                </ul>
                {lock.missing.length === 0 && <p className="mt-4 font-semibold text-emerald-600">Em đã học đủ rồi, tải lại trang để vào làm bài nhé!</p>}
              </section>
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-elevation-2">
              <OwlMascot className="mx-auto h-24 w-24" covering animated={false} />
              <p className="mt-4 font-display text-2xl font-black text-slate-800">{message || "Không tìm thấy bài kiểm tra"}</p>
              <Link to={backTo} className="mt-6 inline-block rounded-full bg-primary px-7 py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245]">
                Về danh sách kiểm tra
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
