import { NextRequest, NextResponse } from "next/server";
import { verifyOtpHash, createSessionToken } from "@/lib/authSecurity";
import { getStoredOtp, deleteOtp, getUserProfile, validateUserApproval } from "@/lib/userService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();
    const otp = body.otp?.trim();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    const storedOtp = await getStoredOtp(email);

    if (!storedOtp) {
      return NextResponse.json(
        { success: false, error: "No active verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check expiration (10 minutes)
    if (Date.now() > storedOtp.expiresAt) {
      await deleteOtp(email);
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Timing-safe HMAC hash verification
    const isValid = verifyOtpHash(email, otp, storedOtp.hash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Delete OTP once verified (single-use strictly enforced)
    await deleteOtp(email);

    // Check if user profile exists
    const profile = await getUserProfile(email);

    if (!profile) {
      // Profile does not exist yet -> trigger registration form
      return NextResponse.json({
        success: true,
        verified: true,
        hasProfile: false,
        email,
      });
    }

    // Check approval criteria with strict validator:
    // 1. status MUST be active
    // 2. expiryDate MUST NOT be null AND must not be expired
    const { isApproved, reason } = validateUserApproval(profile);

    // Issue response
    const response = NextResponse.json({
      success: true,
      verified: true,
      hasProfile: true,
      isApproved,
      profile,
      reason: !isApproved ? reason : undefined,
    });

    // Issue session token
    const sessionToken = createSessionToken({
      email: profile.email,
      role: profile.role,
      status: profile.status,
      expiryDate: profile.expiryDate,
    });

    response.cookies.set("grownext_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set("grownext_user", profile.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // STRICT APPROVAL COOKIE: "true" only if BOTH conditions are satisfied, else "false"
    response.cookies.set("grownext_approved", isApproved ? "true" : "false", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error("[Verify OTP API Error]", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during verification." },
      { status: 500 }
    );
  }
}
