import nodemailer from "nodemailer";

const getEmailTemplate = (title, content, buttonText, buttonUrl, footerText) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #4a5568; margin: 0;">${process.env.EMAIL_FROM_NAME || 'Event Management System'}</h1>
    </div>
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px;">
      <h2 style="color: #2d3748; margin-top: 0;">${title}</h2>
      ${content}
      ${buttonUrl ? `
        <div style="text-align: center; margin: 25px 0;">
          <a href="${buttonUrl}" style="display: inline-block; padding: 12px 24px; 
            background-color: #4299e1; color: white; text-decoration: none; 
            border-radius: 4px; font-weight: bold;">${buttonText}</a>
        </div>
      ` : ''}
      <p style="color: #718096; font-size: 0.9em; margin-bottom: 0;">${footerText}</p>
    </div>
    <div style="text-align: center; margin-top: 20px; color: #a0aec0; font-size: 0.8em;">
      © ${new Date().getFullYear()} ${process.env.EMAIL_FROM_NAME || 'Event Management System'}
    </div>
  </div>
`;

const createTransporter = async () => {
  if (process.env.NODE_ENV === 'test') {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

let transporter;
let emailEnabled = false;

(async () => {
  try {
    transporter = await createTransporter();
    await transporter.verify();
    emailEnabled = true;
    console.log('✅ Email server ready');
  } catch (error) {
    console.error('❌ Email connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
})();

const sendEmail = async (mailOptions, emailType = 'email') => {
  if (!emailEnabled) {
    console.warn(`Email service not available - skipping ${emailType}`);
    return { 
      accepted: [], 
      rejected: [mailOptions.to], 
      message: 'Email service not available',
      envelope: { from: mailOptions.from, to: [mailOptions.to] }
    };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    console.log(`${emailType} sent to ${mailOptions.to}`, info.messageId);
    return info;
  } catch (error) {
    console.error(`Error sending ${emailType}:`, error);
    throw new Error(`Failed to send ${emailType}`);
  }
};

export const sendVerificationEmail = async (email, verificationToken) => {
  const encodedToken = encodeURIComponent(verificationToken);
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${encodedToken}`;

  return sendEmail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: "Email Verification",
    html: getEmailTemplate(
      "Verify Your Email",
      `<p>Welcome! Please verify your email address to complete your registration.</p>
       <p style="color: #718096; font-size: 0.9em;">If you didn't create an account, please ignore this email.</p>`,
      "Verify Email",
      verificationUrl,
      "This link will expire in 24 hours."
    )
  }, 'verification email');
};

export const sendWelcomeEmail = async (email, name) => {
  return sendEmail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: "Welcome to Our Platform!",
    html: getEmailTemplate(
      "Welcome!",
      `<p>Hi ${name},</p>
       <p>Thank you for registering with us. We're excited to have you on board!</p>
       <p style="color: #718096; font-size: 0.9em;">Start exploring the platform and enjoy our services.</p>`,
      "Get Started",
      process.env.FRONTEND_URL,
      "Feel free to contact us if you have any questions."
    )
  }, 'welcome email');
};

export const sendOrganizerVerificationEmail = async (email, organizationName, verificationToken) => {
  const encodedToken = encodeURIComponent(verificationToken);
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-organization?token=${encodedToken}`;

  return sendEmail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: "Verify Your Organization",
    html: getEmailTemplate(
      "Verify Your Organization",
      `<p>Please verify your organization <strong>${organizationName}</strong> to start creating events.</p>
       <p style="color: #718096; font-size: 0.9em;">This link will expire in 24 hours.</p>`,
      "Verify Organization",
      verificationUrl,
      "You'll gain access to event creation after verification."
    )
  }, 'organization verification email');
};
export default transporter;