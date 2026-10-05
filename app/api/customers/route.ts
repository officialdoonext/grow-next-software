import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/authSecurity";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  getDoc,
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

    // Query by userId without requiring manual composite index
    const q = query(
      collection(db, "customers"),
      where("userId", "==", userEmail)
    );

    const snapshot = await getDocs(q);
    const customers: any[] = [];
    snapshot.forEach((d) => {
      customers.push({ id: d.id, ...d.data() });
    });

    // Sort recent first
    customers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Strictly limit 24 items
    const recentCustomers = customers.slice(0, 24);

    return NextResponse.json({ success: true, customers: recentCustomers });
  } catch (err: any) {
    console.error("[Get Customers API Error]", err);
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
    const { name, mobile, email, city } = body;

    if (!name?.trim() || !mobile?.trim() || !city?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer Name, Mobile Number, and City are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newCustomer = {
      name: name.trim(),
      mobile: mobile.trim(),
      email: email?.trim() ? email.trim().toLowerCase() : "",
      city: city.trim(),
      userId: userEmail, // Strict multi-tenant isolation
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "customers"), newCustomer);

    return NextResponse.json({
      success: true,
      message: "Customer added successfully.",
      customer: { id: docRef.id, ...newCustomer },
    });
  } catch (err: any) {
    console.error("[Create Customer API Error]", err);
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
      return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "customers", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    // Verify ownership
    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this customer." }, { status: 403 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ success: true, message: "Customer deleted successfully." });
  } catch (err: any) {
    console.error("[Delete Customer API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
