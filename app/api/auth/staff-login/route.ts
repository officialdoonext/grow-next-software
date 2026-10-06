import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { createSessionToken } from "@/lib/authSecurity";
import { getUserProfile, validateUserApproval } from "@/lib/userService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, mpin, staffId } = body;

    if (!mobile?.trim() || !mpin?.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your Mobile Number and MPIN." },
        { status: 400 }
      );
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, "").trim();
    const cleanMpin = mpin.replace(/[^0-9]/g, "").trim();

    if (cleanMobile.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (cleanMpin.length < 4 || cleanMpin.length > 6) {
      return NextResponse.json(
        { success: false, error: "MPIN must be 4 to 6 digits." },
        { status: 400 }
      );
    }

    let selectedStaffDoc: any = null;

    // STEP A: If specific staffId is chosen from multiple profiles selection
    if (staffId) {
      const docRef = doc(db, "staff", staffId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return NextResponse.json(
          { success: false, error: "Selected staff profile no longer exists." },
          { status: 404 }
        );
      }

      const sData = docSnap.data();
      if (sData.mobile !== cleanMobile || sData.mpin !== cleanMpin) {
        return NextResponse.json(
          { success: false, error: "Credentials did not match this staff profile." },
          { status: 401 }
        );
      }

      if (sData.status === "inactive") {
        return NextResponse.json(
          { success: false, error: "This staff account has been deactivated by the business administrator." },
          { status: 403 }
        );
      }

      selectedStaffDoc = { id: docSnap.id, ...sData };
    } else {
      // STEP B: Search by mobile number across all staff
      const q = query(
        collection(db, "staff"),
        where("mobile", "==", cleanMobile)
      );

      const snap = await getDocs(q);
      const matches: any[] = [];

      snap.forEach((d) => {
        const data = d.data();
        if (data.mpin === cleanMpin && data.status !== "inactive") {
          matches.push({ id: d.id, ...data });
        }
      });

      if (matches.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid Mobile Number or MPIN. Please try again." },
          { status: 401 }
        );
      }

      // If multiple business workspaces exist for this phone number, return profile selection!
      if (matches.length > 1) {
        // Collect business info for each profile
        const profilesWithDetails = await Promise.all(
          matches.map(async (m) => {
            const owner = await getUserProfile(m.userId);
            return {
              staffId: m.id,
              staffName: m.name,
              businessName: owner?.businessName || m.businessName || "Business Workspace",
              ownerEmail: m.userId,
              ownerName: owner?.name || "Business Owner",
              logoUrl: owner?.logoUrl || null,
              allowedCount: Object.values(m.permissions || {}).filter((v) => v !== "none").length,
            };
          })
        );

        return NextResponse.json({
          success: true,
          multipleProfiles: true,
          profiles: profilesWithDetails,
          message: "Multiple business profiles found. Please choose a profile to proceed.",
        });
      }

      selectedStaffDoc = matches[0];
    }

    // Now proceed with log in for selectedStaffDoc
    const ownerEmail = selectedStaffDoc.userId;
    const ownerProfile = await getUserProfile(ownerEmail);

    if (!ownerProfile) {
      return NextResponse.json(
        { success: false, error: "Business account associated with this staff was not found." },
        { status: 404 }
      );
    }

    // Check business license approval
    const { isApproved, reason } = validateUserApproval(ownerProfile);
    if (!isApproved) {
      return NextResponse.json(
        {
          success: false,
          error: reason || "The business license for this workspace is inactive or expired.",
        },
        { status: 403 }
      );
    }

    // Create session token with staff metadata
    const sessionToken = createSessionToken({
      email: ownerProfile.email,
      role: "staff",
      status: ownerProfile.status,
      expiryDate: ownerProfile.expiryDate,
      isStaff: true,
      staffId: selectedStaffDoc.id,
      staffName: selectedStaffDoc.name,
      ownerEmail: ownerProfile.email,
      permissions: selectedStaffDoc.permissions || {},
    });

    // Determine starting page based on staff permissions
    const permissions: Record<string, string> = selectedStaffDoc.permissions || {};
    let redirectUrl = "/dashboard";
    const priorityOrder = [
      { key: "dashboard", url: "/dashboard" },
      { key: "leads", url: "/leads" },
      { key: "quotations", url: "/quotations" },
      { key: "customers", url: "/customers" },
      { key: "invoices", url: "/invoices" },
      { key: "custom_objects", url: "/custom-objects" },
    ];

    for (const item of priorityOrder) {
      if (permissions[item.key] && permissions[item.key] !== "none") {
        redirectUrl = item.url;
        break;
      }
    }

    const response = NextResponse.json({
      success: true,
      multipleProfiles: false,
      redirectUrl,
      staff: {
        id: selectedStaffDoc.id,
        name: selectedStaffDoc.name,
        businessName: ownerProfile.businessName || "Business Workspace",
        ownerEmail: ownerProfile.email,
      },
      permissions,
      message: `Welcome, ${selectedStaffDoc.name}!`,
    });

    // Set 30-day session cookies
    response.cookies.set("grownext_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set("grownext_user", ownerProfile.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set("grownext_approved", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("[Staff Login API Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process staff login." },
      { status: 500 }
    );
  }
}
