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
 * Send an email verification link
 */
export async function sendVerificationEmail(
  recipientEmail: string,
  verificationToken: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify your BrainSequences email address';
  
  const text = `
Hello,

Thank you for signing up for BrainSequences!

Please verify your email address by clicking the link below:

${verifyUrl}

If you didn't sign up for BrainSequences, you can safely ignore this email.

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
 * Send a password reset link
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  
  const subject = 'Reset your BrainSequences password';
  
  const text = `
Hello,

You requested to reset your password for BrainSequences.

Please click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

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
