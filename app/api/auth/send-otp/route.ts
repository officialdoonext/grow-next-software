import { NextRequest, NextResponse } from "next/server";
import { generateSecureOtp, hashOtp } from "@/lib/authSecurity";
import { saveOtp } from "@/lib/userService";
import { sendOtpEmail } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Generate secure 6-digit cryptographic OTP
    const otp = generateSecureOtp();

    // Hash OTP with SHA-256 HMAC and secret key
    const hashed = hashOtp(email, otp);

    // Save to Firestore and memory cache with 10-minute expiry
    await saveOtp(email, hashed);

    // Dispatch styled email
    const mailResult = await sendOtpEmail(email, otp);
    if (!mailResult.success && mailResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: `Email delivery failed: ${mailResult.error}. Please check SMTP_HOST and credentials in .env.local.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
    });
  } catch (err: any) {
    console.error("[Send OTP API Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
