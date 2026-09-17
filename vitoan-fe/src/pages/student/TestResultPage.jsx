import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { testAttemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import QuizResultView from "../../components/quiz/QuizResultView.jsx";

export default function TestResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAttemptService.getOne(attemptId).then((res) => {
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
      <QuizResultView attempt={attempt} />
    </div>
  );
}
