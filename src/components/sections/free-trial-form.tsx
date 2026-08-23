"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requireEmail,
  requirePhone,
  requireString,
  type FieldErrors,
} from "@/lib/validation";

type FormState = { name: string; phone: string; email: string; courseId: string };

const EMPTY_FORM: FormState = { name: "", phone: "", email: "", courseId: "" };

function validate(form: FormState) {
  const errors: FieldErrors = {};
  requireString(errors, "name", form.name, "Full name", { min: 2, max: 100 });
  requirePhone(errors, "phone", form.phone);
  requireEmail(errors, "email", form.email);
  requireString(errors, "course", form.courseId, "Course", { min: 1 });
  return errors;
}

export function FreeTrialForm({ courses }: { courses: { id: string; name: string }[] }) {
  const t = useTranslations("FreeTrialForm");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg border-none bg-secondary/40 shadow-none">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <p className="text-lg font-semibold text-foreground">{t("successTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("successBody")}</p>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setSubmitError(
          data?.error ?? "Something went wrong. Please try again."
        );
      }
    } catch {
      setSubmitError(
        "Couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg border-none bg-secondary/40 shadow-none">
      <CardContent className="p-8">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("fullName")}</Label>
            <Input
              id="name"
              name="name"
              placeholder={t("fullNamePlaceholder")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="course">{t("course")}</Label>
            <select
              id="course"
              name="course"
              value={form.courseId}
              onChange={(e) =>
                setForm((f) => ({ ...f, courseId: e.target.value }))
              }
              aria-invalid={!!errors.course}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 aria-invalid:border-destructive"
            >
              <option value="" disabled>
                {t("selectCourse")}
              </option>
              {courses.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            {errors.course && (
              <p className="text-xs text-destructive">{errors.course}</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button type="submit" size="lg" className="mt-2" disabled={submitting}>
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
