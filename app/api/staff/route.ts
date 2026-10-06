import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/authSecurity";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getUserProfile } from "@/lib/userService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getUserEmailFromReq(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("grownext_session")?.value;
  if (cookieToken) {
    const verified = verifySessionToken(cookieToken);
    if (verified.valid && verified.payload?.email) {
      return verified.payload.ownerEmail || verified.payload.email.toLowerCase().trim();
    }
  }

  const clientUserCookie = req.cookies.get("grownext_user")?.value;
  if (clientUserCookie) {
    return clientUserCookie.toLowerCase().trim();
  }

  const emailParam = req.nextUrl.searchParams.get("email");
  if (emailParam) {
    return emailParam.toLowerCase().trim();
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const userEmail = getUserEmailFromReq(req);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    // Query strictly filtered by userId (multi-tenant isolation)
    const q = query(
      collection(db, "staff"),
      where("userId", "==", userEmail)
    );

    const snapshot = await getDocs(q);
    const staffList: any[] = [];
    snapshot.forEach((d) => {
      staffList.push({ id: d.id, ...d.data() });
    });

    // Sort recent first
    staffList.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Limit to 24 items per rule
    const recentStaff = staffList.slice(0, 24);

    return NextResponse.json({ success: true, staff: recentStaff });
  } catch (err: any) {
    console.error("[Get Staff API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userEmail = getUserEmailFromReq(req);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, mobile, mpin, permissions } = body;

    if (!name?.trim() || !mobile?.trim() || !mpin?.trim()) {
      return NextResponse.json(
        { success: false, error: "Staff Name, Mobile Number, and MPIN are required." },
        { status: 400 }
      );
    }

    // Clean inputs
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

    // Check if staff with this mobile already exists for THIS user
    const existingQ = query(
      collection(db, "staff"),
      where("userId", "==", userEmail),
      where("mobile", "==", cleanMobile)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      return NextResponse.json(
        { success: false, error: "A staff member with this mobile number already exists in your workspace." },
        { status: 400 }
      );
    }

    // Get owner's business name
    const ownerProfile = await getUserProfile(userEmail);
    const businessName = ownerProfile?.businessName || ownerProfile?.name || "Business Workspace";

    const now = new Date().toISOString();
    const newStaff = {
      name: name.trim(),
      mobile: cleanMobile,
      mpin: cleanMpin,
      permissions: permissions && typeof permissions === "object" ? permissions : {},
      status: "active",
      userId: userEmail, // Strict multi-tenant isolation
      businessName,
      ownerEmail: userEmail,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "staff"), newStaff);

    return NextResponse.json({
      success: true,
      message: "Staff member added successfully.",
      staff: { id: docRef.id, ...newStaff },
    });
  } catch (err: any) {
    console.error("[Create Staff API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userEmail = getUserEmailFromReq(req);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, mobile, mpin, permissions, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "staff", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    // Multi-tenant security check
    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access to this staff member." }, { status: 403 });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name?.trim()) updates.name = name.trim();
    if (mobile?.trim()) {
      const cleanMobile = mobile.replace(/[^0-9]/g, "").trim();
      if (cleanMobile.length < 10) {
        return NextResponse.json({ success: false, error: "Invalid mobile number." }, { status: 400 });
      }
      updates.mobile = cleanMobile;
    }
    if (mpin?.trim()) {
      const cleanMpin = mpin.replace(/[^0-9]/g, "").trim();
      if (cleanMpin.length < 4 || cleanMpin.length > 6) {
        return NextResponse.json({ success: false, error: "MPIN must be 4 to 6 digits." }, { status: 400 });
      }
      updates.mpin = cleanMpin;
    }
    if (permissions && typeof permissions === "object") {
      updates.permissions = permissions;
    }
    if (status === "active" || status === "inactive") {
      updates.status = status;
    }

    await updateDoc(docRef, updates);

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully.",
      staff: { id, ...snap.data(), ...updates },
    });
  } catch (err: any) {
    console.error("[Update Staff API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userEmail = getUserEmailFromReq(req);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "staff", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    // Verify ownership
    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this staff member." }, { status: 403 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ success: true, message: "Staff member removed successfully." });
  } catch (err: any) {
    console.error("[Delete Staff API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
