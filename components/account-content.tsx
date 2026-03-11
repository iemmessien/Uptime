"use client";

import { AccountForm } from "@/components/account-form";

interface AccountContentProps {
  initialEmail: string;
  initialUsername: string;
}

export function AccountContent({ initialEmail, initialUsername }: AccountContentProps) {
  return (
    <div className="w-full">
      <AccountForm
        initialEmail={initialEmail}
        initialUsername={initialUsername}
      />
    </div>
  );
}
