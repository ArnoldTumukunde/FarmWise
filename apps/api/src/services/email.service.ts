import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;
    await resend.emails.send({
      from: 'FarmWise <noreply@farmwise.app>',
      to,
      subject: 'Verify your FarmWise account',
      html: `<h2>Welcome to FarmWise!</h2><p>Click the link below to verify your account:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
    });
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await resend.emails.send({
      from: 'FarmWise <noreply@farmwise.app>',
      to,
      subject: 'Reset your FarmWise password',
      html: `<h2>Password Reset</h2><p>Click below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 15 minutes.</p>`,
    });
  },

  async sendEnrollmentConfirmation(to: string, courseTitle: string, courseSlug: string) {
    const courseUrl = `${process.env.FRONTEND_URL}/learn/${courseSlug}`;
    await resend.emails.send({
      from: 'FarmWise <noreply@farmwise.app>',
      to,
      subject: `You're enrolled in ${courseTitle}!`,
      html: `<h2>Enrollment Confirmed</h2><p>You're now enrolled in <strong>${courseTitle}</strong>.</p><p><a href="${courseUrl}">Start Learning</a></p>`,
    });
  },

  async sendGeneric(to: string, subject: string, html: string) {
    await resend.emails.send({ from: 'FarmWise <noreply@farmwise.app>', to, subject, html });
  },
};
