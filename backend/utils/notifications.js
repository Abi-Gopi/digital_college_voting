// backend/utils/notifications.js - UPDATED WITH WELCOME EMAIL

const nodemailer = require("nodemailer");

/* ====================================
   EMAIL CONFIGURATION
   ==================================== */
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/* ====================================
   SEND OTP VIA SMS (MSG91)
   ==================================== */
const sendOtpSMS = async (phoneNumber, otp) => {
  try {
    const axios = require("axios");
    
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || "ANNELC";

    if (!authKey) {
      console.log("⚠️ MSG91 not configured. OTP:", otp);
      return { success: false, error: "MSG91 not configured", otp };
    }

    // Remove +91 prefix if present
    const cleanPhone = phoneNumber.replace(/^\+91/, "").replace(/\s+/g, "");

    const message = `Your OTP for Anna Adarsh College Election registration is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

    const url = `https://api.msg91.com/api/v2/sendsms`;

    const response = await axios.post(url, {
      sender: senderId,
      route: "4",
      country: "91",
      sms: [
        {
          message: message,
          to: [cleanPhone],
        },
      ],
    }, {
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ OTP SMS sent to ${cleanPhone}`);
    return { success: true, response: response.data };
    
  } catch (error) {
    console.error("❌ OTP SMS failed:", error.message);
    return { success: false, error: error.message, otp };
  }
};

/* ====================================
   SEND WELCOME EMAIL (After Registration)
   ==================================== */
const sendWelcomeEmail = async (to, voterName) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: `"Anna Adarsh College" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "🎉 Welcome to Anna Adarsh College Election System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">🎉 Welcome to Anna Adarsh Elections!</h2>
          
          <p>Dear <strong>${voterName}</strong>,</p>
          
          <p>Thank you for registering for the Anna Adarsh College Election System!</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">📋 Next Steps:</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li><strong>KYC Verification:</strong> Your account is pending KYC verification by our admin team</li>
              <li><strong>Email Notification:</strong> You'll receive an email once your KYC is approved</li>
              <li><strong>Start Voting:</strong> After approval, you can log in and cast your vote</li>
            </ol>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>⏳ Pending Status:</strong> Your KYC verification is currently under review. This usually takes 24-48 hours.</p>
          </div>
          
          <p><strong>Your Registration Details:</strong></p>
          <ul>
            <li>📧 Email: ${to}</li>
            <li>📅 Registered On: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</li>
          </ul>
          
          <p style="margin-top: 30px;">If you have any questions, please contact the election admin.</p>
          
          <p>Best regards,<br><strong>Anna Adarsh College Election Committee</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${to}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error("❌ Welcome email failed:", error);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND KYC APPROVAL EMAIL
   ==================================== */
const sendKycApprovalEmail = async (to, voterName) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: `"Anna Adarsh College" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "✅ KYC Verification Approved - Anna Adarsh Election",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">🎉 KYC Verification Approved!</h2>
          
          <p>Dear <strong>${voterName}</strong>,</p>
          
          <p>Congratulations! Your identity verification (KYC) has been successfully approved by our admin team.</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>✅ Status:</strong> Verified</p>
            <p style="margin: 10px 0 0 0;"><strong>📅 Approved On:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          
          <p>You are now eligible to participate in the upcoming college elections. You can:</p>
          <ul>
            <li>✅ Cast your vote during the election period</li>
            <li>✅ View election results</li>
            <li>✅ Access all voter features</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/login" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Vote
            </a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Anna Adarsh College Election Committee</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ KYC approval email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND KYC APPROVAL SMS
   ==================================== */
const sendKycApprovalSMS_MSG91 = async (phoneNumber, voterName) => {
  try {
    const axios = require("axios");
    
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || "ANNELC";

    if (!authKey) {
      console.log("⚠️ MSG91 not configured, skipping SMS");
      return { success: false, error: "MSG91 not configured" };
    }

    const cleanPhone = phoneNumber.replace(/^\+91/, "").replace(/\s+/g, "");
    const message = `Hi ${voterName}, Your KYC has been approved! You can now vote in Anna Adarsh College Elections. Login at ${process.env.FRONTEND_URL || 'http://localhost:8081'}`;

    const url = `https://api.msg91.com/api/v2/sendsms`;

    const response = await axios.post(url, {
      sender: senderId,
      route: "4",
      country: "91",
      sms: [
        {
          message: message,
          to: [cleanPhone],
        },
      ],
    }, {
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ KYC SMS sent:", response.data);
    return { success: true, response: response.data };
    
  } catch (error) {
    console.error("❌ KYC SMS failed:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpSMS,
  sendWelcomeEmail,
  sendKycApprovalEmail,
  sendKycApprovalSMS_MSG91,
};