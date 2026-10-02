import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Plus, Search, Eye, EyeOff, Gift, Star, Sparkles, Medal, Smile, Crown } from "lucide-react";
import { rewardService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const ICONS = { star: Star, sparkles: Sparkles, medal: Medal, smile: Smile, crown: Crown, gift: Gift };

const EMPTY_FORM = {
  name: "",
  description: "",
  type: "frame",
  value: "star",
  durationDays: 7,
  costPoints: 50,
  icon: "gift",
  stock: -1,
  isActive: true,
};

// Tên hiển thị cho các mã giá trị (khung, kiểu avatar, màu tên).
const VALUE_LABELS = {
  leaf: "Lá xanh", star: "Ngôi sao", flower: "Hoa xuân", rainbow: "Cầu vồng", fire: "Ngọn lửa", ice: "Băng giá",
  galaxy: "Vũ trụ", gold: "Vàng hoàng gia", "big-smile": "Mặt cười", thumbs: "Ngón cái", adventurer: "Nhà thám hiểm",
  bottts: "Robot", "pixel-art": "Pixel", "fun-emoji": "Emoji", lorelei: "Tí hon", avataaars: "Hoạt hình", micah: "Nét vẽ",
  croodles: "Vẽ nguệch ngoạc", blue: "Xanh biển", orange: "Cam", purple: "Tím", vip: "VIP",
};

// Loại quà + các giá trị hợp lệ (khớp với FRAMES/NAME_COLORS ở frontend học sinh).
const TYPE_OPTIONS = {
  frame: { label: "Khung avatar", values: ["leaf", "star", "flower", "rainbow", "fire", "ice", "galaxy", "gold"], icon: "star" },
  avatar: {
    label: "Ảnh đại diện (DiceBear)",
    values: ["big-smile", "thumbs", "adventurer", "bottts", "pixel-art", "fun-emoji", "lorelei", "avataaars", "micah", "croodles"],
    icon: "smile",
  },
  title: { label: "Danh hiệu (gõ chữ)", values: null, icon: "medal" },
  name_color: { label: "Màu tên", values: ["blue", "orange", "purple", "rainbow"], icon: "sparkles" },
  vip: { label: "VIP có thời hạn", values: ["vip"], icon: "crown" },
  other: { label: "Quà khác / hiện vật", values: null, icon: "gift" },
};
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";
const filterSelectClass =
  "w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminRewardsPage() {
  const dialog = useDialog();
  const [rewards, setRewards] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function loadRewards() {
    setLoadingList(true);
    const res = await rewardService.list();
    setRewards(res.data);
    setLoadingList(false);
  }

  useEffect(() => {
    loadRewards();
  }, []);

  const filtered = rewards.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (filterStock === "in" && r.stock === 0) return false;
    if (filterStock === "out" && r.stock !== 0) return false;
    if (filterStatus === "published" && !r.isActive) return false;
    if (filterStatus === "draft" && r.isActive) return false;
    return true;
  });

  async function startEdit(reward) {
    setEditingId(reward._id);
    setShowForm(true);
    setForm({
      name: reward.name,
      description: reward.description || "",
      costPoints: reward.costPoints,
      icon: reward.icon || "gift",
      type: reward.type || "other",
      value: reward.value || "",
      durationDays: reward.durationDays || 7,
      stock: reward.stock,
      isActive: reward.isActive,
    });
  }

  async function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên phần thưởng");
      return;
    }
    try {
      if (editingId) {
        await rewardService.update(editingId, form);
      } else {
        await rewardService.create(form);
      }
      resetForm();
      await loadRewards();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    }
  }

  async function handleDelete(id) {
    if (!(await dialog.confirm({ message: "Xóa phần thưởng này?", danger: true, confirmText: "Xoá" }))) return;
    await rewardService.remove(id);
    await loadRewards();
  }

  async function toggleStatus(reward) {
    await rewardService.update(reward._id, { isActive: !reward.isActive });
    await loadRewards();
  }

  return (
    <div className="mx-auto max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-h2 text-slate-800">Phần quà</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Thêm phần thưởng
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">Loại quà</span>
              <select
                className={`${inputClass} mt-1`}
                value={form.type}
                onChange={(e) => {
                  const t = TYPE_OPTIONS[e.target.value];
                  setForm((f) => ({ ...f, type: e.target.value, value: t.values?.[0] || "", icon: t.icon }));
                }}
              >
                {Object.entries(TYPE_OPTIONS).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            {form.type !== "other" && (
              <label className="block">
                <span className="text-caption font-semibold text-slate-500">Giá trị áp dụng</span>
                {TYPE_OPTIONS[form.type]?.values ? (
                  <select
                    className={`${inputClass} mt-1`}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  >
                    {TYPE_OPTIONS[form.type].values.map((v) => (
                      <option key={v} value={v}>
                        {VALUE_LABELS[v] || v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`${inputClass} mt-1`}
                    placeholder="VD: Thần đồng Toán"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    required
                  />
                )}
              </label>
            )}
            {form.type === "vip" && (
              <label className="block">
                <span className="text-caption font-semibold text-slate-500">Số ngày hiệu lực</span>
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} mt-1`}
                  value={form.durationDays}
                  onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                />
              </label>
            )}
          </div>
          <label className="block">
            <span className="text-caption font-semibold text-slate-500">Tên phần quà *</span>
            <input
              className={`${inputClass} mt-1`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="text-caption font-semibold text-slate-500">Mô tả (học sinh sẽ thấy)</span>
            <textarea
              className={`${inputClass} mt-1`}
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">Số điểm cần để đổi *</span>
              <input
                type="number"
                min={1}
                className={`${inputClass} mt-1`}
                value={form.costPoints}
                onChange={(e) => setForm((f) => ({ ...f, costPoints: Number(e.target.value) }))}
                required
              />
            </label>
            <div>
              <span className="text-caption font-semibold text-slate-500">Số lượng có thể đổi</span>
              <div className="mt-1 flex items-center gap-3">
                <label className="flex shrink-0 items-center gap-2 font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={form.stock < 0}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.checked ? -1 : 10 }))}
                  />
                  Không giới hạn
                </label>
                {form.stock >= 0 && (
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: Math.max(0, Number(e.target.value)) }))}
                  />
                )}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Đang sử dụng (hiển thị cho học sinh)
          </label>

          {error && <p className="text-caption text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Cập nhật" : "Thêm phần thưởng"}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              <X className="h-4 w-4" /> Hủy
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo tên phần thưởng"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={filterSelectClass} value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
          <option value="">Tất cả số lượng</option>
          <option value="in">Còn</option>
          <option value="out">Hết</option>
        </select>
        <select className={filterSelectClass} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="published">Đang dùng</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      {loadingList ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((reward) => {
            const Icon = ICONS[reward.icon] || Gift;
            return (
              <div
                key={reward._id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vietnamese/10 text-vietnamese">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-display font-bold text-slate-800">
                      {reward.name}
                      <span className="shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 text-caption font-semibold text-secondary">
                        {TYPE_OPTIONS[reward.type || "other"]?.label}
                        {reward.value && reward.type !== "other" ? ` · ${reward.value}` : ""}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold",
                          reward.isActive ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {reward.isActive ? "Đang dùng" : "Nháp"}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold",
                          reward.stock === 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {reward.stock === 0 ? "Hết" : reward.stock < 0 ? "Không giới hạn" : `Còn ${reward.stock}`}
                      </span>
                    </p>
                    <p className="truncate text-caption text-slate-500">
                      {reward.costPoints} điểm{reward.description ? ` · ${reward.description}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" onClick={() => toggleStatus(reward)} title={reward.isActive ? "Chuyển sang Nháp" : "Đưa vào sử dụng"}>
                    {reward.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" onClick={() => startEdit(reward)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(reward._id)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">
              Không tìm thấy phần thưởng phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
