"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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

type FormState = {
  name: string;
  phone: string;
  email: string;
  courseId: string;
  message: string;
};

const EMPTY_FORM: FormState = { name: "", phone: "", email: "", courseId: "", message: "" };
const DRAFT_KEY = "freeTrialDraft";
const TOTAL_STEPS = 3;

function validateStep(step: number, form: FormState) {
  const errors: FieldErrors = {};
  if (step === 1) {
    requireString(errors, "name", form.name, "Full name", { min: 2, max: 100 });
    requirePhone(errors, "phone", form.phone);
  } else if (step === 2) {
    requireEmail(errors, "email", form.email);
    requireString(errors, "course", form.courseId, "Course", { min: 1 });
  }
  return errors;
}

export function FreeTrialForm({ courses }: { courses: { id: string; name: string }[] }) {
  const t = useTranslations("FreeTrialForm");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const hydrated = useRef(false);

  // Restore an in-progress draft on mount so a refresh or accidental close
  // doesn't lose what the visitor already typed.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<FormState>;
        // localStorage isn't available during SSR, so restoring the draft
        // has to happen post-mount rather than in a lazy useState initializer
        // (which would otherwise produce a hydration mismatch).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((f) => ({ ...f, ...draft }));
      }
    } catch {
      // Ignore a corrupt or inaccessible draft — start fresh.
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current || submitted) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Best-effort only — private browsing or a full quota shouldn't break the form.
    }
  }, [form, submitted]);

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg border-none bg-secondary/40 shadow-none">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <p className="text-lg font-semibold text-foreground">{t("successTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("successBody")}</p>
          <p className="text-sm text-muted-foreground">{t("successWhatsappNote")}</p>
        </CardContent>
      </Card>
    );
  }

  async function checkDuplicateEmail() {
    if (!form.email) return;
    try {
      const res = await fetch(`/api/free-trial/check-email?email=${encodeURIComponent(form.email)}`);
      const data = await res.json();
      setDuplicateEmail(!!data.exists);
    } catch {
      // Non-critical — just skip the notice if the check fails.
    }
  }

  function goNext() {
    const stepErrors = validateStep(step, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    if (step === 2) checkDuplicateEmail();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const stepErrors = validateStep(2, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/free-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSubmitted(true);
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {
          // Ignore — nothing critical depends on clearing the draft.
        }
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

  const stepTitle =
    step === 1 ? t("stepAboutYou") : step === 2 ? t("stepContactCourse") : t("stepGoals");

  return (
    <Card className="mx-auto max-w-lg border-none bg-secondary/40 shadow-none">
      <CardContent className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("stepIndicator", { step, total: TOTAL_STEPS })}</span>
            <span className="font-medium text-foreground">{stepTitle}</span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : "bg-primary/15"
                }`}
              />
            ))}
          </div>
        </div>

        <form
          className="flex flex-col gap-5"
          onSubmit={step === TOTAL_STEPS ? handleSubmit : (e) => e.preventDefault()}
          noValidate
        >
          {step === 1 && (
            <>
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
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, email: e.target.value }));
                    setDuplicateEmail(false);
                  }}
                  onBlur={checkDuplicateEmail}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                {duplicateEmail && !errors.email && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    {t("duplicateEmailNotice")}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="course">{t("course")}</Label>
                <select
                  id="course"
                  name="course"
                  value={form.courseId}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
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
                {errors.course && <p className="text-xs text-destructive">{errors.course}</p>}
              </div>
            </>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="message">{t("goals")}</Label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder={t("goalsPlaceholder")}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              />
            </div>
          )}

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="mt-2 flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
                {t("back")}
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button type="button" size="lg" className="flex-1" onClick={goNext}>
                {t("next")}
              </Button>
            ) : (
              <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
                {submitting ? t("submitting") : t("submit")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
