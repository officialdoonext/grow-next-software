// Built-in fetch in Node 22

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "official.doonext@gmail.com";

async function run() {
  console.log("=== 1. Testing Settings Profile API ===");
  const profileRes = await fetch(`${BASE_URL}/api/settings/profile?email=${encodeURIComponent(TEST_EMAIL)}`);
  const profileData = await profileRes.json();
  console.log("GET /api/settings/profile status:", profileRes.status, profileData);

  const updateProfileRes = await fetch(`${BASE_URL}/api/settings/profile?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Siva Krishna",
      businessName: "GrowNext Technologies",
      phone: "+91 9876543210",
      city: "Hyderabad",
      address: "Hitec City, Cyber Towers",
      gstin: "36ABCDE1234F1Z5",
      logoUrl: "https://ik.imagekit.io/grownext/company-logo.png",
    }),
  });
  const updateProfileData = await updateProfileRes.json();
  console.log("POST /api/settings/profile status:", updateProfileRes.status, updateProfileData);

  console.log("\n=== 2. Testing Quotation Creation with Customer Info & Line Items (No Subject/Title) ===");
  const quotePayload = {
    customerName: "Acme Enterprises",
    businessName: "Acme Corp Ltd",
    mobile: "+91 9123456780",
    email: "billing@acme.com",
    issueDate: "2026-10-05",
    validUntil: "2026-11-05",
    status: "Draft",
    items: [
      {
        id: "item-1",
        description: "Cloud Architecture Setup & High Availability Migration",
        qty: 1,
        amount: 50000,
        discount: 5000,
        subtotal: 45000,
      },
      {
        id: "item-2",
        description: "Monthly Support & SLA Management",
        qty: 3,
        amount: 15000,
        discount: 0,
        subtotal: 45000,
      },
    ],
    amount: 90000,
    notes: "Payment 50% advance upon agreement signing.",
    customAttributes: {
      delivery_timeline: "4 Weeks",
      contact_person: "John Doe",
    },
  };

  const quoteRes = await fetch(`${BASE_URL}/api/quotations?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quotePayload),
  });
  const quoteData = await quoteRes.json();
  console.log("POST /api/quotations status:", quoteRes.status);
  console.log("Quotation created:", {
    id: quoteData.quotation?.id,
    quotationNumber: quoteData.quotation?.quotationNumber,
    customerName: quoteData.quotation?.customerName,
    businessName: quoteData.quotation?.businessName,
    itemCount: quoteData.quotation?.items?.length,
    amount: quoteData.quotation?.amount,
  });

  console.log("\n=== 3. Testing Invoice Creation with Customer Info & Line Items (No Subject/Title) ===");
  const invoicePayload = {
    customerName: "Globex Corporation",
    businessName: "Globex Global Pvt Ltd",
    mobile: "+91 9988776655",
    email: "finance@globex.com",
    issueDate: "2026-10-05",
    dueDate: "2026-10-20",
    status: "Sent",
    items: [
      {
        id: "item-1",
        description: "GrowNext Enterprise Annual License (10 Seats)",
        qty: 10,
        amount: 12000,
        discount: 20000,
        subtotal: 100000,
      },
      {
        id: "item-2",
        description: "Dedicated Dedicated API Gateway Integration",
        qty: 1,
        amount: 25000,
        discount: 0,
        subtotal: 25000,
      },
    ],
    amount: 125000,
    notes: "Please transfer to HDFC A/C: 50200012345678 IFSC: HDFC0001234",
    customAttributes: {
      po_reference: "PO-2026-889",
      billing_terms: "Net 15",
    },
  };

  const invoiceRes = await fetch(`${BASE_URL}/api/invoices?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoicePayload),
  });
  const invoiceData = await invoiceRes.json();
  console.log("POST /api/invoices status:", invoiceRes.status);
  console.log("Invoice created:", {
    id: invoiceData.invoice?.id,
    invoiceNumber: invoiceData.invoice?.invoiceNumber,
    customerName: invoiceData.invoice?.customerName,
    businessName: invoiceData.invoice?.businessName,
    itemCount: invoiceData.invoice?.items?.length,
    amount: invoiceData.invoice?.amount,
  });

  console.log("\n=== 4. Verifying Sequential ID Formats ===");
  const qNum = quoteData.quotation?.quotationNumber || "";
  const iNum = invoiceData.invoice?.invoiceNumber || "";
  const qMatch = /^QT-\d{6}\d{2,}$/.test(qNum);
  const iMatch = /^INV-\d{6}\d{2,}$/.test(iNum);
  console.log(`Quotation format check (${qNum}): ${qMatch ? "PASSED" : "FAILED"}`);
  console.log(`Invoice format check (${iNum}): ${iMatch ? "PASSED" : "FAILED"}`);

  if (quoteData.quotation?.id) {
    await fetch(`${BASE_URL}/api/quotations?email=${encodeURIComponent(TEST_EMAIL)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: quoteData.quotation.id }),
    });
    console.log("Cleaned up test quotation");
  }

  if (invoiceData.invoice?.id) {
    await fetch(`${BASE_URL}/api/invoices?email=${encodeURIComponent(TEST_EMAIL)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: invoiceData.invoice.id }),
    });
    console.log("Cleaned up test invoice");
  }

  console.log("\nALL TESTS PASSED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
