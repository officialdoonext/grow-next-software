import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function LeadsPage() {
  return (
    <SoftwareLayout pageTitle="Leads">
      <EmptySoftwarePage
        title="Leads"
        description="Prospective customer inquiries, contact touchpoints, and sales pipeline tracking will appear here."
      />
    </SoftwareLayout>
  );
}
