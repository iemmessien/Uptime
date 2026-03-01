import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddUptimeButton } from "@/components/add-uptime-button";
import { SingleUtilizationChart } from "@/components/single-utilization-chart";
import { SingleAvailabilityChart } from "@/components/single-availability-chart";

export default async function Generator9Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Generator 9</h1>

        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="power-availability">Power Availability</TabsTrigger>
              <TabsTrigger value="power-utilization">Power Utilization</TabsTrigger>
              <TabsTrigger value="test-run">Test Run</TabsTrigger>
            </TabsList>
            <AddUptimeButton />
          </div>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Utilization Chart */}
              <SingleUtilizationChart powerSupply="Generator 9" color="#F59E0B" />

              {/* Availability Chart */}
              <SingleAvailabilityChart powerSupply="Generator 9" color="#F59E0B" />
            </div>
          </TabsContent>

          <TabsContent value="power-availability">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Power Availability
              </h2>
              <p className="text-gray-900">
                Power availability metrics for Generator 9.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="power-utilization">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Power Utilization
              </h2>
              <p className="text-gray-900">
                Power utilization metrics for Generator 9.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="test-run">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Test Run
              </h2>
              <p className="text-gray-900">
                Test run data and results for Generator 9.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
