const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWelcomeEmail(email, name) {
  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'YOUR_GMAIL_APP_PASSWORD') {
    console.warn('SMTP not configured — skipping welcome email to', email);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
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
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `${process.env.APP_NAME} — Password Reset`,
    html: `<h2>Password Reset</h2><p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
