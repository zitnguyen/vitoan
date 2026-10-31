import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { Img3D } from "../../lib/icons3d.jsx";
import { cn } from "../../lib/utils";

const GOALS = [
  { n: 3, label: "Nhẹ nhàng", hint: "3 bài mỗi ngày · khoảng 10 phút" },
  { n: 5, label: "Đều đặn", hint: "5 bài mỗi ngày · khoảng 20 phút" },
  { n: 10, label: "Thử thách", hint: "10 bài mỗi ngày · cho bạn nhỏ siêng năng" },
];
const FEATURES = [
  { icon: "books", title: "Học & luyện tập", text: "Video, kiến thức cần nhớ và bài luyện tập chấm từng câu." },
  { icon: "brain", title: "Ôn câu hay sai", text: "ViToan nhắc em ôn đúng những câu đã sai để nhớ chắc." },
  { icon: "game", title: "Đấu trường", text: "Thi đấu với bạn cùng lớp, lên hạng Đồng → Kim cương." },
  { icon: "gift", title: "Đổi quà", text: "Điểm thưởng đổi khung ảnh, danh hiệu, màu tên." },
];

// Màn chào mừng lần đầu: giới thiệu, chọn mục tiêu mỗi ngày, điểm qua các tính năng chính.
export default function OnboardingModal() {
  const { user, updatePreferences } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(user.dailyGoal || 3);
  const [saving, setSaving] = useState(false);
  const firstName = user.fullName?.split(" ").pop() || user.username;

  async function finish() {
    setSaving(true);
    try {
      await updatePreferences({ dailyGoal: goal, onboarded: true });
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Chào mừng em đến ViToan">
      <div className="w-full max-w-lg overflow-clip rounded-[2rem] bg-white shadow-[0_30px_80px_-20px_rgba(11,35,64,0.6)]">
        <div className="relative bg-gradient-to-br from-sky-100 via-violet-100 to-pink-100 px-6 pb-4 pt-6 text-center">
          <OwlMascot className="mx-auto h-24 w-24" />
          <div className="mt-2 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-8 bg-primary" : "w-2 bg-slate-300")} />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          {step === 0 && (
            <div className="text-center">
              <p className="font-display text-3xl font-black text-slate-800">Chào {firstName}! 👋</p>
              <p className="mt-2 text-lg font-semibold text-slate-600">Mình là cú ViToan. Mình sẽ đồng hành cùng em học Toán và Tiếng Việt mỗi ngày thật vui!</p>
              <button type="button" onClick={() => setStep(1)} className="mt-6 w-full rounded-full bg-primary py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5">
                Bắt đầu thôi
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-center font-display text-2xl font-black text-slate-800">Mỗi ngày em muốn học bao nhiêu?</p>
              <p className="mt-1 text-center font-semibold text-slate-500">Em có thể đổi lại bất cứ lúc nào ở trang chủ.</p>
              <div className="mt-4 space-y-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.n}
                    type="button"
                    onClick={() => setGoal(g.n)}
                    className={cn("flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left ring-2 transition", goal === g.n ? "bg-primary/10 ring-primary" : "bg-white ring-slate-200 hover:ring-sky-300")}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white font-display text-2xl font-black text-primary shadow">{g.n}</span>
                    <span>
                      <span className="block font-display text-lg font-black text-slate-800">{g.label}</span>
                      <span className="block text-sm font-semibold text-slate-500">{g.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep(2)} className="mt-5 w-full rounded-full bg-primary py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5">
                Tiếp tục
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-center font-display text-2xl font-black text-slate-800">Em sẽ làm được gì ở ViToan?</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {FEATURES.map((f) => (
                  <div key={f.title} className="rounded-2xl bg-slate-50 p-3 text-center">
                    <Img3D name={f.icon} className="mx-auto h-12 w-12" />
                    <p className="mt-1 font-display font-black text-slate-800">{f.title}</p>
                    <p className="text-sm font-semibold text-slate-500">{f.text}</p>
                  </div>
                ))}
              </div>
              <button type="button" disabled={saving} onClick={finish} className="mt-5 w-full rounded-full bg-primary py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5 disabled:opacity-60">
                {saving ? "Đang lưu..." : "Vào học ngay!"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
