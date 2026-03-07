import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PowerSupplyContent } from "@/components/power-supply-content";

export default async function EjigboPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <PowerSupplyContent 
        title="Ejigbo Grid - Trend" 
        powerSupply="Ejigbo" 
        color="#3B82F6" 
      />
    </DashboardLayout>
  );
}
