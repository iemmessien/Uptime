import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AccountForm } from "@/components/account-form";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch full user details from database
  const adminUser = await prisma.admin.findUnique({
    where: { id: user.userId },
    select: {
      email: true,
      username: true,
    },
  });

  if (!adminUser) {
    redirect("/login");
  }

  return (
    <DashboardLayout username={user.username}>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Account Settings</h1>
        <AccountForm
          initialEmail={adminUser.email}
          initialUsername={adminUser.username}
        />
      </div>
    </DashboardLayout>
  );
}
