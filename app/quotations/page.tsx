import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function QuotationsPage() {
  return (
    <SoftwareLayout pageTitle="Quotations">
      <EmptySoftwarePage
        title="Quotations"
        description="Formal price estimates, discount schedules, and client quotation workflows will be managed here."
      />
    </SoftwareLayout>
  );
}
