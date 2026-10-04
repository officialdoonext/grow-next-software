import { NextRequest, NextResponse } from "next/server";
import { createUserProfile, getUserProfile, validateUserApproval } from "@/lib/userService";
import { createSessionToken } from "@/lib/authSecurity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobile, email, city, address } = body;

    if (!name?.trim() || !mobile?.trim() || !email?.trim() || !city?.trim() || !address?.trim()) {
      return NextResponse.json(
        { success: false, error: "Please fill in all profile fields (Name, Mobile, Email, City, Address)." },
        { status: 400 }
      );
    }

    const norm = email.toLowerCase().trim();

    // Check if already registered - if so, gracefully log in instead of creating duplicate or failing
    const existing = await getUserProfile(norm);
    if (existing) {
      const { isApproved } = validateUserApproval(existing);

      const sessionToken = createSessionToken({
        email: existing.email,
        role: existing.role,
        status: existing.status,
        expiryDate: existing.expiryDate,
      });

      const response = NextResponse.json({
        success: true,
        message: "Profile already registered. Session restored.",
        profile: existing,
        isApproved,
      });

      response.cookies.set("grownext_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      response.cookies.set("grownext_user", existing.email, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      response.cookies.set("grownext_approved", isApproved ? "true" : "false", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    const profile = await createUserProfile({
      name,
      mobile,
      email: norm,
      city,
      address,
    });

    const { isApproved } = validateUserApproval(profile);

    const response = NextResponse.json({
      success: true,
      message: "Profile created successfully. Account is pending admin activation.",
      profile,
      isApproved, // Strictly false on initial creation
    });

    // Set 30-day session cookie so user stays logged in across browser reloads
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

    response.cookies.set("grownext_approved", isApproved ? "true" : "false", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("[Register Profile API Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to create profile. Please try again." },
      { status: 500 }
    );
  }
}
