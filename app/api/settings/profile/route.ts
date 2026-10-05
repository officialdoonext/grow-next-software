import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/authSecurity";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

    const userDocRef = doc(db, "users", userEmail);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      return NextResponse.json({
        success: true,
        profile: {
          name: "",
          email: userEmail,
          mobile: "",
          businessName: "",
          city: "",
          address: "",
          gstin: "",
          logoUrl: "",
          signatureUrl: "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: snap.id,
        ...snap.data(),
      },
    });
  } catch (err: any) {
    console.error("[Get Settings Profile API Error]", err);
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
    const { name, mobile, businessName, city, address, gstin, logoUrl, signatureUrl } = body;

    const userDocRef = doc(db, "users", userEmail);
    const existingSnap = await getDoc(userDocRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};

    const updatedProfile = {
      ...existingData,
      name: name !== undefined ? String(name).trim() : existingData.name || "",
      mobile: mobile !== undefined ? String(mobile).trim() : existingData.mobile || "",
      businessName: businessName !== undefined ? String(businessName).trim() : existingData.businessName || "",
      city: city !== undefined ? String(city).trim() : existingData.city || "",
      address: address !== undefined ? String(address).trim() : existingData.address || "",
      gstin: gstin !== undefined ? String(gstin).trim() : existingData.gstin || "",
      logoUrl: logoUrl !== undefined ? String(logoUrl).trim() : existingData.logoUrl || "",
      signatureUrl: signatureUrl !== undefined ? String(signatureUrl).trim() : existingData.signatureUrl || "",
      email: userEmail,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, updatedProfile, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Profile settings updated successfully.",
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("[Update Settings Profile API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
