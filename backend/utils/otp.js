const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOTP = async (email, phone, otpCode) => {
  try {
    // Send email OTP
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verify Your Account - Voting System',
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP code is: <strong>${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `
    });

    // Send SMS OTP
    await twilioClient.messages.create({
      body: `Your voting system verification code is: ${otpCode}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log('OTP sent successfully via email and SMS');
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

module.exports = { sendOTP };
