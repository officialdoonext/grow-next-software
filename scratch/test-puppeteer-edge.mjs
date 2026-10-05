import puppeteer from "puppeteer-core";
import fs from "fs";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function testPdfRender() {
  console.log("Launching Edge via puppeteer-core...");
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();

  // Test with exact preview design HTML
  const testHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
      * { box-sizing: border-box; font-family: 'Sora', -apple-system, sans-serif; }
      body { margin: 0; padding: 24px; color: #1e293b; background: #ffffff; font-size: 12px; }
      .sheet { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px; }
      .header-row { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
      .company-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
      .company-meta { font-size: 11.5px; color: #64748b; line-height: 1.5; }
      .badge-doc { display: inline-block; background: #faf5ff; border: 1px solid #f3e8ff; color: #6024a8; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 6px; }
      .doc-num { font-family: monospace; font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
      .doc-dates { font-size: 11.5px; color: #64748b; line-height: 1.5; text-align: right; }
      .customer-box { margin: 20px 0; padding: 14px; background: #fafafc; border: 1px solid #f1f5f9; border-radius: 6px; }
      .customer-box h4 { margin: 0 0 6px; font-size: 10.5px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
      .customer-name { font-size: 13.5px; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
      .customer-info { font-size: 11.5px; color: #64748b; }
      table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-top: 16px; font-size: 12px; }
      th { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 600; }
      td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
      .discount-text { color: #059669; font-weight: 600; }
      .totals-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
      .totals-box { width: 260px; font-size: 12px; }
      .totals-row { display: flex; justify-content: space-between; padding: 4px 0; color: #64748b; }
      .totals-grand { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1.5px solid #6024a8; font-size: 14.5px; font-weight: 700; color: #6024a8; margin-top: 4px; }
      .notes-box { margin-top: 20px; padding: 12px 14px; background: #fafafc; border-left: 3px solid #6024a8; border-radius: 0 4px 4px 0; font-size: 11.5px; color: #475569; }
      .footer-seal { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10.5px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header-row">
        <div>
          <h2 class="company-title">GrowNext Technologies</h2>
          <div class="company-meta">
            Cyber Towers, Hitec City, Hyderabad<br>
            Phone: +91 9876543210 | Email: official.doonext@gmail.com<br>
            GSTIN: 36ABCDE1234F1Z5
          </div>
        </div>
        <div style="text-align: right;">
          <div class="badge-doc">Quotation</div>
          <div class="doc-num">QT-20261001</div>
          <div class="doc-dates">
            Issue Date: 2026-10-05<br>
            Valid Until: 2026-11-05<br>
            Status: <strong style="color: #059669;">Approved</strong>
          </div>
        </div>
      </div>

      <div class="customer-box">
        <h4>Quotation Prepared For:</h4>
        <div class="customer-name">Acme Enterprises</div>
        <div class="customer-info">Acme Corp Ltd • Phone: +91 9123456780 • Email: billing@acme.com</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>Description</th>
            <th style="width: 50px; text-align: center;">Qty</th>
            <th style="width: 90px; text-align: right;">Unit Price</th>
            <th style="width: 80px; text-align: right;">Discount</th>
            <th style="width: 100px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center; color: #94a3b8;">1</td>
            <td style="font-weight: 500; color: #0f172a;">Enterprise Cloud Infrastructure Setup</td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">₹50,000.00</td>
            <td style="text-align: right;"><span class="discount-text">₹5,000.00</span></td>
            <td style="text-align: right; font-weight: 600;">₹45,000.00</td>
          </tr>
          <tr>
            <td style="text-align: center; color: #94a3b8;">2</td>
            <td style="font-weight: 500; color: #0f172a;">Dedicated 24/7 SLA Engineering Support</td>
            <td style="text-align: center;">3</td>
            <td style="text-align: right;">₹15,000.00</td>
            <td style="text-align: right;"><span style="color: #94a3b8;">—</span></td>
            <td style="text-align: right; font-weight: 600;">₹45,000.00</td>
          </tr>
        </tbody>
      </table>

      <div class="totals-wrap">
        <div class="totals-box">
          <div class="totals-row">
            <span>Items Subtotal:</span>
            <span style="font-weight: 500; color: #1e293b;">₹95,000.00</span>
          </div>
          <div class="totals-row" style="color: #059669; font-weight: 600;">
            <span>Total Discount:</span>
            <span>-₹5,000.00</span>
          </div>
          <div class="totals-grand">
            <span>Grand Total:</span>
            <span>₹90,000.00</span>
          </div>
        </div>
      </div>

      <div class="notes-box">
        <strong style="display: block; margin-bottom: 2px;">Terms & Notes:</strong>
        Payment 50% advance upon proposal acceptance, balance within 30 days of delivery.
      </div>

      <div class="footer-seal">
        Thank you for your business. Official document issued by GrowNext Technologies. Certified digital record.
      </div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(testHtml, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });

  await browser.close();
  console.log("PDF generated! Size:", pdfBuffer.length, "bytes");
  fs.writeFileSync("scratch/preview-replica.pdf", pdfBuffer);
  console.log("Saved scratch/preview-replica.pdf successfully!");
}

testPdfRender().catch((err) => {
  console.error("Puppeteer test failed:", err);
  process.exit(1);
});
