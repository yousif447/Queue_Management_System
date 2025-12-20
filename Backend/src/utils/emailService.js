// utils/emailService.js
const nodemailer = require("nodemailer");

/**
 * Parse EMAIL_FROM to handle quoted strings
 * Handles formats like: "Name" <email@example.com> or just email@example.com
 */
const parseEmailFrom = () => {
  const emailFrom = process.env.EMAIL_FROM;
  if (!emailFrom) {
    return `"Queue Management System" <${process.env.EMAIL_USER}>`;
  }
  
  // If it's already in the correct format or just an email, return as-is
  // Remove any extra quotes that might cause issues
  return emailFrom.replace(/^["']|["']$/g, '');
};

/**
 * Create and configure email transporter
 */
const createTransporter = () => {
  const mailHost = process.env.EMAIL_HOST;
  const mailPort = parseInt(process.env.EMAIL_PORT);
  // Support both EMAIL_PASSWORD and EMAIL_PASS environment variables
  const mailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

  console.log("📧 Configuring Email Transporter...");
  
  let config = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: mailPass,
    },
    // Add timeout and connection options for better error handling in serverless
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 15000,
    socketTimeout: 15000,
    // Fix for self-signed certificate errors
    tls: {
      rejectUnauthorized: false
    }
  };

  // Optimization for common email services
  if (mailHost.includes('gmail.com')) {
    config.service = 'gmail';
    console.log("🔹 Using pre-configured Gmail service");
  } else {
    config.host = mailHost;
    config.port = mailPort;
    config.secure = mailPort === 465;
    console.log(`🔹 Using custom host: ${mailHost}:${mailPort} (secure: ${config.secure})`);
  }

  return nodemailer.createTransport(config);
};

/**
 * Test SMTP connection
 * @returns {Promise<boolean>} True if connection successful
 */
const testConnection = async () => {
  try {
    const transporter = createTransporter();
    console.log("🔍 Testing SMTP connection...");
    
    await transporter.verify();
    
    console.log("✅ SMTP connection successful!");
    return true;
  } catch (error) {
    console.error("❌ SMTP connection failed!");
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error("\n🔐 Authentication Error - Possible causes:");
      console.error("  1. Incorrect email or password");
      console.error("  2. Need to use App Password (if 2FA enabled)");
      console.error("  3. 'Less secure app access' disabled in Gmail");
      console.error("\n📖 See EMAIL_SETUP.md for detailed instructions");
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error("\n🌐 Connection Error - Possible causes:");
      console.error("  1. Firewall blocking SMTP port 587");
      console.error("  2. Network connectivity issues");
      console.error("  3. Incorrect SMTP host or port");
    } else if (error.code === 'ESOCKET') {
      console.error("\n🔒 SSL Certificate Error - Possible causes:");
      console.error("  1. Corporate proxy intercepting SSL");
      console.error("  2. Antivirus software scanning HTTPS traffic");
      console.error("  3. Network security software doing SSL inspection");
      console.error("\n✅ Already configured to bypass this in development");
    }
    
    return false;
  }
};

/**
 * Send OTP email for password reset
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} options.name - Recipient name (optional)
 */
const sendOTPEmail = async ({ email, otp, name }) => {
  try {
    console.log(`📧 Attempting to send OTP email to: ${email}`);
    
    const transporter = createTransporter();
    const fromAddress = parseEmailFrom();

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: "Password Reset OTP - Queue Management System",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #359487 0%, #2a8074 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                        ${name ? `Hi ${name},` : 'Hello,'}
                      </p>
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                        We received a request to reset your password. Use the OTP code below to reset your password:
                      </p>
                      
                      <!-- OTP Box -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                        <tr>
                          <td align="center" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 2px dashed #359487;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #359487; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${otp}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                        This OTP will expire in <strong style="color: #359487;">10 minutes</strong>.
                      </p>
                      
                      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.5; color: #666666;">
                        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                        Queue Management System
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #999999;">
                        This is an automated email. Please do not reply.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Password Reset OTP
        
        ${name ? `Hi ${name},` : 'Hello,'}
        
        We received a request to reset your password. Use the OTP code below to reset your password:
        
        Your OTP Code: ${otp}
        
        This OTP will expire in 10 minutes.
        
        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        
        Queue Management System
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    console.error("Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const sendNotificationEmail = async ({ email, subject, message, name, type = 'general' }) => {
  try {
    console.log(`📧 Attempting to send notification email to: ${email}`);
    
    const transporter = createTransporter();
    const fromAddress = parseEmailFrom();

    const icons = {
      queue: '🕒',
      ticket: '🎟️',
      payment: '💳',
      general: '📢',
      turn: '🔔'
    };
    
    const icon = icons[type] || icons.general;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: `${icon} ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 30px; text-align: center; background: linear-gradient(135deg, #359487 0%, #2a8074 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">${subject}</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                        ${name ? `Hi ${name},` : 'Hello,'}
                      </p>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #359487; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #555555;">
                          ${message.replace(/\n/g, '<br>')}
                        </p>
                      </div>
                      
                      <p style="margin: 20px 0 0; font-size: 14px; color: #666666;">
                        You can view more details in your dashboard.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0 0 5px; font-size: 14px; color: #666666; font-weight: bold;">
                        Queue Management System
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #999999;">
                        Automated Notification • Do Not Reply
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        ${subject}
        
        ${name ? `Hi ${name},` : 'Hello,'}
        
        ${message}
        
        Queue Management System
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Notification email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Notification email sending failed:", error);
    // Don't throw logic error, just log it so main flow continues
    return { success: false, error: error.message }; 
  }
};

module.exports = {
  sendOTPEmail,
  sendNotificationEmail,
  testConnection,
};