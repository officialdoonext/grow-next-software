import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function CustomObjectsPage() {
  return (
    <SoftwareLayout pageTitle="Custom Objects">
      <EmptySoftwarePage
        title="Custom Objects"
        description="Custom entity schemas, metadata fields, tailored business data tables, and dynamic forms will live here."
      />
    </SoftwareLayout>
  );
}
