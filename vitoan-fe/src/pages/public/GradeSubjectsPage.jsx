import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Divide, BookOpenText, BookMarked } from "lucide-react";
import { gradeService, subjectService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";

const SUBJECT_STYLES = {
  toan: { color: "from-secondary to-blue-600", label: "Toán", Icon: Divide },
  "tieng-viet": { color: "from-vietnamese to-orange-600", label: "Tiếng Việt", Icon: BookOpenText },
};

export default function GradeSubjectsPage() {
  const { gradeSlug } = useParams();
  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([gradeService.list(), subjectService.list()]).then(([gradesRes, subjectsRes]) => {
      setGrade(gradesRes.data.find((g) => g.slug === gradeSlug) || null);
      setSubjects(subjectsRes.data);
      setLoading(false);
    });
  }, [gradeSlug]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-center font-display text-h2 text-slate-800">
        {grade ? grade.name : "Chọn lớp"} — Chọn môn học
      </h1>
      <p className="mt-2 text-center text-body text-slate-500">Chọn môn học em muốn luyện tập hôm nay</p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {subjects.map((subject) => {
          const style = SUBJECT_STYLES[subject.slug] || { color: "from-primary to-primary-dark", label: subject.name, Icon: BookMarked };
          return (
            <Link
              key={subject._id}
              to={`/lop/${gradeSlug}/${subject.slug}`}
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
