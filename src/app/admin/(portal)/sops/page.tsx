"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RowActionButton } from "@/components/dashboard/row-action-button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Category = { id: string; name: string; documentCount: number };
type SopDoc = {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string | null;
  fileUrl: string;
  version: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdByName: string;
  createdAt: string;
};

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"] as const;

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const EMPTY_FORM = {
  categoryId: "",
  title: "",
  description: "",
  fileUrl: "",
  status: "APPROVED" as (typeof STATUS_OPTIONS)[number],
};

export default function AdminSopsPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [documents, setDocuments] = useState<SopDoc[] | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/sops/categories").then((r) => r.json()),
      fetch("/api/sops/documents").then((r) => r.json()),
    ]).then(([catsRes, docsRes]) => {
      if (!active) return;
      setCategories(catsRes.categories ?? []);
      setDocuments(docsRes.documents ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!documents) return null;
    if (categoryFilter === "ALL") return documents;
    return documents.filter((d) => d.categoryId === categoryFilter);
  }, [documents, categoryFilter]);

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const res = await fetch("/api/sops/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategories((prev) => [...(prev ?? []), { ...data.category, documentCount: 0 }]);
        setNewCategoryName("");
      } else {
        window.alert(data.errors?.name ?? data.error ?? "Couldn't add category.");
      }
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Delete category "${category.name}"? Its documents will be deleted too.`
    );
    if (!confirmed) return;
    const res = await fetch(`/api/sops/categories/${category.id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev?.filter((c) => c.id !== category.id) ?? prev);
      setDocuments((prev) => prev?.filter((d) => d.categoryId !== category.id) ?? prev);
      if (categoryFilter === category.id) setCategoryFilter("ALL");
    }
  }

  function openAddForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, categoryId: categories?.[0]?.id ?? "" });
    setErrors({});
    setOpen(true);
  }

  function openEditForm(doc: SopDoc) {
    setEditingId(doc.id);
    setForm({
      categoryId: doc.categoryId,
      title: doc.title,
      description: doc.description ?? "",
      fileUrl: doc.fileUrl,
      status: doc.status,
    });
    setErrors({});
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(
        editingId ? `/api/sops/documents/${editingId}` : "/api/sops/documents",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingId ? { ...form, bumpVersion: true } : form),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { form: data.error ?? "Something went wrong." });
        return;
      }
      setDocuments((prev) => {
        if (!prev) return prev;
        if (editingId) return prev.map((d) => (d.id === editingId ? data.document : d));
        return [data.document, ...prev];
      });
      setCategories((prev) =>
        prev?.map((c) =>
          c.id === data.document.categoryId
            ? { ...c, documentCount: c.documentCount + (editingId ? 0 : 1) }
            : c
        ) ?? prev
      );
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(doc: SopDoc, status: string) {
    setSavingId(doc.id);
    try {
      const res = await fetch(`/api/sops/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) => prev?.map((d) => (d.id === doc.id ? data.document : d)) ?? prev);
      }
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(doc: SopDoc) {
    const confirmed = window.confirm(`Delete "${doc.title}"? This can't be undone.`);
    if (!confirmed) return;
    setDeletingId(doc.id);
    try {
      const res = await fetch(`/api/sops/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev?.filter((d) => d.id !== doc.id) ?? prev);
        setCategories((prev) =>
          prev?.map((c) =>
            c.id === doc.categoryId ? { ...c, documentCount: Math.max(0, c.documentCount - 1) } : c
          ) ?? prev
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SOPs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Company-wide standard operating procedures — visible to Teachers and Staff once
            approved.
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <Button onClick={openAddForm} disabled={!categories?.length}>
            <Plus className="h-4 w-4" />
            Add SOP
          </Button>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit SOP" : "Add SOP"}</SheetTitle>
            </SheetHeader>
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                >
                  <option value="">Select a category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-destructive">{errors.categoryId}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fileUrl">Document Link</Label>
                <Input
                  id="fileUrl"
                  required
                  placeholder="Google Drive / PDF link"
                  value={form.fileUrl}
                  onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                />
                {errors.fileUrl && <p className="text-xs text-destructive">{errors.fileUrl}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as (typeof STATUS_OPTIONS)[number] }))
                  }
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {errors.form && <p className="text-xs text-destructive">{errors.form}</p>}

              <div className="mt-auto flex gap-3 pt-2">
                <SheetClose render={<Button type="button" variant="outline" className="flex-1" />}>
                  Cancel
                </SheetClose>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Add SOP"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border-none bg-background shadow-none">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="h-8 w-48"
            />
            <Button type="submit" size="sm" variant="outline" disabled={addingCategory}>
              Add Category
            </Button>
          </form>
        </CardContent>
      </Card>

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
        {categories?.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === c.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {c.name} ({c.documentCount})
            </button>
            <RowActionButton
              onClick={() => handleDeleteCategory(c)}
              icon={Trash2}
              label={`Delete category ${c.name}`}
              variant="danger"
            />
          </span>
        ))}
      </div>

      <Card className="border-none bg-background shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Version</th>
                  <th className="px-6 py-3 font-medium">Uploaded By</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered === null &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-secondary/70" />
                      </td>
                    </tr>
                  ))}
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center">
                      <FileText className="mx-auto h-6 w-6 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">
                        No SOPs yet. Add a category, then add your first SOP.
                      </p>
                    </td>
                  </tr>
                )}
                {filtered?.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-6 py-4">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground hover:underline"
                      >
                        {doc.title}
                      </a>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground">{doc.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{doc.categoryName}</td>
                    <td className="px-6 py-4 text-muted-foreground">v{doc.version}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doc.createdByName}</td>
                    <td className="px-6 py-4">
                      <select
                        value={doc.status}
                        disabled={savingId === doc.id}
                        onChange={(e) => handleStatusChange(doc, e.target.value)}
                        className={`rounded-full border-none px-2.5 py-1 text-xs font-semibold outline-none ${STATUS_STYLE[doc.status]}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <RowActionButton
                          onClick={() => openEditForm(doc)}
                          icon={FileText}
                          label={`Edit ${doc.title}`}
                          variant="edit"
                        />
                        <RowActionButton
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          icon={Trash2}
                          label={`Delete ${doc.title}`}
                          variant="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
