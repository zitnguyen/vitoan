import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { testAttemptService } from "../../api/services";
import ResultMissing from "../../components/quiz/ResultMissing.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import QuizResultView from "../../components/quiz/QuizResultView.jsx";
import QuizResultLayout from "../../components/quiz/QuizResultLayout.jsx";

export default function TestResultPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    testAttemptService.getOne(attemptId).then((res) => {
      setAttempt(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!attempt) return <ResultMissing />;

  return (
    <QuizResultLayout>
      <QuizResultView
        attempt={attempt}
        heading={[attempt.test?.subject?.name, attempt.test?.grade?.name, attempt.test?.title].filter(Boolean).join(" · ")}
        backTo={
          attempt.test?.chapter && attempt.test?.grade?.slug && attempt.test?.subject?.slug
            ? `/lop/${attempt.test.grade.slug}/${attempt.test.subject.slug}?chu-de=${attempt.test.chapter._id}`
            : `/kiem-tra${attempt.test?.subject?.slug ? `?mon=${attempt.test.subject.slug}` : ""}`
        }
        backLabel={attempt.test?.chapter ? "Về chủ đề" : "Về danh sách kiểm tra"}
        retryTo={attempt.test?._id ? `/kiem-tra/${attempt.test._id}` : undefined}
        newBadges={location.state?.newBadges}
        pointsEarned={location.state?.pointsEarned}
        previousBest={location.state?.previousBest}
      />
    </QuizResultLayout>
  );
}
