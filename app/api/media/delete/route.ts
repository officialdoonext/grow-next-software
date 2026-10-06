import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/authSecurity";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
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

    const body = await req.json();
    const { fileUrl, fileId, entityType, entityId, attributeKey } = body;

    if (!fileUrl && !fileId) {
      return NextResponse.json(
        { success: false, error: "fileUrl or fileId is required for deletion." },
        { status: 400 }
      );
    }

    // 1. Fetch user's media integrations
    const docRef = doc(db, "integrations", `${userEmail}_media`);
    const snap = await getDoc(docRef);
    const mediaConfig = snap.exists() ? snap.data() : null;

    const imagekit = mediaConfig?.imagekit;
    const cloudinary = mediaConfig?.cloudinary;

    let deletedFromCloud = false;
    let cloudProvider = "none";
    let cloudError: string | null = null;

    // 2. IMAGEKIT DELETION
    const isImageKit =
      Boolean(fileUrl && (fileUrl.includes("imagekit.io") || fileUrl.includes("ik.imagekit.io"))) ||
      Boolean(fileId && imagekit?.privateKey);

    if (isImageKit && imagekit?.privateKey) {
      try {
        const authHeader = "Basic " + Buffer.from(imagekit.privateKey + ":").toString("base64");
        let targetFileId = fileId;

        // If fileId not supplied directly, search ImageKit by fileName
        if (!targetFileId && fileUrl) {
          try {
            const cleanUrl = fileUrl.split("?")[0];
            const rawFileName = cleanUrl.split("/").pop();
            if (rawFileName) {
              const decodedFileName = decodeURIComponent(rawFileName);
              const searchRes = await fetch(
                `https://api.imagekit.io/v1/files?name=${encodeURIComponent(decodedFileName)}`,
                {
                  headers: { Authorization: authHeader },
                }
              );

              if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (Array.isArray(searchData) && searchData.length > 0) {
                  // Find exact url match or match by name
                  const matched =
                    searchData.find((f: any) => f.url === fileUrl || f.name === decodedFileName) ||
                    searchData[0];
                  targetFileId = matched?.fileId;
                }
              }
            }
          } catch (searchErr) {
            console.warn("[ImageKit File Search Warning]", searchErr);
          }
        }

        if (targetFileId) {
          const ikDeleteRes = await fetch(`https://api.imagekit.io/v1/files/${targetFileId}`, {
            method: "DELETE",
            headers: { Authorization: authHeader },
          });

          if (ikDeleteRes.ok || ikDeleteRes.status === 204 || ikDeleteRes.status === 404) {
            deletedFromCloud = true;
            cloudProvider = "imagekit";
          } else {
            const errData = await ikDeleteRes.text();
            console.warn("[ImageKit Delete Warning]", ikDeleteRes.status, errData);
            cloudError = `ImageKit delete failed: ${ikDeleteRes.status}`;
          }
        } else {
          cloudError = "Could not locate fileId in ImageKit.";
        }
      } catch (ikErr: any) {
        console.error("[ImageKit Deletion Error]", ikErr);
        cloudError = ikErr.message;
      }
    }

    // 3. CLOUDINARY DELETION
    const isCloudinary = Boolean(
      fileUrl && (fileUrl.includes("cloudinary.com") || fileUrl.includes("res.cloudinary.com"))
    );

    if (isCloudinary && cloudinary?.cloudName && cloudinary?.apiKey && cloudinary?.apiSecret) {
      try {
        // Extract public_id: usually after /upload/v<version>/ or /upload/
        const cleanUrl = fileUrl.split("?")[0];
        const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        const publicId = match ? match[1] : null;

        if (publicId) {
          const timestamp = Math.floor(Date.now() / 1000);
          const resourceType =
            cleanUrl.includes("/video/") || cleanUrl.includes("/audio/") || cleanUrl.match(/\.(mp3|wav|m4a|aac|ogg)$/i)
              ? "video"
              : "image";

          const strToSign = `public_id=${publicId}&timestamp=${timestamp}${cloudinary.apiSecret}`;
          const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

          const cldFormData = new FormData();
          cldFormData.append("public_id", publicId);
          cldFormData.append("api_key", cloudinary.apiKey);
          cldFormData.append("timestamp", timestamp.toString());
          cldFormData.append("signature", signature);

          const cldRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${resourceType}/destroy`,
            {
              method: "POST",
              body: cldFormData,
            }
          );

          if (cldRes.ok) {
            deletedFromCloud = true;
            cloudProvider = "cloudinary";
          }
        }
      } catch (cldErr: any) {
        console.error("[Cloudinary Deletion Error]", cldErr);
      }
    }

    // 4. FIRESTORE DOCUMENT UPDATE
    // If entityType, entityId, and attributeKey are provided, remove this attribute from the document
    if (entityType && entityId && attributeKey) {
      const collectionMap: Record<string, string> = {
        leads: "leads",
        lead: "leads",
        quotations: "quotations",
        quotation: "quotations",
        invoices: "invoices",
        invoice: "invoices",
        customers: "customers",
        customer: "customers",
      };

      const targetCol = collectionMap[entityType.toLowerCase()];
      if (targetCol) {
        const entityDocRef = doc(db, targetCol, entityId);
        const entitySnap = await getDoc(entityDocRef);

        if (entitySnap.exists()) {
          const docData = entitySnap.data();
          // Multi-tenant check
          if (docData.userId === userEmail) {
            const currentAttrs = { ...(docData.customAttributes || {}) };
            delete currentAttrs[attributeKey];

            await updateDoc(entityDocRef, {
              customAttributes: currentAttrs,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedFromCloud,
      cloudProvider,
      cloudError,
      message: deletedFromCloud
        ? `File deleted from ${cloudProvider} and record updated.`
        : "File removed from record.",
    });
  } catch (err: any) {
    console.error("[Media Delete Route Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete media." },
      { status: 500 }
    );
  }
}
