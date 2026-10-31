// Nguồn của câu hỏi: tự biên soạn hay trích từ SGK / SBT (ghi rõ sách, tập, trang).
export const SOURCE_KINDS = {
  self: "Tự biên soạn",
  sgk: "Sách giáo khoa",
  sbt: "Sách bài tập",
  other: "Nguồn khác",
};

const SHORT = { sgk: "SGK", sbt: "SBT", other: "" };

// Gợi ý tên sách khi nhập nguồn
export const BOOK_SUGGESTIONS = [
  "Toán 1 – Kết nối tri thức với cuộc sống",
  "Tiếng Việt 1 – Kết nối tri thức với cuộc sống",
  "Vở bài tập Toán 1 – Kết nối tri thức với cuộc sống",
  "Vở bài tập Tiếng Việt 1 – Kết nối tri thức với cuộc sống",
];

export const isSourced = (source) => !!source && source.kind && source.kind !== "self";

// "SGK Toán 1 – Kết nối tri thức với cuộc sống, Tập 1, trang 24, Bài 3"
export function formatSource(source) {
  if (!isSourced(source)) return SOURCE_KINDS.self;
  const head = [SHORT[source.kind], source.book].filter(Boolean).join(" ") || SOURCE_KINDS[source.kind];
  return [head, source.volume, source.page && `trang ${source.page}`, source.exercise].filter(Boolean).join(", ");
}

export const EMPTY_SOURCE = { kind: "self", book: "", volume: "", page: "", exercise: "", url: "", note: "" };
