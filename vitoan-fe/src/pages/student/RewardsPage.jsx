import { useEffect, useState } from "react";
import { Gift, Gem, CheckCircle2, PackageX, Crown, Shirt, Store, History, Sparkles } from "../../components/ui/icons.jsx";
import { rewardService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import UserAvatar, { isVip } from "../../components/common/UserAvatar.jsx";
import UserName, { TitleChip } from "../../components/common/UserName.jsx";
import { cn } from "../../lib/utils";
import PageHeader, { HeaderStat } from "../../components/ui/PageHeader.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

const CATEGORIES = [
  { type: "frame", label: "Khung avatar", hint: "Viền trang trí quanh ảnh đại diện" },
  { type: "avatar", label: "Ảnh đại diện", hint: "Nhân vật hoạt hình theo tên của em" },
  { type: "title", label: "Danh hiệu", hint: "Hiện cạnh tên ở bình luận, bảng xếp hạng" },
  { type: "name_color", label: "Màu tên", hint: "Tên của em nổi bật hơn" },
  { type: "vip", label: "VIP", hint: "Vương miện và nhãn VIP có thời hạn" },
  { type: "other", label: "Quà khác", hint: "" },
];

function dicebear(style, user) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(user?.username || "vitoan")}`;
}

// Xem trước món quà ngay trên avatar/tên của chính em.
function RewardPreview({ reward, user }) {
  if (reward.type === "frame") {
    return <UserAvatar user={user} frame={reward.value} size="h-20 w-20" decoSize="text-xl" showVip={false} />;
  }
  if (reward.type === "avatar") {
    return <UserAvatar user={user} src={dicebear(reward.value, user)} size="h-20 w-20" decoSize="text-xl" showVip={false} />;
  }
  if (reward.type === "title") {
    return (
      <div className="flex h-20 items-center">
        <TitleChip title={reward.value} className="px-3 py-1 text-sm" />
      </div>
    );
  }
  if (reward.type === "name_color") {
    return (
      <div className="flex h-20 items-center">
        <UserName user={user} color={reward.value} title="" showVip={false} className="text-xl" />
      </div>
    );
  }
  if (reward.type === "vip") {
    return (
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-elevation-1">
        <Crown className="h-10 w-10" />
      </span>
    );
  }
  return (
    <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-vietnamese to-orange-600 text-white shadow-elevation-1">
      <Gift className="h-9 w-9" />
    </span>
  );
}

function isEquipped(reward, user) {
  if (reward.type === "frame") return user?.equippedFrame === reward.value;
  if (reward.type === "title") return user?.equippedTitle === reward.value;
  if (reward.type === "name_color") return user?.nameColor === reward.value;
  if (reward.type === "avatar") return !!user?.avatarUrl?.includes(`/9.x/${reward.value}/`);
  return false;
}

function ShopCard({ reward, user, onRedeem, onEquip, busy }) {
  const outOfStock = reward.stock === 0;
  const affordable = (user?.points ?? 0) >= reward.costPoints;
  const equipped = reward.owned && isEquipped(reward, user);

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl bg-white p-4 text-center shadow-elevation-1 ring-1",
        equipped ? "ring-2 ring-primary" : "ring-slate-100"
      )}
    >
      <RewardPreview reward={reward} user={user} />
      <p className="mt-3 font-display text-lg font-bold leading-snug text-slate-800">{reward.name}</p>
      <p className="mt-1 flex-1 text-sm text-slate-500">{reward.description}</p>
      {!reward.owned && (
        <span className="my-3 flex items-center gap-1 rounded-full bg-vietnamese/10 px-3 py-1 text-base font-bold text-vietnamese">
          <Gem className="h-4 w-4" /> {reward.costPoints}
        </span>
      )}
      {reward.owned ? (
        equipped ? (
          <span className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 font-bold text-primary">
            <CheckCircle2 className="h-5 w-5" /> Đang dùng
          </span>
        ) : (
          <Button disabled={busy} onClick={() => onEquip(reward)} className="mt-3 w-full justify-center rounded-xl bg-secondary hover:bg-secondary-dark">
            <Shirt className="h-4 w-4" /> Đã có · Dùng ngay
          </Button>
        )
      ) : (
        <Button
          disabled={outOfStock || !affordable || busy}
          onClick={() => onRedeem(reward)}
          className="mt-auto w-full justify-center rounded-xl"
        >
          {busy ? (
            "Đang đổi..."
          ) : outOfStock ? (
            <>
              <PackageX className="h-4 w-4" /> Đã hết
            </>
          ) : !affordable ? (
            `Còn thiếu ${reward.costPoints - (user?.points ?? 0)} điểm`
          ) : (
            "Đổi quà"
          )}
        </Button>
      )}
    </div>
  );
}

export default function RewardsPage() {
  const dialog = useDialog();
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [tab, setTab] = useState("shop");
  const [category, setCategory] = useState("frame");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    return Promise.all([rewardService.list(), rewardService.myRedemptions()]).then(([rewardsRes, redemptionsRes]) => {
      setRewards(rewardsRes.data);
      setRedemptions(redemptionsRes.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function flash(msg) {
    setError("");
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleRedeem(reward) {
    if (!(await dialog.confirm({ message: `Đổi "${reward.name}" với ${reward.costPoints} điểm?`, confirmText: "Đổi quà" }))) return;
    setError("");
    setBusyId(reward._id);
    try {
      await rewardService.redeem(reward._id);
      await Promise.all([load(), refreshUser()]);
      flash(
        reward.type === "vip"
          ? "Em đã là thành viên VIP! 👑"
          : ["frame", "avatar", "title", "name_color"].includes(reward.type)
          ? `Đổi "${reward.name}" thành công và đã dùng luôn! 🎉`
          : `Đổi "${reward.name}" thành công! 🎉`
      );
    } catch (err) {
      setError(err.apiMessage || "Không thể đổi quà lúc này");
    } finally {
      setBusyId(null);
    }
  }

  async function handleEquip(reward, type) {
    setError("");
    setBusyId(reward?._id || type);
    try {
      await rewardService.equip(type || reward.type, reward?._id);
      await Promise.all([load(), refreshUser()]);
      flash(reward ? `Đã dùng "${reward.name}"` : "Đã bỏ về mặc định");
    } catch (err) {
      setError(err.apiMessage || "Không thể thay đổi lúc này");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const owned = rewards.filter((r) => r.owned);
  const visibleCategories = CATEGORIES.filter((c) => rewards.some((r) => (r.type || "other") === c.type));
  const shopItems = rewards.filter((r) => (r.type || "other") === category);
  const vipActive = isVip(user);

  return (
    <div className="min-h-screen">
      <div className="page">
        <PageHeader
          icon={Gift}
          tone="pink"
          title="Đổi quà"
          subtitle="Dùng điểm thưởng để trang trí avatar, đổi danh hiệu và màu tên"
          right={<HeaderStat icon={Gem} value={user?.points ?? 0} label="điểm thưởng" />}
        />

        {/* Góc của em: xem ngay diện mạo hiện tại */}
        <div className="mt-5 flex flex-wrap items-center gap-5 rounded-3xl bg-white p-5 shadow-elevation-1">
          <UserAvatar user={user} size="h-24 w-24" decoSize="text-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Diện mạo của em</p>
            <div className="mt-1">
              <UserName user={user} className="text-2xl" />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {vipActive
                ? `VIP đến ${new Date(user.vipUntil).toLocaleDateString("vi-VN")}`
                : "Đổi khung, ảnh đại diện, danh hiệu để diện mạo thật nổi bật nhé!"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "shop", label: "Cửa hàng", Icon: Store },
              { key: "wardrobe", label: `Tủ đồ (${owned.length})`, Icon: Shirt },
              { key: "history", label: "Lịch sử", Icon: History },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn("pill", tab === t.key && "pill-active")}
              >
                <t.Icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-center font-bold text-primary">
            <Sparkles className="h-5 w-5" /> {message}
          </p>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-center font-semibold text-red-600">{error}</p>}

        {tab === "shop" && (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {visibleCategories.map((c) => (
                <button
                  key={c.type}
                  type="button"
                  onClick={() => setCategory(c.type)}
                  className={cn("pill", category === c.type && "pill-active")}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500">{CATEGORIES.find((c) => c.type === category)?.hint}</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {shopItems.map((reward) => (
                <ShopCard
                  key={reward._id}
                  reward={reward}
                  user={user}
                  onRedeem={handleRedeem}
                  onEquip={(r) => handleEquip(r)}
                  busy={busyId === reward._id}
                />
              ))}
            </div>
          </>
        )}

        {tab === "wardrobe" && (
          <div className="mt-5 space-y-5">
            {owned.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center shadow-elevation-1">
                <Shirt className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-slate-500">Tủ đồ còn trống. Vào Cửa hàng đổi món đầu tiên nhé!</p>
                <Button onClick={() => setTab("shop")} className="mt-4 rounded-xl">
                  <Store className="h-4 w-4" /> Tới cửa hàng
                </Button>
              </div>
            )}
            {CATEGORIES.filter((c) => ["frame", "avatar", "title", "name_color"].includes(c.type)).map((c) => {
              const items = owned.filter((r) => r.type === c.type);
              if (items.length === 0) return null;
              const noneActive = !items.some((r) => isEquipped(r, user));
              return (
                <section key={c.type} className="rounded-3xl bg-white p-5 shadow-elevation-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="section-title">{c.label}</h2>
                    <button
                      type="button"
                      disabled={noneActive || busyId === c.type}
                      onClick={() => handleEquip(null, c.type)}
                      className="rounded-full px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      {c.type === "avatar" ? "Dùng ảnh mặc định" : "Bỏ, dùng mặc định"}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {items.map((r) => {
                      const active = isEquipped(r, user);
                      return (
                        <button
                          key={r._id}
                          type="button"
                          disabled={active || busyId === r._id}
                          onClick={() => handleEquip(r)}
                          className={cn(
                            "flex w-40 flex-col items-center gap-2 rounded-2xl p-3 text-center transition",
                            active ? "bg-primary/10 ring-2 ring-primary" : "bg-slate-50 ring-1 ring-slate-100 hover:bg-slate-100"
                          )}
                        >
                          <RewardPreview reward={r} user={user} />
                          <span className="text-sm font-bold text-slate-700">{r.name}</span>
                          <span className={cn("text-sm font-bold", active ? "text-primary" : "text-secondary")}>
                            {active ? "✓ Đang dùng" : "Bấm để dùng"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {tab === "history" && (
          <section className="mt-5">
            {redemptions.length === 0 ? (
              <p className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-elevation-1">
                Em chưa đổi món quà nào.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {redemptions.map((r) => (
                  <div key={r._id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-elevation-1">
                    <div>
                      <p className="font-display font-bold text-slate-800">{r.reward?.name || "Phần quà"}</p>
                      <p className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-vietnamese/10 px-3 py-1 font-bold text-vietnamese">
                      <Gem className="h-4 w-4" /> -{r.pointsSpent}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
