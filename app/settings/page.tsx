import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function SettingsPage() {
  return (
    <SoftwareLayout pageTitle="Settings">
      <EmptySoftwarePage
        title="Settings"
        description="Application parameters, store location settings, document formats, taxes, and security controls will be configured here."
      />
    </SoftwareLayout>
  );
}
