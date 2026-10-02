import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Eye,
  ThumbsUp,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  RotateCcw,
  Lock,
  Clock,
  Rocket,
  ChevronLeft,
  ChevronRight,
  MessageCircleHeart,
  Send,
} from "../../components/ui/icons.jsx";
import {
  lessonService,
  questionService,
  reviewContentService,
  practiceSetService,
  commentService,
  chapterService,
  attemptService,
} from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import IdBadge from "../../components/common/IdBadge.jsx";
import { cn } from "../../lib/utils";
import UserAvatar from "../../components/common/UserAvatar.jsx";
import UserName from "../../components/common/UserName.jsx";
import LearningProgress from "../../components/lesson/LearningProgress.jsx";
import { trackYouTube, withJsApi, withStart } from "../../lib/youtube.js";

const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const LEVEL_COLOR = {
  easy: "bg-primary/10 text-primary",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-600",
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}

export default function LessonContentPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === "Student";
  const [lesson, setLesson] = useState(null);
  const [review, setReview] = useState(null);
  const [practiceSets, setPracticeSets] = useState([]);
  const [legacyQuestionCount, setLegacyQuestionCount] = useState(0);
  const [chapter, setChapter] = useState(null);
  const [learning, setLearning] = useState(null);
  const videoRef = useRef(null);
  const theoryRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      lessonService.getOne(lessonId, { trackView: 1 }),
      reviewContentService.getByLesson(lessonId).catch(() => ({ data: null })),
      practiceSetService.listByLesson(lessonId).catch(() => ({ data: [] })),
      questionService.listByLesson(lessonId).catch(() => ({ data: [] })),
      commentService.listByLesson(lessonId).catch(() => ({ data: [], total: 0 })),
    ])
      .then(([lessonRes, reviewRes, setsRes, questionsRes, commentsRes]) => {
        setLesson(lessonRes.data);
        setReview(reviewRes.data);
        setPracticeSets(setsRes.data);
        setLegacyQuestionCount(questionsRes.data.length);
        setComments(commentsRes.data);
        setCommentTotal(commentsRes.total || commentsRes.data.length);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err.apiMessage || "Không thể tải bài học");
        setLoading(false);
      });
  }, [lessonId]);

  // Tên chủ đề cho thanh đường dẫn.
  const chapterId = lesson?.chapter;
  useEffect(() => {
    if (!chapterId || !lesson) return;
    chapterService
      .list({ subject: lesson.subject?._id, grade: lesson.grade?._id })
      .then((res) => setChapter(res.data.find((c) => c._id === chapterId) || null))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  // Tiến độ học bài này (video, lý thuyết, luyện tập) — chỉ học sinh mới lưu.
  // liveVideo: các đoạn video đã xem + vị trí hiện tại, cập nhật từng giây trên máy
  // (server chỉ lưu định kỳ) để % tiến độ nhích lên ngay khi đang xem.
  const watchedRef = useRef(new Set());
  const [liveVideo, setLiveVideo] = useState(null);
  // Giây phát tiếp video — chốt 1 lần khi mở bài (null = chưa tải xong tiến độ).
  const [resumeAt, setResumeAt] = useState(null);

  function applyLearning(data) {
    const v = data?.steps?.video;
    if (v) {
      v.buckets?.forEach((b) => watchedRef.current.add(b));
      setLiveVideo((prev) => ({
        position: prev?.position ?? v.position,
        duration: v.duration || prev?.duration || 0,
        count: watchedRef.current.size,
      }));
    }
    setLearning(data);
  }

  useEffect(() => {
    setLearning(null);
    setLiveVideo(null);
    setResumeAt(null);
    watchedRef.current = new Set();
    if (!isStudent) return;
    attemptService
      .getLearning(lessonId)
      .then((res) => {
        const v = res.data?.steps?.video;
        const pos = v?.position || 0;
        // Đã xem hết (hoặc gần hết) thì mở lại từ đầu.
        setResumeAt(pos >= 3 && (!v.duration || pos < v.duration - 10) ? pos : 0);
        applyLearning(res.data);
      })
      .catch(() => setResumeAt(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, isStudent]);

  const saveLearning = useCallback(
    (patch) => {
      if (!isStudent) return;
      attemptService
        .saveLearning({ lesson: lessonId, ...patch })
        .then((res) => applyLearning(res.data))
        .catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStudent, lessonId]
  );

  // Theo dõi video (YouTube IFrame API) — gắn 1 lần khi đã có dữ liệu tiến độ để phát tiếp đúng chỗ.
  // Học sinh: đợi biết chỗ đang xem dở rồi mới nạp video, để phát tiếp đúng chỗ.
  const videoSrc = isStudent
    ? resumeAt === null
      ? null
      : withStart(withJsApi(review?.videoUrl), resumeAt)
    : withJsApi(review?.videoUrl);
  const learningReady = !!learning;
  useEffect(() => {
    if (!isStudent || !videoSrc || !videoRef.current || !learningReady) return undefined;
    const v = learning?.steps?.video;
    return trackYouTube(videoRef.current, {
      bucketSeconds: v?.bucketSeconds || 10,
      startAt: resumeAt || 0,
      onTick: ({ position, duration, bucket }) => {
        if (bucket !== null && bucket !== undefined) watchedRef.current.add(bucket);
        setLiveVideo({ position, duration, count: watchedRef.current.size });
      },
      onFlush: ({ buckets, position, duration, final }) => {
        if (!buckets.length && !position) return;
        const patch = { videoBuckets: buckets, videoPosition: position, videoDuration: duration };
        if (final) attemptService.saveLearningKeepalive({ lesson: lessonId, ...patch });
        else saveLearning(patch);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent, videoSrc, learningReady, saveLearning]);

  // Gộp số liệu video đang xem (trên máy) vào tiến độ server để hiển thị theo thời gian thực.
  const liveLearning = (() => {
    if (!learning?.steps?.video || !liveVideo) return learning;
    const v = learning.steps.video;
    const bucketSeconds = v.bucketSeconds || 10;
    const duration = liveVideo.duration || v.duration;
    const total = duration ? Math.ceil(duration / bucketSeconds) : 0;
    const ratio = total ? liveVideo.count / total : v.percent / 100;
    const done = v.done || ratio >= 0.9;
    const video = {
      ...v,
      done,
      duration,
      position: liveVideo.position,
      watchedSeconds: Math.min(duration, liveVideo.count * bucketSeconds),
      percent: done ? 100 : Math.min(99, Math.round(ratio * 100)),
    };
    const steps = { ...learning.steps, video };
    const weights = learning.weights || {};
    const keys = Object.keys(steps);
    const wSum = keys.reduce((s, k) => s + (weights[k] || 0), 0);
    const percent = wSum ? Math.round(keys.reduce((s, k) => s + (weights[k] || 0) * steps[k].percent, 0) / wSum) : learning.percent;
    return { ...learning, steps, percent };
  })();

  function scrollTo(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleToggleLessonLike() {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    try {
      const res = await lessonService.toggleLike(lessonId);
      setLesson((prev) => ({ ...prev, likeCount: res.data.likeCount, likedByMe: res.data.likedByMe }));
    } catch {
      // ignore transient like errors
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!user || !commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res = await commentService.create({ lesson: lessonId, text: commentText.trim() });
      setComments((prev) => [res.data, ...prev]);
      setCommentTotal((prev) => prev + 1);
      setCommentText("");
    } catch {
      // ignore transient comment errors
    } finally {
      setPostingComment(false);
    }
  }

  async function handleToggleCommentLike(commentId) {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    try {
      const res = await commentService.toggleLike(commentId);
      setComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, likes: Array(res.data.likeCount).fill(user._id) } : c)));
    } catch {
      // ignore transient like errors
    }
  }

  if (loading && !lesson) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Lock className="h-7 w-7" />
        </span>
        <p className="mt-4 text-body-lg font-semibold text-slate-800">{loadError}</p>
        <p className="mt-1 text-caption text-slate-500">Đăng nhập hoặc đăng ký để tiếp tục học bài này.</p>
        <div className="mt-5 flex gap-3">
          <Link to="/dang-nhap" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary">
            Đăng nhập
          </Link>
          <Link to="/dang-ky" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
            Đăng ký miễn phí
          </Link>
        </div>
      </div>
    );
  }

  const firstPracticeTarget = practiceSets[0]
    ? `/luyen-tap/${practiceSets[0]._id}`
    : legacyQuestionCount > 0
    ? `/bai/${lessonId}/luyen-tap`
    : null;

  const gradeSlug = lesson?.grade?.slug;
  const subjectSlug = lesson?.subject?.slug;
  // Lùi 1 cấp: về đúng chủ đề chứa bài học này trên trang danh sách.
  const backTo =
    gradeSlug && subjectSlug ? `/lop/${gradeSlug}/${subjectSlug}${chapterId ? `?chu-de=${chapterId}` : ""}` : "/";
  const theoryDone = !!learning?.steps?.theory?.done;

  return (
    <div className={cn("transition-opacity", loading && "opacity-60")}>
      {/* ===== Thanh lùi 1 cấp + vị trí hiện tại ===== */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 items-center gap-3 px-4 py-2 sm:px-6">
          <Link
            to={backTo}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" /> Chủ đề
          </Link>
          <p className="min-w-0 flex-1 truncate text-sm text-slate-500">
            {lesson?.subject?.name} · {lesson?.grade?.name}
            {chapter?.title && <span className="font-semibold text-slate-700"> · {chapter.title}</span>}
          </p>
          <IdBadge id={lessonId} label="Bài" />
        </div>
      </div>

      <div className="page pt-4">
          <div className="min-w-0">
            {/* ----- Video: hiện ngay đầu trang ----- */}
            <div id="video" className="mx-auto overflow-hidden rounded-3xl bg-slate-900 shadow-elevation-2" style={{ maxWidth: "calc((100vh - 13rem) * 16 / 9)" }}>
              <div className="aspect-video w-full">
                {review?.videoUrl && !videoSrc ? (
                  <div className="h-full w-full animate-pulse bg-slate-800" />
                ) : review?.videoUrl ? (
                  <iframe
                    key={videoSrc}
                    ref={videoRef}
                    src={videoSrc}
                    title={review.title}
                    className="h-full w-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-primary/10 text-center">
                    <OwlMascot className="h-16 w-16" animated={false} />
                    <p className="text-caption font-semibold text-slate-400">Bài học này chưa có video minh hoạ</p>
                  </div>
                )}
              </div>
            </div>

            {/* ----- Tên bài + hành động ----- */}
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-elevation-1">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-h2 leading-tight text-slate-800">{lesson?.title}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {(lesson?.viewCount || 0).toLocaleString("vi-VN")}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleLessonLike}
                    className={cn("flex items-center gap-1 font-semibold", lesson?.likedByMe ? "text-primary" : "hover:text-primary")}
                  >
                    <ThumbsUp className={cn("h-4 w-4", lesson?.likedByMe && "fill-primary")} /> {(lesson?.likeCount || 0).toLocaleString("vi-VN")}
                  </button>
                </div>
              </div>
              {firstPracticeTarget && (
                <Link
                  to={firstPracticeTarget}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-body font-bold text-white shadow-elevation-2 transition hover:-translate-y-0.5 hover:bg-primary-dark"
                >
                  Luyện tập ngay <ChevronRight className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* ----- Em đã học được bao nhiêu ----- */}
            {isStudent ? (
              learning && (
                <div className="mt-3">
                  <LearningProgress
                    learning={liveLearning}
                    practiceTo={firstPracticeTarget}
                    onGoVideo={() => document.getElementById("video")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    onGoTheory={() => scrollTo(theoryRef)}
                  />
                </div>
              )
            ) : (
              !user && (
                <p className="mt-3 rounded-2xl bg-secondary/5 p-4 text-slate-600 ring-1 ring-secondary/20">
                  <Link to="/dang-nhap" className="font-bold text-secondary hover:underline">
                    Đăng nhập
                  </Link>{" "}
                  để lưu tiến độ học: đã xem video tới đâu, đã làm bao nhiêu câu.
                </p>
              )
            )}

            {/* ----- Kiến thức cần nhớ ----- */}
            {(review?.content || review?.examples?.length > 0) && (
              <div ref={theoryRef} className="mt-3 overflow-hidden rounded-3xl bg-white shadow-elevation-1">
                <div className="flex items-center gap-2 bg-primary/5 px-5 py-2.5">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-body font-bold uppercase tracking-wide text-primary">Kiến thức cần nhớ</span>
                </div>
                <div className="p-5">
                  {review?.imageUrl && !review.imageUrl.startsWith("data:") && (
                    <img src={review.imageUrl} alt="" className="mb-3 max-h-56 rounded-xl object-contain" />
                  )}
                  {review?.content && (
                    <ul className="space-y-1.5">
                      {review.content
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-body-lg leading-relaxed text-slate-700">
                            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary" /> {line.replace(/^[-•]\s*/, "")}
                          </li>
                        ))}
                    </ul>
                  )}
                  {review?.examples?.length > 0 && (
                    <div className={cn(review?.content && "mt-4")}>
                      <div className="flex items-center gap-1.5 text-secondary">
                        <Lightbulb className="h-4 w-4 fill-amber-300 text-amber-500" />
                        <span className="text-body font-semibold uppercase tracking-wide">Ví dụ</span>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {review.examples.map((example, idx) => (
                          <div key={idx} className="flex items-start gap-2 rounded-xl bg-secondary/5 px-3.5 py-2.5 text-body-lg text-slate-700">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-caption font-bold text-secondary">
                              {idx + 1}
                            </span>
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isStudent && (
                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                      {theoryDone ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-2 font-bold text-green-700">
                          <CheckCircle2 className="h-5 w-5" /> Em đã đọc xong phần này
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => saveLearning({ theoryDone: true })}
                          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-bold text-white shadow-elevation-1 hover:bg-primary-dark"
                        >
                          <CheckCircle2 className="h-5 w-5" /> Em đã đọc xong
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ----- Bài luyện tập ----- */}
            <div className="mt-5">
              <h2 className="section-title">
                <Rocket className="h-5 w-5 text-vietnamese" /> Bài luyện tập
              </h2>
              {practiceSets.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {practiceSets.map((set) => {
                    const completed = !!set.lastAttempt;
                    return (
                      <Link
                        key={set._id}
                        to={`/luyen-tap/${set._id}`}
                        className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 transition hover:ring-primary/30"
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white",
                            completed ? "bg-primary" : "bg-vietnamese"
                          )}
                        >
                          {completed ? <CheckCircle2 className="h-5 w-5" /> : <Rocket className="h-5 w-5" />}
                        </span>
                        <div className="flex-1">
                          <p className="font-display text-body-lg font-bold text-slate-800">{set.title}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <span className={cn("rounded-full px-2 py-0.5 font-semibold", LEVEL_COLOR[set.level])}>{LEVEL_LABEL[set.level]}</span>
                            <span>{set.questionCount} câu</span>
                            {set.timeLimitSeconds > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {Math.round(set.timeLimitSeconds / 60)} phút
                              </span>
                            )}
                            {completed && (
                              <span className="font-semibold text-primary">
                                Gần nhất: {set.lastAttempt.score}/{set.lastAttempt.totalQuestions}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-xl px-4 py-2 text-sm font-bold",
                            completed ? "border border-slate-200 text-slate-600" : "bg-primary text-white group-hover:bg-primary-dark"
                          )}
                        >
                          {completed ? (
                            <span className="flex items-center gap-1">
                              <RotateCcw className="h-3.5 w-3.5" /> Làm lại
                            </span>
                          ) : (
                            "Bắt đầu"
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : legacyQuestionCount > 0 ? (
                <Link
                  to={`/bai/${lessonId}/luyen-tap`}
                  className="group mt-2 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 transition hover:ring-primary/30"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vietnamese text-white">
                    <Rocket className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-display font-bold text-slate-800">Luyện tập {lesson?.title}</p>
                    <p className="text-sm text-slate-500">{legacyQuestionCount} câu hỏi · chấm từng câu, tích điểm ngay</p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white group-hover:bg-primary-dark">Bắt đầu</span>
                </Link>
              ) : (
                <p className="mt-2 rounded-2xl bg-white p-4 text-body text-slate-500 shadow-elevation-1">
                  Bài học này chưa có bài luyện tập.
                </p>
              )}
            </div>

            {/* ----- Bình luận ----- */}
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="section-title">
                  <MessageCircleHeart className="h-5 w-5 text-violet-500" /> Bình luận
                </h2>
                <span className="text-caption font-semibold text-slate-400">{commentTotal} bình luận</span>
              </div>

              {user ? (
                <form onSubmit={handleSubmitComment} className="mt-2 flex items-start gap-3 rounded-2xl bg-white p-3 shadow-elevation-1">
                  <UserAvatar user={user} size="h-11 w-11" decoSize="text-xs" />
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Em thấy bài học này thế nào?"
                      rows={2}
                      maxLength={1000}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-body text-slate-700 outline-none focus:border-primary/50"
                    />
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="submit"
                        disabled={!commentText.trim() || postingComment}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" /> Gửi
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="mt-2 rounded-2xl bg-white p-3 text-body text-slate-500 shadow-elevation-1">
                  <Link to="/dang-nhap" className="font-semibold text-primary hover:underline">
                    Đăng nhập
                  </Link>{" "}
                  để bình luận bài học này.
                </p>
              )}

              <div className="mt-3 space-y-2.5">
                {comments.map((c) => (
                  <div key={c._id} className="flex items-start gap-3">
                    <UserAvatar user={c.user} size="h-11 w-11" decoSize="text-xs" />
                    <div className="flex-1 rounded-2xl bg-white p-3 shadow-elevation-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <UserName user={c.user} name={c.user?.fullName || "Học sinh ViToan"} />
                        <p className="text-caption text-slate-400">{c.user?.grade?.name ? `Học sinh ${c.user.grade.name}` : "Học sinh ViToan"}</p>
                      </div>
                      <p className="mt-0.5 text-body text-slate-700">{c.text}</p>
                      <div className="mt-1.5 flex items-center gap-4 text-caption text-slate-400">
                        <span>{timeAgo(c.createdAt)}</span>
                        <button type="button" onClick={() => handleToggleCommentLike(c._id)} className="flex items-center gap-1 font-semibold hover:text-primary">
                          <ThumbsUp className="h-3.5 w-3.5" /> {c.likes?.length || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="rounded-2xl bg-white p-3 text-body text-slate-400 shadow-elevation-1">
                    Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận!
                  </p>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
