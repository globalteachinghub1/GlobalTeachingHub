"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type SopDoc = {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string | null;
  fileUrl: string;
  version: number;
  createdAt: string;
};

export default function TeacherSopsPage() {
  const [documents, setDocuments] = useState<SopDoc[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    fetch("/api/sops/documents")
      .then((r) => r.json())
      .then((data) => {
        if (active) setDocuments(data.documents ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    if (!documents) return [];
    const seen = new Map<string, string>();
    for (const d of documents) seen.set(d.categoryId, d.categoryName);
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [documents]);

  const filtered = useMemo(() => {
    if (!documents) return null;
    if (categoryFilter === "ALL") return documents;
    return documents.filter((d) => d.categoryId === categoryFilter);
  }, [documents, categoryFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SOPs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Company-wide standard operating procedures.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === "ALL"
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === c.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered === null && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-none bg-background shadow-none">
              <CardContent className="p-6">
                <div className="h-4 w-2/3 animate-pulse rounded bg-secondary/70" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-secondary/70" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="mx-auto h-6 w-6 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No SOPs published yet.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered?.map((doc) => (
          <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
            <Card className="h-full border-none bg-background shadow-none transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.categoryName} · v{doc.version}
                  </p>
                </div>
                {doc.description && (
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                )}
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
