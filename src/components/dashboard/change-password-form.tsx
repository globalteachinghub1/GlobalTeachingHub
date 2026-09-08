"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ChangePasswordStrings = {
  title: string;
  subtitle: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  save: string;
  saving: string;
  saved: string;
  mismatchError: string;
  genericError: string;
  connectionError: string;
};

const DEFAULT_STRINGS: ChangePasswordStrings = {
  title: "Change Password",
  subtitle: "Update the password you use to log in.",
  currentPassword: "Current Password",
  newPassword: "New Password",
  confirmPassword: "Confirm New Password",
  save: "Update Password",
  saving: "Updating...",
  saved: "Password updated.",
  mismatchError: "New password and confirmation don't match.",
  genericError: "Something went wrong. Please try again.",
  connectionError: "Couldn't reach the server. Check your connection and try again.",
};

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm({
  strings,
}: {
  strings?: Partial<ChangePasswordStrings>;
}) {
  const s = { ...DEFAULT_STRINGS, ...strings };
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSaved(false);

    if (form.newPassword !== form.confirmPassword) {
      setErrors({ confirmPassword: s.mismatchError });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setForm(EMPTY_FORM);
        setSaved(true);
        return;
      }

      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setFormError(data?.error ?? s.genericError);
      }
    } catch {
      setFormError(s.connectionError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg border-none shadow-sm">
      <CardContent className="p-8">
        <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>

        <form className="mt-5 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">{s.currentPassword}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
                aria-invalid={!!errors.currentPassword}
                className="h-11 pr-10 pl-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">{s.newPassword}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                aria-invalid={!!errors.newPassword}
                className="h-11 pr-10 pl-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">{s.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type={showNew ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              aria-invalid={!!errors.confirmPassword}
              className="h-11"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? s.saving : s.save}
            </Button>
            {saved && <p className="text-xs text-muted-foreground">{s.saved}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
