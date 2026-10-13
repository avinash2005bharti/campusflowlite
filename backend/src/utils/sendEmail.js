import nodemailer from 'nodemailer';
import { getBrevoClient } from '../config/brevo.js';

export const sendEmail = async ({ to, subject, html, text, recipientName = 'User' }) => {
  const brevoClient = getBrevoClient();

  // 1. Send via official Brevo Transactional Emails SDK if API key is provided
  if (brevoClient) {
    try {
      const emailPayload = {
        subject,
        htmlContent: html,
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'Attendance & Leave Portal',
          email: process.env.BREVO_SENDER_EMAIL || 'support@college.edu',
        },
        to: [{ email: to, name: recipientName }],
      };

      if (text) {
        emailPayload.textContent = text;
      }

      const response = await brevoClient.transactionalEmails.sendTransacEmail(emailPayload);
      console.log(`🚀 [Brevo Email Sent] to ${to} | MessageId: ${response?.messageId || 'Success'}`);
      return { success: true, provider: 'brevo', data: response };
    } catch (error) {
      console.error(`❌ [Brevo API Error]: ${error.message}`);
      // Fall through to fallback
    }
  }

  // 2. Fallback to standard SMTP (or Brevo SMTP) if configured
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;
  if (EMAIL_USER && EMAIL_PASS && !EMAIL_USER.includes('<')) {
    try {
      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST || 'smtp-relay.brevo.com',
        port: Number(EMAIL_PORT) || 587,
        secure: Number(EMAIL_PORT) === 465,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: EMAIL_FROM || `"Attendance & Leave Portal" <${EMAIL_USER}>`,
        to,
        subject,
        text: text || '',
        html: html || '',
      });

      console.log(`📧 [SMTP Email Sent] to ${to}: ${info.messageId}`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (smtpError) {
      console.error(`❌ [SMTP Error]: ${smtpError.message}`);
    }
  }

  // 3. Fallback: Local development simulation
  console.log('\n================== 📧 [DEV EMAIL SIMULATION] ==================');
  console.log(`To: ${to} (${recipientName})`);
  console.log(`Subject: ${subject}`);
  console.log(`Content:\n${text || html}`);
  console.log('Tip: Add BREVO_API_KEY and BREVO_SENDER_EMAIL to backend/.env for real delivery.');
  console.log('===============================================================\n');

  return { success: true, simulated: true };
};

export const sendOtpEmail = async (email, otp, name = 'Student') => {
  const subject = `Your Verification OTP for Attendance & Leave Portal`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0;">Email Verification</h2>
      <p style="color: #475569; font-size: 15px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 15px;">Your One-Time Password (OTP) to verify your account is:</p>
      <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">Powered by Brevo Email & Attendance Management Portal</p>
    </div>
  `;
  const text = `Hello ${name},\n\nYour OTP verification code is: ${otp}\nValid for 10 minutes.`;

  return sendEmail({ to: email, subject, html, text, recipientName: name });
};

export const sendStatusNotificationEmail = async (
  email,
  name,
  applicationType,
  status,
  remarks
) => {
  const subject = `Update on your ${applicationType}: ${status}`;
  const statusColor =
    status === 'APPROVED'
      ? '#16a34a'
      : status === 'RECOMMENDED_TO_HOD'
      ? '#2563eb'
      : '#dc2626';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0;">Application Status Update</h2>
      <p style="color: #475569; font-size: 15px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 15px;">Your <strong>${applicationType}</strong> has been updated:</p>
      <div style="background-color: #f8fafc; border-left: 4px solid ${statusColor}; padding: 14px 18px; border-radius: 6px; margin: 16px 0;">
        <div style="font-size: 18px; font-weight: bold; color: ${statusColor};">${status.replace(/_/g, ' ')}</div>
        ${remarks ? `<p style="margin: 8px 0 0; color: #475569; font-size: 14px;"><strong>Remarks:</strong> ${remarks}</p>` : ''}
      </div>
      <p style="color: #64748b; font-size: 13px;">You can view the full details in your Student Dashboard.</p>
    </div>
  `;
  const text = `Hello ${name},\n\nYour ${applicationType} status is now: ${status}.\nRemarks: ${remarks || 'None'}`;

  return sendEmail({ to: email, subject, html, text, recipientName: name });
};
