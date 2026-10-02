/* eslint-disable react-refresh/only-export-components */
// Bộ icon của ViToan — thay cho icon nét mảnh của lucide-react ở các trang học sinh.
// • Icon MANG Ý NGHĨA (sách, cúp, quà, lửa, mục tiêu…) → hình 3D Fluent Emoji (xem lib/icons3d.jsx),
//   giữ nguyên tên như lucide nên chỉ cần đổi dòng import: from "…/components/ui/icons.jsx".
// • Icon ĐIỀU KHIỂN (×, mũi tên, tìm kiếm, mắt, thùng rác, +…) vẫn là lucide — đúng chuẩn giao diện, dễ bấm.
import { icon3d } from "../../lib/icons3d.jsx";

export * from "lucide-react";

// Icon 3D nhận cùng props với lucide (className, style…); bỏ qua strokeWidth/fill.
// Lớp "fill-white/…" (sao rỗng ở trang kết quả) → hiện mờ xám để vẫn phân biệt được trạng thái.
function make3D(key, displayName) {
  function Icon3D({ className = "", style, title, "aria-label": ariaLabel }) {
    const dim = /\bfill-white\/|\btext-white\/\d/.test(className);
    return (
      <img
        src={icon3d(key)}
        alt={ariaLabel || title || ""}
        title={title}
        draggable={false}
        className={`inline-block shrink-0 select-none object-contain align-middle ${className} ${dim ? "opacity-40 grayscale" : ""}`}
        style={style}
      />
    );
  }
  Icon3D.displayName = displayName;
  return Icon3D;
}

// Học tập
export const BookOpen = make3D("openBook", "BookOpen");
export const BookOpenText = make3D("openBook", "BookOpenText");
export const BookMarked = make3D("books", "BookMarked");
export const PenLine = make3D("writing", "PenLine");
export const ClipboardCheck = make3D("clipboard", "ClipboardCheck");
export const ListChecks = make3D("notepad", "ListChecks");
export const Divide = make3D("numbers", "Divide");
export const PlayCircle = make3D("video", "PlayCircle");
export const Lightbulb = make3D("bulb", "Lightbulb");
export const Dumbbell = make3D("muscle", "Dumbbell");
export const Newspaper = make3D("newspaper", "Newspaper");
export const Compass = make3D("compass", "Compass");

// Thành tích, thưởng
export const Trophy = make3D("trophy", "Trophy");
export const Medal = make3D("medal", "Medal");
export const Award = make3D("goldMedal", "Award");
export const Crown = make3D("crown", "Crown");
export const Star = make3D("star", "Star");
export const Sparkles = make3D("sparkles", "Sparkles");
export const Gift = make3D("gift", "Gift");
export const Gem = make3D("gem", "Gem");
export const Flame = make3D("fire", "Flame");
export const Target = make3D("target", "Target");
export const Store = make3D("shop", "Store");
export const Shirt = make3D("shirt", "Shirt");

// Trạng thái
export const CheckCircle2 = make3D("check", "CheckCircle2");
export const XCircle = make3D("cross", "XCircle");
export const AlertCircle = make3D("warning", "AlertCircle");
export const AlertTriangle = make3D("warning", "AlertTriangle");
export const Info = make3D("info", "Info");
export const HelpCircle = make3D("question", "HelpCircle");
export const Inbox = make3D("inbox", "Inbox");
export const PackageX = make3D("package", "PackageX");
export const ThumbsUp = make3D("thumbsUp", "ThumbsUp");
export const ThumbsDown = make3D("thumbsDown", "ThumbsDown");
export const Ear = make3D("ear", "Ear");

// Thống kê, thời gian
export const BarChart3 = make3D("chart", "BarChart3");
export const Activity = make3D("chartUp", "Activity");
export const Percent = make3D("chartUp", "Percent");
export const Clock = make3D("clock", "Clock");
export const Timer = make3D("hourglassRun", "Timer");
export const History = make3D("scroll", "History");
export const CalendarDays = make3D("calendar", "CalendarDays");
export const Sun = make3D("sun", "Sun");

// Người dùng, liên lạc
export const User = make3D("user", "User");
export const Users = make3D("users", "Users");
export const Bot = make3D("robot", "Bot");
export const Smile = make3D("smile", "Smile");
export const KeyRound = make3D("key", "KeyRound");
export const Lock = make3D("lock", "Lock");
export const ShieldCheck = make3D("shield", "ShieldCheck");
export const Mail = make3D("mail", "Mail");
export const MapPin = make3D("pin", "MapPin");
export const MessageCircle = make3D("chat", "MessageCircle");
export const MessageSquareQuote = make3D("chat", "MessageSquareQuote");
export const Home = make3D("house", "Home");
export const Camera = make3D("camera", "Camera");

// Thiết bị
export const Monitor = make3D("desktop", "Monitor");
export const Smartphone = make3D("phone", "Smartphone");
export const Tablet = make3D("phone", "Tablet");

// Trang trí theo lớp (menu chọn lớp)
export const Sprout = make3D("seedling", "Sprout");
export const CloudSun = make3D("sunCloud", "CloudSun");
export const PartyPopper = make3D("party", "PartyPopper");
export const Rocket = make3D("rocket", "Rocket");
