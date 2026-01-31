import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('Testing email with:');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);

try {
  await transporter.verify();
  console.log('✅ SMTP connection verified successfully!');
  
  await transporter.sendMail({
    from: `"BrainSequences Test" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER, // Send to yourself
    subject: 'Test Email',
    text: 'This is a test email from BrainSequences.',
  });
  console.log('✅ Test email sent successfully!');
} catch (error) {
  console.error('❌ Email test failed:', error.message);
  console.error('Full error:', error);
}
