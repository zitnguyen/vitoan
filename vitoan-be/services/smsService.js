// Gửi SMS OTP. Chọn nhà cung cấp bằng SMS_PROVIDER trong .env:
//   console  (mặc định) — không gửi thật, in mã ra console BE (dùng khi dev/demo)
//   speedsms — cần SPEEDSMS_TOKEN (+ tuỳ chọn SPEEDSMS_TYPE, SPEEDSMS_SENDER)
//   esms     — cần ESMS_API_KEY, ESMS_SECRET_KEY (+ ESMS_SMS_TYPE, ESMS_BRANDNAME, ESMS_SANDBOX=1 để test không gửi thật)
//   twilio   — cần TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN và TWILIO_FROM (số gửi) hoặc TWILIO_MESSAGING_SERVICE_SID.
//              Gửi được số quốc tế; tài khoản dùng thử chỉ gửi tới số đã xác thực trên Twilio.
// Nội dung tin nhắn viết không dấu để không bị đổi sang tin Unicode (tốn gấp nhiều lần).

const { toE164 } = require("../utils/phone");

const TIMEOUT_MS = 10000;

function getProvider() {
  const provider = String(process.env.SMS_PROVIDER || "console").trim().toLowerCase();
  if (provider === "speedsms" && process.env.SPEEDSMS_TOKEN) return "speedsms";
  if (provider === "esms" && process.env.ESMS_API_KEY && process.env.ESMS_SECRET_KEY) return "esms";
  if (
    provider === "twilio" &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_FROM || process.env.TWILIO_MESSAGING_SERVICE_SID)
  ) {
    return "twilio";
  }
  if (provider !== "console") {
    console.warn(`[smsService] SMS_PROVIDER="${provider}" không hợp lệ hoặc thiếu khóa API (chỉ nhận console | speedsms | esms | twilio) — dùng chế độ console`);
  }
  return "console";
}

async function sendViaTwilio(to, text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const body = new URLSearchParams({ To: toE164(to), Body: text });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) body.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  else body.set("From", process.env.TWILIO_FROM);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
    },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 201 || res.status === 200) return { sent: true };
  return { sent: false, error: `${data.message || "twilio_failed"}${data.code ? ` (code ${data.code})` : ""}` };
}

// SpeedSMS chỉ cho gửi nội dung khớp mẫu đã đăng ký của hệ thống, nên dùng đúng mẫu
// "$param1 Ma xac nhan cua ban la $param2" (không thêm chữ nào khác). Nhà cung cấp khác/console dùng bản đầy đủ.
function buildOtpSmsText(code) {
  if (getProvider() === "speedsms") return `ViToan Ma xac nhan cua ban la ${code}`;
  // eSMS loại 8 (đầu số cố định) chỉ cho gửi nội dung khớp mẫu đã đăng ký; đây là mẫu OTP ghi trong tài liệu eSMS.
  if (getProvider() === "esms") return `Ma Xac Nhan cua ban la ${code}`;
  return `ViToan: Ma xac nhan cua ban la ${code}. Co hieu luc 15 phut. Khong chia se ma nay cho bat ky ai.`;
}

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 200) };
  }
}

async function sendViaSpeedSms(to, text) {
  const token = process.env.SPEEDSMS_TOKEN;
  const body = { to: [to], content: text, sms_type: Number(process.env.SPEEDSMS_TYPE || 2) };
  // Chỉ gửi khóa sender khi có giá trị: khóa rỗng bị SpeedSMS báo "sender not found".
  const sender = String(process.env.SPEEDSMS_SENDER || "").trim();
  if (sender) body.sender = sender;
  const data = await postJson(
    "https://api.speedsms.vn/index.php/sms/send",
    body,
    { Authorization: `Basic ${Buffer.from(`${token}:x`).toString("base64")}` }
  );
  if (data.status === "success") return { sent: true };
  return { sent: false, error: data.message || data.raw || "speedsms_failed" };
}

async function sendViaEsms(to, text) {
  const body = {
    ApiKey: process.env.ESMS_API_KEY,
    SecretKey: process.env.ESMS_SECRET_KEY,
    Phone: to,
    Content: text,
    SmsType: String(process.env.ESMS_SMS_TYPE || "8"),
    IsUnicode: "0",
    Sandbox: process.env.ESMS_SANDBOX === "1" ? "1" : "0",
  };
  if (process.env.ESMS_BRANDNAME) body.Brandname = process.env.ESMS_BRANDNAME;
  const data = await postJson("https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/", body);
  if (String(data.CodeResult) === "100") return { sent: true };
  return { sent: false, error: data.ErrorMessage || data.raw || `esms_${data.CodeResult}` };
}

// Trả về { provider, sent, error? }. "console" coi như đã gửi (chỉ in ra log).
async function sendSms({ to, text }) {
  const provider = getProvider();
  if (provider === "console") {
    console.info(`[smsService] SMS_PROVIDER=console — tin nhắn tới ${to}: ${text}`);
    return { provider, sent: true };
  }
  try {
    const senders = { speedsms: sendViaSpeedSms, esms: sendViaEsms, twilio: sendViaTwilio };
    const result = await senders[provider](to, text);
    if (!result.sent) console.error(`[smsService] ${provider} gửi thất bại:`, result.error);
    return { provider, ...result };
  } catch (err) {
    console.error(`[smsService] ${provider} lỗi:`, err?.message);
    return { provider, sent: false, error: err?.message || "send_failed" };
  }
}

module.exports = { sendSms, getProvider, buildOtpSmsText };
