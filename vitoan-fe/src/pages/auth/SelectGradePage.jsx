import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gradeService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { BlobBackground } from "../../components/illustrations/Decorations.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

// Mỗi lớp một màu pastel + hình 3D riêng
const GRADE_STYLES = [
  { bg: "from-emerald-100 to-lime-100", num: "from-emerald-400 to-green-500", icon: "seedling" },
  { bg: "from-sky-100 to-cyan-100", num: "from-sky-400 to-blue-500", icon: "pencil" },
  { bg: "from-amber-100 to-yellow-100", num: "from-amber-400 to-orange-500", icon: "books" },
  { bg: "from-violet-100 to-fuchsia-100", num: "from-violet-400 to-purple-500", icon: "bulb" },
  { bg: "from-pink-100 to-rose-100", num: "from-pink-400 to-rose-500", icon: "rocket" },
];

export default function SelectGradePage() {
  const navigate = useNavigate();
  const { setGrade } = useAuth();
  const toast = useToast();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    gradeService
      .list()
      .then((res) => setGrades(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(gradeId) {
    setSubmittingId(gradeId);
    try {
      await setGrade(gradeId);
      toast.success("Đã lưu lớp học của em!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.apiMessage || "Có lỗi xảy ra, thử lại sau");
      setSubmittingId(null);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden">
      <BlobBackground className="pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 text-center">
        <OwlMascot className="mx-auto h-32 w-32 drop-shadow-[0_16px_20px_rgba(11,35,64,0.18)]" />
        <h1 className="mt-4 font-display text-4xl font-black text-[#0b2340] sm:text-5xl">Em đang học lớp mấy?</h1>
        <p className="mt-3 text-lg font-semibold text-slate-500">
          Chọn lớp để ViToan gợi ý đúng bài học phù hợp với em nhé.
        </p>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
            {grades.map((grade, idx) => {
              const isSubmitting = submittingId === grade._id;
              const st = GRADE_STYLES[idx % GRADE_STYLES.length];
              return (
                <button
                  key={grade._id}
                  type="button"
                  disabled={Boolean(submittingId)}
                  onClick={() => handleSelect(grade._id)}
                  className={`group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[1.75rem] bg-gradient-to-br px-3 pb-5 pt-6 text-center shadow-elevation-1 transition hover:-translate-y-1.5 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-60 ${st.bg}`}
                >
                  <Img3D name={st.icon} className="absolute right-2 top-2 h-9 w-9 opacity-90 transition group-hover:rotate-12 group-hover:scale-110" />
                  <span className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br font-display text-5xl font-black text-white shadow-lg transition group-hover:scale-110 ${st.num}`}>
                    {isSubmitting ? <Spinner className="h-8 w-8" /> : grade.order || idx + 1}
                  </span>
                  <span className="font-display text-xl font-black text-[#0b2340]">{grade.name}</span>
                  <span className="text-sm font-bold text-slate-500">Toán · Tiếng Việt</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
