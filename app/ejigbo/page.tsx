import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              Add Uptime
            </button>
          </div>

          <TabsContent value="overview">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ejigbo Grid Overview
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">Status: Online</span>
                </div>
                <p className="text-gray-900">
                  Monitoring uptime for Ejigbo grid power supply.
                </p>
              </div>
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
