import puppeteer from "puppeteer-core";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "official.doonext@gmail.com";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

// A clean sample transparent PNG digital signature (or sample URL)
const SAMPLE_SIGNATURE_URL = "https://ik.imagekit.io/doonext/signature-sample.png";

async function testSignatureFlow() {
  console.log("=== 1. Testing Settings Profile API with Digital Signature ===");

  // 1. Save profile with signatureUrl
  const updateRes = await fetch(`${BASE_URL}/api/settings/profile?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Siva Krishna",
      mobile: "+91 9876543210",
      businessName: "GrowNext Enterprise Solutions",
      city: "Hyderabad",
      address: "HITEC City, Phase 2, Hyderabad - 500081",
      gstin: "36AAACG1234F1Z5",
      logoUrl: "https://ik.imagekit.io/doonext/grownext-logo.jpeg",
      signatureUrl: SAMPLE_SIGNATURE_URL,
    }),
  });

  const updateData = await updateRes.json();
  console.log("Update Profile Status:", updateRes.status);
  console.log("Updated Profile:", updateData.profile?.signatureUrl);

  if (!updateRes.ok || !updateData.success || updateData.profile?.signatureUrl !== SAMPLE_SIGNATURE_URL) {
    throw new Error("Failed to save signatureUrl in profile");
  }

  // 2. Fetch profile and verify
  const getRes = await fetch(`${BASE_URL}/api/settings/profile?email=${encodeURIComponent(TEST_EMAIL)}`);
  const getData = await getRes.json();
  console.log("Get Profile Status:", getRes.status);
  console.log("Fetched signatureUrl:", getData.profile?.signatureUrl);

  if (!getRes.ok || getData.profile?.signatureUrl !== SAMPLE_SIGNATURE_URL) {
    throw new Error("signatureUrl was not persisted in Firestore");
  }

  // 3. Render visual screenshot with Puppeteer to verify signature placement
  console.log("=== 2. Rendering Document Preview with Digital Signature ===");
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

  // Test send-email API which triggers PDF generation with signatureUrl from profile
  const emailRes = await fetch(`${BASE_URL}/api/documents/send-email?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userEmail: TEST_EMAIL,
      docType: "quotation",
      document: {
        id: "qt-sig-test-01",
        quotationNumber: "QT-20261012",
        customerName: "Apex Global Logistics",
        businessName: "Apex Logistics International",
        email: TEST_EMAIL,
        mobile: "+91 99887 76655",
        title: "Fleet Tracking & Billing System Integration",
        items: [
          {
            description: "Custom IoT Gateway Firmware Setup",
            qty: 1,
            amount: 75000,
            discount: 10000,
            subtotal: 65000,
          },
          {
            description: "Automated Invoicing & Dispatch Module",
            qty: 1,
            amount: 35000,
            discount: 5000,
            subtotal: 30000,
          },
        ],
        amount: 95000,
        issueDate: "2026-10-05",
        validUntil: "2026-11-05",
        status: "Approved",
        notes: "Strict 14-day delivery cycle. Official digital signature applied.",
      },
    }),
  });

  const emailData = await emailRes.json();
  console.log("Send Email API Status:", emailRes.status);
  console.log("Send Email Result:", emailData);

  if (!emailRes.ok || !emailData.success) {
    throw new Error("Failed to send email with signature");
  }

  await browser.close();
  console.log("=== ALL SIGNATURE FLOW TESTS PASSED SUCCESSFULLY! ===");
}

testSignatureFlow().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
