import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function DashboardPage() {
  return (
    <SoftwareLayout pageTitle="Dashboard">
      <EmptySoftwarePage
        title="Dashboard"
        description="Key performance indicators, sales summaries, and real-time business analytics will be configured here."
      />
    </SoftwareLayout>
  );
}
