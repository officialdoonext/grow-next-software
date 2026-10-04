import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function InvoicesPage() {
  return (
    <SoftwareLayout pageTitle="Invoices">
      <EmptySoftwarePage
        title="Invoices"
        description="Billing receipts, tax invoices, payment statuses, and automated numbering will be handled here."
      />
    </SoftwareLayout>
  );
}
