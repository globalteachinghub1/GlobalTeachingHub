"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

type Invoice = {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: string;
  amountPaid: string | null;
  dueDate: string | null;
  date: string;
  status: string;
};

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

const STATUS_KEY: Record<string, string> = {
  PAID: "invoiceStatusPaid",
  PENDING: "invoiceStatusPending",
  OVERDUE: "invoiceStatusOverdue",
  PARTIAL: "invoiceStatusPartial",
};

export default function InvoicesPage() {
  const t = useTranslations("InvoicesPage");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/student/me")
      .then((r) => r.json())
      .then((data) => {
        if (active) setInvoices(data.student?.invoices ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  const pendingCount = invoices?.filter((i) => i.status !== "PAID").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {invoices && invoices.length > 0 && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {pendingCount === 0 ? t("allPaid") : t("awaitingPayment", { count: pendingCount })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {invoices === null && (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("loading")}</p>
        )}
        {invoices?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("noInvoicesYet")}</p>
            </CardContent>
          </Card>
        )}
        {invoices?.map((invoice) => (
          <Card
            key={invoice.id}
            className="border-none shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="flex flex-wrap items-center gap-4 p-5 sm:flex-nowrap">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <Receipt className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {invoice.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {invoice.invoiceNumber} ·{" "}
                  {new Date(invoice.date).toLocaleDateString(locale, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {invoice.dueDate &&
                    ` · ${t("due", {
                      date: new Date(invoice.dueDate).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                      }),
                    })}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-foreground">{invoice.amount}</p>
                {invoice.status === "PARTIAL" && invoice.amountPaid && (
                  <p className="text-xs text-muted-foreground">
                    {t("paidAmount", { amount: invoice.amountPaid })}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[invoice.status] ?? "bg-secondary text-muted-foreground"}`}
              >
                {tCommon(STATUS_KEY[invoice.status] ?? "invoiceStatusPending")}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
