import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

if (config.email.isConfigured) {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
}

export const sendVerificationEmail = async ({ to, token, name }) => {
  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  if (!config.email.isConfigured) {
    return { sent: false };
  }

  const mailOptions = {
    from: config.email.from,
    to,
    subject: 'Verify your Expense Tracker Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #191820; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #A78BFA;">Welcome, ${escapeHtml(name)}!</h2>
        <p>Thank you for registering. Please confirm your email address by clicking the link below:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Account</a>
        </p>
        <p style="color: #9CA3AF; font-size: 13px;">This link will expire in 24 hours.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { sent: true };
};

export const sendPasswordResetEmail = async ({ to, token, name }) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  if (!config.email.isConfigured) {
    return { sent: false };
  }

  const mailOptions = {
    from: config.email.from,
    to,
    subject: 'Reset your Expense Tracker Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #191820; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #A78BFA;">Password Reset Request</h2>
        <p>Hello ${escapeHtml(name)}, you requested to reset your password. Click the link below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </p>
        <p style="color: #9CA3AF; font-size: 13px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { sent: true };
};
