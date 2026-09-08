"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Calendar, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";

type StudentMe = {
  name: string;
  email: string;
  phone: string | null;
  joined: string;
} | null;

export default function ProfilePage() {
  const t = useTranslations("ProfilePage");
  const [student, setStudent] = useState<StudentMe | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/student/me")
      .then((r) => r.json())
      .then((data) => {
        if (active) setStudent(data.student);
      });
    return () => {
      active = false;
    };
  }, []);

  if (student === undefined) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!student) {
    return <p className="text-sm text-muted-foreground">{t("notSetUp")}</p>;
  }

  return <ProfileForm student={student} />;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfileForm({ student }: { student: NonNullable<StudentMe> }) {
  const t = useTranslations("ProfilePage");
  const tPassword = useTranslations("ChangePasswordForm");
  const locale = useLocale();
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/student/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.errors?.name ?? "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-700 via-teal-600 to-emerald-700 p-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold ring-4 ring-white/20">
            {initials(name || student.name)}
          </span>
          <div>
            <h1 className="text-2xl font-bold">{name || student.name}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-teal-50/90 sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {student.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {t("studentSince", {
                  date: new Date(student.joined).toLocaleDateString(locale, {
                    month: "long",
                    year: "numeric",
                  }),
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-none shadow-sm">
        <CardContent className="p-8">
          <h2 className="text-base font-semibold text-foreground">{t("editDetails")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("editSubtitle")}</p>
          <form className="mt-5 flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("addPhone")}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? t("saving") : t("save")}
              </Button>
              {saved && <p className="text-xs text-muted-foreground">{t("saved")}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <ChangePasswordForm
        strings={{
          title: tPassword("title"),
          subtitle: tPassword("subtitle"),
          currentPassword: tPassword("currentPassword"),
          newPassword: tPassword("newPassword"),
          confirmPassword: tPassword("confirmPassword"),
          save: tPassword("save"),
          saving: tPassword("saving"),
          saved: tPassword("saved"),
          mismatchError: tPassword("mismatchError"),
          genericError: tPassword("genericError"),
          connectionError: tPassword("connectionError"),
        }}
      />
    </div>
  );
}
