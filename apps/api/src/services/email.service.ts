import { Resend } from 'resend';

const FROM = 'FarmWise <no-reply@myfarmwise.xyz>';

// Lazy-init: Resend client created on first use so dotenv has loaded by then
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function send(params: { from: string; to: string; subject: string; html: string }) {
  const { data, error } = await getResend().emails.send(params);
  if (error) {
    console.error('[email] Resend error:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
  return data;
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1A2E1A,#2E7D32);padding:32px 40px;text-align:center;">
          <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">🌱 FarmWise</span>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Growing Knowledge, Growing Harvests</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #e8e8e0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#8a8a7a;">FarmWise — Agricultural learning for East Africa</p>
          <p style="margin:6px 0 0;font-size:11px;color:#a0a090;">You received this email because you signed up on FarmWise. If you didn't, you can safely ignore it.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const emailService = {
  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;
    await send({
      from: FROM,
      to,
      subject: 'Verify your FarmWise account',
      html: layout(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1B2B1B;">Welcome to FarmWise! 🎉</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#5A6E5A;line-height:1.6;">
          You're one step away from joining thousands of farmers learning new skills. Click the button below to verify your email and get started.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:8px 0 24px;">
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;background-color:#2E7D32;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:50px;">
              Verify My Email
            </a>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;color:#8a8a7a;">Or copy and paste this link into your browser:</p>
        <p style="margin:0 0 24px;font-size:12px;color:#2E7D32;word-break:break-all;">${verifyUrl}</p>
        <p style="margin:0;font-size:13px;color:#8a8a7a;">This link expires in <strong>24 hours</strong>.</p>
      `),
    });
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await send({
      from: FROM,
      to,
      subject: 'Reset your FarmWise password',
      html: layout(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1B2B1B;">Password Reset</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#5A6E5A;line-height:1.6;">
          We received a request to reset your password. Click the button below to choose a new one.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:8px 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background-color:#F57F17;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:50px;">
              Reset Password
            </a>
          </td></tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;color:#8a8a7a;">Or copy and paste this link:</p>
        <p style="margin:0 0 24px;font-size:12px;color:#F57F17;word-break:break-all;">${resetUrl}</p>
        <p style="margin:0;font-size:13px;color:#8a8a7a;">This link expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
      `),
    });
  },

  async sendEnrollmentConfirmation(to: string, courseTitle: string, courseSlug: string) {
    const courseUrl = `${process.env.FRONTEND_URL}/learn/${courseSlug}`;
    await send({
      from: FROM,
      to,
      subject: `You're enrolled in ${courseTitle}!`,
      html: layout(`
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1B2B1B;">Enrollment Confirmed! 📚</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#5A6E5A;line-height:1.6;">
          You're now enrolled in <strong style="color:#1B2B1B;">${courseTitle}</strong>. Start learning right away — your course is ready.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:8px 0 24px;">
            <a href="${courseUrl}" style="display:inline-block;padding:14px 36px;background-color:#2E7D32;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:50px;">
              Start Learning
            </a>
          </td></tr>
        </table>
      `),
    });
  },

  async sendGeneric(to: string, subject: string, html: string) {
    await send({ from: FROM, to, subject, html: layout(html) });
  },
};
