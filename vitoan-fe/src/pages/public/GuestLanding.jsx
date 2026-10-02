import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Monitor, Smartphone, Tablet } from "../../components/ui/icons.jsx";
import { gradeService, userService } from "../../api/services";
import { cn } from "../../lib/utils";
import { icon3d } from "../../lib/icons3d.jsx";
import { CountUp, Reveal } from "../../components/landing/LandingFx.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import UserAvatar from "../../components/common/UserAvatar.jsx";
import FloatingIsland from "../../components/common/FloatingIsland.jsx";

// Trang chủ cho khách (chưa đăng nhập) — bố cục tham khảo trang chủ VioEdu: hero bầu trời + linh vật lớn trên đồi hoa,
// thẻ số liệu đè mép hero, chương trình học, bảng vàng trên "đảo nổi", lộ trình 3 bước, học trên mọi thiết bị,
// "vì sao chọn" theo đối tượng. Nội dung, số liệu là của ViToan; hình 3D từ Fluent Emoji (MIT, xem lib/icons3d.js).

const NAVY = "#0b2340";
const CARD_SHADOW = "shadow-[0_18px_50px_-20px_rgba(11,35,64,0.28)]";

function Img3D({ name, className, style, alt = "" }) {
  return <img src={icon3d(name)} alt={alt} draggable={false} loading="lazy" className={cn("pointer-events-none select-none object-contain", className)} style={style} />;
}

// ---------- Trang trí: mây ----------
function Cloud({ className, style }) {
  return (
    <svg viewBox="0 0 200 80" className={cn("pointer-events-none absolute", className)} style={style} aria-hidden>
      <path
        d="M30 70c-16 0-26-10-26-22s11-21 24-20c3-13 15-22 29-21 9-14 33-15 44-2 14-7 33 2 35 18 15 0 28 10 28 24s-11 23-27 23H30z"
        fill="#fff"
      />
    </svg>
  );
}

// Dải mây trắng nhiều lớp ở mép dưới (hoặc trên khi flip) một khu vực
function CloudBand({ flip = false, className, color = "#fff" }) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={cn("pointer-events-none absolute inset-x-0 h-20 w-full sm:h-28", flip && "rotate-180", className)} aria-hidden>
      <path
        d="M0 120V70c40-24 90-28 130-8 30-34 100-40 140-6 40-30 110-26 150 6 30-26 100-30 140 0 40-34 120-32 160 4 30-24 100-28 140 2 40-30 120-28 160 4 30-22 90-24 130 2 40-28 110-26 140 2 30-14 70-14 100-4L1440 60V120z"
        fill={color}
        opacity="0.55"
      />
      <path
        d="M0 120V88c50-18 100-20 140-4 40-26 110-28 150 0 40-22 100-20 140 6 40-26 120-26 160 4 40-24 110-22 150 4 40-26 120-24 160 4 40-20 100-20 140 4 40-22 100-20 140 0 30-10 60-10 80-6L1440 84V120z"
        fill={color}
      />
    </svg>
  );
}

function FloatProp({ className, children, delay = 0 }) {
  return (
    <span aria-hidden className={cn("drift pointer-events-none absolute", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </span>
  );
}

// Đồi cỏ có hoa dưới chân cú (giống VioEdu)
function FlowerHill() {
  return (
    <div aria-hidden className="pointer-events-none absolute -bottom-10 left-[58%] h-44 w-[170%] -translate-x-1/2">
      <svg viewBox="0 0 600 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#4caf50" />
          </linearGradient>
        </defs>
        <path d="M0 160C60 70 180 30 300 40s240 40 300 120z" fill="url(#hill)" />
        <path d="M60 160c50-60 130-90 240-86s190 30 250 86z" fill="#65c466" opacity="0.6" />
      </svg>
      {[
        ["sunflower", "left-[18%] top-[18%] h-12 w-12", 0],
        ["blossom", "left-[30%] top-[6%] h-9 w-9", 1.2],
        ["sunflower", "left-[62%] top-[4%] h-14 w-14", 0.6],
        ["blossom", "left-[74%] top-[20%] h-10 w-10", 1.8],
        ["sunflower", "left-[44%] top-[22%] h-10 w-10", 2.4],
      ].map(([n, pos, d], i) => (
        <span key={i} className={cn("absolute", pos)}>
          <Img3D name={n} className="h-full w-full animate-[float-soft_5s_ease-in-out_infinite]" style={{ animationDelay: `${d}s` }} />
        </span>
      ))}
    </div>
  );
}

// ---------- 1. Hero ----------
function Hero() {
  return (
    <section className="relative overflow-clip" style={{ background: "linear-gradient(180deg,#a9dcfb 0%,#cdeafd 45%,#e9f6ff 100%)" }}>
      <Cloud className="-left-10 top-24 w-72 opacity-95" />
      <Cloud className="left-[30%] top-20 w-44 opacity-70" />
      <Cloud className="right-[8%] top-28 w-80 opacity-95" />
      <Cloud className="left-[8%] top-[52%] w-36 opacity-60" />
      <Cloud className="-right-10 top-[58%] w-56 opacity-80" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-4 px-4 pb-44 pt-28 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-56 md:pt-32 xl:max-w-7xl">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-primary shadow-sm">
            <Img3D name="sparkles" className="h-5 w-5" /> Toán & Tiếng Việt tiểu học
          </span>
          <h1 className="mt-5 font-display text-[2.4rem] font-black leading-[1.12] sm:text-5xl lg:text-[3.6rem]" style={{ color: NAVY }}>
            Nền tảng tự học
            <br />
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">vui như chơi</span> cho bé
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg font-semibold leading-relaxed text-slate-600 md:mx-0">
            Video bài giảng, luyện tập chấm từng câu, trợ lý AI cú ViToan — dành cho học sinh lớp 1 đến lớp 5, hoàn toàn miễn phí.
          </p>
          <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row md:justify-start">
            <Link
              to="/dang-ky"
              className="btn-shine inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-black text-white shadow-[0_6px_0_0_#049245,0_14px_28px_-10px_rgba(0,177,79,0.6)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
            >
              Học thử miễn phí <span aria-hidden>›</span>
            </Link>
            <a href="#lo-trinh" className="group inline-flex items-center gap-3 font-bold text-slate-700">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                <Play className="relative h-6 w-6 fill-current" />
              </span>
              Giới thiệu về ViToan
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-6 h-80 w-80 sm:h-[26rem] sm:w-[26rem] lg:h-[32rem] lg:w-[32rem]">
          <FlowerHill />
          <div className="absolute inset-[14%] rounded-full bg-white/70 blur-3xl" />
          {/* khung riêng để dời cú xuống đứng trên đồi (hiệu ứng nhún của cú tự dùng transform) */}
          <div className="relative h-[84%] w-[84%] translate-x-[9%] translate-y-[8%]">
            <OwlMascot className="h-full w-full drop-shadow-[0_24px_30px_rgba(11,35,64,0.22)]" />
          </div>
          <FloatProp className="left-0 top-6" delay={0.3}>
            <Img3D name="hundred" className="h-16 w-16 -rotate-12 sm:h-20 sm:w-20" />
          </FloatProp>
          <FloatProp className="right-2 top-0" delay={1.4}>
            <Img3D name="books" className="h-16 w-16 rotate-6 sm:h-20 sm:w-20" />
          </FloatProp>
          <FloatProp className="-right-4 top-[42%]" delay={0.8}>
            <Img3D name="ruler" className="h-14 w-14 rotate-12 sm:h-16 sm:w-16" />
          </FloatProp>
          <FloatProp className="-left-6 top-[46%]" delay={2}>
            <Img3D name="pencil" className="h-14 w-14 -rotate-6 sm:h-16 sm:w-16" />
          </FloatProp>
          <FloatProp className="left-[42%] -top-4" delay={2.6}>
            <Img3D name="star" className="h-10 w-10" />
          </FloatProp>
        </div>
      </div>
      <CloudBand className="bottom-0" />
    </section>
  );
}

// ---------- 2. Thẻ số liệu đè mép hero ----------
function StatsCard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    userService
      .publicStats()
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);
  const items = [
    { icon: "memo", value: stats?.questions, suffix: "+", label: "câu hỏi", desc: "Trắc nghiệm, điền khuyết, nghe đọc" },
    { icon: "books", value: stats?.lessons, suffix: "", label: "bài học", desc: "Có video & kiến thức cần nhớ" },
    { icon: "robot", text: "Trợ lý AI", desc: "Cú ViToan gợi ý, giải đáp mọi lúc" },
    { icon: "gift", text: "100% miễn phí", desc: "Không quảng cáo, không giới hạn lượt" },
  ];
  return (
    <div className="relative z-10 mx-auto -mt-36 max-w-6xl px-4 sm:px-6 md:-mt-44">
      <Reveal className={cn("rounded-[2.5rem] bg-white px-6 py-9 sm:px-12", CARD_SHADOW)}>
        <h2 className="text-center font-display text-2xl font-black sm:text-[2rem]" style={{ color: NAVY }}>
          Trợ lý học tập thông minh ViToan
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.desc} className="group text-center">
              <Img3D name={it.icon} className="mx-auto h-16 w-16 transition duration-300 group-hover:-translate-y-1 group-hover:scale-110 sm:h-20 sm:w-20" />
              <p className="mt-3 font-display text-xl font-black" style={{ color: NAVY }}>
                {it.value != null ? (
                  <>
                    <CountUp to={it.value} suffix={it.suffix} /> {it.label}
                  </>
                ) : (
                  it.text ?? "…"
                )}
              </p>
              <p className="mx-auto mt-1 max-w-[14rem] text-sm font-semibold leading-relaxed text-slate-500">{it.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

// ---------- 3. Chương trình học ----------
const PROGRAMS = [
  {
    slug: "toan",
    name: "Toán",
    tint: "from-[#fff1f7] to-[#ffe4ef]",
    desc: "Số học, hình học, đo lường, giải toán có lời văn",
    icons: [
      ["abacus", "h-24 w-24"],
      ["numbers", "h-14 w-14 -ml-6 mt-10"],
    ],
  },
  {
    slug: "tieng-viet",
    name: "Tiếng Việt",
    tint: "from-[#f4fbe8] to-[#e6f6d3]",
    desc: "Chính tả, từ và câu, đọc hiểu — có đọc to đề bài",
    icons: [
      ["openBook", "h-24 w-24"],
      ["letters", "h-14 w-14 -ml-6 mt-10"],
    ],
  },
];

function Programs() {
  const [grades, setGrades] = useState([]);
  useEffect(() => {
    gradeService
      .list()
      .then((res) => setGrades(res.data))
      .catch(() => {});
  }, []);
  return (
    <section id="chon-lop" className="scroll-mt-24 pb-20 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-black sm:text-[2.5rem]" style={{ color: NAVY }}>
            Chương trình học được yêu thích
          </h2>
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-slate-500 shadow-[0_6px_20px_-10px_rgba(11,35,64,0.3)]">
            <Img3D name="cap" className="h-6 w-6" /> Bám sát sách giáo khoa lớp 1 – 5
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-7 md:grid-cols-2">
          {PROGRAMS.map((p, i) => (
            <Reveal key={p.slug} delay={i * 120} className={cn("group rounded-[2rem] bg-gradient-to-br p-8 text-center transition duration-300 hover:-translate-y-1.5", p.tint, CARD_SHADOW)}>
              <h3 className="font-display text-2xl font-black" style={{ color: NAVY }}>
                {p.name}
              </h3>
              <div className="my-6 flex items-start justify-center">
                {p.icons.map(([n, cls]) => (
                  <Img3D key={n} name={n} className={cn(cls, "transition duration-300 group-hover:scale-110")} />
                ))}
              </div>
              <p className="font-semibold text-slate-600">{p.desc}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {grades.map((g) => (
                  <Link
                    key={g._id}
                    to={`/lop/${g.slug}/${p.slug}`}
                    className="rounded-full bg-white px-4 py-1.5 text-sm font-black text-slate-600 shadow-sm transition hover:bg-primary hover:text-white"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/dang-ky"
            className="inline-flex rounded-full bg-primary px-9 py-3.5 font-display text-lg font-black text-white shadow-[0_5px_0_0_#049245] transition hover:-translate-y-0.5"
          >
            Học thử ngay
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------- 4. Bảng vàng: đảo nổi ----------
const MEDALS = ["bg-amber-300 text-amber-900", "bg-slate-200 text-slate-700", "bg-orange-300 text-orange-900"];

function PodiumPerson({ row, first }) {
  return (
    <div className="flex flex-col items-center text-center">
      {first && <Img3D name="crown" className="-mb-1 h-10 w-10 animate-[float-soft_4s_ease-in-out_infinite]" />}
      <div className="relative rounded-full bg-white p-1.5 shadow-lg">
        <UserAvatar user={{ avatarUrl: row.avatarUrl, fullName: row.name }} size={first ? "h-24 w-24" : "h-20 w-20"} />
        <span className={cn("absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-sm font-black ring-4 ring-white", MEDALS[row.rank - 1] || MEDALS[2])}>
          {row.rank}
        </span>
      </div>
      <p className="mt-4 font-display text-lg font-black text-white [text-shadow:0_2px_6px_rgba(11,35,64,0.35)]">{row.name}</p>
      <p className="text-sm font-bold text-white/90">{row.score} điểm học tập</p>
    </div>
  );
}

function HallOfFame() {
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [rows, setRows] = useState(null);

  useEffect(() => {
    gradeService
      .list()
      .then((res) => {
        setGrades(res.data);
        if (res.data[0]) setGradeId(res.data[0]._id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!gradeId) return;
    setRows(null);
    userService
      .publicLeaderboard(gradeId)
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, [gradeId]);

  const top = rows?.slice(0, 3) || [];
  const rest = rows?.slice(3) || [];
  const podium = [top[1], top[0], top[2]]; // hạng 2 — hạng 1 — hạng 3

  return (
    <section id="vinh-danh" className="relative scroll-mt-24 overflow-clip pb-36 pt-32" style={{ background: "linear-gradient(180deg,#3b9cf2 0%,#5fb2f6 45%,#8fcbfa 100%)" }}>
      <CloudBand flip className="top-0" color="#fbfdff" />
      <Img3D name="cloud" className="absolute left-[4%] top-40 hidden w-32 opacity-90 sm:block" />
      <Img3D name="cloud" className="absolute right-[6%] top-56 hidden w-40 opacity-80 sm:block" />
      <Img3D name="trophy" className="absolute bottom-40 left-[8%] hidden w-20 rotate-[-8deg] opacity-90 lg:block" />
      <Img3D name="medal" className="absolute bottom-48 right-[9%] hidden w-16 rotate-12 opacity-90 lg:block" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center font-display text-3xl font-black text-white [text-shadow:0_3px_10px_rgba(11,35,64,0.25)] sm:text-[2.5rem]">Vinh danh Bảng vàng ViToan</h2>
        <p className="mt-3 text-center font-bold text-white/90">Những bạn nhỏ chăm chỉ nhất theo từng lớp</p>

        <div className="mx-auto mt-7 flex w-fit flex-wrap justify-center gap-1.5 rounded-full bg-white/20 p-1.5 backdrop-blur">
          {grades.map((g) => (
            <button
              key={g._id}
              type="button"
              onClick={() => setGradeId(g._id)}
              className={cn("rounded-full px-5 py-2 font-black transition", gradeId === g._id ? "bg-white text-primary shadow-lg" : "text-white hover:bg-white/20")}
            >
              {g.name}
            </button>
          ))}
        </div>

        {rows && rows.length === 0 && (
          <div className="mx-auto mt-12 max-w-md rounded-[2rem] bg-white/95 p-8 text-center shadow-xl">
            <Img3D name="trophy" className="mx-auto h-20 w-20" />
            <p className="mt-3 font-display text-xl font-black" style={{ color: NAVY }}>
              Bảng vàng đang chờ em!
            </p>
            <p className="mt-1 font-semibold text-slate-500">Chưa bạn nào của lớp này ghi điểm. Học ngay để là người đầu tiên nhé.</p>
            <Link to="/dang-ky" className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 font-black text-white shadow-[0_4px_0_0_#049245]">
              Bắt đầu học
            </Link>
          </div>
        )}

        {top.length > 0 && (
          <div className="mt-14 grid grid-cols-3 items-end gap-2 sm:gap-8">
            {podium.map((row, i) => (
              <div key={i} className={cn("flex flex-col items-center", i === 1 ? "pb-0" : i === 0 ? "pb-0 sm:pt-10" : "sm:pt-16")}>
                {row ? <PodiumPerson row={row} first={i === 1} /> : <div className="h-24" />}
                <div className="-mt-1 w-full">
                  <FloatingIsland place={[2, 1, 3][i]} scale={[0.9, 1.05, 0.82][i]} />
                </div>
              </div>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className="mx-auto mt-8 max-w-xl space-y-2.5">
            {rest.map((r) => (
              <div key={`${r.rank}-${r.name}`} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-3 shadow-md">
                <span className="w-7 font-display text-lg font-black text-slate-400">{String(r.rank).padStart(2, "0")}</span>
                <UserAvatar user={{ avatarUrl: r.avatarUrl, fullName: r.name }} size="h-10 w-10" />
                <span className="min-w-0 flex-1 truncate font-bold" style={{ color: NAVY }}>
                  {r.name}
                </span>
                <span className="font-black text-primary">{r.score} điểm</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <CloudBand className="bottom-0" color="#fbfdff" />
    </section>
  );
}

// ---------- 5. Lộ trình 3 bước ----------
const STEPS = [
  { n: 1, title: "Chọn lớp & học bài", color: "bg-sky-500", arch: "from-sky-100", icon: "books", items: ["Xem video bài giảng", "Kiến thức cần nhớ"] },
  { n: 2, title: "Luyện tập chủ động", color: "bg-amber-500", arch: "from-amber-100", icon: "pencil", items: ["Luyện tập chấm từng câu", "Ôn tập phần hay sai", "Kiểm tra giữa & cuối kỳ"] },
  { n: 3, title: "Vui học, nhận quà", color: "bg-primary", arch: "from-green-100", icon: "trophy", items: ["Nhiệm vụ hằng ngày", "Huy hiệu & bảng vàng", "Đổi quà trang trí"] },
];

function Roadmap() {
  return (
    <section id="lo-trinh" className="relative scroll-mt-24 overflow-clip py-24">
      <div aria-hidden className="absolute -left-48 top-0 h-[28rem] w-[28rem] rounded-full bg-orange-200/60 blur-3xl" />
      <div aria-hidden className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-black sm:text-[2.5rem]" style={{ color: NAVY }}>
            Lộ trình học tập cá nhân hóa
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-semibold leading-relaxed text-slate-500">ViToan ghi lại từng câu em làm đúng, làm sai để biết em mạnh ở đâu và cần ôn thêm phần nào.</p>
        </Reveal>

        <div className="relative mt-16">
          <svg aria-hidden viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute inset-x-0 top-0 hidden h-44 w-full md:block">
            <path d="M40 190 C 250 190, 300 100, 500 100 S 760 14, 960 14" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 9" />
          </svg>
          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:items-end">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 150} className={cn("flex flex-col items-center", i === 0 && "md:pt-32", i === 1 && "md:pt-16")}>
                <span className={cn("flex h-14 w-14 items-center justify-center font-display text-2xl font-black text-white shadow-lg", s.color)} style={{ clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)" }}>
                  {s.n}
                </span>
                <p className="mt-3 font-display text-xl font-black" style={{ color: NAVY }}>
                  {s.title}
                </p>
                <div className={cn("relative mt-5 w-full max-w-xs rounded-t-full bg-gradient-to-b to-transparent px-6 pb-8 pt-16", s.arch)}>
                  <Img3D name={s.icon} className="absolute -top-6 left-1/2 h-16 w-16 -translate-x-1/2" />
                  <div className="space-y-2.5">
                    {s.items.map((it) => (
                      <p key={it} className="rounded-full bg-white/95 px-4 py-2 text-center text-sm font-bold text-slate-600 shadow-sm">
                        {it}
                      </p>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- 6. Học trên mọi thiết bị ----------
function Devices() {
  return (
    <section className="relative overflow-clip bg-[#f2f5ea] py-24">
      <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-10 w-full">
        <path d="M0 0h1440v20C1100 60 340 60 0 20z" fill="#fbfdff" />
      </svg>
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-3xl font-black sm:text-[2.5rem]" style={{ color: NAVY }}>
            Học trên mọi thiết bị
          </h2>
          <p className="mt-4 max-w-md font-semibold leading-relaxed text-slate-600">
            Mở ViToan trên máy tính, máy tính bảng hay điện thoại — không cần cài đặt. Tiến độ được lưu lại: học dở ở máy này, làm tiếp ở máy khác.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {[
              [Monitor, "Máy tính"],
              [Tablet, "Máy tính bảng"],
              [Smartphone, "Điện thoại"],
            ].map(([Icon, label]) => (
              <span key={label} className="inline-flex items-center gap-2 rounded-xl bg-[#0b2340] px-4 py-3 font-bold text-white shadow-md">
                <Icon className="h-5 w-5 text-lime-300" /> {label}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={150} className="relative mx-auto flex h-72 w-full max-w-md items-center justify-center sm:h-80">
          <div className="absolute inset-6 rounded-full bg-white/70 blur-2xl" />
          <Img3D name="laptop" className="relative h-60 w-60 drop-shadow-2xl sm:h-72 sm:w-72" />
          <Img3D name="phone" className="drift absolute bottom-2 right-2 h-32 w-32 drop-shadow-2xl sm:right-4 sm:h-36 sm:w-36" />
          <OwlMascot className="drift absolute left-2 top-2 h-20 w-20 sm:h-24 sm:w-24" animated={false} />
        </Reveal>
      </div>
    </section>
  );
}

// ---------- 7. Vì sao chọn ViToan ----------
const WHY = {
  "Phụ huynh": {
    art: "heart",
    items: [
      { icon: "chart", title: "Báo cáo trực quan", desc: "Xem con đã học bài nào, đúng bao nhiêu, hay sai phần nào." },
      { icon: "bulb", title: "Hỗ trợ kèm con học", desc: "Kiến thức cần nhớ và lời giải từng câu giúp bố mẹ kèm con dễ hơn." },
      { icon: "hourglass", title: "Tiết kiệm thời gian", desc: "Con tự học, tự luyện; hệ thống tự chấm và tổng hợp kết quả." },
      { icon: "shield", title: "An toàn, miễn phí", desc: "Không quảng cáo, không thu phí, nội dung bám sách giáo khoa." },
    ],
  },
  "Học sinh": {
    art: "party",
    items: [
      { icon: "game", title: "Học mà chơi", desc: "Nhiệm vụ mỗi ngày, huy hiệu và quà trang trí avatar." },
      { icon: "sparkles", title: "Biết đúng sai ngay", desc: "Chấm từng câu kèm giải thích dễ hiểu, có đọc to đề bài." },
      { icon: "target", title: "Ôn đúng chỗ yếu", desc: "Thống kê phần kiến thức hay sai để ôn lại cho chắc." },
      { icon: "robot", title: "Có cú ViToan đồng hành", desc: "Hỏi trợ lý AI bất cứ khi nào em chưa hiểu bài." },
    ],
  },
};

function WhyUs() {
  const tabs = Object.keys(WHY);
  const [tab, setTab] = useState(tabs[0]);
  return (
    <section id="vi-sao" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-black sm:text-[2.5rem]" style={{ color: NAVY }}>
            Tại sao nên lựa chọn ViToan
          </h2>
          <div className="mx-auto mt-7 inline-flex rounded-full bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(11,35,64,0.3)]">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn("rounded-full px-7 py-2.5 font-black transition", tab === t ? "bg-primary text-white shadow" : "text-slate-500 hover:text-slate-800")}
              >
                {t}
              </button>
            ))}
          </div>
        </Reveal>
        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] items-center gap-12 md:grid-cols-[1.4fr_1fr]">
          <div key={tab} className="grid animate-pop-in grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
            {WHY[tab].items.map((w) => (
              <div key={w.title} className="group">
                <Img3D name={w.icon} className="h-12 w-12 transition duration-300 group-hover:-translate-y-1 group-hover:scale-110" />
                <p className="mt-3 font-display text-lg font-black" style={{ color: NAVY }}>
                  {w.title}
                </p>
                <p className="mt-1 font-semibold leading-relaxed text-slate-500">{w.desc}</p>
              </div>
            ))}
          </div>
          <div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-100 via-amber-100 to-amber-200" />
            <OwlMascot className="relative h-full w-full p-8" />
            <Img3D key={tab} name={WHY[tab].art} className="absolute -right-2 top-4 h-20 w-20 animate-pop-in" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GuestLanding() {
  return (
    <div className="bg-[#fbfdff]">
      <Hero />
      <StatsCard />
      <Programs />
      <HallOfFame />
      <Roadmap />
      <Devices />
      <WhyUs />
    </div>
  );
}
