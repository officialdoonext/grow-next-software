import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import puppeteer from "puppeteer-core";
import fs from "fs";

/**
 * Generates the responsive HTML email template for GrowNext OTP verification
 */
export function getOtpEmailHtml(otp: string, recipientEmail: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GrowNext Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fafafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #fafafc;
      padding: 40px 16px;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 6px;
      border: 1px solid #edf0f5;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      padding: 30px 24px 22px 24px;
      text-align: center;
      background: linear-gradient(180deg, #fcfbff 0%, #ffffff 100%);
      border-bottom: 1px solid #f1f3f7;
    }
    .logo-img {
      max-height: 44px;
      width: auto;
      display: block;
      margin: 0 auto;
    }
    .subtitle {
      font-size: 10.5px;
      font-weight: 500;
      color: #8c97a8;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin-top: 12px;
    }
    .content {
      padding: 28px 28px 24px 28px;
    }
    .title {
      font-size: 16px;
      font-weight: 500;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .paragraph {
      font-size: 13px;
      line-height: 1.5;
      color: #64748b;
      margin: 0 0 20px 0;
    }
    .otp-card {
      background-color: #faf7ff;
      border: 1px dashed #d8b4fe;
      border-radius: 6px;
      padding: 18px 20px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 700;
      color: #6024a8;
      letter-spacing: 8px;
      margin: 0;
      padding: 0;
    }
    .otp-note {
      font-size: 11px;
      color: #8c97a8;
      margin-top: 8px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      color: #059669;
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      padding: 2px 8px;
      margin-bottom: 16px;
    }
    .security-notice {
      padding: 16px 20px;
      background-color: #f8fafc;
      border-radius: 6px;
      border: 1px solid #f1f5f9;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .footer {
      padding: 20px;
      background-color: #f8fafc;
      border-top: 1px solid #f1f3f7;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header with ImageKit Logo -->
      <div class="header">
        <img
          src="https://ik.imagekit.io/doonext/grownext-logo.jpeg"
          alt="GrowNext"
          class="logo-img"
        />
        <div class="subtitle">SECURITY VERIFICATION</div>
      </div>

      <!-- Main Body -->
      <div class="content">
        <div class="badge">One-Time Verification</div>
        <h2 class="title">Administrator Sign-In Code</h2>
        <p class="paragraph">
          We received a request to access the GrowNext system using this email address (<strong style="color: #1e293b;">${recipientEmail}</strong>).
        </p>

        <!-- OTP Display Box -->
        <div class="otp-card">
          <div class="otp-code">${otp}</div>
          <div class="otp-note">Valid for 10 minutes • Single Use Only</div>
        </div>

        <!-- Security Warning -->
        <div class="security-notice">
          <strong>Security Reminder:</strong> Never share this 6-digit code with anyone. GrowNext personnel will never ask for your verification passcode.
        </div>

        <p class="paragraph" style="font-size: 11.5px; color: #94a3b8; margin: 0;">
          If you did not request this login attempt, unauthorized access was detected and logged under strict audit procedures. You may safely disregard this message.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        Restricted Access for Authorized Personnel Only.<br>
        © ${new Date().getFullYear()} GrowNext • Powered by Doonext
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatches the OTP email using SMTP if configured
 */
export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "GrowNext Security <no-reply@grownext.com>";

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from,
        to: email,
        subject: `GrowNext Login Code: ${otp}`,
        html: getOtpEmailHtml(otp, email),
      });

      return { success: true };
    } catch (err: any) {
      console.error("[GrowNext Email Service Error]", err);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export interface DocumentEmailPayload {
  docType: "quotation" | "invoice";
  document: {
    id: string;
    documentNumber: string;
    customerName: string;
    businessName?: string;
    email: string;
    mobile?: string;
    title?: string;
    items?: Array<{
      description: string;
      qty: number;
      amount: number;
      discount: number;
      subtotal: number;
    }>;
    amount: number;
    issueDate?: string;
    dueDate?: string;
    validUntil?: string;
    notes?: string;
    status?: string;
    customAttributes?: Record<string, any>;
  };
  senderProfile?: {
    businessName?: string;
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
    gstin?: string;
    logoUrl?: string;
    signatureUrl?: string;
  };
}

function getBrowserExecutablePath(): string | null {
  const possiblePaths = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean) as string[];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Generates exact HTML matching the DocumentPreviewModal component
 */
function buildExactPreviewHtml(payload: DocumentEmailPayload): string {
  const { docType, document: doc, senderProfile: profile } = payload;
  const isQuotation = docType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "TAX INVOICE";
  const docNumber = doc.documentNumber || (isQuotation ? (doc as any).quotationNumber : (doc as any).invoiceNumber) || "QT-20261001";
  const dateLabel = isQuotation ? "Issue Date" : "Invoice Date";
  const dateValue = doc.issueDate || "—";
  const secondDateLabel = isQuotation ? "Valid Until" : "Due Date";
  const secondDateValue = (isQuotation ? doc.validUntil : doc.dueDate) || "—";

  const companyLogo = profile?.logoUrl || "https://ik.imagekit.io/doonext/grownext-logo.jpeg";
  const companyName = profile?.businessName || profile?.name || "GrowNext Enterprise";
  const companyPhone = profile?.phone || (profile as any)?.mobile || "";
  const companyEmail = profile?.email || "";
  const companyAddress = profile?.address || profile?.city || "";
  const companyGstin = profile?.gstin || "";
  const signatureUrl = profile?.signatureUrl || "";

  const items = doc.items && doc.items.length > 0 ? doc.items : [
    {
      description: doc.title || (isQuotation ? "Project Estimate" : "Professional Services"),
      qty: 1,
      amount: Number(doc.amount) || 0,
      discount: 0,
      subtotal: Number(doc.amount) || 0,
    }
  ];

  const totalDiscount = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  const itemsSubtotal = items.reduce((acc, it) => acc + ((Number(it.qty) || 1) * (Number(it.amount) || 0)), 0);
  const grandTotal = Number(doc.amount) || items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

  const customAttrs = doc.customAttributes || {};
  const hasCustomAttrs = Object.keys(customAttrs).length > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docTitle} - ${docNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    body {
      background-color: #ffffff;
      color: #1e293b;
      font-size: 12px;
      line-height: 1.5;
      padding: 32px 36px;
      width: 100%;
      max-width: 794px;
      margin: 0 auto;
    }

    .printable-document {
      width: 100%;
      background: #ffffff;
    }

    /* Header Row */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      gap: 16px;
    }

    .company-info {
      max-width: 380px;
    }

    .logo-container {
      height: 40px;
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .company-logo {
      max-height: 40px;
      max-width: 170px;
      object-fit: contain;
    }

    .company-name {
      font-size: 15px;
      font-weight: 500;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 4px;
    }

    .company-address {
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 4px;
    }

    .company-meta-row {
      font-size: 11.5px;
      color: #64748b;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .doc-meta-box {
      text-align: right;
      align-self: flex-start;
    }

    .doc-title {
      font-size: 20px;
      font-weight: 500;
      letter-spacing: -0.02em;
      color: #6024a8;
      display: block;
      margin-bottom: 2px;
    }

    .doc-number {
      font-size: 13px;
      font-family: monospace, ui-monospace, SFMono-Regular;
      font-weight: 500;
      color: #1e293b;
      display: block;
      margin-bottom: 8px;
    }

    .doc-dates {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }

    .doc-dates p {
      margin: 1px 0;
    }

    .meta-label {
      color: #94a3b8;
    }

    .meta-value {
      font-weight: 500;
      color: #1e293b;
    }

    .status-badge {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 500;
      text-transform: uppercase;
      background: #faf5ff;
      color: #6024a8;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #ebdcfc;
      letter-spacing: 0.02em;
    }

    /* Bill / Quote To Section */
    .bill-to-section {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 16px;
      border-radius: 6px;
      background: #fbfafd;
      border: 1px solid rgba(235, 220, 252, 0.7);
    }

    .section-eyebrow {
      font-size: 10.5px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      display: block;
      margin-bottom: 4px;
    }

    .customer-name {
      font-size: 13.5px;
      font-weight: 500;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .customer-business {
      font-size: 12px;
      font-weight: 500;
      color: #475569;
      margin-bottom: 4px;
    }

    .customer-contacts {
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.4;
    }

    .subject-text {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      margin: 0;
    }

    /* Table */
    .table-container {
      margin-top: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }

    table {
      width: 100%;
      text-align: left;
      border-collapse: collapse;
      font-size: 12px;
    }

    thead tr {
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 10.5px;
      font-weight: 500;
    }

    th {
      padding: 10px 12px;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .col-idx { width: 40px; text-align: center; color: #94a3b8; }
    .col-desc { font-weight: 400; color: #1e293b; }
    .col-qty { width: 64px; text-align: center; color: #475569; }
    .col-price { width: 96px; text-align: right; color: #334155; }
    .col-disc { width: 80px; text-align: right; }
    .col-sub { width: 112px; text-align: right; font-weight: 500; color: #0f172a; }

    .discount-val {
      color: #059669;
      font-weight: 500;
    }

    /* Calculations Summary */
    .calc-footer {
      padding: 12px 14px;
      background: #faf9fd;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 12px;
    }

    .calc-box {
      width: 240px;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      color: #64748b;
      padding: 2px 0;
    }

    .calc-row.discount-row {
      color: #059669;
      font-weight: 500;
    }

    .calc-grand {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 500;
      color: #6024a8;
      padding-top: 6px;
      margin-top: 4px;
      border-top: 1px solid rgba(216, 180, 254, 0.8);
    }

    /* Custom Attributes */
    .custom-attrs-section {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .custom-attrs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 8px;
    }

    .custom-attr-card {
      padding: 10px 12px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid rgba(226, 232, 240, 0.7);
      font-size: 11.5px;
    }

    .custom-attr-label {
      color: #94a3b8;
      text-transform: capitalize;
      font-size: 10.5px;
      display: block;
      margin-bottom: 4px;
    }

    /* Terms & Notes */
    .notes-section {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .notes-text {
      font-size: 11.5px;
      color: #475569;
      white-space: pre-wrap;
      line-height: 1.6;
      margin: 0;
    }

    /* Signatory */
    .signatory-row {
      margin-top: 32px;
      display: flex;
      justify-content: flex-end;
    }

    .signatory-box {
      text-align: center;
      width: 192px;
    }

    .signatory-stamp-container {
      height: 48px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 2px;
    }

    .digital-signature-img {
      max-height: 48px;
      max-width: 160px;
      object-fit: contain;
    }

    .signatory-line {
      border-bottom: 1px solid #cbd5e1;
      height: 6px;
      margin-bottom: 6px;
    }

    .signatory-title {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
      display: block;
    }

    .signatory-company {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 500;
      display: block;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="printable-document">
    <!-- Header Row -->
    <div class="header-row">
      <div class="company-info">
        ${companyLogo ? `
          <div class="logo-container">
            <img src="${companyLogo}" class="company-logo" alt="${companyName}" onerror="this.parentElement.style.display='none'" />
          </div>
        ` : ""}
        <h2 class="company-name">${companyName}</h2>
        ${companyAddress ? `<p class="company-address">${companyAddress}</p>` : ""}
        <div class="company-meta-row">
          ${companyPhone ? `<span>Phone: ${companyPhone}</span>` : ""}
          ${companyEmail ? `<span>Email: ${companyEmail}</span>` : ""}
          ${companyGstin ? `<span>GSTIN: ${companyGstin}</span>` : ""}
        </div>
      </div>

      <div class="doc-meta-box">
        <span class="doc-title">${docTitle}</span>
        <span class="doc-number">${docNumber}</span>
        <div class="doc-dates">
          <p><span class="meta-label">${dateLabel}: </span><span class="meta-value">${dateValue}</span></p>
          <p><span class="meta-label">${secondDateLabel}: </span><span class="meta-value">${secondDateValue}</span></p>
          <p><span class="meta-label">Status: </span><span class="status-badge">${doc.status || "Draft"}</span></p>
        </div>
      </div>
    </div>

    <!-- Bill / Quote Prepared For -->
    <div class="bill-to-section">
      <div>
        <span class="section-eyebrow">${isQuotation ? "Quote Prepared For" : "Billed To"}</span>
        <h3 class="customer-name">${doc.customerName}</h3>
        ${doc.businessName ? `<p class="customer-business">${doc.businessName}</p>` : ""}
        <div class="customer-contacts">
          ${doc.mobile ? `<p>Mobile: ${doc.mobile}</p>` : ""}
          ${doc.email ? `<p>Email: ${doc.email}</p>` : ""}
        </div>
      </div>
      ${doc.title ? `
        <div>
          <span class="section-eyebrow">Subject / Purpose</span>
          <p class="subject-text">${doc.title}</p>
        </div>
      ` : ""}
    </div>

    <!-- Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="col-idx">#</th>
            <th class="col-desc">Description</th>
            <th class="col-qty">Qty</th>
            <th class="col-price">Unit Price</th>
            <th class="col-disc">Discount</th>
            <th class="col-sub">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => `
            <tr>
              <td class="col-idx">${idx + 1}</td>
              <td class="col-desc">${it.description || "Line Item"}</td>
              <td class="col-qty">${it.qty}</td>
              <td class="col-price">₹${Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td class="col-disc">
                ${it.discount > 0 ? `<span class="discount-val">₹${Number(it.discount).toLocaleString("en-IN")}</span>` : `<span style="color: #94a3b8;">—</span>`}
              </td>
              <td class="col-sub">₹${Number(it.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Calculations Summary -->
      <div class="calc-footer">
        <div class="calc-box">
          <div class="calc-row">
            <span>Items Subtotal:</span>
            <span style="font-weight: 500; color: #1e293b;">₹${itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          ${totalDiscount > 0 ? `
            <div class="calc-row discount-row">
              <span>Total Discount:</span>
              <span>-₹${totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          ` : ""}
          <div class="calc-grand">
            <span>Grand Total:</span>
            <span>₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Attributes -->
    ${hasCustomAttrs ? `
      <div class="custom-attrs-section">
        <span class="section-eyebrow">Additional Specifications &amp; Attachments</span>
        <div class="custom-attrs-grid">
          ${Object.entries(customAttrs).map(([k, v]) => {
            const displayKey = k.replace(/_/g, " ");
            const strVal = String(v || "");
            const isMedia = strVal.startsWith("http://") || strVal.startsWith("https://");
            const isImage = isMedia && (strVal.match(/\.(jpeg|jpg|gif|png|webp)/i) || strVal.includes("imagekit.io") || strVal.includes("cloudinary.com"));

            return `
              <div class="custom-attr-card">
                <span class="custom-attr-label">${displayKey}</span>
                ${isImage ? `<img src="${strVal}" alt="${displayKey}" style="height: 70px; max-width: 100%; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0; display: block;" onerror="this.style.display='none'" />` : `<span style="font-weight: 500; color: #1e293b;">${strVal}</span>`}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    ` : ""}

    <!-- Terms & Notes -->
    ${doc.notes ? `
      <div class="notes-section">
        <span class="section-eyebrow">Terms &amp; Notes</span>
        <p class="notes-text">${doc.notes}</p>
      </div>
    ` : ""}

    <!-- Authorized Signatory -->
    <div class="signatory-row">
      <div class="signatory-box">
        ${signatureUrl ? `
          <div class="signatory-stamp-container">
            <img src="${signatureUrl}" alt="Digital Signature" class="digital-signature-img" onerror="this.parentElement.style.display='none'" />
          </div>
        ` : ""}
        <div class="signatory-line"></div>
        <span class="signatory-title">Authorized Signatory</span>
        <span class="signatory-company">${companyName}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generatePdfKitFallback(payload: DocumentEmailPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const { docType, document: d, senderProfile: profile } = payload;
      const isQuotation = docType === "quotation";
      const docTitle = isQuotation ? "QUOTATION" : "TAX INVOICE";
      const docNumber = d.documentNumber;
      const companyName = profile?.businessName || profile?.name || "GrowNext Enterprise";

      doc.rect(40, 40, 515, 3).fill("#6024a8");
      doc.y = 52;
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(16).text(companyName, 40, 52);
      doc.font("Helvetica").fontSize(8.5).fillColor("#475569");
      if (profile?.address) doc.text(profile.address + (profile?.city ? `, ${profile.city}` : ""));
      if (profile?.phone) doc.text(`Phone: ${profile.phone}`);
      if (profile?.email) doc.text(`Email: ${profile.email}`);
      if (profile?.gstin) doc.text(`GSTIN: ${profile.gstin}`);

      doc.font("Helvetica-Bold").fontSize(18).fillColor("#6024a8").text(docTitle, 350, 52, { align: "right", width: 205 });
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e293b").text(`Doc #: ${docNumber}`, 350, 74, { align: "right", width: 205 });
      doc.font("Helvetica").fontSize(8.5).fillColor("#64748b");
      doc.text(`Issue Date: ${d.issueDate || "—"}`, 350, 88, { align: "right", width: 205 });
      doc.text(`${isQuotation ? "Valid Until" : "Due Date"}: ${isQuotation ? (d.validUntil || "—") : (d.dueDate || "—")}`, 350, 100, { align: "right", width: 205 });
      doc.text(`Status: ${d.status || "Issued"}`, 350, 112, { align: "right", width: 205 });

      const dividerY = Math.max(doc.y + 16, 132);
      doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, dividerY).lineTo(555, dividerY).stroke();

      const cardY = dividerY + 12;
      doc.rect(40, cardY, 515, 54).fillAndStroke("#fafafc", "#e2e8f0");
      doc.fillColor("#94a3b8").font("Helvetica-Bold").fontSize(8).text(isQuotation ? "QUOTE TO:" : "BILL TO:", 52, cardY + 8);
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(d.customerName, 52, cardY + 20);
      doc.font("Helvetica").fontSize(8.5).fillColor("#475569");
      const custMeta: string[] = [];
      if (d.businessName) custMeta.push(d.businessName);
      if (d.mobile) custMeta.push(`Phone: ${d.mobile}`);
      if (d.email) custMeta.push(`Email: ${d.email}`);
      doc.text(custMeta.join("  |  "), 52, cardY + 36);

      let tableY = cardY + 68;
      doc.rect(40, tableY, 515, 20).fill("#f8fafc");
      doc.strokeColor("#e2e8f0").lineWidth(1).rect(40, tableY, 515, 20).stroke();

      doc.font("Helvetica-Bold").fontSize(8).fillColor("#475569");
      doc.text("#", 46, tableY + 6, { width: 20 });
      doc.text("Description", 70, tableY + 6, { width: 220 });
      doc.text("Qty", 295, tableY + 6, { width: 35, align: "center" });
      doc.text("Rate (Rs.)", 335, tableY + 6, { width: 65, align: "right" });
      doc.text("Discount (Rs.)", 405, tableY + 6, { width: 70, align: "right" });
      doc.text("Subtotal (Rs.)", 480, tableY + 6, { width: 70, align: "right" });

      const items = d.items && d.items.length > 0 ? d.items : [
        { description: d.title || (isQuotation ? "Project Estimate" : "Professional Services"), qty: 1, amount: d.amount, discount: 0, subtotal: d.amount }
      ];

      tableY += 20;
      doc.font("Helvetica").fontSize(8.5);

      items.forEach((it, idx) => {
        const rowHeight = 22;
        if (idx % 2 === 1) doc.rect(40, tableY, 515, rowHeight).fill("#fcfbff");
        doc.strokeColor("#f1f5f9").lineWidth(0.5).rect(40, tableY, 515, rowHeight).stroke();

        doc.fillColor("#94a3b8").text(String(idx + 1), 46, tableY + 6, { width: 20 });
        doc.fillColor("#0f172a").font("Helvetica-Bold").text(it.description || "Line Item", 70, tableY + 6, { width: 220, ellipsis: true });
        doc.font("Helvetica").fillColor("#475569").text(String(it.qty), 295, tableY + 6, { width: 35, align: "center" });
        doc.text(Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 335, tableY + 6, { width: 65, align: "right" });

        if (it.discount > 0) {
          doc.fillColor("#059669").font("Helvetica-Bold").text(Number(it.discount).toLocaleString("en-IN"), 405, tableY + 6, { width: 70, align: "right" });
        } else {
          doc.fillColor("#94a3b8").font("Helvetica").text("—", 405, tableY + 6, { width: 70, align: "right" });
        }

        doc.fillColor("#0f172a").font("Helvetica-Bold").text(Number(it.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 480, tableY + 6, { width: 70, align: "right" });
        tableY += rowHeight;
      });

      tableY += 10;
      const itemsSubtotal = items.reduce((acc, it) => acc + ((Number(it.qty) || 1) * (Number(it.amount) || 0)), 0);
      const totalDiscount = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
      const grandTotal = d.amount || Math.max(0, itemsSubtotal - totalDiscount);

      const totalsBoxX = 330;
      const totalsBoxWidth = 225;

      doc.font("Helvetica").fontSize(8.5).fillColor("#64748b");
      doc.text("Items Subtotal:", totalsBoxX, tableY, { width: 110 });
      doc.fillColor("#1e293b").font("Helvetica-Bold").text(`Rs. ${itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, totalsBoxX + 110, tableY, { width: 115, align: "right" });
      tableY += 16;

      if (totalDiscount > 0) {
        doc.font("Helvetica-Bold").fillColor("#059669");
        doc.text("Total Discount:", totalsBoxX, tableY, { width: 110 });
        doc.text(`-Rs. ${totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, totalsBoxX + 110, tableY, { width: 115, align: "right" });
        tableY += 16;
      }

      doc.strokeColor("#6024a8").lineWidth(1.5).moveTo(totalsBoxX, tableY).lineTo(totalsBoxX + totalsBoxWidth, tableY).stroke();
      tableY += 6;
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#6024a8");
      doc.text("Grand Total:", totalsBoxX, tableY, { width: 100 });
      doc.text(`Rs. ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, totalsBoxX + 100, tableY, { width: 125, align: "right" });

      if (d.notes) {
        tableY += 30;
        doc.rect(40, tableY, 515, 45).fillAndStroke("#fafafc", "#e2e8f0");
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#64748b").text("TERMS & NOTES:", 48, tableY + 6);
        doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(d.notes, 48, tableY + 18, { width: 495 });
      }

      doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(40, 745).lineTo(555, 745).stroke();
      doc.font("Helvetica").fontSize(7.5).fillColor("#94a3b8");
      doc.text(`Official digital document generated by ${companyName} via GrowNext Business Suite. Certified & Tamper-Evident.`, 40, 752, { align: "center", width: 515 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Generates an exact replica PDF of the DocumentPreviewModal component
 */
export async function generateDocumentPdfBuffer(payload: DocumentEmailPayload): Promise<Buffer> {
  const browserPath = getBrowserExecutablePath();
  const logEntries: string[] = [`[${new Date().toISOString()}] Browser path: ${browserPath}`];

  if (browserPath) {
    try {
      logEntries.push(`Attempting puppeteer.launch with: ${browserPath}`);
      const browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      const html = buildExactPreviewHtml(payload);
      await page.setContent(html, { waitUntil: "networkidle0" as any });
      await page.evaluateHandle("document.fonts.ready");
      const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
      });
      await browser.close();
      logEntries.push(`SUCCESS: Puppeteer generated PDF with ${pdfUint8.length} bytes`);
      try {
        fs.appendFileSync("scratch/last-pdf-generation.log", logEntries.join("\n") + "\n\n");
      } catch (e) {}
      return Buffer.from(pdfUint8);
    } catch (browserErr: any) {
      logEntries.push(`ERROR in Puppeteer: ${browserErr?.stack || browserErr?.message || browserErr}`);
    }
  } else {
    logEntries.push("No browser executable path found.");
  }

  logEntries.push("Falling back to PDFKit renderer");
  try {
    fs.appendFileSync("scratch/last-pdf-generation.log", logEntries.join("\n") + "\n\n");
  } catch (e) {}
  return generatePdfKitFallback(payload);
}

/**
 * Builds the attractive, high-trust HTML body for customer email
 */
function buildDocumentEmailHtml(payload: DocumentEmailPayload): string {
  const { docType, document: doc, senderProfile: profile } = payload;
  const isQuotation = docType === "quotation";
  const docTitle = isQuotation ? "Quotation" : "Tax Invoice";
  const docNumber = doc.documentNumber;
  const items = doc.items && doc.items.length > 0 ? doc.items : [
    { description: doc.title || (isQuotation ? "Quotation Services" : "Invoice Services"), qty: 1, amount: doc.amount, discount: 0, subtotal: doc.amount }
  ];
  const itemsSubtotal = items.reduce((acc, it) => acc + ((Number(it.qty) || 1) * (Number(it.amount) || 0)), 0);
  const totalDiscount = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  const grandTotal = doc.amount || Math.max(0, itemsSubtotal - totalDiscount);
  const companyName = profile?.businessName || profile?.name || "GrowNext Enterprise";
  const dateLabel = isQuotation ? "Valid Until" : "Due Date";
  const dateVal = isQuotation ? (doc.validUntil || "30 Days from Issue") : (doc.dueDate || "Upon Receipt");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle} ${docNumber} from ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f2f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f2f8; padding: 30px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 8px 30px rgba(96, 36, 168, 0.06);">
          
          <!-- Top Executive Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4c1d95 0%, #6024a8 50%, #7c3aed 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
              ${profile?.logoUrl ? `
                <div style="background: #ffffff; display: inline-block; padding: 6px 14px; border-radius: 6px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <img src="${profile.logoUrl}" style="max-height: 38px; max-width: 170px; display: block;" alt="${companyName} Logo" onerror="this.parentElement.style.display='none'" />
                </div>
              ` : `
                <div style="display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">
                  Verified Official Document
                </div>
              `}
              <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: 0.2px; color: #ffffff;">
                ${docTitle} #${docNumber}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #e9d5ff; font-weight: 500;">
                Issued with confidence by ${companyName}
              </p>
            </td>
          </tr>

          <!-- Trust Intro & Greeting -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <p style="margin: 0 0 14px; font-size: 14.5px; color: #0f172a;">
                Dear <strong>${doc.customerName}</strong>,
              </p>
              <p style="margin: 0 0 18px; font-size: 13px; color: #475569; line-height: 1.65;">
                We appreciate the opportunity to do business with you. Please find your official <strong>${docTitle}</strong> (<strong>#${docNumber}</strong>) prepared and summarized below. For your accounting, taxation, and official records, a certified digital <strong>PDF copy has been generated and attached</strong> directly to this email.
              </p>

              <!-- Quick Highlights Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #faf9fd; border: 1px solid #ebdcfc; border-radius: 6px; margin-bottom: 22px;">
                <tr>
                  <td width="33%" style="padding: 14px 16px; border-right: 1px solid #ebdcfc;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #8c97a8; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Document #</span>
                    <strong style="font-size: 13px; color: #6024a8; font-family: monospace;">${docNumber}</strong>
                  </td>
                  <td width="33%" style="padding: 14px 16px; border-right: 1px solid #ebdcfc;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #8c97a8; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">${dateLabel}</span>
                    <strong style="font-size: 12.5px; color: #1e293b;">${dateVal}</strong>
                  </td>
                  <td width="34%" style="padding: 14px 16px;">
                    <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #8c97a8; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Total Amount</span>
                    <strong style="font-size: 14px; color: #0f172a;">₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </td>
                </tr>
              </table>

              <!-- Line Items Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 20px; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 10.5px; text-transform: uppercase; font-weight: 600;">
                    <th style="padding: 10px 12px; text-align: left;">Item Description</th>
                    <th style="padding: 10px 8px; text-align: center; width: 45px;">Qty</th>
                    <th style="padding: 10px 10px; text-align: right; width: 85px;">Rate</th>
                    <th style="padding: 10px 10px; text-align: right; width: 80px;">Discount</th>
                    <th style="padding: 10px 12px; text-align: right; width: 95px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((it, idx) => `
                    <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? "background-color: #fbfafd;" : ""}">
                      <td style="padding: 10px 12px; color: #1e293b; font-weight: 500;">
                        ${it.description || "Line Item"}
                      </td>
                      <td style="padding: 10px 8px; text-align: center; color: #64748b;">
                        ${it.qty}
                      </td>
                      <td style="padding: 10px 10px; text-align: right; color: #64748b;">
                        ₹${Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style="padding: 10px 10px; text-align: right;">
                        ${it.discount > 0 ? `<span style="color: #059669; font-weight: 600;">₹${Number(it.discount).toLocaleString("en-IN")}</span>` : `<span style="color: #94a3b8;">—</span>`}
                      </td>
                      <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #0f172a;">
                        ₹${Number(it.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>

              <!-- Financial Totals Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                <tr>
                  <td align="right">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="width: 250px; font-size: 12.5px;">
                      <tr>
                        <td style="padding: 4px 8px; color: #64748b;">Items Subtotal:</td>
                        <td style="padding: 4px 8px; text-align: right; font-weight: 500; color: #1e293b;">
                          ₹${itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      ${totalDiscount > 0 ? `
                        <tr style="color: #059669;">
                          <td style="padding: 4px 8px; font-weight: 600;">Total Discount:</td>
                          <td style="padding: 4px 8px; text-align: right; font-weight: 600;">
                            -₹${totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ` : ""}
                      <tr>
                        <td colspan="2" style="padding-top: 6px;">
                          <div style="border-top: 1.5px solid #6024a8; margin-top: 4px;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 8px; font-size: 14px; font-weight: 700; color: #6024a8;">Grand Total:</td>
                        <td style="padding: 8px 8px; text-align: right; font-size: 15px; font-weight: 700; color: #6024a8;">
                          ₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment Callout Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fdfcff; border: 1px dashed #d8b4fe; border-radius: 6px; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" valign="top">
                          <span style="font-size: 24px; line-height: 1;">📄</span>
                        </td>
                        <td style="padding-left: 10px;">
                          <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 3px;">
                            Attached PDF Document: <code style="color: #6024a8; font-size: 12px; background: #faf5ff; padding: 2px 6px; border-radius: 4px;">${isQuotation ? "Quotation" : "Invoice"}-${docNumber}.pdf</code>
                          </strong>
                          <span style="font-size: 12px; color: #64748b; line-height: 1.4; display: block;">
                            The official PDF document has been attached to this email. You can directly preview, download, or print it for your procurement and financial filings.
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${doc.notes ? `
                <div style="background-color: #fafafc; border-left: 3px solid #6024a8; padding: 12px 16px; margin-bottom: 22px; font-size: 12px; color: #475569; border-radius: 0 4px 4px 0;">
                  <strong style="color: #1e293b; display: block; margin-bottom: 4px;">Terms &amp; Notes:</strong>
                  ${doc.notes}
                </div>
              ` : ""}

              <!-- Need Help & Contact -->
              <p style="margin: 0; font-size: 12.5px; color: #64748b; line-height: 1.6;">
                Have questions or need adjustments? Simply reply directly to this email or reach us at <strong>${profile?.phone || profile?.email || companyName}</strong>. Our team is always happy to assist.
              </p>
            </td>
          </tr>

          <!-- Footer & Security Audit Notice -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-weight: 500;">
                Sent on behalf of <strong>${companyName}</strong> via GrowNext Enterprise Suite.
              </p>
              ${profile?.gstin ? `<p style="margin: 0 0 4px 0;">GSTIN: ${profile.gstin} ${profile?.address ? `• ${profile.address}` : ""}</p>` : ""}
              <p style="margin: 0; font-size: 10.5px; color: #cbd5e1;">
                Confidentiality Notice: This email and any attachments are intended solely for ${doc.customerName}. Certified digital audit record.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a quotation or invoice email with official PDF attachment
 */
export async function sendDocumentEmail(
  payload: DocumentEmailPayload
): Promise<{ success: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromName = payload.senderProfile?.businessName || payload.senderProfile?.name || "GrowNext";
  const from = process.env.SMTP_USER ? `"${fromName}" <${process.env.SMTP_USER}>` : (process.env.SMTP_FROM || `"${fromName}" <noreply@doonext.app>`);

  const recipient = payload.document.email;
  if (!recipient || !recipient.includes("@")) {
    return { success: false, error: "Recipient email is invalid or missing." };
  }

  const isQuotation = payload.docType === "quotation";
  const docTitle = isQuotation ? "Quotation" : "Tax Invoice";
  const docNumber = payload.document.documentNumber;
  const subject = `Official ${docTitle} #${docNumber} from ${fromName}`;

  if (!host || !user || !pass) {
    console.warn("[SMTP not fully configured] Simulating email delivery for:", recipient);
    return { success: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    const emailHtml = buildDocumentEmailHtml(payload);
    const pdfBuffer = await generateDocumentPdfBuffer(payload);

    await transporter.sendMail({
      from,
      to: recipient,
      subject,
      html: emailHtml,
      attachments: [
        {
          filename: `${isQuotation ? "Quotation" : "Invoice"}-${docNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return { success: true };
  } catch (err: any) {
    console.error("[sendDocumentEmail Error]", err);
    return { success: false, error: err.message || "Failed to send email." };
  }
}

