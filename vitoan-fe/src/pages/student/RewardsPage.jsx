import { useEffect, useState } from "react";
import { Gift, Gem, Star, Sparkles, Medal, Smile, Crown, CheckCircle2, PackageX } from "lucide-react";
import { rewardService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import { cn } from "../../lib/utils";

const ICONS = { star: Star, sparkles: Sparkles, medal: Medal, smile: Smile, crown: Crown, gift: Gift };

function RewardCard({ reward, points, onRedeem, redeeming }) {
  const Icon = ICONS[reward.icon] || Gift;
  const outOfStock = reward.stock === 0;
  const affordable = points >= reward.costPoints;

  return (
    <div className="flex flex-col items-center rounded-3xl bg-white p-5 text-center shadow-elevation-1 ring-1 ring-slate-100">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-vietnamese to-orange-600 text-white shadow-elevation-1">
        <Icon className="h-8 w-8" />
      </span>
      <p className="mt-3 font-display font-bold text-slate-800">{reward.name}</p>
      <p className="mt-1 text-caption text-slate-500">{reward.description}</p>
      <span className="mt-3 flex items-center gap-1 rounded-full bg-vietnamese/10 px-3 py-1 text-sm font-bold text-vietnamese">
        <Gem className="h-4 w-4" /> {reward.costPoints}
      </span>
      {reward.stock >= 0 && (
        <p className="mt-1 text-caption text-slate-400">Còn {reward.stock} suất</p>
      )}
      <Button
        disabled={outOfStock || !affordable || redeeming}
        onClick={() => onRedeem(reward)}
        className="mt-4 w-full justify-center rounded-xl"
      >
        {redeeming ? (
          "Đang đổi..."
        ) : outOfStock ? (
          <>
            <PackageX className="h-4 w-4" /> Đã hết
          </>
        ) : !affordable ? (
          "Chưa đủ điểm"
        ) : (
          "Đổi quà"
        )}
      </Button>
    </div>
  );
}

export default function RewardsPage() {
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    return Promise.all([rewardService.list(), rewardService.myRedemptions()]).then(([rewardsRes, redemptionsRes]) => {
      setRewards(rewardsRes.data);
      setRedemptions(redemptionsRes.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRedeem(reward) {
    setError("");
    setMessage("");
    setRedeemingId(reward._id);
    try {
      await rewardService.redeem(reward._id);
      setMessage(`Đổi "${reward.name}" thành công! 🎉`);
      await Promise.all([load(), refreshUser()]);
    } catch (err) {
      setError(err.apiMessage || "Không thể đổi quà lúc này");
    } finally {
      setRedeemingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500 p-8 text-center text-white shadow-elevation-3">
          <div className="animate-blob-float absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div
            className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10"
            style={{ animation: "blob-float 7s ease-in-out infinite reverse" }}
          />
          <div className="relative flex flex-col items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Gift className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-caption font-semibold uppercase tracking-wide text-white/80">Đổi quà</p>
            <p className="mt-1 flex items-center gap-2 font-display text-h1 leading-none">
              <Gem className="h-8 w-8" /> {user?.points ?? 0}
            </p>
            <p className="mt-2 text-body text-white/85">điểm thưởng hiện có</p>
          </div>
        </div>

        {message && (
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-center text-sm font-bold text-primary">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-600">{error}</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rewards.map((reward) => (
            <RewardCard
              key={reward._id}
              reward={reward}
              points={user?.points ?? 0}
              onRedeem={handleRedeem}
              redeeming={redeemingId === reward._id}
            />
          ))}
        </div>

        {redemptions.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-h3 text-slate-800">Lịch sử đổi quà</h2>
            <div className="mt-3 space-y-2.5">
              {redemptions.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100"
                >
                  <div>
                    <p className="font-display font-bold text-slate-800">{r.reward?.name || "Phần quà"}</p>
                    <p className="text-caption text-slate-500">{new Date(r.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <span className={cn("flex items-center gap-1 rounded-full bg-vietnamese/10 px-3 py-1 text-sm font-bold text-vietnamese")}>
                    <Gem className="h-3.5 w-3.5" /> -{r.pointsSpent}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
