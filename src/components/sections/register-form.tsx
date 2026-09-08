"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldErrors } from "@/lib/validation";

type Course = { id: string; name: string };

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  whatsapp: "",
  parentName: "",
  parentContact: "",
  courseIds: [] as string[],
  acceptedTerms: false,
};

export function RegisterForm({ courses }: { courses: Course[] }) {
  const t = useTranslations("RegisterForm");
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function toggleCourse(courseId: string) {
    setForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(courseId)
        ? f.courseIds.filter((id) => id !== courseId)
        : [...f.courseIds, courseId],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    if (!form.acceptedTerms) {
      setErrors({ acceptedTerms: t("termsRequired") });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.errors) setErrors(data.errors);
        else setSubmitError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setSubmitError(
        "Couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("fullName")}</Label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            name="name"
            placeholder={t("fullNamePlaceholder")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            aria-invalid={!!errors.name}
            className="h-11 pl-10"
          />
        </div>
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            aria-invalid={!!errors.email}
            className="h-11 pl-10"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            aria-invalid={!!errors.password}
            className="h-11 pr-10 pl-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="whatsapp">{t("whatsapp")}</Label>
          <Input
            id="whatsapp"
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="parentName">{t("parentName")}</Label>
          <Input
            id="parentName"
            value={form.parentName}
            onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="parentContact">{t("parentContact")}</Label>
          <Input
            id="parentContact"
            value={form.parentContact}
            onChange={(e) => setForm((f) => ({ ...f, parentContact: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t("courses")}</Label>
        {courses.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("noCoursesOpen")}</p>
        )}
        <div className="flex flex-col gap-1.5">
          {courses.map((course) => (
            <label
              key={course.id}
              className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10"
            >
              <input
                type="checkbox"
                checked={form.courseIds.includes(course.id)}
                onChange={() => toggleCourse(course.id)}
                className="h-3.5 w-3.5 accent-primary"
              />
              {course.name}
            </label>
          ))}
        </div>
        {errors.courseIds && (
          <p className="text-xs text-destructive">{errors.courseIds}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.acceptedTerms}
            onChange={(e) => {
              setForm((f) => ({ ...f, acceptedTerms: e.target.checked }));
              if (e.target.checked) setErrors((err) => ({ ...err, acceptedTerms: "" }));
            }}
            aria-invalid={!!errors.acceptedTerms}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
          />
          <span>
            {t.rich("agreeTerms", {
              terms: (chunks) => (
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-medium text-primary hover:underline"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-medium text-primary hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {errors.acceptedTerms && (
          <p className="text-xs text-destructive">{errors.acceptedTerms}</p>
        )}
      </div>

      {submitError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-1 h-11" disabled={submitting}>
        {submitting ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
