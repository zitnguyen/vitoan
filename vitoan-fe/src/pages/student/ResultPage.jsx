import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { attemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import QuizResultView from "../../components/quiz/QuizResultView.jsx";
import QuizResultLayout from "../../components/quiz/QuizResultLayout.jsx";

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
    <QuizResultLayout>
      <QuizResultView
        attempt={attempt}
        heading={[attempt.lesson?.subject?.name, attempt.lesson?.grade?.name, attempt.practiceSet?.title || attempt.lesson?.title]
          .filter(Boolean)
          .join(" · ")}
        backTo={`/bai/${attempt.lesson?._id || attempt.lesson}`}
        backLabel="Về bài học"
        retryTo={
          attempt.practiceSet
            ? `/luyen-tap/${attempt.practiceSet._id || attempt.practiceSet}`
            : `/bai/${attempt.lesson?._id || attempt.lesson}/luyen-tap`
        }
        newBadges={location.state?.newBadges}
        pointsEarned={location.state?.pointsEarned}
        previousBest={location.state?.previousBest}
      />
    </QuizResultLayout>
  );
}
