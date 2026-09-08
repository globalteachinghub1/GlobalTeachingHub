"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

type Faq = { question: string; answer: string; category: string };

export function FaqList() {
  const t = useTranslations("Faq");
  const faqs = t.raw("items") as Faq[];
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? faqs.filter(
          (f) =>
            f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
        )
      : faqs;

    const map = new Map<string, Faq[]>();
    for (const f of filtered) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return map;
  }, [faqs, query]);

  return (
    <>
      <div className="relative mx-auto mt-10 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 pl-10"
        />
      </div>

      {grouped.size === 0 && (
        <p className="mt-10 text-center text-muted-foreground">{t("noResults")}</p>
      )}

      <div className="mt-10 flex flex-col gap-10">
        {[...grouped.entries()].map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">
              {category}
            </h2>
            <Accordion className="mt-4">
              {items.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </>
  );
}
