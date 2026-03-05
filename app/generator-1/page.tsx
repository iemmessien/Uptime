import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { GeneratorContent } from "@/components/generator-content";

export default async function Generator1Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <GeneratorContent 
        title="Generator 1" 
        powerSupply="Generator 1" 
        color="#F59E0B" 
      />
    </DashboardLayout>
  );
}
