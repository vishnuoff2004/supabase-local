const transporter = require('../config/mailer');

async function sendWelcomeEmail(email, name) {
  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'YOUR_GMAIL_APP_PASSWORD') {
    console.warn('SMTP not configured — skipping welcome email to', email);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
    to: email,
    subject: `Welcome to ${process.env.APP_NAME}!`,
    html: `<h2>Welcome, ${name}!</h2><p>Your account has been created successfully. You can now sign in and start exploring.</p>`,
  });
}

async function sendPasswordResetEmail(email, resetLink) {
  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'YOUR_GMAIL_APP_PASSWORD') {
    console.warn('SMTP not configured — skipping password reset email to', email);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
    to: email,
    subject: `${process.env.APP_NAME} — Password Reset`,
    html: `<h2>Password Reset</h2><p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
}

async function sendOtpEmail({ name, email, otp }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
    to: email,
    subject: `Your verification code: ${otp}`,
    html: `<h2>Hello, ${name}!</h2><p>Your OTP verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendOtpEmail };
