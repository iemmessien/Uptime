import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { OverviewContent } from "@/components/overview-content";

export default async function UptimeOverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <OverviewContent />
    </DashboardLayout>
  );
}
