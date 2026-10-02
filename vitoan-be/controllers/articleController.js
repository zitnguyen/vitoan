const mongoose = require("mongoose");
const Article = require("../models/Article");
const { FEEDS, fetchFeed } = require("../utils/newsFeeds");

const EDITABLE = ["title", "summary", "content", "imageUrl", "category", "sourceName", "sourceUrl", "publishedAt", "isPublished", "isFeatured"];

function pick(body) {
  const data = {};
  for (const k of EDITABLE) if (body[k] !== undefined) data[k] = body[k];
  if (data.sourceUrl === "") data.sourceUrl = undefined;
  return data;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /articles — công khai: chỉ bài đã đăng. Admin (?all=1) thấy cả bài ẩn.
async function list(req, res, next) {
  try {
    const isAdmin = req.user?.role === "Admin" && req.query.all === "1";
    const filter = isAdmin ? {} : { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.source) filter.sourceName = req.query.source;
    if (req.query.q) filter.title = { $regex: escapeRegex(String(req.query.q).trim()), $options: "i" };

    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const [items, total, sources] = await Promise.all([
      Article.find(filter)
        .select("-content")
        .sort({ isFeatured: -1, publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Article.countDocuments(filter),
      Article.distinct("sourceName", isAdmin ? {} : { isPublished: true }),
    ]);
    res.json({ success: true, data: items, total, page, limit, sources: sources.filter(Boolean) });
  } catch (err) {
    next(err);
  }
}

// GET /articles/:id — kèm vài bài liên quan; mỗi lần xem tăng lượt xem.
async function getOne(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }
    const isAdmin = req.user?.role === "Admin";
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, ...(isAdmin ? {} : { isPublished: true }) },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!article) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    const related = await Article.find({ _id: { $ne: article._id }, isPublished: true, category: article.category })
      .select("-content")
      .sort({ publishedAt: -1 })
      .limit(4);
    res.json({ success: true, data: article, related });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const article = await Article.create(pick(req.body));
    res.status(201).json({ success: true, data: article });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Bài gốc này đã có trong trang tin" });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = pick(req.body);
    const unset = req.body.sourceUrl === "" ? { $unset: { sourceUrl: 1 } } : {};
    const article = await Article.findByIdAndUpdate(req.params.id, { $set: data, ...unset }, { new: true, runValidators: true });
    if (!article) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    res.json({ success: true, data: article });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Bài gốc này đã có trong trang tin" });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// GET /articles/feeds — danh sách nguồn báo có thể lấy tin.
function feeds(req, res) {
  res.json({ success: true, data: Object.entries(FEEDS).map(([key, f]) => ({ key, name: f.name, url: f.url })) });
}

// GET /articles/feeds/:key — xem trước tin mới của 1 nguồn, đánh dấu tin đã nhập.
async function previewFeed(req, res, next) {
  try {
    const items = await fetchFeed(req.params.key);
    const existing = await Article.find({ sourceUrl: { $in: items.map((i) => i.sourceUrl) } }).select("sourceUrl");
    const have = new Set(existing.map((e) => e.sourceUrl));
    res.json({ success: true, data: items.map((i) => ({ ...i, imported: have.has(i.sourceUrl) })) });
  } catch (err) {
    res.status(502).json({ success: false, message: err.message || "Không đọc được nguồn tin" });
  }
}

// POST /articles/import { items: [...], category } — nhập các tin admin đã chọn, bỏ qua tin trùng.
async function importItems(req, res, next) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
    const category = req.body.category || "giao-duc";
    let added = 0;
    for (const it of items) {
      if (!it?.title || !/^https?:\/\//.test(it.sourceUrl || "")) continue;
      const r = await Article.updateOne(
        { sourceUrl: it.sourceUrl },
        {
          $setOnInsert: {
            title: String(it.title).slice(0, 300),
            summary: String(it.summary || "").slice(0, 600),
            imageUrl: /^https?:\/\//.test(it.imageUrl || "") ? it.imageUrl : "",
            sourceName: String(it.sourceName || "").slice(0, 100),
            sourceUrl: it.sourceUrl,
            publishedAt: it.publishedAt ? new Date(it.publishedAt) : new Date(),
            category,
            isPublished: true,
          },
        },
        { upsert: true }
      );
      if (r.upsertedCount) added++;
    }
    res.json({ success: true, added, skipped: items.length - added });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, feeds, previewFeed, importItems };
