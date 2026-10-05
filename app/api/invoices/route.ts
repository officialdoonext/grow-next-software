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

    // 1. Preview next sequential Invoice ID
    if (req.nextUrl.searchParams.get("action") === "next-number") {
      const dateParam = req.nextUrl.searchParams.get("date") || undefined;
      const nextNumber = await peekNextDocumentNumber("invoice", userEmail, dateParam);
      return NextResponse.json({ success: true, nextNumber });
    }

    // Query strictly isolated by userId
    const q = query(
      collection(db, "invoices"),
      where("userId", "==", userEmail)
    );

    const snapshot = await getDocs(q);
    const invoices: any[] = [];
    snapshot.forEach((d) => {
      invoices.push({ id: d.id, ...d.data() });
    });

    // Recent first
    invoices.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Strict 24 items limit
    const recentInvoices = invoices.slice(0, 24);

    return NextResponse.json({ success: true, invoices: recentInvoices });
  } catch (err: any) {
    console.error("[Get Invoices API Error]", err);
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
      businessName,
      mobile,
      email,
      title,
      items,
      issueDate,
      dueDate,
      amount,
      status,
      notes,
      customAttributes,
    } = body;

    if (!customerName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer Name is required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const targetIssueDate = issueDate || now.slice(0, 10);

    // Guaranteed Unique, Auto-Generated Invoice ID (INV-YYYYMMNN)
    const assignedInvoiceNumber = await commitNextDocumentNumber(
      "invoice",
      userEmail,
      targetIssueDate
    );

    const newInvoice = {
      invoiceNumber: assignedInvoiceNumber,
      customerName: customerName.trim(),
      businessName: businessName ? String(businessName).trim() : "",
      mobile: mobile ? String(mobile).trim() : "",
      email: email ? String(email).trim().toLowerCase() : "",
      title: title ? String(title).trim() : "",
      items: Array.isArray(items) ? items : [],
      issueDate: targetIssueDate,
      dueDate: dueDate || "",
      amount: typeof amount === "number" ? amount : parseFloat(amount) || 0,
      status: status || "Draft",
      notes: notes?.trim() || "",
      customAttributes: customAttributes && typeof customAttributes === "object" ? customAttributes : {},
      userId: userEmail, // Strict multi-tenant isolation
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "invoices"), newInvoice);

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully.",
      invoice: { id: docRef.id, ...newInvoice },
    });
  } catch (err: any) {
    console.error("[Create Invoice API Error]", err);
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
      return NextResponse.json({ success: false, error: "Invoice ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "invoices", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
    }

    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    const cleanUpdates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // invoiceNumber is strictly immutable / not editable
    if (updates.customerName !== undefined) cleanUpdates.customerName = String(updates.customerName).trim();
    if (updates.businessName !== undefined) cleanUpdates.businessName = String(updates.businessName).trim();
    if (updates.mobile !== undefined) cleanUpdates.mobile = String(updates.mobile).trim();
    if (updates.email !== undefined) cleanUpdates.email = String(updates.email).trim().toLowerCase();
    if (updates.title !== undefined) cleanUpdates.title = String(updates.title).trim();
    if (updates.items !== undefined && Array.isArray(updates.items)) cleanUpdates.items = updates.items;
    if (updates.issueDate !== undefined) cleanUpdates.issueDate = updates.issueDate;
    if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate;
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
      message: "Invoice updated successfully.",
      invoice: { id, ...snap.data(), ...cleanUpdates },
    });
  } catch (err: any) {
    console.error("[Update Invoice API Error]", err);
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
      return NextResponse.json({ success: false, error: "Invoice ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "invoices", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
    }

    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully.",
    });
  } catch (err: any) {
    console.error("[Delete Invoice API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
