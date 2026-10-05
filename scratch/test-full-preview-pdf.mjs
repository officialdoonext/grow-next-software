import puppeteer from "puppeteer-core";
import fs from "fs";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function buildExactPreviewHtml(payload) {
  const { docType, document: doc, senderProfile: profile } = payload;
  const isQuotation = docType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "TAX INVOICE";
  const docNumber = doc.documentNumber;
  const dateLabel = isQuotation ? "Issue Date" : "Invoice Date";
  const dateValue = doc.issueDate || "—";
  const secondDateLabel = isQuotation ? "Valid Until" : "Due Date";
  const secondDateValue = (isQuotation ? doc.validUntil : doc.dueDate) || "—";

  const companyLogo = profile?.logoUrl || "";
  const companyName = profile?.businessName || profile?.name || "GrowNext Enterprise";
  const companyPhone = profile?.phone || "";
  const companyEmail = profile?.email || "";
  const companyAddress = profile?.address || profile?.city || "";
  const companyGstin = profile?.gstin || "";

  const items = doc.items && doc.items.length > 0 ? doc.items : [
    { description: doc.title || (isQuotation ? "Project Estimate" : "Professional Services"), qty: 1, amount: doc.amount, discount: 0, subtotal: doc.amount }
  ];
  const itemsSubtotal = items.reduce((acc, it) => acc + ((Number(it.qty) || 1) * (Number(it.amount) || 0)), 0);
  const totalDiscount = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  const grandTotal = doc.amount || Math.max(0, itemsSubtotal - totalDiscount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docTitle} - ${docNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; font-family: 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { margin: 0; padding: 20px; background: #ffffff; color: #1e293b; font-size: 12px; line-height: 1.5; }
    .document-sheet { max-width: 760px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
    .company-col { max-width: 380px; }
    .company-logo { max-height: 40px; max-width: 170px; object-fit: contain; margin-bottom: 8px; display: block; }
    .company-name { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 4px; line-height: 1.2; }
    .company-addr { font-size: 11.5px; color: #64748b; line-height: 1.5; margin: 0 0 4px; }
    .company-meta-items { font-size: 11px; color: #64748b; display: flex; flex-wrap: wrap; gap: 8px; }
    .doc-meta-col { text-align: right; }
    .doc-type-title { font-size: 20px; font-weight: 600; tracking-tight; color: #6024a8; margin: 0 0 2px; }
    .doc-id { font-family: monospace; font-size: 13px; font-weight: 600; color: #1e293b; margin: 0 0 8px; display: block; }
    .doc-meta-dates { font-size: 11.5px; color: #475569; }
    .doc-meta-dates p { margin: 2px 0; }
    .doc-meta-dates .label { color: #94a3b8; }
    .badge-status { text-transform: uppercase; font-size: 10px; font-weight: 600; background: #faf5ff; color: #6024a8; padding: 2px 6px; border-radius: 4px; border: 1px solid #ebdcfc; }
    
    .bill-to-box { margin-top: 24px; background: #fbfafd; border: 1px solid #f1e9fa; border-radius: 6px; padding: 16px; display: flex; justify-content: space-between; }
    .bill-to-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
    .customer-name { font-size: 13.5px; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
    .customer-business { font-size: 12px; font-weight: 500; color: #475569; margin: 0 0 4px; }
    .customer-contact { font-size: 11.5px; color: #64748b; margin: 2px 0; }

    table { width: 100%; border-collapse: collapse; margin-top: 24px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; font-size: 12px; }
    thead tr { background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    th { padding: 10px 12px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tbody tr:hover { background-color: #fafafc; }
    .discount-val { color: #059669; font-weight: 600; }

    .calc-footer { margin-top: 24px; display: flex; justify-content: flex-end; }
    .calc-box { width: 260px; font-size: 12px; }
    .calc-row { display: flex; justify-content: space-between; padding: 4px 0; color: #64748b; }
    .calc-row.discount { color: #059669; font-weight: 600; }
    .calc-grand { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1.5px solid #ebdcfc; font-size: 14.5px; font-weight: 700; color: #6024a8; margin-top: 4px; }

    .terms-card { margin-top: 24px; padding: 14px 16px; background: #faf9fd; border: 1px solid #f1e9fa; border-radius: 6px; font-size: 11.5px; }
    .terms-title { font-size: 10.5px; font-weight: 600; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
    .terms-text { margin: 0; color: #475569; white-space: pre-wrap; line-height: 1.5; }

    .seal-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="document-sheet">
    <!-- Header -->
    <div class="header-row">
      <div class="company-col">
        ${companyLogo ? `<img src="${companyLogo}" class="company-logo" alt="${companyName}" />` : ""}
        <h2 class="company-name">${companyName}</h2>
        ${companyAddress ? `<p class="company-addr">${companyAddress}</p>` : ""}
        <div class="company-meta-items">
          ${companyPhone ? `<span>Phone: ${companyPhone}</span>` : ""}
          ${companyEmail ? `<span>Email: ${companyEmail}</span>` : ""}
          ${companyGstin ? `<span>GSTIN: ${companyGstin}</span>` : ""}
        </div>
      </div>
      <div class="doc-meta-col">
        <h1 class="doc-type-title">${docTitle}</h1>
        <span class="doc-id">${docNumber}</span>
        <div class="doc-meta-dates">
          <p><span class="label">${dateLabel}: </span><strong>${dateValue}</strong></p>
          <p><span class="label">${secondDateLabel}: </span><strong>${secondDateValue}</strong></p>
          <p><span class="label">Status: </span><span class="badge-status">${doc.status || "Draft"}</span></p>
        </div>
      </div>
    </div>

    <!-- Bill / Quote To -->
    <div class="bill-to-box">
      <div>
        <span class="bill-to-label">${isQuotation ? "Quote Prepared For" : "Billed To"}</span>
        <h3 class="customer-name">${doc.customerName}</h3>
        ${doc.businessName ? `<p class="customer-business">${doc.businessName}</p>` : ""}
        ${doc.mobile ? `<p class="customer-contact">Mobile: ${doc.mobile}</p>` : ""}
        ${doc.email ? `<p class="customer-contact">Email: ${doc.email}</p>` : ""}
      </div>
      ${doc.title ? `
      <div>
        <span class="bill-to-label">Subject / Purpose</span>
        <p style="margin: 0; font-size: 12.5px; font-weight: 500; color: #1e293b;">${doc.title}</p>
      </div>
      ` : ""}
    </div>

    <!-- Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Description</th>
          <th style="width: 55px; text-align: center;">Qty</th>
          <th style="width: 95px; text-align: right;">Unit Price</th>
          <th style="width: 85px; text-align: right;">Discount</th>
          <th style="width: 105px; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => `
          <tr>
            <td style="text-align: center; color: #94a3b8;">${idx + 1}</td>
            <td style="font-weight: 500; color: #0f172a;">${it.description || "Line Item"}</td>
            <td style="text-align: center; color: #475569;">${it.qty}</td>
            <td style="text-align: right; color: #475569;">₹${Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;">${it.discount > 0 ? `<span class="discount-val">₹${Number(it.discount).toLocaleString("en-IN")}</span>` : `<span style="color: #94a3b8;">—</span>`}</td>
            <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${Number(it.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="calc-footer">
      <div class="calc-box">
        <div class="calc-row">
          <span>Items Subtotal:</span>
          <span style="font-weight: 500; color: #0f172a;">₹${itemsSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        ${totalDiscount > 0 ? `
          <div class="calc-row discount">
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

    <!-- Notes -->
    ${doc.notes ? `
      <div class="terms-card">
        <span class="terms-title">Terms & Notes:</span>
        <p class="terms-text">${doc.notes}</p>
      </div>
    ` : ""}

    <!-- Footer -->
    <div class="seal-footer">
      Thank you for your business. Certified official document issued via GrowNext Enterprise Suite.
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
  const html = buildExactPreviewHtml({
    docType: "quotation",
    document: {
      documentNumber: "QT-20261001",
      customerName: "Acme Enterprises",
      businessName: "Acme Corp Ltd",
      email: "billing@acme.com",
      mobile: "+91 9123456780",
      issueDate: "2026-10-05",
      validUntil: "2026-11-05",
      status: "Approved",
      items: [
        { description: "Enterprise Cloud Infrastructure Setup", qty: 1, amount: 50000, discount: 5000, subtotal: 45000 },
        { description: "24/7 SLA Engineering Support", qty: 2, amount: 15000, discount: 0, subtotal: 30000 },
      ],
      amount: 75000,
      notes: "Payment 50% advance upon quotation approval.",
    },
    senderProfile: {
      businessName: "GrowNext Technologies",
      phone: "+91 9876543210",
      email: "official.doonext@gmail.com",
      address: "Cyber Towers, Hitec City, Hyderabad",
      gstin: "36ABCDE1234F1Z5",
      logoUrl: "https://ik.imagekit.io/grownext/company-logo.png",
    },
  });

  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });
  await browser.close();

  fs.writeFileSync("scratch/exact-preview-matched.pdf", pdfBuffer);
  console.log("SUCCESS! Generated scratch/exact-preview-matched.pdf of size:", pdfBuffer.length);
}

run().catch((e) => console.error(e));
