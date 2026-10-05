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

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getUserEmailFromReq(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("grownext_session")?.value;
  if (cookieToken) {
    const verified = verifySessionToken(cookieToken);
    if (verified.valid && verified.payload?.email) {
      return verified.payload.email.toLowerCase().trim();
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

    // Query strictly filtered by userId
    const q = query(
      collection(db, "leads"),
      where("userId", "==", userEmail)
    );

    const snapshot = await getDocs(q);
    const leads: any[] = [];
    snapshot.forEach((d) => {
      leads.push({ id: d.id, ...d.data() });
    });

    // Sort recent first
    leads.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Strictly limit to 24 items
    const recentLeads = leads.slice(0, 24);

    return NextResponse.json({ success: true, leads: recentLeads });
  } catch (err: any) {
    console.error("[Get Leads API Error]", err);
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
    const { customerName, businessName, mobile, email, customAttributes } = body;

    if (!customerName?.trim() || !businessName?.trim() || !mobile?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer Name, Business Name, and Mobile Number are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newLead = {
      customerName: customerName.trim(),
      businessName: businessName.trim(),
      mobile: mobile.trim(),
      email: email?.trim() ? email.trim().toLowerCase() : "",
      customAttributes: customAttributes && typeof customAttributes === "object" ? customAttributes : {},
      userId: userEmail, // Strict multi-tenant isolation
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "leads"), newLead);

    return NextResponse.json({
      success: true,
      message: "Lead added successfully.",
      lead: { id: docRef.id, ...newLead },
    });
  } catch (err: any) {
    console.error("[Create Lead API Error]", err);
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
      return NextResponse.json({ success: false, error: "Lead ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "leads", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    }

    // Verify ownership
    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this lead." }, { status: 403 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ success: true, message: "Lead deleted successfully." });
  } catch (err: any) {
    console.error("[Delete Lead API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userEmail = getUserEmailFromReq(req);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { id, customAttributes } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Lead ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "leads", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    }

    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    const currentAttrs = snap.data().customAttributes || {};
    const updatedAttrs = { ...currentAttrs, ...customAttributes };

    await updateDoc(docRef, {
      customAttributes: updatedAttrs,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Lead updated successfully." });
  } catch (err: any) {
    console.error("[Patch Lead API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
