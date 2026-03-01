import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddUptimeButton } from "@/components/add-uptime-button";
import { SingleUtilizationChart } from "@/components/single-utilization-chart";
import { SingleAvailabilityChart } from "@/components/single-availability-chart";

export default async function EjigboPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ejigbo Grid</h1>

        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="power-availability">Power Availability</TabsTrigger>
              <TabsTrigger value="power-utilization">Power Utilization</TabsTrigger>
            </TabsList>
            <AddUptimeButton />
          </div>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Utilization Chart */}
              <SingleUtilizationChart powerSupply="Ejigbo" color="#3B82F6" />

              {/* Availability Chart */}
              <SingleAvailabilityChart powerSupply="Ejigbo" color="#3B82F6" />
            </div>
          </TabsContent>

          <TabsContent value="power-availability">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Power Availability
              </h2>
              <p className="text-gray-900">
                Power availability metrics for Ejigbo grid.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="power-utilization">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Power Utilization
              </h2>
              <p className="text-gray-900">
                Power utilization metrics for Ejigbo grid.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
