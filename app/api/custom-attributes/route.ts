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

    const entityParam = req.nextUrl.searchParams.get("entity");

    // Strictly multi-tenant isolated by userId
    const q = query(
      collection(db, "custom_attributes"),
      where("userId", "==", userEmail)
    );

    const snapshot = await getDocs(q);
    const attributes: any[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      attributes.push({ id: d.id, ...data });
    });

    // In-memory filter by entity if specified
    const filtered = entityParam
      ? attributes.filter((a) => a.entity?.toLowerCase() === entityParam.toLowerCase())
      : attributes;

    // Sort by createdAt ascending (so schema maintains orderly sequence)
    filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

    return NextResponse.json({ success: true, attributes: filtered });
  } catch (err: any) {
    console.error("[Get Custom Attributes API Error]", err);
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
    const { name, dataType, options, mandatory, defaultValue, entity } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Attribute name is required." },
        { status: 400 }
      );
    }

    const validDataTypes = ["String", "Integer", "Boolean", "List"];
    if (!validDataTypes.includes(dataType)) {
      return NextResponse.json(
        { success: false, error: `Invalid data type. Must be one of: ${validDataTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const validEntities = ["leads", "customers", "quotations", "invoices"];
    const targetEntity = (entity || "customers").toLowerCase();
    if (!validEntities.includes(targetEntity)) {
      return NextResponse.json(
        { success: false, error: `Invalid entity. Must be one of: ${validEntities.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate unique slug key for the attribute
    const slugKey = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `attr_${Date.now()}`;

    // List validation
    let cleanOptions: string[] = [];
    if (dataType === "List") {
      if (!Array.isArray(options) || options.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one option value is required for List data type." },
          { status: 400 }
        );
      }
      cleanOptions = options.map((opt: any) => String(opt).trim()).filter(Boolean);
      if (cleanOptions.length === 0) {
        return NextResponse.json(
          { success: false, error: "Please provide valid non-empty list values." },
          { status: 400 }
        );
      }
    }

    // Format defaultValue based on dataType
    let formattedDefault: any = defaultValue ?? "";
    if (dataType === "Boolean") {
      formattedDefault = Boolean(defaultValue === true || defaultValue === "true" || defaultValue === "Yes");
    } else if (dataType === "Integer") {
      formattedDefault = defaultValue !== undefined && defaultValue !== "" && !isNaN(Number(defaultValue))
        ? parseInt(String(defaultValue), 10)
        : "";
    } else if (dataType === "String") {
      formattedDefault = defaultValue !== undefined ? String(defaultValue).trim() : "";
    } else if (dataType === "List") {
      formattedDefault = defaultValue !== undefined ? String(defaultValue).trim() : "";
      if (formattedDefault && !cleanOptions.includes(formattedDefault)) {
        cleanOptions.push(formattedDefault);
      }
    }

    const now = new Date().toISOString();
    const newAttribute = {
      name: name.trim(),
      key: slugKey,
      dataType,
      options: cleanOptions,
      mandatory: Boolean(mandatory),
      defaultValue: formattedDefault,
      entity: targetEntity,
      userId: userEmail, // Strict multi-tenant isolation
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "custom_attributes"), newAttribute);

    return NextResponse.json({
      success: true,
      message: "Custom attribute created successfully.",
      attribute: { id: docRef.id, ...newAttribute },
    });
  } catch (err: any) {
    console.error("[Create Custom Attribute API Error]", err);
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
      return NextResponse.json({ success: false, error: "Attribute ID is required." }, { status: 400 });
    }

    const docRef = doc(db, "custom_attributes", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: "Attribute not found." }, { status: 404 });
    }

    // Verify ownership
    if (snap.data().userId !== userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this attribute." }, { status: 403 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ success: true, message: "Custom attribute deleted successfully." });
  } catch (err: any) {
    console.error("[Delete Custom Attribute API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
