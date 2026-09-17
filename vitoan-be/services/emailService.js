const nodemailer = require("nodemailer");

let cachedTransport = null;

function getSmtpTransport() {
  const host = String(process.env.SMTP_HOST || "").trim();
  if (!host) return null;
  if (cachedTransport) return cachedTransport;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });
  return cachedTransport;
}

function getFromAddress() {
  const from = String(process.env.MAIL_FROM || "").trim();
  if (from) return from;
  const user = String(process.env.SMTP_USER || "").trim();
  return user || "noreply@localhost";
}

async function sendMailIfConfigured({ to, subject, text, html }) {
  const address = String(to || "").trim();
  if (!address) return { sent: false, skipped: true, error: "no_recipient" };

  const transport = getSmtpTransport();
  if (!transport) {
    console.info("[emailService] Bỏ qua gửi mail (thiếu SMTP_HOST). To:", address, "Subject:", subject);
    return { sent: false, skipped: true };
  }
  try {
    await transport.sendMail({
      from: getFromAddress(),
      to: address,
      subject: String(subject || "").slice(0, 200),
      text: text || undefined,
      html: html || undefined,
    });
    return { sent: true };
  } catch (err) {
    console.error("[emailService] sendMail failed:", err?.message);
    return { sent: false, error: err?.message || "send_failed" };
  }
}

function buildOtpEmailHtml({ heading, code, note }) {
  return `
<!DOCTYPE html>
<html lang="vi">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 16px rgba(11,35,64,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#00b14f,#0ea5e9);padding:28px 32px;text-align:center;">
                <span style="display:inline-block;width:40px;height:40px;background:#ffffff;border-radius:12px;line-height:40px;font-size:20px;font-weight:800;color:#00b14f;font-family:Georgia,serif;">V</span>
                <div style="margin-top:10px;font-size:20px;font-weight:800;color:#ffffff;">
                  Vi<span style="color:#fde047;">Toan</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;text-align:center;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">${heading}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 8px;text-align:center;">
                <div style="display:inline-block;padding:16px 36px;background-color:#f0fdf4;border:2px dashed #00b14f;border-radius:16px;">
                  <span style="font-size:34px;font-weight:800;letter-spacing:8px;color:#00b14f;font-family:Georgia,serif;">${code}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 4px;text-align:center;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
                  Mã có hiệu lực trong <strong style="color:#64748b;">15 phút</strong>.${note ? ` ${note}` : ""}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#cbd5e1;">
                  Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này — tài khoản của bạn vẫn an toàn.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f8fafc;text-align:center;border-top:1px solid #f1f5f9;">
                <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 ViToan · Nền tảng luyện tập Toán &amp; Tiếng Việt tiểu học</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

module.exports = { sendMailIfConfigured, buildOtpEmailHtml };
