import puppeteer from "puppeteer-core";
import fs from "fs";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function buildExactPreviewHtml(payload) {
  const { docType, document: doc, senderProfile: profile } = payload;
  const isQuotation = docType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "TAX INVOICE";
  const docNumber = doc.documentNumber || (isQuotation ? doc.quotationNumber : doc.invoiceNumber) || "QT-20261001";
  const dateLabel = isQuotation ? "Issue Date" : "Invoice Date";
  const dateValue = doc.issueDate || "—";
  const secondDateLabel = isQuotation ? "Valid Until" : "Due Date";
  const secondDateValue = (isQuotation ? doc.validUntil : doc.dueDate) || "—";

  const companyLogo = profile?.logoUrl || "https://ik.imagekit.io/doonext/grownext-logo.jpeg";
  const companyName = profile?.businessName || profile?.name || "GrowNext Enterprise";
  const companyPhone = profile?.phone || profile?.mobile || "";
  const companyEmail = profile?.email || "";
  const companyAddress = profile?.address || profile?.city || "";
  const companyGstin = profile?.gstin || "";

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

    /* Container matching DocumentPreviewModal #printable-document */
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

    .signatory-line {
      border-bottom: 1px solid #cbd5e1;
      height: 32px;
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
        <div class="logo-container">
          <img src="${companyLogo}" class="company-logo" alt="${companyName}" />
        </div>
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
                ${isImage ? `<img src="${strVal}" alt="${displayKey}" style="height: 70px; max-width: 100%; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0; display: block;" />` : `<span style="font-weight: 500; color: #1e293b;">${strVal}</span>`}
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
        <div class="signatory-line"></div>
        <span class="signatory-title">Authorized Signatory</span>
        <span class="signatory-company">${companyName}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

  const mockPayload = {
    docType: "quotation",
    document: {
      id: "qt-101",
      quotationNumber: "QT-20261001",
      customerName: "Alex Rivera",
      businessName: "Vertex Technologies Pvt Ltd",
      email: "alex@vertextech.com",
      mobile: "+91 98765 43210",
      title: "Cloud Infrastructure Setup & Maintenance",
      items: [
        {
          description: "Production Kubernetes Cluster Deployment",
          qty: 1,
          amount: 65000,
          discount: 5000,
          subtotal: 60000,
        },
        {
          description: "High-Availability Redis & PostgreSQL",
          qty: 2,
          amount: 15000,
          discount: 2000,
          subtotal: 28000,
        },
      ],
      amount: 88000,
      issueDate: "2026-10-05",
      validUntil: "2026-11-04",
      status: "Approved",
      notes: "Payment: 50% advance on PO confirmation, balance upon deployment handover.\nWarranty & SLA coverage valid for 12 months.",
    },
    senderProfile: {
      businessName: "GrowNext Solutions",
      name: "GrowNext Enterprise",
      email: "official.doonext@gmail.com",
      phone: "+91 80088 12345",
      address: "Tech Hub Tower, HITEC City",
      city: "Hyderabad, India",
      gstin: "36AAACG1234F1Z5",
      logoUrl: "https://ik.imagekit.io/doonext/grownext-logo.jpeg",
    },
  };

  const html = buildExactPreviewHtml(mockPayload);
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");

  const screenshotPath = "C:\\Users\\Arumulla SivaKrishna\\.gemini\\antigravity-ide\\brain\\5eeb0d9c-63e5-483b-9564-86475ddc487c\\preview-capture.png";
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Screenshot written to:", screenshotPath);

  const pdfUint8 = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
  });
  fs.writeFileSync("scratch/preview-exact-A4.pdf", Buffer.from(pdfUint8));
  console.log("PDF written to scratch/preview-exact-A4.pdf, size:", pdfUint8.length);

  await browser.close();
}

run();
