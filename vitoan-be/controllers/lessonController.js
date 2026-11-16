const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const PracticeSet = require("../models/PracticeSet");
const ReviewContent = require("../models/ReviewContent");
const Chapter = require("../models/Chapter");
const { isObjectId, diffFields, toBool } = require("../utils/excelSync");
const { isStaff } = require("../utils/rbac");

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = req.query.chapter;
    if (!isStaff(req.user)) filter.isPublished = true;
    const lessons = await Lesson.find(filter)
      .populate("subject", "name slug")
      .populate("grade", "name slug order")
      .sort({ order: 1, createdAt: 1 });
    if (req.query.withCounts !== "1") return res.json({ success: true, data: lessons });

    // Admin: kèm số câu hỏi / bài luyện tập / có lý thuyết, video hay chưa để nhìn nhanh độ đầy đủ nội dung.
    const ids = lessons.map((l) => l._id);
    const [qCounts, psCounts, reviews] = await Promise.all([
      Question.aggregate([{ $match: { lesson: { $in: ids } } }, { $group: { _id: "$lesson", n: { $sum: 1 } } }]),
      PracticeSet.aggregate([{ $match: { lesson: { $in: ids } } }, { $group: { _id: "$lesson", n: { $sum: 1 } } }]),
      ReviewContent.find({ lesson: { $in: ids } }).select("lesson videoUrl content").lean(),
    ]);
    const qMap = new Map(qCounts.map((c) => [String(c._id), c.n]));
    const psMap = new Map(psCounts.map((c) => [String(c._id), c.n]));
    const rMap = new Map(reviews.map((r) => [String(r.lesson), r]));
    res.json({
      success: true,
      data: lessons.map((l) => {
        const r = rMap.get(String(l._id));
        return {
          ...l.toObject(),
          questionCount: qMap.get(String(l._id)) || 0,
          practiceSetCount: psMap.get(String(l._id)) || 0,
          hasVideo: !!r?.videoUrl,
          hasContent: !!r?.content,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    if (req.query.trackView === "1") {
      await Lesson.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    }
    const lesson = await Lesson.findById(req.params.id).populate("subject", "name slug").populate("grade", "name slug order");
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    // Học sinh chỉ được vào bài của đúng lớp mình đã chọn.
    if (req.user?.role === "Student" && req.user.grade && String(lesson.grade?._id) !== String(req.user.grade._id || req.user.grade)) {
      return res.status(403).json({ success: false, message: `Bài học này thuộc ${lesson.grade?.name || "lớp khác"}, không phải lớp em đã chọn.` });
    }
    const data = lesson.toObject();
    data.likeCount = lesson.likedBy.length;
    data.likedByMe = !!(req.user && lesson.likedBy.some((id) => id.toString() === req.user._id.toString()));
    delete data.likedBy;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function toggleLike(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    const userId = req.user._id.toString();
    const idx = lesson.likedBy.findIndex((id) => id.toString() === userId);
    if (idx >= 0) lesson.likedBy.splice(idx, 1);
    else lesson.likedBy.push(req.user._id);
    await lesson.save();
    res.json({ success: true, data: { likeCount: lesson.likedBy.length, likedByMe: idx < 0 } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    res.json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ lesson: req.params.id });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

// Xuất toàn bộ bài học (kèm chủ đề, lý thuyết, video) của một Môn + Lớp để admin tải Excel về sửa.
async function exportLessons(req, res, next) {
  try {
    const { subject, grade } = req.query;
    if (!subject || !grade) return res.status(400).json({ success: false, message: "Thiếu môn hoặc lớp" });
    const chapters = await Chapter.find({ subject, grade }).sort({ semester: 1, order: 1 }).lean();
    const lessons = await Lesson.find({ subject, grade }).sort({ order: 1, createdAt: 1 }).lean();
    const ids = lessons.map((l) => l._id);
    const [qCounts, reviews] = await Promise.all([
      Question.aggregate([{ $match: { lesson: { $in: ids } } }, { $group: { _id: "$lesson", n: { $sum: 1 } } }]),
      ReviewContent.find({ lesson: { $in: ids } }).lean(),
    ]);
    const qMap = new Map(qCounts.map((c) => [String(c._id), c.n]));
    const rMap = new Map(reviews.map((r) => [String(r.lesson), r]));
    const rows = [];
    for (const c of chapters) {
      for (const l of lessons.filter((x) => String(x.chapter) === String(c._id))) {
        const r = rMap.get(String(l._id));
        rows.push({
          _id: l._id,
          semester: c.semester || 1,
          chapter: c.title,
          title: l.title,
          description: l.description || "",
          order: l.order,
          isPublished: l.isPublished,
          isTrial: !!l.isTrial,
          randomQuestionCount: l.randomQuestionCount || 0,
          content: r?.content || "",
          examples: r?.examples || [],
          videoUrl: r?.videoUrl || "",
          questionCount: qMap.get(String(l._id)) || 0,
        });
      }
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

// Nhập bài học từ Excel cho một Môn + Lớp. Dòng có mã → chỉ cập nhật phần đã đổi; không có mã → thêm bài mới
// (chủ đề chưa có thì tự tạo). Lý thuyết/ví dụ/video lưu vào ReviewContent của bài.
async function importLessons(req, res, next) {
  try {
    const { subject, grade } = req.body;
    const items = Array.isArray(req.body.rows) ? req.body.rows.slice(0, 2000) : [];
    if (!isObjectId(String(subject)) || !isObjectId(String(grade))) return res.status(400).json({ success: false, message: "Thiếu môn hoặc lớp" });
    if (!items.length) return res.status(400).json({ success: false, message: "Không có bài học nào để nhập" });

    const chapterByTitle = new Map((await Chapter.find({ subject, grade }).lean()).map((c) => [c.title.trim().toLowerCase(), c]));
    let chapterOrder = chapterByTitle.size;
    const errors = [];
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let chaptersCreated = 0;

    for (let i = 0; i < items.length; i++) {
      const raw = items[i];
      const row = raw.row || i + 2;
      const title = String(raw.title || "").trim();
      const chapterTitle = String(raw.chapter || "").trim();
      if (!title) { errors.push({ row, message: "Thiếu tên bài học" }); continue; }
      if (!chapterTitle) { errors.push({ row, message: "Thiếu tên chủ đề" }); continue; }

      let chapter = chapterByTitle.get(chapterTitle.toLowerCase());
      if (!chapter) {
        const created = await Chapter.create({ title: chapterTitle, subject, grade, order: ++chapterOrder, semester: Number(raw.semester) === 2 ? 2 : 1 });
        chapter = created.toObject();
        chapterByTitle.set(chapterTitle.toLowerCase(), chapter);
        chaptersCreated++;
      }

      const next = {
        title,
        description: String(raw.description ?? "").trim(),
        chapter: chapter._id,
        order: raw.order === "" || raw.order === undefined ? undefined : Number(raw.order),
        isPublished: toBool(raw.isPublished, undefined),
        isTrial: toBool(raw.isTrial, undefined),
        randomQuestionCount: raw.randomQuestionCount === "" || raw.randomQuestionCount === undefined ? undefined : Math.max(0, Number(raw.randomQuestionCount) || 0),
      };
      if (next.order !== undefined && Number.isNaN(next.order)) next.order = undefined;
      const review = {
        content: String(raw.content ?? "").replace(/\r\n/g, "\n").trim(),
        examples: (Array.isArray(raw.examples) ? raw.examples : []).map((s) => String(s).trim()).filter(Boolean),
        videoUrl: String(raw.videoUrl ?? "").trim(),
      };

      let lesson = null;
      if (raw._id) {
        lesson = isObjectId(String(raw._id)) ? await Lesson.findOne({ _id: raw._id, subject, grade }) : null;
        if (!lesson) { errors.push({ row, message: `Không tìm thấy bài học có mã ${raw._id} trong môn/lớp này` }); continue; }
        // So sánh sau khi chuẩn hoá khoảng trắng để dòng không sửa không bị tính là "đã đổi".
        const changed = diffFields({ title: lesson.title.trim(), description: (lesson.description || "").trim(), chapter: lesson.chapter, order: lesson.order, isPublished: lesson.isPublished, isTrial: !!lesson.isTrial, randomQuestionCount: lesson.randomQuestionCount || 0 }, next);
        if (Object.keys(changed).length) { await Lesson.updateOne({ _id: lesson._id }, { $set: changed }); updated++; }
        const rc = await ReviewContent.findOne({ lesson: lesson._id });
        const hasReview = review.content || review.examples.length || review.videoUrl;
        if (rc) {
          const rcChanged = diffFields({ content: (rc.content || "").replace(/\r\n/g, "\n").trim(), examples: (rc.examples || []).map((s) => s.trim()).filter(Boolean), videoUrl: (rc.videoUrl || "").trim() }, review);
          if (Object.keys(rcChanged).length) {
            await ReviewContent.updateOne({ _id: rc._id }, { $set: rcChanged });
            if (!Object.keys(changed).length) updated++;
          } else if (!Object.keys(changed).length) unchanged++;
        } else if (hasReview) {
          await ReviewContent.create({ lesson: lesson._id, title: `Kiến thức: ${title}`, ...review });
          if (!Object.keys(changed).length) updated++;
        } else if (!Object.keys(changed).length) unchanged++;
        continue;
      }

      if (await Lesson.exists({ subject, grade, chapter: chapter._id, title })) { errors.push({ row, message: `Bài "${title}" đã có trong chủ đề này (muốn sửa thì giữ nguyên cột Mã)` }); continue; }
      const last = await Lesson.findOne({ chapter: chapter._id }).sort({ order: -1 }).select("order");
      lesson = await Lesson.create({
        ...Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined)),
        subject,
        grade,
        order: next.order ?? (last?.order || 0) + 1,
      });
      if (review.content || review.examples.length || review.videoUrl) await ReviewContent.create({ lesson: lesson._id, title: `Kiến thức: ${title}`, ...review });
      inserted++;
    }
    res.status(201).json({ success: true, data: { inserted, updated, unchanged, chaptersCreated, errors } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, toggleLike, create, update, remove, exportLessons, importLessons };
