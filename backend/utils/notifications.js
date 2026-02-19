// backend/utils/notifications.js - COMPLETE VERSION

const nodemailer = require("nodemailer");
const axios = require("axios");

/* ====================================
   EMAIL TRANSPORTER SETUP
   ==================================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ====================================
   SEND OTP VIA MSG91 SMS
   ==================================== */
const sendOtpSMS = async (phoneNumber, otp) => {
  try {
    const cleanPhone = phoneNumber.replace(/\s+/g, "").replace(/^\+91/, "");
    
    const url = `https://control.msg91.com/api/v5/flow/`;
    
    const payload = {
      template_id: "your_template_id", // You can get this from MSG91 dashboard
      short_url: "0",
      recipients: [
        {
          mobiles: `91${cleanPhone}`,
          var1: otp, // OTP variable
        },
      ],
    };

    const response = await axios.post(url, payload, {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ SMS sent to ${cleanPhone}:`, response.data);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error("❌ MSG91 SMS Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND WELCOME EMAIL AFTER REGISTRATION
   ==================================== */
const sendWelcomeEmail = async (toEmail, voterName) => {
  try {
    const mailOptions = {
      from: `"Anna Adarsh College" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "🎉 Welcome to Anna Adarsh College Election System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Welcome to Anna Adarsh College Elections!</h2>
          
          <p>Dear <strong>${voterName}</strong>,</p>
          
          <p>Thank you for registering with the Anna Adarsh College Election System. Your account has been successfully created!</p>
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>✅ Status:</strong> Account Created</p>
            <p style="margin: 10px 0 0 0;"><strong>📅 Date:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Log in to your account</li>
            <li>Go to <strong>Settings</strong> page</li>
            <li>Submit your KYC documents (Aadhaar, PAN, Election ID)</li>
            <li>Wait for admin approval</li>
            <li>Once approved, you can vote!</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:8081/login" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            If you did not create this account, please ignore this email or contact the election committee.
          </p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Anna Adarsh College Election Committee</strong></p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${toEmail}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND KYC APPROVAL EMAIL
   ==================================== */
const sendKycApprovalEmail = async (toEmail, voterName) => {
  try {
    const mailOptions = {
      from: `"Anna Adarsh College" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "✅ KYC Verification Approved - Anna Adarsh Election",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #10b981; text-align: center;">KYC Verification Approved!</h2>
          
          <p>Dear <strong>${voterName}</strong>,</p>
          
          <p>Great news! Your identity verification (KYC) has been approved by the election committee.</p>
          
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0;"><strong>✅ Status:</strong> KYC Approved</p>
            <p style="margin: 10px 0 0 0;"><strong>📅 Date:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          
          <p><strong>🎉 You can now vote in the Anna Adarsh College Elections!</strong></p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:8081/login" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login & Cast Your Vote
            </a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Anna Adarsh College Election Committee</strong></p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ KYC approval email sent to ${toEmail}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Failed to send KYC approval email to ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND KYC APPROVAL SMS VIA MSG91
   ==================================== */
const sendKycApprovalSMS_MSG91 = async (phoneNumber, voterName) => {
  try {
    const cleanPhone = phoneNumber.replace(/\s+/g, "").replace(/^\+91/, "");
    
    const message = `Hi ${voterName}, Your KYC has been approved! You can now vote in Anna Adarsh College Elections. Login at http://localhost:8081`;
    
    const url = `https://control.msg91.com/api/sendhttp.php`;
    
    const params = {
      authkey: process.env.MSG91_AUTH_KEY,
      mobiles: `91${cleanPhone}`,
      message: message,
      sender: process.env.MSG91_SENDER_ID || "ANNELC",
      route: process.env.MSG91_ROUTE || "4",
      country: "91",
    };

    const response = await axios.get(url, { params });
    
    console.log(`✅ KYC approval SMS sent to ${cleanPhone}`);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error(`❌ Failed to send KYC approval SMS:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpSMS,
  sendWelcomeEmail,
  sendKycApprovalEmail,
  sendKycApprovalSMS_MSG91,
};