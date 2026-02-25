import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function UptimeOverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Uptime Overview</h1>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="power-availability">Power Availability</TabsTrigger>
            <TabsTrigger value="power-utilization">Power Utilization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Summary Cards */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-sm font-medium text-gray-600 mb-2">Main Grids</h2>
                <p className="text-3xl font-bold text-gray-800">2</p>
                <p className="text-sm text-green-600 mt-2">Both Online</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-sm font-medium text-gray-600 mb-2">Generators</h2>
                <p className="text-3xl font-bold text-gray-800">12</p>
                <p className="text-sm text-gray-600 mt-2">Available Units</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-sm font-medium text-gray-600 mb-2">System Status</h2>
                <p className="text-3xl font-bold text-green-600">Operational</p>
                <p className="text-sm text-gray-600 mt-2">All systems running</p>
              </div>
            </div>

            {/* Main Grids Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Main Grids</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Ejigbo Grid</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Online</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Isolo Grid</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generators Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Generators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <div key={num} className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Generator {num}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-600">Standby</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="power-availability">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Power Availability Analysis
              </h2>
              <p className="text-gray-600">
                Power availability metrics and analytics will be displayed here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="power-utilization">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Power Utilization Analysis
              </h2>
              <p className="text-gray-600">
                Power utilization metrics and analytics will be displayed here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
