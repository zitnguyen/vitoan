// Bỏ câu hỏi trùng nội dung (cùng loại, cùng đề, cùng đáp án đúng) để học sinh không gặp lại câu y hệt khi luyện tập.
function normalize(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function questionKey(q) {
  const answer = q.correctText != null && q.correctText !== "" ? q.correctText : q.choices?.[q.correctIndex];
  return [q.type, normalize(q.text), normalize(answer), q.imageUrl || ""].join("|");
}

function dedupeQuestions(list) {
  const seen = new Set();
  return list.filter((q) => {
    const key = questionKey(q);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { dedupeQuestions };
