import { useEffect, useState } from "react";
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
  ChevronRight,
  MessageCircleHeart,
  Send,
  Home,
  Sparkles,
} from "lucide-react";
import {
  lessonService,
  questionService,
  reviewContentService,
  practiceSetService,
  commentService,
  chapterService,
} from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { avatarUrl } from "../../lib/avatar.js";
import { cn } from "../../lib/utils";

const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const LEVEL_COLOR = {
  easy: "bg-primary/10 text-primary",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-600",
};
const TILE_COLORS = [
  "from-secondary to-blue-600",
  "from-vietnamese to-orange-600",
  "from-primary to-primary-dark",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
];

function SectionIcon({ icon: Icon, className }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-elevation-1",
        className
      )}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
    </span>
  );
}

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

function Avatar({ user, className }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />;
  }
  const initial = user?.fullName?.trim()?.[0]?.toUpperCase() || "?";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary",
        className
      )}
    >
      {initial}
    </span>
  );
}

export default function LessonContentPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [review, setReview] = useState(null);
  const [practiceSets, setPracticeSets] = useState([]);
  const [legacyQuestionCount, setLegacyQuestionCount] = useState(0);
  const [siblingLessons, setSiblingLessons] = useState([]);
  const [chapter, setChapter] = useState(null);
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
        if (lessonRes.data?.chapter) {
          lessonService
            .list({ chapter: lessonRes.data.chapter })
            .then((res) => setSiblingLessons(res.data.filter((l) => l._id !== lessonId)))
            .catch(() => {});
          chapterService
            .list({ subject: lessonRes.data.subject?._id, grade: lessonRes.data.grade?._id })
            .then((res) => setChapter(res.data.find((c) => c._id === lessonRes.data.chapter) || null))
            .catch(() => {});
        }
      })
      .catch((err) => {
        setLoadError(err.apiMessage || "Không thể tải bài học");
        setLoading(false);
      });
  }, [lessonId]);

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
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, likes: Array(res.data.likeCount).fill(user._id) } : c))
      );
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
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
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
  const siblingIndex = siblingLessons.findIndex((l) => l._id === lessonId);
  const totalInChapter = siblingLessons.length + 1;
  const currentPosition = lesson?.order ?? siblingIndex + 1;

  return (
    <div className={cn("bg-slate-50 transition-opacity", loading && "opacity-60")}>
      {/* ===== Breadcrumb: orient the student within grade > subject > chapter ===== */}
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-6 pt-4 text-body text-slate-500 xl:px-10">
        <Link to="/" className="flex items-center gap-1.5 hover:text-primary">
          <Home className="h-4 w-4" /> Trang chủ
        </Link>
        {gradeSlug && subjectSlug && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <Link to={`/lop/${gradeSlug}/${subjectSlug}`} className="hover:text-primary">
              {lesson?.subject?.name} {lesson?.grade?.name}
            </Link>
          </>
        )}
        {chapter?.title && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="max-w-[320px] truncate font-semibold text-slate-700">{chapter.title}</span>
          </>
        )}
      </div>

      <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-3 xl:px-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ===== Main column ===== */}
          <div className="lg:col-span-2">
            {/* ----- Video card ----- */}
            <div className="overflow-hidden rounded-3xl bg-slate-900 shadow-elevation-2">
              <div className="aspect-video w-full">
                {review?.videoUrl ? (
                  <iframe src={review.videoUrl} title={review.title} className="h-full w-full" allowFullScreen />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-primary/10 text-center">
                    <OwlMascot className="h-16 w-16" animated={false} />
                    <p className="text-caption font-semibold text-slate-400">Bài học này chưa có video minh hoạ</p>
                  </div>
                )}
              </div>
            </div>

            {/* ----- Title card ----- */}
            <div className="mt-5 rounded-3xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-body font-bold text-primary">
                  {lesson?.grade?.name}
                </span>
                {totalInChapter > 1 && (
                  <span className="inline-flex items-center rounded-full bg-secondary/10 px-3.5 py-1.5 text-body font-bold text-secondary">
                    Bài {currentPosition}
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-display text-h1 text-slate-800">{lesson?.title}</h1>
              {lesson?.description && <p className="mt-2 text-body-lg text-slate-500">{lesson.description}</p>}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-body font-semibold text-slate-500">
                  <Eye className="h-4 w-4 text-primary" /> {(lesson?.viewCount || 0).toLocaleString("vi-VN")}
                </span>
                <button
                  type="button"
                  onClick={handleToggleLessonLike}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body font-semibold transition",
                    lesson?.likedByMe ? "bg-primary/10 text-primary" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <ThumbsUp className={cn("h-4 w-4", lesson?.likedByMe && "fill-primary")} /> {(lesson?.likeCount || 0).toLocaleString("vi-VN")}
                </button>
                {firstPracticeTarget && (
                  <Link
                    to={firstPracticeTarget}
                    className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-body font-bold text-white shadow-elevation-2 transition hover:-translate-y-0.5 hover:bg-primary-dark"
                  >
                    Thực hành ngay <ChevronRight className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>

            {/* ----- Theory content card ----- */}
            {(review?.content || review?.examples?.length > 0) && (
              <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-elevation-1 ring-1 ring-slate-100">
                <div className="flex items-center gap-2.5 bg-primary/5 px-6 py-3.5">
                  <SectionIcon icon={BookOpen} className="h-7 w-7 from-primary to-primary-dark" />
                  <span className="text-body font-bold uppercase tracking-wide text-primary">Kiến thức cần nhớ</span>
                </div>
                <div className="p-6 sm:p-8">
                  {review?.content && (
                    <p className="whitespace-pre-wrap text-body-lg leading-relaxed text-slate-700">{review.content}</p>
                  )}
                  {review?.examples?.length > 0 && (
                    <div className={cn(review?.content && "mt-5")}>
                      <div className="flex items-center gap-1.5 text-secondary">
                        <Lightbulb className="h-4 w-4 fill-amber-300 text-amber-500" />
                        <span className="text-body font-semibold uppercase tracking-wide">Ví dụ minh họa</span>
                      </div>
                      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                        {review.examples.map((example, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 rounded-xl bg-secondary/5 px-3.5 py-2.5 text-body-lg text-slate-700"
                          >
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-caption font-bold text-secondary">
                              {idx + 1}
                            </span>
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== Practice sets ===== */}
            <div className="mt-8">
              <h2 className="flex items-center gap-2.5 font-display text-h3 text-slate-800">
                <SectionIcon icon={Rocket} className="from-vietnamese to-orange-600" /> Bài luyện tập
              </h2>

              {practiceSets.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {practiceSets.map((set, idx) => {
                    const completed = !!set.lastAttempt;
                    return (
                      <Link
                        key={set._id}
                        to={`/luyen-tap/${set._id}`}
                        className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
                      >
                        <span
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-elevation-1",
                            completed ? "bg-gradient-to-br from-primary to-primary-dark" : `bg-gradient-to-br ${TILE_COLORS[idx % TILE_COLORS.length]}`
                          )}
                        >
                          {completed ? <CheckCircle2 className="h-6 w-6" /> : <Rocket className="h-6 w-6" />}
                        </span>
                        <div className="flex-1">
                          <p className="font-display text-body-lg font-bold text-slate-800">{set.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-body text-slate-500">
                            <span className={cn("rounded-full px-2 py-0.5 font-semibold", LEVEL_COLOR[set.level])}>
                              {LEVEL_LABEL[set.level]}
                            </span>
                            <span>{set.questionCount} câu</span>
                            {set.timeLimitSeconds > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {Math.round(set.timeLimitSeconds / 60)} phút
                              </span>
                            )}
                            {completed && (
                              <span className="font-semibold text-primary">
                                Điểm gần nhất: {set.lastAttempt.score}/{set.lastAttempt.totalQuestions}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition",
                            completed
                              ? "border border-slate-200 text-slate-600 group-hover:border-primary/40 group-hover:text-primary"
                              : "bg-primary text-white group-hover:bg-primary-dark"
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
                  className="group mt-3 flex items-center gap-4 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-vietnamese to-orange-600 text-white shadow-elevation-1">
                    <Rocket className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="font-display font-bold text-slate-800">Luyện tập</p>
                    <p className="text-caption text-slate-500">{legacyQuestionCount} câu hỏi</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white group-hover:bg-primary-dark">
                    Bắt đầu
                  </span>
                </Link>
              ) : (
                <p className="mt-3 rounded-2xl bg-white p-4 text-body text-slate-500 shadow-elevation-1 ring-1 ring-slate-100">
                  Bài học này chưa có bài luyện tập.
                </p>
              )}
            </div>

            {/* ===== Comments ===== */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2.5 font-display text-h3 text-slate-800">
                  <SectionIcon icon={MessageCircleHeart} className="from-violet-500 to-purple-600" /> Bình luận &amp; Đánh giá
                </h2>
                <span className="text-caption font-semibold text-slate-400">{commentTotal} bình luận</span>
              </div>

              {user ? (
                <form
                  onSubmit={handleSubmitComment}
                  className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100"
                >
                  <Avatar user={user} className="h-9 w-9 text-sm" />
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Em thấy bài học này thế nào?"
                      rows={2}
                      maxLength={1000}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-body text-slate-700 outline-none focus:border-primary/50"
                    />
                    <div className="mt-2 flex justify-end">
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
                <p className="mt-4 rounded-2xl bg-white p-4 text-body text-slate-500 shadow-elevation-1 ring-1 ring-slate-100">
                  <Link to="/dang-nhap" className="font-semibold text-primary hover:underline">
                    Đăng nhập
                  </Link>{" "}
                  để bình luận và đánh giá bài học này.
                </p>
              )}

              <div className="mt-4 space-y-3">
                {comments.map((c) => (
                  <div key={c._id} className="flex items-start gap-3">
                    <Avatar user={c.user} className="h-9 w-9 text-sm" />
                    <div className="flex-1 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="font-display font-bold text-slate-800">{c.user?.fullName || "Học sinh ViToan"}</p>
                        <p className="text-caption text-slate-400">
                          {c.user?.grade?.name ? `Học sinh ${c.user.grade.name}` : "Học sinh ViToan"}
                        </p>
                      </div>
                      <p className="mt-1 text-body text-slate-700">{c.text}</p>
                      <div className="mt-2 flex items-center gap-4 text-caption text-slate-400">
                        <span>{timeAgo(c.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCommentLike(c._id)}
                          className="flex items-center gap-1 font-semibold hover:text-primary"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" /> {c.likes?.length || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="rounded-2xl bg-white p-4 text-body text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">
                    Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ===== Sidebar: sibling lessons in the same topic ===== */}
          <div>
            <div className="rounded-3xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100 lg:sticky lg:top-20">
              <h2 className="px-1 font-display text-h3 text-slate-800">Danh sách bài giảng lý thuyết</h2>
              <p className="truncate px-1 text-body text-slate-400">{chapter?.title || "của chủ điểm này"}</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-3 ring-1 ring-primary/20">
                  <span className="relative shrink-0">
                    <img
                      src={avatarUrl(lesson?._id, 0)}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover shadow-elevation-1"
                      loading="lazy"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white">
                      <Sparkles className="h-3 w-3" />
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-body-lg font-display font-bold text-primary">{lesson?.title}</p>
                    <p className="flex items-center gap-1 text-body text-slate-500">
                      <Eye className="h-4 w-4" /> {(lesson?.viewCount || 0).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                {siblingLessons.map((l, idx) => (
                  <Link
                    key={l._id}
                    to={`/bai/${l._id}`}
                    className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"
                  >
                    <img
                      src={avatarUrl(l._id, idx + 1)}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-full object-cover shadow-elevation-1"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-body-lg font-display font-bold text-slate-800">{l.title}</p>
                      <p className="flex items-center gap-1 text-body text-slate-500">
                        <Eye className="h-4 w-4" /> {(l.viewCount || 0).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </Link>
                ))}
                {siblingLessons.length === 0 && (
                  <p className="px-1 text-body text-slate-400">Đây là bài duy nhất trong chủ điểm này.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
