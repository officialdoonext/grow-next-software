import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function IntegrationsPage() {
  return (
    <SoftwareLayout pageTitle="Integrations">
      <EmptySoftwarePage
        title="Integrations"
        description="Payment gateways, SMS providers, accounting connectors, and webhook configurations will be linked here."
      />
    </SoftwareLayout>
  );
}
