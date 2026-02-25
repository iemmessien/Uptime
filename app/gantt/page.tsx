import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function GanttPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Gantt Chart</h1>

        <Tabs defaultValue="utilization" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="utilization">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Utilization Gantt Chart
              </h2>
              <p className="text-gray-900">
                Gantt chart visualization for power utilization across all generators.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="availability">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Availability Gantt Chart
              </h2>
              <p className="text-gray-900">
                Gantt chart visualization for power availability across all generators.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
