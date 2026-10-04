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

    // Isolated Firestore doc per user in integrations collection
    const docRef = doc(db, "integrations", `${userEmail}_media`);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({
        success: true,
        data: {
          imagekit: { urlEndpoint: "", publicKey: "", privateKey: "", isConfigured: false },
          cloudinary: { cloudName: "", apiKey: "", apiSecret: "", isConfigured: false },
        },
      });
    }

    const data = snap.data();
    return NextResponse.json({
      success: true,
      data: {
        imagekit: {
          urlEndpoint: data.imagekit?.urlEndpoint || "",
          publicKey: data.imagekit?.publicKey || "",
          privateKey: data.imagekit?.privateKey || "",
          isConfigured: !!(data.imagekit?.urlEndpoint && data.imagekit?.publicKey && data.imagekit?.privateKey),
        },
        cloudinary: {
          cloudName: data.cloudinary?.cloudName || "",
          apiKey: data.cloudinary?.apiKey || "",
          apiSecret: data.cloudinary?.apiSecret || "",
          isConfigured: !!(data.cloudinary?.cloudName && data.cloudinary?.apiKey && data.cloudinary?.apiSecret),
        },
        routing: {
          images: data.routing?.images || "imagekit",
          audio: data.routing?.audio || "cloudinary",
          documents: data.routing?.documents || "imagekit",
        },
      },
    });
  } catch (err: any) {
    console.error("[Get Media Integration API Error]", err);
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
    const { provider, data } = body;

    if (!provider || !data) {
      return NextResponse.json(
        { success: false, error: "Provider and integration data are required." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "integrations", `${userEmail}_media`);
    const snap = await getDoc(docRef);
    const existing = snap.exists() ? snap.data() : { userId: userEmail, createdAt: new Date().toISOString() };

    const now = new Date().toISOString();

    if (provider === "imagekit") {
      const { urlEndpoint, publicKey, privateKey } = data;
      if (!urlEndpoint?.trim() || !publicKey?.trim() || !privateKey?.trim()) {
        return NextResponse.json(
          { success: false, error: "Please provide ImageKit URL Endpoint, Public Key, and Private Key." },
          { status: 400 }
        );
      }

      existing.userId = userEmail;
      existing.updatedAt = now;
      existing.imagekit = {
        urlEndpoint: urlEndpoint.trim(),
        publicKey: publicKey.trim(),
        privateKey: privateKey.trim(),
        updatedAt: now,
      };
    } else if (provider === "cloudinary") {
      const { cloudName, apiKey, apiSecret } = data;
      if (!cloudName?.trim() || !apiKey?.trim() || !apiSecret?.trim()) {
        return NextResponse.json(
          { success: false, error: "Please provide Cloudinary Cloud Name, API Key, and API Secret." },
          { status: 400 }
        );
      }

      existing.userId = userEmail;
      existing.updatedAt = now;
      existing.cloudinary = {
        cloudName: cloudName.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        updatedAt: now,
      };
    } else if (provider === "routing" || provider === "selection") {
      const { images, audio, documents } = data;
      existing.userId = userEmail;
      existing.updatedAt = now;
      existing.routing = {
        images: images === "cloudinary" ? "cloudinary" : "imagekit",
        audio: audio === "cloudinary" ? "cloudinary" : "imagekit",
        documents: documents === "cloudinary" ? "cloudinary" : "imagekit",
        updatedAt: now,
      };
    } else {
      return NextResponse.json({ success: false, error: "Unsupported provider." }, { status: 400 });
    }

    await setDoc(docRef, existing, { merge: true });

    const message =
      provider === "routing" || provider === "selection"
        ? "Media file routing preferences saved successfully."
        : `${provider === "imagekit" ? "ImageKit" : "Cloudinary"} credentials saved successfully.`;

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: any) {
    console.error("[Save Media Integration API Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
