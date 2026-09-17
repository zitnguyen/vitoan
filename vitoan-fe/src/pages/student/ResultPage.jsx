import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { attemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import QuizResultView from "../../components/quiz/QuizResultView.jsx";

export default function ResultPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptService.getOne(attemptId).then((res) => {
      setAttempt(res.data);
      setLoading(false);
    });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!attempt) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <QuizResultView attempt={attempt} newBadges={location.state?.newBadges} />
    </div>
  );
}
