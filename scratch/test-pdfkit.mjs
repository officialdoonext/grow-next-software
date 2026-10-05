import PDFDocument from "pdfkit";
import fs from "fs";

function testPdf() {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const buffers = [];
  doc.on("data", (chunk) => buffers.push(chunk));
  doc.on("end", () => {
    const pdfBuf = Buffer.concat(buffers);
    console.log("Generated PDF Buffer size:", pdfBuf.length, "bytes");
    fs.writeFileSync("scratch/sample-test.pdf", pdfBuf);
    console.log("Saved scratch/sample-test.pdf successfully!");
  });

  // Header
  doc.fillColor("#6024a8").fontSize(20).text("QUOTATION", { align: "right" });
  doc.fillColor("#64748b").fontSize(10).text("QT-20261001", { align: "right" });
  doc.moveDown(1);

  doc.fillColor("#0f172a").fontSize(16).text("GrowNext Technologies");
  doc.fillColor("#475569").fontSize(10).text("Cyber Towers, Hitec City, Hyderabad");
  doc.text("GSTIN: 36ABCDE1234F1Z5 | Phone: +91 9876543210");
  doc.moveDown(1.5);

  doc.rect(40, doc.y, 515, 60).fillAndStroke("#fafafc", "#e2e8f0");
  doc.fillColor("#64748b").fontSize(9).text("QUOTE TO:", 50, doc.y - 50);
  doc.fillColor("#0f172a").fontSize(12).text("Acme Enterprises", 50, doc.y);
  doc.fillColor("#64748b").fontSize(9).text("Email: billing@acme.com | Mobile: +91 9123456780", 50, doc.y);
  doc.moveDown(2);

  doc.end();
}

testPdf();
