import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PowerSupplyContent } from "@/components/power-supply-content";

export default async function IsoloPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <PowerSupplyContent 
        title="Isolo Grid - Trend" 
        powerSupply="Isolo" 
        color="#10B981" 
      />
    </DashboardLayout>
  );
}
