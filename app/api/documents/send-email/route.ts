import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendDocumentEmail, DocumentEmailPayload } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get("email");
    const body = await req.json();

    const userEmail = (queryEmail || body.userEmail || "").trim().toLowerCase();
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Authenticated user email is required." },
        { status: 401 }
      );
    }

    const { docType, document } = body;
    if (!docType || !document) {
      return NextResponse.json(
        { success: false, error: "Missing docType or document payload." },
        { status: 400 }
      );
    }

    const recipientEmail = (document.email || "").trim().toLowerCase();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Customer does not have a valid email address configured." },
        { status: 400 }
      );
    }

    // Fetch sender profile details for company branding
    let senderProfile: DocumentEmailPayload["senderProfile"] = {
      email: userEmail,
    };

    try {
      const userDocSnap = await getDoc(doc(db, "users", userEmail));
      if (userDocSnap.exists()) {
        const udata = userDocSnap.data();
        senderProfile = {
          name: udata.name || "",
          businessName: udata.businessName || udata.name || "GrowNext Enterprise",
          email: userEmail,
          phone: udata.phone || udata.mobile || "",
          city: udata.city || "",
          address: udata.address || "",
          gstin: udata.gstin || "",
          logoUrl: udata.logoUrl || "",
          signatureUrl: udata.signatureUrl || "",
        };
      }
    } catch (profileErr) {
      console.warn("[Profile fetch warning]", profileErr);
    }

    const documentNumber = document.quotationNumber || document.invoiceNumber || document.id;

    const emailPayload: DocumentEmailPayload = {
      docType,
      document: {
        id: document.id,
        documentNumber,
        customerName: document.customerName,
        businessName: document.businessName,
        email: recipientEmail,
        mobile: document.mobile,
        title: document.title,
        items: document.items || [],
        amount: Number(document.amount) || 0,
        issueDate: document.issueDate,
        dueDate: document.dueDate,
        validUntil: document.validUntil,
        notes: document.notes,
        status: document.status,
        customAttributes: document.customAttributes,
      },
      senderProfile,
    };

    const result = await sendDocumentEmail(emailPayload);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to dispatch email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${docType === "invoice" ? "Invoice" : "Quotation"} ${documentNumber} was successfully emailed to ${recipientEmail} with the official PDF attachment.`,
    });
  } catch (error: any) {
    console.error("[Document Email API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
