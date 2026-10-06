import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, createSessionToken } from "@/lib/authSecurity";
import { getUserProfile, validateUserApproval } from "@/lib/userService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("grownext_session")?.value;
    const clientUserCookie = req.cookies.get("grownext_user")?.value;
    const emailParam = req.nextUrl.searchParams.get("email");

    let email = emailParam || clientUserCookie;

    let isStaff = false;
    let staffId = "";
    let staffName = "";
    let staffPermissions: Record<string, string> = {};

    if (cookieToken) {
      const verified = verifySessionToken(cookieToken);
      if (verified.valid && verified.payload?.email) {
        email = verified.payload.ownerEmail || verified.payload.email;
        if (verified.payload.isStaff) {
          isStaff = true;
          staffId = verified.payload.staffId || "";
          staffName = verified.payload.staffName || "";
          staffPermissions = verified.payload.permissions || {};
        }
      }
    }

    if (!email) {
      return NextResponse.json({
        authenticated: false,
        isApproved: false,
        user: null,
      });
    }

    // Always fetch latest business owner profile from database
    const profile = await getUserProfile(email);

    if (!profile) {
      return NextResponse.json({
        authenticated: false,
        isApproved: false,
        user: null,
      });
    }

    // Check both conditions using central validator
    const { isApproved, reason } = validateUserApproval(profile);

    const responseUser = {
      ...profile,
      ...(isStaff
        ? {
            isStaff: true,
            staffId,
            staffName,
            name: staffName ? `${staffName} (Staff)` : profile.name,
          }
        : {}),
    };

    const response = NextResponse.json({
      authenticated: true,
      isApproved,
      user: responseUser,
      isStaff,
      staffId: isStaff ? staffId : undefined,
      staffName: isStaff ? staffName : undefined,
      permissions: isStaff ? staffPermissions : undefined,
      reason: !isApproved ? reason : undefined,
    });

    // Refresh 30-day cookies on every check to keep user logged in across reloads
    const sessionToken = createSessionToken({
      email: profile.email,
      role: isStaff ? "staff" : profile.role,
      status: profile.status,
      expiryDate: profile.expiryDate,
      isStaff,
      staffId,
      staffName,
      ownerEmail: profile.email,
      permissions: staffPermissions,
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

    // Strict gatekeeper cookie for middleware protection
    response.cookies.set("grownext_approved", isApproved ? "true" : "false", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error("[Session Check API Error]", err);
    return NextResponse.json({ authenticated: false, isApproved: false, user: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully" });
      response.cookies.set("grownext_session", "", { path: "/", maxAge: 0 });
      response.cookies.set("grownext_user", "", { path: "/", maxAge: 0 });
      response.cookies.set("grownext_approved", "", { path: "/", maxAge: 0 });
      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
