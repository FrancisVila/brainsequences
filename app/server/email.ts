import nodemailer from 'nodemailer';

// SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'noreply.brainsequences@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Send a collaboration invitation email
 */
export async function sendInvitationEmail(
  recipientEmail: string,
  inviterName: string,
  sequenceTitle: string,
  invitationToken: string
): Promise<void> {
  const acceptUrl = `${APP_URL}/invitations/accept?token=${invitationToken}`;
  
  const subject = `You've been invited to collaborate on "${sequenceTitle}"`;
  
  const text = `
Hello,

${inviterName} has invited you to collaborate on the brain sequence named "${sequenceTitle}" on BrainSequences. BrainSequences is an educational application designed to help students, or the general public, to understand how different areas of the brain interact and function together, in different situations of life.

You can accept this invitation by clicking the link below:

${acceptUrl}

This invitation will expire in 7 days.

If you don't have an account yet, you'll be prompted to create one before accepting the invitation.

Best regards,
BrainSequences Team
`.trim();

  await transporter.sendMail({
    from: `"BrainSequences" <${SMTP_USER}>`,
    to: recipientEmail,
    subject,
    text,
  });
}

/**
 * Verify email configuration is valid (for testing)
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
