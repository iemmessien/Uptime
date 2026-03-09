"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AccountForm } from "@/components/account-form";

interface AccountContentProps {
  initialEmail: string;
  initialUsername: string;
}

export function AccountContent({ initialEmail, initialUsername }: AccountContentProps) {
  return (
    <Tabs defaultValue="information" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="information">Account Information</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="information">
        <AccountForm
          initialEmail={initialEmail}
          initialUsername={initialUsername}
        />
      </TabsContent>

      <TabsContent value="activity">
        <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">
          Activity log coming soon...
        </div>
      </TabsContent>
    </Tabs>
  );
}
