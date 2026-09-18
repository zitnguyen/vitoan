import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Plus, Search, Eye, EyeOff, Gift, Star, Sparkles, Medal, Smile, Crown } from "lucide-react";
import { rewardService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

const ICONS = { star: Star, sparkles: Sparkles, medal: Medal, smile: Smile, crown: Crown, gift: Gift };
const ICON_OPTIONS = Object.keys(ICONS);

const EMPTY_FORM = { name: "", description: "", costPoints: 50, icon: "gift", stock: -1, isActive: true };
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";
const filterSelectClass =
  "w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminRewardsPage() {
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

  function startEdit(reward) {
    setEditingId(reward._id);
    setShowForm(true);
    setForm({
      name: reward.name,
      description: reward.description || "",
      costPoints: reward.costPoints,
      icon: reward.icon || "gift",
      stock: reward.stock,
      isActive: reward.isActive,
    });
  }

  function resetForm() {
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
    if (!confirm("Xóa phần thưởng này?")) return;
    await rewardService.remove(id);
    await loadRewards();
  }

  async function toggleStatus(reward) {
    await rewardService.update(reward._id, { isActive: !reward.isActive });
    await loadRewards();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-h2 text-slate-800">Quản lý đổi điểm</h1>
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
          <input
            className={inputClass}
            placeholder="Tên phần quà hoặc voucher"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <textarea
            className={inputClass}
            placeholder="Mô tả"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="number"
              min={1}
              className={inputClass}
              placeholder="Số điểm cần đổi"
              value={form.costPoints}
              onChange={(e) => setForm((f) => ({ ...f, costPoints: Number(e.target.value) }))}
              required
            />
            <input
              type="number"
              min={-1}
              className={inputClass}
              placeholder="Số lượng (-1 = không giới hạn)"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
            />
            <select
              className={inputClass}
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            >
              {ICON_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
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
