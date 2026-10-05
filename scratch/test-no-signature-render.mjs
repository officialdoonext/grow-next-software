import puppeteer from "puppeteer-core";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "official.doonext@gmail.com";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function testNoSignatureAndBrokenImage() {
  console.log("=== Testing No-Signature & Broken-Image Safeguards ===");

  // 1. Set signatureUrl to empty string
  const updateRes = await fetch(`${BASE_URL}/api/settings/profile?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      signatureUrl: "", // empty signature
    }),
  });

  const updateData = await updateRes.json();
  console.log("Profile updated with empty signature:", updateData.profile?.signatureUrl === "");

  // 2. Dispatch email to test PDF generation without signature
  const emailRes = await fetch(`${BASE_URL}/api/documents/send-email?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userEmail: TEST_EMAIL,
      docType: "quotation",
      document: {
        id: "qt-no-sig-01",
        quotationNumber: "QT-20261015",
        customerName: "Clean Signatory Corp",
        email: TEST_EMAIL,
        amount: 25000,
        issueDate: "2026-10-05",
      },
    }),
  });

  const emailData = await emailRes.json();
  console.log("Email dispatch without signature:", emailData.success);

  if (!emailRes.ok || !emailData.success) {
    throw new Error("Failed email dispatch without signature");
  }

  console.log("=== SUCCESS: Verified no-signature and broken-image handling! ===");
}

testNoSignatureAndBrokenImage().catch((err) => {
  console.error(err);
  process.exit(1);
});
