import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Lock, X, MapPin } from "lucide-react";
import { Gift, Gem, Shirt, Store, History } from "../../components/ui/icons.jsx";
import { rewardService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import UserAvatar, { isVip } from "../../components/common/UserAvatar.jsx";
import UserName from "../../components/common/UserName.jsx";
import { cn } from "../../lib/utils";
import PageHeader, { HeaderStat } from "../../components/ui/PageHeader.jsx";
import { useDialog } from "../../context/DialogContext.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

// Cửa hàng đổi quà: chọn 1 món để "thử" ngay trên Phòng thử đồ (xem em sẽ hiện thế nào ở menu,
// bảng xếp hạng, bình luận) rồi mới đổi. Độ hiếm tính theo giá để thẻ quà có màu nổi bật.
const CATEGORIES = [
  { type: "frame", label: "Khung avatar", icon: "picture", where: ["Menu", "Xếp hạng", "Bình luận", "Hồ sơ"] },
  { type: "avatar", label: "Ảnh đại diện", icon: "smile", where: ["Menu", "Xếp hạng", "Bình luận", "Hồ sơ"] },
  { type: "title", label: "Danh hiệu", icon: "goldMedal", where: ["Xếp hạng", "Bình luận", "Hồ sơ", "Trang chủ"] },
  { type: "name_color", label: "Màu tên", icon: "palette", where: ["Xếp hạng", "Bình luận", "Hồ sơ", "Trang chủ"] },
  { type: "vip", label: "VIP", icon: "crown", where: ["Mọi nơi có avatar và tên"] },
  { type: "other", label: "Quà khác", icon: "gift", where: [] },
];

const RARITY = [
  { min: 350, label: "Huyền thoại", badge: "bg-gradient-to-r from-amber-400 to-orange-500 text-white", stage: "from-amber-100 via-yellow-50 to-orange-100", ring: "ring-amber-300", glow: "shadow-[0_14px_30px_-14px_rgba(245,158,11,0.75)]" },
  { min: 200, label: "Sử thi", badge: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white", stage: "from-violet-100 via-fuchsia-50 to-pink-100", ring: "ring-violet-200", glow: "shadow-[0_14px_30px_-16px_rgba(139,92,246,0.6)]" },
  { min: 100, label: "Hiếm", badge: "bg-gradient-to-r from-sky-400 to-blue-500 text-white", stage: "from-sky-100 via-cyan-50 to-blue-100", ring: "ring-sky-200", glow: "" },
  { min: 0, label: "Thường", badge: "bg-slate-200 text-slate-600", stage: "from-slate-100 via-white to-slate-100", ring: "ring-slate-100", glow: "" },
];
const rarityOf = (r) => RARITY.find((x) => r.costPoints >= x.min) || RARITY[RARITY.length - 1];

function dicebear(style, user) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(user?.username || "vitoan")}`;
}

// Diện mạo của em khi khoác thêm món quà đang thử
function tryOn(user, reward) {
  if (!reward) return user;
  const u = { ...user };
  if (reward.type === "frame") u.equippedFrame = reward.value;
  else if (reward.type === "avatar") u.avatarUrl = dicebear(reward.value, user);
  else if (reward.type === "title") u.equippedTitle = reward.value;
  else if (reward.type === "name_color") u.nameColor = reward.value;
  else if (reward.type === "vip") u.vipUntil = new Date(Date.now() + 86400000).toISOString();
  return u;
}

function isEquipped(reward, user) {
  if (reward.type === "frame") return user?.equippedFrame === reward.value;
  if (reward.type === "title") return user?.equippedTitle === reward.value;
  if (reward.type === "name_color") return user?.nameColor === reward.value;
  if (reward.type === "avatar") return !!user?.avatarUrl?.includes(`/9.x/${reward.value}/`);
  return false;
}

// Hình xem trước nhỏ trên thẻ quà
function RewardPreview({ reward, user }) {
  if (reward.type === "frame") return <UserAvatar user={user} frame={reward.value} size="h-20 w-20" decoSize="text-xl" showVip={false} />;
  if (reward.type === "avatar") return <UserAvatar user={user} src={dicebear(reward.value, user)} size="h-20 w-20" showVip={false} />;
  if (reward.type === "title") {
    return (
      <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-white px-3 py-1.5 text-sm font-black text-amber-700 shadow-sm ring-1 ring-amber-200">
        🏅 {reward.value}
      </span>
    );
  }
  if (reward.type === "name_color") {
    return (
      <span className="max-w-full truncate rounded-2xl bg-white px-3 py-1.5 shadow-sm">
        <UserName user={user} name={user?.fullName?.split(" ").pop() || "Tên em"} color={reward.value} title="" showVip={false} className="text-2xl" />
      </span>
    );
  }
  if (reward.type === "vip") return <Img3D name="crown" className="h-20 w-20 drop-shadow-[0_10px_14px_rgba(245,158,11,0.45)]" />;
  return <Img3D name="gift" className="h-20 w-20" />;
}

function ShopCard({ reward, user, trying, onTry, onRedeem, onEquip, busy }) {
  const rar = rarityOf(reward);
  const outOfStock = reward.stock === 0;
  const missing = reward.costPoints - (user?.points ?? 0);
  const equipped = reward.owned && isEquipped(reward, user);
  const legendary = rar.label === "Huyền thoại";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTry(reward)}
      onKeyDown={(e) => e.key === "Enter" && onTry(reward)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-clip rounded-3xl bg-white ring-1 transition duration-200 hover:-translate-y-1 active:scale-[0.98]",
        rar.ring,
        rar.glow || "shadow-elevation-1",
        trying && "ring-[3px] ring-primary",
        equipped && !trying && "ring-2 ring-primary/60"
      )}
    >
      <div className={cn("relative flex h-36 items-center justify-center bg-gradient-to-br px-3", rar.stage)}>
        {legendary && <span aria-hidden className="reward-shine absolute inset-0" />}
        <span className={cn("absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wide", rar.badge)}>{rar.label}</span>
        {reward.owned && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-black text-primary shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3.5} /> {equipped ? "Đang dùng" : "Đã có"}
          </span>
        )}
        <div className="relative transition duration-300 group-hover:scale-110">
          <RewardPreview reward={reward} user={user} />
        </div>
        {trying && <span className="absolute bottom-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-black text-white">Đang thử</span>}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-display text-base font-black leading-snug text-[#0b2340]">{reward.name}</p>
        {reward.description && <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{reward.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {reward.owned ? (
            <span className="text-sm font-bold text-slate-400">Của em rồi</span>
          ) : (
            <span className="flex items-center gap-1 font-display text-lg font-black text-sky-600">
              <Gem className="h-5 w-5" /> {reward.costPoints}
            </span>
          )}
          {reward.owned ? (
            equipped ? (
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-black text-primary">✓ Đang dùng</span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  onEquip(reward);
                }}
                className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-black text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                Dùng
              </button>
            )
          ) : outOfStock ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-400">Đã hết</span>
          ) : missing > 0 ? (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-400">
              <Lock className="h-3.5 w-3.5" /> Thiếu {missing}
            </span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onRedeem(reward);
              }}
              className="rounded-full bg-gradient-to-r from-primary to-emerald-500 px-4 py-1.5 text-sm font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
            >
              {busy ? "..." : "Đổi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Phòng thử đồ: diện mạo lớn + 3 chỗ mà món quà sẽ xuất hiện
function FittingRoom({ user, trying, onClear, onRedeem, onEquip, busy }) {
  const look = tryOn(user, trying);
  const first = look?.fullName?.split(" ").pop() || look?.username;
  const cat = trying && CATEGORIES.find((c) => c.type === (trying.type || "other"));
  return (
    <aside className="rounded-[1.75rem] bg-white p-5 shadow-elevation-2 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-black text-[#0b2340]">Phòng thử đồ</h2>
        {trying && (
          <button type="button" onClick={onClear} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" /> Bỏ thử
          </button>
        )}
      </div>

      <div className="relative mt-3 flex flex-col items-center overflow-clip rounded-3xl bg-gradient-to-br from-sky-100 via-violet-50 to-pink-100 px-4 pb-5 pt-6 text-center">
        <span aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/50 blur-xl" />
        <UserAvatar user={look} size="h-28 w-28" decoSize="text-3xl" className="relative" />
        <div className="relative mt-3 flex max-w-full justify-center">
          <UserName user={look} className="text-2xl" />
        </div>
        <p className="relative mt-1 text-sm font-semibold text-slate-500">
          {trying ? (
            <>
              Đang thử: <b className="text-[#0b2340]">{trying.name}</b>
            </>
          ) : (
            "Bấm vào một món quà để thử ngay nhé!"
          )}
        </p>
      </div>

      {trying && (
        <div className="mt-4">
          {cat?.where?.length > 0 && (
            <p className="text-sm font-semibold text-slate-500">
              Hiện ở: <b className="text-slate-700">{cat.where.join(" · ")}</b>
            </p>
          )}
          <div className="mt-3">
            {trying.owned ? (
              isEquipped(trying, user) ? (
                <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary/10 py-2.5 font-black text-primary">✓ Em đang dùng món này</span>
              ) : (
                <button type="button" disabled={busy} onClick={() => onEquip(trying)} className="w-full rounded-full bg-secondary py-2.5 font-display font-black text-white transition hover:brightness-110 active:scale-[0.98]">
                  Dùng ngay
                </button>
              )
            ) : (user?.points ?? 0) >= trying.costPoints ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onRedeem(trying)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-emerald-500 py-2.5 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Đổi với <Gem className="h-5 w-5" /> {trying.costPoints}
              </button>
            ) : (
              <div className="rounded-2xl bg-amber-50 p-3 text-center">
                <p className="font-bold text-amber-700">Em còn thiếu {trying.costPoints - (user?.points ?? 0)} điểm</p>
                <Link to="/nhiem-vu" className="mt-1 inline-block text-sm font-black text-primary hover:underline">
                  Làm nhiệm vụ, điểm danh để kiếm thêm →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Em sẽ hiện ở đâu */}
      <p className="mt-5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
        <MapPin className="h-3.5 w-3.5" /> Bạn bè sẽ thấy em như thế này
      </p>
      <div className="mt-2 space-y-2.5">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Thanh menu</p>
          <div className="mt-1.5 flex items-center gap-2">
            <UserAvatar user={look} size="h-9 w-9" decoSize="text-xs" />
            <span className="truncate font-display font-black text-[#0b2340]">{first}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Bảng xếp hạng</p>
          <div className="mt-1.5 flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 shadow-sm">
            <span className="font-display font-black text-amber-500">#3</span>
            <UserAvatar user={look} size="h-9 w-9" decoSize="text-xs" />
            <div className="min-w-0 flex-1">
              <UserName user={look} className="text-sm" />
            </div>
            <span className="shrink-0 text-sm font-black text-primary">128</span>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Bình luận bài học</p>
          <div className="mt-1.5 flex gap-2.5">
            <UserAvatar user={look} size="h-9 w-9" decoSize="text-xs" />
            <div className="min-w-0 flex-1">
              <UserName user={look} className="text-sm" />
              <p className="mt-1 w-fit rounded-2xl rounded-tl-sm bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm">Bài này hay quá! 😍</p>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}

export default function RewardsPage() {
  const dialog = useDialog();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [tab, setTab] = useState("shop");
  const [category, setCategory] = useState("frame");
  const [sort, setSort] = useState("price");
  const [trying, setTrying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const [rewardsRes, redemptionsRes] = await Promise.all([rewardService.list(), rewardService.myRedemptions()]);
    setRewards(rewardsRes.data);
    setRedemptions(redemptionsRes.data);
    setLoading(false);
    // Cập nhật lại món đang thử theo dữ liệu mới (vd vừa đổi xong → owned = true)
    setTrying((t) => (t ? rewardsRes.data.find((r) => r._id === t._id) || null : null));
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  async function handleRedeem(reward) {
    if (!(await dialog.confirm({ message: `Đổi "${reward.name}" với ${reward.costPoints} điểm?`, confirmText: "Đổi quà" }))) return;
    setBusyId(reward._id);
    try {
      await rewardService.redeem(reward._id);
      await Promise.all([load(), refreshUser()]);
      toast.success(reward.type === "vip" ? "Em đã là thành viên VIP! 👑" : `Đã đổi "${reward.name}" và dùng luôn! 🎉`);
    } catch (err) {
      toast.error(err.apiMessage || "Không thể đổi quà lúc này");
    } finally {
      setBusyId(null);
    }
  }

  async function handleEquip(reward, type) {
    setBusyId(reward?._id || type);
    try {
      await rewardService.equip(type || reward.type, reward?._id);
      await Promise.all([load(), refreshUser()]);
      toast.success(reward ? `Đã dùng "${reward.name}"` : "Đã bỏ về mặc định");
    } catch (err) {
      toast.error(err.apiMessage || "Không thể thay đổi lúc này");
    } finally {
      setBusyId(null);
    }
  }

  const owned = rewards.filter((r) => r.owned);
  const cosmetics = rewards.filter((r) => ["frame", "avatar", "title", "name_color"].includes(r.type));
  const visibleCategories = CATEGORIES.filter((c) => rewards.some((r) => (r.type || "other") === c.type));
  const shopItems = useMemo(() => {
    const list = rewards.filter((r) => (r.type || "other") === category);
    if (sort === "price") return [...list].sort((a, b) => a.costPoints - b.costPoints);
    if (sort === "rare") return [...list].sort((a, b) => b.costPoints - a.costPoints);
    // Đổi được ngay lên đầu
    return [...list].sort((a, b) => {
      const ok = (r) => (!r.owned && (user?.points ?? 0) >= r.costPoints ? 0 : r.owned ? 2 : 1);
      return ok(a) - ok(b) || a.costPoints - b.costPoints;
    });
  }, [rewards, category, sort, user?.points]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const vipActive = isVip(user);

  return (
    <div>
      <div className="page">
        <PageHeader
          icon={Gift}
          tone="pink"
          title="Đổi quà"
          subtitle="Dùng điểm thưởng để trang trí avatar, đổi danh hiệu, màu tên — bạn bè sẽ thấy ở bảng xếp hạng và bình luận!"
          right={<HeaderStat icon={Gem} value={user?.points ?? 0} label="điểm thưởng" />}
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "shop", label: "Cửa hàng", Icon: Store },
              { key: "wardrobe", label: `Tủ đồ (${owned.length})`, Icon: Shirt },
              { key: "history", label: "Lịch sử", Icon: History },
            ].map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("pill active:scale-95", tab === t.key && "pill-active")}>
                <t.Icon className="h-5 w-5" /> {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-black text-slate-500">Bộ sưu tập</span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500" style={{ width: `${cosmetics.length ? (owned.filter((r) => r.type !== "vip").length / cosmetics.length) * 100 : 0}%` }} />
            </div>
            <span className="text-sm font-black text-violet-600">
              {owned.filter((r) => r.type !== "vip").length}/{cosmetics.length}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <FittingRoom user={user} trying={trying} onClear={() => setTrying(null)} onRedeem={handleRedeem} onEquip={handleEquip} busy={!!busyId} />

          <div className="min-w-0">
            {tab === "shop" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {visibleCategories.map((c) => {
                      const all = rewards.filter((r) => (r.type || "other") === c.type);
                      return (
                        <button
                          key={c.type}
                          type="button"
                          onClick={() => setCategory(c.type)}
                          className={cn(
                            "flex items-center gap-2 rounded-2xl px-3.5 py-2 font-black transition active:scale-95",
                            category === c.type ? "bg-[#0b2340] text-white shadow-lg" : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
                          )}
                        >
                          <Img3D name={c.icon} className="h-6 w-6" />
                          {c.label}
                          <span className={cn("rounded-full px-1.5 text-xs", category === c.type ? "bg-white/20" : "bg-slate-100 text-slate-400")}>{all.length}</span>
                        </button>
                      );
                    })}
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-full border-0 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
                  >
                    <option value="price">Giá thấp → cao</option>
                    <option value="rare">Hiếm nhất trước</option>
                    <option value="afford">Đổi được ngay</option>
                  </select>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                  <MapPin className="h-4 w-4 text-primary" />
                  {CATEGORIES.find((c) => c.type === category)?.where.length
                    ? `Hiện ở: ${CATEGORIES.find((c) => c.type === category).where.join(" · ")}`
                    : "Quà đặc biệt"}
                  {category === "vip" && vipActive && ` — em là VIP đến ${new Date(user.vipUntil).toLocaleDateString("vi-VN")}`}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
                  {shopItems.map((reward) => (
                    <ShopCard
                      key={reward._id}
                      reward={reward}
                      user={user}
                      trying={trying?._id === reward._id}
                      onTry={(r) => setTrying((t) => (t?._id === r._id ? null : r))}
                      onRedeem={handleRedeem}
                      onEquip={(r) => handleEquip(r)}
                      busy={busyId === reward._id}
                    />
                  ))}
                </div>
              </>
            )}

            {tab === "wardrobe" && (
              <div className="space-y-5">
                {owned.length === 0 && (
                  <div className="rounded-3xl bg-white p-10 text-center shadow-elevation-1">
                    <Img3D name="shirt" className="mx-auto h-16 w-16" />
                    <p className="mt-3 font-bold text-slate-500">Tủ đồ còn trống. Vào Cửa hàng đổi món đầu tiên nhé!</p>
                    <button type="button" onClick={() => setTab("shop")} className="pill pill-active mt-4">
                      Tới cửa hàng
                    </button>
                  </div>
                )}
                {CATEGORIES.filter((c) => ["frame", "avatar", "title", "name_color"].includes(c.type)).map((c) => {
                  const items = owned.filter((r) => r.type === c.type);
                  if (items.length === 0) return null;
                  const noneActive = !items.some((r) => isEquipped(r, user));
                  return (
                    <section key={c.type} className="rounded-3xl bg-white p-5 shadow-elevation-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 font-display text-lg font-black text-[#0b2340]">
                          <Img3D name={c.icon} className="h-7 w-7" /> {c.label}
                        </h2>
                        <button
                          type="button"
                          disabled={noneActive || busyId === c.type}
                          onClick={() => handleEquip(null, c.type)}
                          className="rounded-full px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                        >
                          {c.type === "avatar" ? "Dùng ảnh mặc định" : "Bỏ, dùng mặc định"}
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {items.map((r) => {
                          const active = isEquipped(r, user);
                          return (
                            <button
                              key={r._id}
                              type="button"
                              disabled={active || busyId === r._id}
                              onClick={() => handleEquip(r)}
                              onMouseEnter={() => setTrying(r)}
                              className={cn(
                                "flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition active:scale-95",
                                active ? "bg-primary/10 ring-2 ring-primary" : "bg-slate-50 ring-1 ring-slate-100 hover:bg-slate-100"
                              )}
                            >
                              <div className="flex h-24 items-center justify-center">
                                <RewardPreview reward={r} user={user} />
                              </div>
                              <span className="text-sm font-bold text-slate-700">{r.name}</span>
                              <span className={cn("text-sm font-black", active ? "text-primary" : "text-secondary")}>{active ? "✓ Đang dùng" : "Bấm để dùng"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {tab === "history" &&
              (redemptions.length === 0 ? (
                <div className="rounded-3xl bg-white p-10 text-center shadow-elevation-1">
                  <Img3D name="scroll" className="mx-auto h-16 w-16" />
                  <p className="mt-3 font-bold text-slate-500">Em chưa đổi món quà nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 xl:grid-cols-2">
                  {redemptions.map((r) => (
                    <div key={r._id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-elevation-1">
                      <Img3D name={CATEGORIES.find((c) => c.type === (r.reward?.type || "other"))?.icon || "gift"} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-black text-[#0b2340]">{r.reward?.name || "Phần quà"}</p>
                        <p className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 font-black text-sky-600">
                        <Gem className="h-4 w-4" /> -{r.pointsSpent}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
