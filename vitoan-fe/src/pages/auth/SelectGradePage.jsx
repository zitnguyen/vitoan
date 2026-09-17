import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, CloudSun, PartyPopper, Star, Rocket } from "lucide-react";
import { gradeService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { BlobBackground } from "../../components/illustrations/Decorations.jsx";

const GRADE_THEMES = [
  { bg: "bg-primary", Icon: Sprout },
  { bg: "bg-secondary", Icon: CloudSun },
  { bg: "bg-vietnamese", Icon: PartyPopper },
  { bg: "bg-violet-500", Icon: Star },
  { bg: "bg-rose-500", Icon: Rocket },
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
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <OwlMascot className="mx-auto h-28 w-28 drop-shadow-lg" />
        <h1 className="mt-4 font-display text-h2 text-slate-800">Em đang học lớp mấy?</h1>
        <p className="mt-2 text-body text-slate-500">
          Chọn lớp để ViToan gợi ý đúng bài học phù hợp với em nhé.
        </p>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {grades.map((grade, idx) => {
              const theme = GRADE_THEMES[idx % GRADE_THEMES.length];
              const isSubmitting = submittingId === grade._id;
              return (
                <button
                  key={grade._id}
                  type="button"
                  disabled={Boolean(submittingId)}
                  onClick={() => handleSelect(grade._id)}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 text-center shadow-elevation-1 ring-1 ring-slate-100 transition duration-200 hover:-translate-y-1 hover:shadow-elevation-3 hover:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${theme.bg} transition group-hover:scale-105`}
                  >
                    {isSubmitting ? <Spinner className="h-5 w-5 border-2 border-white/40 border-t-white" /> : <theme.Icon className="h-6 w-6" strokeWidth={2} />}
                  </span>
                  <span className="font-display text-h3 text-slate-800">{grade.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
