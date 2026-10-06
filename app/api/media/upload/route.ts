import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/authSecurity";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import crypto from "crypto";

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

export async function POST(req: NextRequest) {
  try {
    const userEmail = getUserEmailFromReq(req);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mediaType = (formData.get("mediaType") as string) || "image"; // "image" | "audio"

    if (!file) {
      return NextResponse.json({ success: false, error: "No media file provided." }, { status: 400 });
    }

    // 1. Fetch user's media credentials and routing from Firestore
    const docRef = doc(db, "integrations", `${userEmail}_media`);
    const snap = await getDoc(docRef);
    const mediaConfig = snap.exists() ? snap.data() : null;

    const imagekit = mediaConfig?.imagekit;
    const cloudinary = mediaConfig?.cloudinary;
    const routing = mediaConfig?.routing || { images: "imagekit", audio: "cloudinary" };

    // Determine chosen provider based on mediaType and routing preference
    let chosenProvider = mediaType === "audio" ? (routing.audio || "cloudinary") : (routing.images || "imagekit");

    // Check if chosen provider is actually configured with required keys
    const isImagekitReady = Boolean(imagekit?.urlEndpoint && imagekit?.publicKey && imagekit?.privateKey);
    const isCloudinaryReady = Boolean(cloudinary?.cloudName && cloudinary?.apiKey && cloudinary?.apiSecret);

    if (chosenProvider === "imagekit" && !isImagekitReady && isCloudinaryReady) {
      chosenProvider = "cloudinary";
    } else if (chosenProvider === "cloudinary" && !isCloudinaryReady && isImagekitReady) {
      chosenProvider = "imagekit";
    }

    // Convert file to buffer and base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || (mediaType === "audio" ? "audio/mpeg" : "image/jpeg");
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || `media_${Date.now()}`;

    // 2. Perform upload to ImageKit
    if (chosenProvider === "imagekit" && isImagekitReady) {
      const ikFormData = new FormData();
      ikFormData.append("file", dataUri);
      ikFormData.append("fileName", cleanFileName);
      ikFormData.append("useUniqueFileName", "true");
      ikFormData.append("folder", `/grownext/${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}/${mediaType}`);

      const authHeader = "Basic " + Buffer.from(imagekit.privateKey + ":").toString("base64");

      const ikResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: ikFormData,
      });

      const ikResult = await ikResponse.json();

      if (!ikResponse.ok || !ikResult.url) {
        console.error("[ImageKit Upload Error]", ikResult);
        throw new Error(ikResult.message || "Failed to upload file to ImageKit.");
      }

      return NextResponse.json({
        success: true,
        url: ikResult.url,
        fileId: ikResult.fileId,
        provider: "imagekit",
        fileName: ikResult.name || cleanFileName,
      });
    }

    // 3. Perform upload to Cloudinary
    if (chosenProvider === "cloudinary" && isCloudinaryReady) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = `grownext/${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}/${mediaType}`;
      
      // Generate Cloudinary SHA-1 signature
      const strToSign = `folder=${folder}&timestamp=${timestamp}${cloudinary.apiSecret}`;
      const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

      const cldFormData = new FormData();
      cldFormData.append("file", dataUri);
      cldFormData.append("api_key", cloudinary.apiKey);
      cldFormData.append("timestamp", timestamp.toString());
      cldFormData.append("folder", folder);
      cldFormData.append("signature", signature);

      const resourceType = mediaType === "audio" ? "video" : "auto";
      const cldResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: cldFormData,
        }
      );

      const cldResult = await cldResponse.json();

      if (!cldResponse.ok || (!cldResult.secure_url && !cldResult.url)) {
        console.error("[Cloudinary Upload Error]", cldResult);
        throw new Error(cldResult.error?.message || "Failed to upload file to Cloudinary.");
      }

      return NextResponse.json({
        success: true,
        url: cldResult.secure_url || cldResult.url,
        provider: "cloudinary",
        fileName: cleanFileName,
      });
    }

    // 4. Fallback if neither integration is configured yet
    // If credentials are not set up in Integrations, inform user but return dataUri so testing works seamlessly
    return NextResponse.json({
      success: true,
      url: dataUri,
      provider: "local",
      fileName: cleanFileName,
      warning: "Cloud media provider not configured in Integrations > Media. Saved as local data URL.",
    });
  } catch (err: any) {
    console.error("[Media Upload API Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload media file." },
      { status: 500 }
    );
  }
}
