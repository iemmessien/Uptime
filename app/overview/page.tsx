import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddUptimeButton } from "@/components/add-uptime-button";
import { NormalOperationTab } from "@/components/normal-operation-tab";
import { PowerAvailabilityTab } from "@/components/power-availability-tab";
import { PowerUtilizationTab } from "@/components/power-utilization-tab";
import { UtilizationChart } from "@/components/utilization-chart";
import { AvailabilityChart } from "@/components/availability-chart";
import { TestRunTab } from "@/components/test-run-tab";

export default async function UptimeOverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Uptime Overview</h1>

        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="normal-operation">Normal Operation</TabsTrigger>
              <TabsTrigger value="power-availability">Power Availability</TabsTrigger>
              <TabsTrigger value="power-utilization">Power Utilization</TabsTrigger>
              <TabsTrigger value="test-run">Test Run</TabsTrigger>
            </TabsList>
            <AddUptimeButton />
          </div>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Utilization Chart */}
              <UtilizationChart />

              {/* Availability Chart */}
              <AvailabilityChart />
            </div>
          </TabsContent>

          <TabsContent value="normal-operation">
            <NormalOperationTab />
          </TabsContent>

          <TabsContent value="power-availability">
            <PowerAvailabilityTab />
          </TabsContent>

          <TabsContent value="power-utilization">
            <PowerUtilizationTab />
          </TabsContent>

          <TabsContent value="test-run">
            <TestRunTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
