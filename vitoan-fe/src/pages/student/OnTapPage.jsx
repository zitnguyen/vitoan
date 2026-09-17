import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Divide, BookOpenText, BookMarked, BookOpen } from "lucide-react";
import { subjectService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const SUBJECT_STYLES = {
  toan: { color: "from-secondary to-blue-600", Icon: Divide },
  "tieng-viet": { color: "from-vietnamese to-orange-600", Icon: BookOpenText },
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
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="flex items-center justify-center gap-2 text-primary">
        <BookOpen className="h-5 w-5" />
        <span className="text-caption font-semibold uppercase tracking-wide">Ôn tập</span>
      </div>
      <h1 className="mt-2 text-center font-display text-h2 text-slate-800">
        Chọn môn học để ôn tập — {user.grade.name}
      </h1>
      <p className="mt-2 text-center text-body text-slate-500">
        Ôn lại kiến thức theo từng chủ đề, đúng chương trình lớp của em
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {subjects.map((subject) => {
          const style = SUBJECT_STYLES[subject.slug] || { color: "from-primary to-primary-dark", Icon: BookMarked };
          return (
            <Link
              key={subject._id}
              to={`/lop/${user.grade.slug}/${subject.slug}`}
              className={`flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-br p-10 text-white shadow-elevation-2 transition hover:-translate-y-1 hover:shadow-elevation-3 ${style.color}`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <style.Icon className="h-8 w-8" strokeWidth={1.75} />
              </span>
              <span className="font-display text-h3">{subject.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
