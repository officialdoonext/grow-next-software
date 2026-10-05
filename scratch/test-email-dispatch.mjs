const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "official.doonext@gmail.com";

async function testEmailDispatch() {
  console.log("=== Testing Document Email API ===");

  const payload = {
    userEmail: TEST_EMAIL,
    docType: "quotation",
    document: {
      id: "quote-test-99",
      quotationNumber: "QT-20261009",
      customerName: "Acme Enterprises",
      businessName: "Acme Corp Ltd",
      email: TEST_EMAIL, // Send to test email
      mobile: "+91 9123456780",
      items: [
        {
          description: "Enterprise Cloud Hosting & Migration",
          qty: 1,
          amount: 45000,
          discount: 5000,
          subtotal: 40000,
        },
        {
          description: "Premium 24/7 SLA Support",
          qty: 2,
          amount: 10000,
          discount: 2000,
          subtotal: 18000,
        },
      ],
      amount: 58000,
      issueDate: "2026-10-05",
      validUntil: "2026-11-05",
      status: "Approved",
      notes: "Payment schedule: 50% advance, balance within 30 days.",
    },
  };

  const res = await fetch(`${BASE_URL}/api/documents/send-email?email=${encodeURIComponent(TEST_EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Email Dispatch Status:", res.status);
  console.log("Response:", data);

  if (res.ok && data.success) {
    console.log("SUCCESS: Document email sent with attachment!");
  } else {
    console.error("FAILURE:", data.error);
    process.exit(1);
  }
}

testEmailDispatch().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
