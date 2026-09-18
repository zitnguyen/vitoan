// "Trợ lý AI" — trò chuyện tự do với học sinh, có lưu lịch sử theo từng cuộc
// trò chuyện để xem lại/tiếp tục. Nhập giọng nói được xử lý ở frontend (Web
// Speech API của trình duyệt), backend chỉ nhận text.
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");
const { chatCompletion } = require("../utils/openai");

const SYSTEM_PROMPT =
  'Bạn là "Bạn đồng hành", trợ lý học tập AI thân thiện của ViToan dành cho học sinh tiểu học Việt Nam. ' +
  "Trả lời ngắn gọn, dễ hiểu, dùng ví dụ gần gũi với trẻ em, giọng điệu vui vẻ và khích lệ. " +
  "Nếu học sinh hỏi bài tập, hãy hướng dẫn cách suy nghĩ thay vì chỉ đưa đáp án ngay.";

async function listConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ student: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || String(conversation.student) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }
    const messages = await ChatMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: { conversation, messages } });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const text = String(req.body.message || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung" });

    let conversation;
    if (req.params.id) {
      conversation = await Conversation.findById(req.params.id);
      if (!conversation || String(conversation.student) !== String(req.user._id)) {
        return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
      }
    } else {
      conversation = await Conversation.create({
        student: req.user._id,
        title: text.length > 40 ? `${text.slice(0, 40)}…` : text,
      });
    }

    await ChatMessage.create({ conversation: conversation._id, role: "user", content: text });

    const history = await ChatMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 }).limit(20);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const reply = await chatCompletion(messages, { maxTokens: 400 });
    await ChatMessage.create({ conversation: conversation._id, role: "assistant", content: reply });
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({ success: true, data: { conversationId: conversation._id, reply } });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
}

async function removeConversation(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || String(conversation.student) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }
    await ChatMessage.deleteMany({ conversation: conversation._id });
    await conversation.deleteOne();
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { listConversations, getConversation, sendMessage, removeConversation };
