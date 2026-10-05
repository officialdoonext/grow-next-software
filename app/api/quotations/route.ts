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
import { peekNextDocumentNumber, commitNextDocumentNumber } from "@/lib/sequenceService";

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

    // 1. Preview next sequential Quotation ID
    if (req.nextUrl.searchParams.get("action") === "next-number") {
      const dateParam = req.nextUrl.searchParams.get("date") || undefined;
      const nextNumber = await peekNextDocumentNumber("quotation", userEmail, dateParam);
      return NextResponse.json({ success: true, nextNumber });
    }

    // Query strictly isolated by userId
    const q = query(
      collection(db, "quotations"),
      where("userId", "==", userEmail)
    );

    const snapshot = await getDocs(q);
    const quotations: any[] = [];
    snapshot.forEach((d) => {
      quotations.push({ id: d.id, ...d.data() });
    });

    // Recent first
    quotations.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Strict 24 items limit
    const recentQuotations = quotations.slice(0, 24);

    return NextResponse.json({ success: true, quotations: recentQuotations });
  } catch (err: any) {
    console.error("[Get Quotations API Error]", err);
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
    const {
      customerName,
      title,
      issueDate,
      validUntil,
      amount,
      status,
      notes,
      customAttributes,
    } = body;

    if (!customerName?.trim() || !title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer Name and Proposal Title are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const targetIssueDate = issueDate || now.slice(0, 10);

    // Guaranteed Unique, Auto-Generated Quotation ID (QT-YYYYMMNN)
    const assignedQuotationNumber = await commitNextDocumentNumber(
      "quotation",
      userEmail,
      targetIssueDate
    );

    const newQuotation = {
      quotationNumber: assignedQuotationNumber,
      customerName: customerName.trim(),
      title: title.trim(),
      issueDate: targetIssueDate,
      validUntil: validUntil || "",
      amount: typeof amount === "number" ? amount : parseFloat(amount) || 0,
      status: status || "Draft",
      notes: notes?.trim() || "",
      customAttributes: customAttributes && typeof customAttributes === "object" ? customAttributes : {},
      userId: userEmail, // Strict multi-tenant isolation
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "quotations"), newQuotation);

    return NextResponse.json({
      success: true,
      message: "Quotation created successfully.",
      quotation: { id: docRef.id, ...newQuotation },
    });
  } catch (err: any) {
    console.error("[Create Quotation API Error]", err);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Quotation ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "quotations", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Quotation not found." }, { status: 404 });
    }

    // Multi-tenant check
    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    const cleanUpdates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // quotationNumber is strictly immutable / not editable
    if (updates.customerName !== undefined) cleanUpdates.customerName = String(updates.customerName).trim();
    if (updates.title !== undefined) cleanUpdates.title = String(updates.title).trim();
    if (updates.issueDate !== undefined) cleanUpdates.issueDate = updates.issueDate;
    if (updates.validUntil !== undefined) cleanUpdates.validUntil = updates.validUntil;
    if (updates.amount !== undefined) cleanUpdates.amount = typeof updates.amount === "number" ? updates.amount : parseFloat(updates.amount) || 0;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.notes !== undefined) cleanUpdates.notes = String(updates.notes).trim();

    if (updates.customAttributes && typeof updates.customAttributes === "object") {
      const existingAttrs = snap.data().customAttributes || {};
      cleanUpdates.customAttributes = {
        ...existingAttrs,
        ...updates.customAttributes,
      };
    }

    await updateDoc(docRef, cleanUpdates);

    return NextResponse.json({
      success: true,
      message: "Quotation updated successfully.",
      quotation: { id, ...snap.data(), ...cleanUpdates },
    });
  } catch (err: any) {
    console.error("[Update Quotation API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userEmail = getUserEmailFromReq(req);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Quotation ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "quotations", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Quotation not found." }, { status: 404 });
    }

    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: "Quotation deleted successfully.",
    });
  } catch (err: any) {
    console.error("[Delete Quotation API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
