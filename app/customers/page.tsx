import SoftwareLayout from "@/components/SoftwareLayout";
import EmptySoftwarePage from "@/components/EmptySoftwarePage";

export default function CustomersPage() {
  return (
    <SoftwareLayout pageTitle="Customers">
      <EmptySoftwarePage
        title="Customers"
        description="Customer directory, transaction history, loyalty points, and profile management will be available here."
      />
    </SoftwareLayout>
  );
}
