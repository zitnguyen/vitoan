import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BookOpen } from "../../components/ui/icons.jsx";
import { subjectService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import PageHeader, { HeaderStat } from "../../components/ui/PageHeader.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

const SUBJECT_STYLES = {
  toan: { bg: "from-sky-100 via-blue-50 to-indigo-100", icons: ["abacus", "numbers"], sub: "Số, hình, đo lường", btn: "from-sky-400 to-blue-500" },
  "tieng-viet": { bg: "from-amber-100 via-orange-50 to-pink-100", icons: ["openBook", "letters"], sub: "Chính tả, từ và câu, đọc hiểu", btn: "from-amber-400 to-orange-500" },
};

export default function OnTapPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subjectService.list().then((res) => {
      setSubjects(res.data);
      setLoading(false);
    });
  }, []);

  if (!user?.grade) {
    return <Navigate to="/chon-lop" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        icon={BookOpen}
        tone="green"
        title={`Ôn tập — ${user.grade.name}`}
        subtitle="Chọn môn học để ôn lại kiến thức theo từng chủ đề"
      />

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {subjects.map((subject) => {
          const style = SUBJECT_STYLES[subject.slug] || { bg: "from-green-100 to-lime-100", icons: ["books"], sub: "", btn: "from-primary to-emerald-500" };
          return (
            <Link
              key={subject._id}
              to={`/lop/${user.grade.slug}/${subject.slug}`}
              className={`group relative flex flex-col items-center overflow-clip rounded-[2rem] bg-gradient-to-br px-6 py-10 text-center shadow-elevation-2 transition hover:-translate-y-1 ${style.bg}`}
            >
              <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/50 blur-2xl" />
              <div className="relative flex items-end">
                <Img3D name={style.icons[0]} className="h-28 w-28 transition duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                {style.icons[1] && <Img3D name={style.icons[1]} className="-ml-8 h-16 w-16 transition duration-300 group-hover:rotate-6" />}
              </div>
              <span className="relative mt-4 font-display text-3xl font-black text-[#0b2340]">{subject.name}</span>
              {style.sub && <span className="relative mt-1 font-semibold text-slate-600">{style.sub}</span>}
              <span className={`relative mt-5 rounded-full bg-gradient-to-r px-7 py-2.5 font-black text-white shadow-md ${style.btn}`}>Ôn tập ngay →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
