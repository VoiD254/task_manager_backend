import nodemailer from "nodemailer";
import configuration from "../../configuration";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: configuration.SMTP.HOST,
  port: Number(configuration.SMTP.PORT),
  secure: true,
  auth: {
    user: configuration.SMTP.USER,
    pass: configuration.SMTP.PASS,
  },
} as SMTPTransport.Options);

async function safeSendEmail(options: nodemailer.SendMailOptions, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.sendMail(options);

      return;
    } catch (err) {
      console.error("Failed to send email:", err);
      if (i === retries) throw err;
      console.warn(`Email send failed, retrying... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
}

async function sendOtpEmail(email: string, otp: string) {
  const subject = "Task Manager - Password Reset OTP";
  const html = `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:16px;border-radius:8px;background:#fafafa;">
            <h2 style="color:#333;">Reset Your Password</h2>
            <p>Use the following OTP to reset your password:</p>
            <div style="font-size:24px;font-weight:bold;letter-spacing:2px;margin:16px 0;">${otp}</div>
            <p>This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
            <p style="font-size:12px;color:#777;">If you didn’t request a password reset, please ignore this email.</p>
        </div>
    `;

  await safeSendEmail({
    from: `"Task Manager" <${configuration.SMTP.FROM}>`,
    to: email,
    subject,
    html,
  });
}

async function sendSecurityEmail(email: string) {
  const subject = "Task Manager - Password Reset Successful";
  const html = `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:16px;border-radius:8px;background:#fafafa;">
        <h2 style="color:#333;">Password Reset Notification</h2>
        <p>Your Task Manager account password was recently changed.</p>
        <p>If you performed this action, no further steps are needed.</p>
        <p>If not, please contact support immediately and secure your account.</p>
        <p style="font-size:12px;color:#777;">For your security, this email is sent whenever a password reset occurs.</p>
        </div>
    `;

  await safeSendEmail({
    from: `"Task Manager" <${configuration.SMTP.FROM}>`,
    to: email,
    subject,
    html,
  });
}

export { sendOtpEmail, sendSecurityEmail };
