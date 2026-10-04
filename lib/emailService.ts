import nodemailer from "nodemailer";

/**
 * Generates the responsive HTML email template for GrowNext OTP verification
 */
export function getOtpEmailHtml(otp: string, recipientEmail: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GrowNext Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fafafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #fafafc;
      padding: 40px 16px;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 6px;
      border: 1px solid #edf0f5;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      padding: 30px 24px 22px 24px;
      text-align: center;
      background: linear-gradient(180deg, #fcfbff 0%, #ffffff 100%);
      border-bottom: 1px solid #f1f3f7;
    }
    .logo-img {
      max-height: 44px;
      width: auto;
      display: block;
      margin: 0 auto;
    }
    .subtitle {
      font-size: 10.5px;
      font-weight: 500;
      color: #8c97a8;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin-top: 12px;
    }
    .content {
      padding: 28px 28px 24px 28px;
    }
    .title {
      font-size: 16px;
      font-weight: 500;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .paragraph {
      font-size: 13px;
      line-height: 1.5;
      color: #64748b;
      margin: 0 0 20px 0;
    }
    .otp-card {
      background-color: #faf7ff;
      border: 1px dashed #d8b4fe;
      border-radius: 6px;
      padding: 18px 20px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 700;
      color: #6024a8;
      letter-spacing: 8px;
      margin: 0;
      padding: 0;
    }
    .otp-note {
      font-size: 11px;
      color: #8c97a8;
      margin-top: 8px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      color: #059669;
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      padding: 2px 8px;
      margin-bottom: 16px;
    }
    .security-notice {
      padding: 16px 20px;
      background-color: #f8fafc;
      border-radius: 6px;
      border: 1px solid #f1f5f9;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .footer {
      padding: 20px;
      background-color: #f8fafc;
      border-top: 1px solid #f1f3f7;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header with ImageKit Logo -->
      <div class="header">
        <img
          src="https://ik.imagekit.io/doonext/grownext-logo.jpeg"
          alt="GrowNext"
          class="logo-img"
        />
        <div class="subtitle">SECURITY VERIFICATION</div>
      </div>

      <!-- Main Body -->
      <div class="content">
        <div class="badge">One-Time Verification</div>
        <h2 class="title">Administrator Sign-In Code</h2>
        <p class="paragraph">
          We received a request to access the GrowNext system using this email address (<strong style="color: #1e293b;">${recipientEmail}</strong>).
        </p>

        <!-- OTP Display Box -->
        <div class="otp-card">
          <div class="otp-code">${otp}</div>
          <div class="otp-note">Valid for 10 minutes • Single Use Only</div>
        </div>

        <!-- Security Warning -->
        <div class="security-notice">
          <strong>Security Reminder:</strong> Never share this 6-digit code with anyone. GrowNext personnel will never ask for your verification passcode.
        </div>

        <p class="paragraph" style="font-size: 11.5px; color: #94a3b8; margin: 0;">
          If you did not request this login attempt, unauthorized access was detected and logged under strict audit procedures. You may safely disregard this message.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        Restricted Access for Authorized Personnel Only.<br>
        © ${new Date().getFullYear()} GrowNext • Powered by Doonext
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatches the OTP email using SMTP if configured
 */
export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "GrowNext Security <no-reply@grownext.com>";

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from,
        to: email,
        subject: `GrowNext Login Code: ${otp}`,
        html: getOtpEmailHtml(otp, email),
      });

      return { success: true };
    } catch (err: any) {
      console.error("[GrowNext Email Service Error]", err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}
