"use client";

import { ChangePasswordForm } from "@/components/dashboard/change-password-form";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
