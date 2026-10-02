// Đọc RSS chuyên mục Giáo dục của các báo chính thống, trả về danh sách tin gọn
// (tiêu đề, tóm tắt ngắn do báo cung cấp trong RSS, ảnh, link gốc, ngày đăng).
const FEEDS = {
  vnexpress: { name: "VnExpress", url: "https://vnexpress.net/rss/giao-duc.rss" },
  tuoitre: { name: "Tuổi Trẻ", url: "https://tuoitre.vn/rss/giao-duc.rss" },
  dantri: { name: "Dân trí", url: "https://dantri.com.vn/rss/giao-duc.rss" },
  thanhnien: { name: "Thanh Niên", url: "https://thanhnien.vn/rss/giao-duc.rss" },
  giaoducthoidai: { name: "Giáo dục và Thời đại", url: "https://giaoducthoidai.vn/rss/giao-duc.rss" },
};

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", hellip: "…", ndash: "–", mdash: "—", laquo: "«", raquo: "»",
};
// Chữ Latin có dấu (một số báo mã hoá tiếng Việt thành &agrave; &ecirc; ...).
const ACCENTS = Object.fromEntries(
  Object.entries({ grave: 0x300, acute: 0x301, circ: 0x302, tilde: 0x303, uml: 0x308, ring: 0x30a, cedil: 0x327 }).map(([k, code]) => [
    k,
    String.fromCharCode(code),
  ])
);
function namedEntity(name) {
  if (ENTITIES[name] !== undefined) return ENTITIES[name];
  const m = name.match(/^([a-zA-Z])(grave|acute|circ|tilde|uml|ring|cedil)$/);
  return m ? (m[1] + ACCENTS[m[2]]).normalize("NFC") : null;
}

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (all, e) => namedEntity(e) ?? all);
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]).trim() : "";
}

function stripHtml(html) {
  return decode(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function findImage(itemXml, descriptionHtml) {
  const candidates = [
    itemXml.match(/<media:content[^>]+url="([^"]+)"/i)?.[1],
    itemXml.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1],
    itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i)?.[1],
    itemXml.match(/<enclosure[^>]+type="image[^"]*"[^>]+url="([^"]+)"/i)?.[1],
    descriptionHtml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
    tag(itemXml, "image"),
  ];
  const url = candidates.find((c) => c && /^https?:\/\//.test(c.trim()));
  return url ? decode(url.trim()) : "";
}

// Tóm tắt tối đa ~300 ký tự, cắt ở ranh giới từ.
function shorten(text, max = 300) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

async function fetchFeed(key) {
  const feed = FEEDS[key];
  if (!feed) throw new Error("Nguồn tin không hợp lệ");
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (ViToan news reader)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Không đọc được RSS ${feed.name} (HTTP ${res.status})`);
  const xml = await res.text();
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  return items
    .map((item) => {
      const rawDescription = decode(item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || "");
      const published = new Date(tag(item, "pubDate"));
      return {
        title: stripHtml(tag(item, "title")),
        // Bỏ tiền tố kiểu "(Dân trí) - ", "GD&TĐ - ".
        summary: shorten(stripHtml(rawDescription).replace(/^(\([^)]{1,30}\)|GD&TĐ)\s*[-–]\s*/, "")),
        imageUrl: findImage(item, rawDescription),
        sourceUrl: tag(item, "link").trim(),
        sourceName: feed.name,
        publishedAt: Number.isNaN(published.getTime()) ? new Date() : published,
      };
    })
    .filter((it) => it.title && /^https?:\/\//.test(it.sourceUrl));
}

module.exports = { FEEDS, fetchFeed };
