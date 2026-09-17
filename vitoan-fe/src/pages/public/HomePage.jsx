import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Trophy,
  Target,
  BookOpen,
  Gift,
  Sprout,
  CloudSun,
  Star,
  Rocket,
  PartyPopper,
  Divide,
  BookOpenText,
  BarChart3,
  Zap,
  Clock,
  Play,
} from "lucide-react";
import { gradeService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import HeroScene from "../../components/illustrations/HeroScene.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import SkyScene from "../../components/illustrations/SkyScene.jsx";
import WaveDivider from "../../components/illustrations/WaveDivider.jsx";
import Reveal from "../../components/common/Reveal.jsx";
import { cn } from "../../lib/utils";

function SectionKicker() {
  return <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r from-primary via-secondary to-vietnamese" aria-hidden="true" />;
}

const GRADE_THEMES = [
  { bg: "bg-primary", Icon: Sprout },
  { bg: "bg-secondary", Icon: CloudSun },
  { bg: "bg-vietnamese", Icon: PartyPopper },
  { bg: "bg-violet-500", Icon: Star },
  { bg: "bg-rose-500", Icon: Rocket },
];

const STATS = [
  { Icon: Trophy, value: "96%", label: "Học sinh tiến bộ rõ rệt sau luyện tập", color: "bg-amber-400" },
  { Icon: Target, value: "1.000+", label: "Câu hỏi bám sát sách giáo khoa", color: "bg-secondary" },
  { Icon: BookOpen, value: "2 môn", label: "Toán và Tiếng Việt tiểu học", color: "bg-vietnamese" },
  { Icon: Gift, value: "Miễn phí", label: "Không giới hạn số lượt luyện tập", color: "bg-primary" },
];

const PROGRAMS = [
  {
    key: "toan",
    name: "Toán ViToan",
    desc: "Rèn luyện tư duy tính toán qua các dạng bài trắc nghiệm bám sát chương trình sách giáo khoa.",
    grades: "Lớp 1 - 5",
    color: "from-secondary to-blue-600",
    Icon: Divide,
  },
  {
    key: "tieng-viet",
    name: "Tiếng Việt",
    desc: "Luyện từ vựng, ngữ pháp, chính tả qua các bài luyện tập sinh động, dễ hiểu.",
    grades: "Lớp 1 - 5",
    color: "from-vietnamese to-orange-600",
    Icon: BookOpenText,
  },
];

const WHY_CHOOSE = [
  { Icon: BarChart3, title: "Theo dõi tiến độ rõ ràng", desc: "Xem lại lịch sử làm bài, điểm số từng lượt luyện tập để biết mình đã tiến bộ ra sao.", color: "bg-secondary" },
  { Icon: Zap, title: "Chấm điểm tức thì", desc: "Nộp bài là có kết quả ngay, kèm giải thích chi tiết cho từng câu hỏi.", color: "bg-amber-400" },
  { Icon: Clock, title: "Học mọi lúc, mọi nơi", desc: "Chỉ cần trình duyệt web, luyện tập bất cứ khi nào em rảnh.", color: "bg-violet-500" },
  { Icon: Gift, title: "Hoàn toàn miễn phí", desc: "Luyện tập không giới hạn số lượt, không mất phí.", color: "bg-rose-500" },
];

export default function HomePage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradeService
      .list()
      .then((res) => setGrades(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pb-6">
        <SkyScene className="absolute inset-0 -z-10 h-full w-full" />

        {/* floating decorative shapes */}
        <Star className="absolute left-[8%] top-20 hidden h-6 w-6 animate-bounce-soft text-white drop-shadow sm:block" style={{ animationDelay: "0.3s" }} fill="currentColor" />
        <Star className="absolute right-[12%] top-32 hidden h-4 w-4 animate-bounce-soft text-white drop-shadow sm:block" style={{ animationDelay: "1.1s" }} fill="currentColor" />
        <div className="absolute left-[18%] top-40 hidden h-10 w-10 animate-spin-slow rounded-2xl bg-white/25 sm:block" />
        <div className="absolute right-[6%] top-16 hidden h-14 w-14 animate-blob-float rounded-full bg-white/20 md:block" />

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-8 pt-16 md:grid-cols-2 md:pt-24">
          <Reveal className="text-center md:text-left">
            <span className="animate-badge-pulse inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-caption font-semibold text-primary shadow-elevation-2 ring-2 ring-white">
              <Sparkles className="h-4 w-4 animate-bounce-soft" /> Nền tảng tự học Toán &amp; Tiếng Việt
            </span>
            <h1 className="mt-5 font-display text-h1 leading-[1.1] text-white [text-shadow:0_3px_0_rgba(11,35,64,0.18)]">
              Học mà chơi cùng
              <br />
              <span
                className="relative inline-block text-vietnamese"
                style={{ WebkitTextStroke: "2px #fff", textShadow: "4px 4px 0 rgba(11,35,64,0.15)" }}
              >
                ViToan
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-body-lg text-white/90 md:mx-0">
              Luyện tập trắc nghiệm Toán &amp; Tiếng Việt theo từng lớp, chấm điểm tức thì,
              giúp các em tự tin hơn mỗi ngày.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
              <Button
                to={user ? (user.grade?.slug ? `/lop/${user.grade.slug}/toan` : "/chon-lop") : "/dang-ky"}
                className="group rounded-2xl border-b-4 border-primary-dark px-7 py-3 text-base transition-all duration-150 hover:-translate-y-0.5 active:translate-y-1 active:border-b-0"
              >
                <span className="inline-flex items-center gap-2">
                  {user ? "Vào học ngay" : "Trải nghiệm ngay"}
                  <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Button>
              {!user && (
                <Button
                  to="/dang-nhap"
                  variant="outline"
                  className="rounded-2xl border-b-4 border-slate-300 bg-white px-7 py-3 text-base transition-all duration-150 hover:-translate-y-0.5 active:translate-y-1 active:border-b-0"
                >
                  Đăng nhập
                </Button>
              )}
            </div>
            <a
              href="#chuong-trinh"
              className="group mt-6 inline-flex items-center gap-3 text-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-elevation-2 transition-transform duration-300 group-hover:scale-110">
                <Play className="h-4 w-4 fill-current" />
              </span>
              <span className="font-semibold [text-shadow:0_1px_2px_rgba(11,35,64,0.25)] group-hover:underline">Xem cách ViToan hoạt động</span>
            </a>
          </Reveal>
          <Reveal delay={150} className="flex justify-center">
            <HeroScene className="h-64 w-64 sm:h-80 sm:w-80" />
          </Reveal>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6">
          <div className="grid grid-cols-2 gap-6 rounded-3xl bg-white p-8 shadow-elevation-3 ring-4 ring-white/60 sm:grid-cols-4">
            {STATS.map((stat, idx) => (
              <Reveal key={stat.value} delay={idx * 90} className="group flex flex-col items-center text-center">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-elevation-1 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6 ${stat.color}`}>
                  <stat.Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="mt-3 font-display text-h3 text-slate-800">{stat.value}</span>
                <span className="mt-1 text-caption leading-snug text-slate-500">{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
        <WaveDivider color="#f8fafc" className="relative z-0 -mt-1" />
      </section>

      {/* Chọn lớp */}
      <section id="chon-lop" className="relative mx-auto max-w-6xl px-4 py-16">
        <PartyPopper className="absolute -left-2 top-6 hidden h-8 w-8 -rotate-12 text-vietnamese/60 sm:block" />
        <Reveal>
          <SectionKicker />
          <h2 className="text-center font-display text-h2 text-slate-800">Chọn lớp của em để bắt đầu</h2>
          <p className="mt-2 text-center text-body text-slate-500">
            Nội dung luyện tập được thiết kế riêng cho từng khối lớp
          </p>
        </Reveal>

        {user?.role === "Student" && user?.grade && (
          <Reveal delay={60}>
            <Link
              to={`/lop/${user.grade.slug}/toan`}
              className="group mt-6 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-primary to-secondary p-5 text-white shadow-elevation-2 transition hover:-translate-y-0.5 hover:shadow-elevation-3"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Rocket className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="text-caption font-semibold uppercase tracking-wide text-white/80">Lớp của em</p>
                <p className="font-display text-h3">Vào học {user.grade.name}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary transition group-hover:bg-white/90">
                Vào học ngay
              </span>
            </Link>
          </Reveal>
        )}

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
            {grades.map((grade, idx) => {
              const theme = GRADE_THEMES[idx % GRADE_THEMES.length];
              const isActive = user?.grade?._id === grade._id;
              return (
                <Reveal key={grade._id} delay={idx * 70} as={Link} to={`/lop/${grade.slug}/toan`}
                  className={cn(
                    "group flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 text-center shadow-elevation-2 ring-2 ring-slate-100 transition duration-300 hover:-translate-y-1.5 hover:rotate-1 hover:ring-primary/40 hover:shadow-elevation-3",
                    isActive && "ring-primary/50"
                  )}
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${theme.bg} shadow-elevation-1 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}>
                    <theme.Icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="font-display text-h3 text-slate-800">{grade.name}</span>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* Chương trình học */}
      <section id="chuong-trinh" className="bg-slate-50/80 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <SectionKicker />
            <h2 className="text-center font-display text-h2 text-slate-800">
              Chương trình học được quan tâm nhất
            </h2>
            <p className="mt-2 text-center text-body text-slate-500">Bám sát chương trình sách giáo khoa tiểu học</p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PROGRAMS.map((program, idx) => (
              <Reveal
                key={program.key}
                delay={idx * 120}
                className={`group relative overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br ${program.color} p-8 text-white shadow-elevation-3 transition-transform duration-300 hover:-translate-y-1.5 sm:p-10`}
              >
                <div className="animate-blob-float absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 right-10 h-14 w-14 rounded-2xl bg-white/10" style={{ animation: "blob-float 7s ease-in-out infinite reverse" }} />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <program.Icon className="h-8 w-8" strokeWidth={1.75} />
                </span>
                <h3 className="relative mt-5 font-display text-h3">{program.name}</h3>
                <p className="relative mt-2 text-body leading-relaxed text-white/85">{program.desc}</p>
                <span className="relative mt-5 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
                  {program.grades}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Vì sao chọn ViToan */}
      <section id="vi-sao" className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <SectionKicker />
          <h2 className="text-center font-display text-h2 text-slate-800">Vì sao chọn ViToan</h2>
          <p className="mt-2 text-center text-body text-slate-500">Học tập hiệu quả, đơn giản và miễn phí</p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE.map((item, idx) => (
            <Reveal
              key={item.title}
              delay={idx * 100}
              className="group rounded-2xl bg-white p-7 text-center shadow-elevation-2 ring-2 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-elevation-3"
            >
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-elevation-1 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${item.color}`}>
                <item.Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <h3 className="mt-4 font-display font-bold text-slate-800">{item.title}</h3>
              <p className="mt-2 text-caption leading-relaxed text-slate-500">{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal className="relative flex flex-col items-center justify-between gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-secondary px-8 py-12 text-center text-white shadow-elevation-3 sm:flex-row sm:text-left">
          <div className="animate-blob-float absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <Star className="absolute right-24 top-6 hidden h-5 w-5 animate-bounce-soft text-white/70 sm:block" fill="currentColor" />
          <OwlMascot className="absolute -right-4 bottom-0 hidden h-28 w-28 opacity-90 drop-shadow-lg sm:block" />
          <div className="relative">
            <h3 className="font-display text-h3">
              {user ? "Sẵn sàng luyện tập tiếp chưa?" : "Sẵn sàng bắt đầu luyện tập?"}
            </h3>
            <p className="mt-1.5 text-body text-white/85">
              {user ? "Tiếp tục hành trình chinh phục kiến thức của em." : "Đăng ký miễn phí và luyện tập ngay hôm nay."}
            </p>
          </div>
          <Button
            to={user ? (user.grade?.slug ? `/lop/${user.grade.slug}/toan` : "/chon-lop") : "/dang-ky"}
            variant="outline"
            className="relative whitespace-nowrap rounded-full border-0 bg-white px-7 py-3 text-base text-primary shadow-elevation-2 transition-transform hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-elevation-3 sm:mr-24"
          >
            {user ? "Vào học ngay" : "Đăng ký ngay"}
          </Button>
        </Reveal>
      </section>
    </div>
  );
}
