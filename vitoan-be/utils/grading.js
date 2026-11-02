function normalizeText(str) {
  return String(str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isFillType(type) {
  return type === "fill_blank" || type === "listen_fill";
}

function gradeAnswer(question, answer) {
  if (!question) return false;
  if (isFillType(question.type)) {
    const given = normalizeText(answer.textAnswer);
    return given.length > 0 && given === normalizeText(question.correctText);
  }
  if (question.type === "multi_choice") {
    const given = [...new Set((answer.selectedIndexes || []).map(Number))].sort();
    const right = [...new Set(question.correctIndexes || [])].sort();
    return given.length > 0 && given.length === right.length && given.every((v, i) => v === right[i]);
  }
  return Number(answer.selectedIndex) === question.correctIndex;
}

module.exports = { gradeAnswer, isFillType, normalizeText };
