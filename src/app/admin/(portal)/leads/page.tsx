"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquare, Phone, Trash2, UserPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RowActionButton } from "@/components/dashboard/row-action-button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  courseId: string | null;
  courseName: string | null;
  message: string | null;
  source: "FREE_TRIAL" | "CONTACT";
  stage: "NEW" | "CONTACTED" | "QUALIFIED" | "ENROLLED" | "LOST";
  noteCount: number;
  createdAt: string;
};

type Note = { id: string; note: string; createdByName: string | null; createdAt: string };

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "ENROLLED", "LOST"] as const;

const STAGE_LABEL: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  ENROLLED: "Enrolled",
  LOST: "Lost",
};

const STAGE_STYLE: Record<string, string> = {
  NEW: "border-t-blue-400",
  CONTACTED: "border-t-amber-400",
  QUALIFIED: "border-t-violet-400",
  ENROLLED: "border-t-emerald-400",
  LOST: "border-t-rose-400",
};

const SOURCE_LABEL: Record<string, string> = {
  FREE_TRIAL: "Free Trial",
  CONTACT: "Contact Form",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then((data) => {
        if (active) setLeads(data.leads ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!leads) return null;
    if (sourceFilter === "ALL") return leads;
    return leads.filter((l) => l.source === sourceFilter);
  }, [leads, sourceFilter]);

  const byStage = useMemo(() => {
    const map = new Map<string, Lead[]>(STAGES.map((s) => [s, []]));
    filtered?.forEach((l) => map.get(l.stage)?.push(l));
    return map;
  }, [filtered]);

  const selected = leads?.find((l) => l.id === selectedId) ?? null;

  function openLead(lead: Lead) {
    setSelectedId(lead.id);
    setNotes(null);
    fetch(`/api/admin/leads/${lead.id}/notes`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes ?? []));
  }

  async function handleStageChange(lead: Lead, stage: string) {
    setLeads((prev) => prev?.map((l) => (l.id === lead.id ? { ...l, stage: stage as Lead["stage"] } : l)) ?? prev);
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  async function handleAddNote() {
    if (!selected || !newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/leads/${selected.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotes((prev) => [data.note, ...(prev ?? [])]);
        setLeads((prev) =>
          prev?.map((l) => (l.id === selected.id ? { ...l, noteCount: l.noteCount + 1 } : l)) ?? prev
        );
        setNewNote("");
      }
    } finally {
      setAddingNote(false);
    }
  }

  async function handleConvert() {
    if (!selected) return;
    const confirmed = window.confirm(
      `Convert "${selected.name}" to a student account? This creates a login and emails them their credentials.`
    );
    if (!confirmed) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/admin/leads/${selected.id}/convert`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLeads((prev) =>
          prev?.map((l) => (l.id === selected.id ? { ...l, stage: "ENROLLED" } : l)) ?? prev
        );
        setSelectedId(null);
      } else {
        window.alert(data.error ?? "Couldn't convert this lead.");
      }
    } finally {
      setConverting(false);
    }
  }

  async function handleDelete(lead: Lead) {
    const confirmed = window.confirm(`Delete lead "${lead.name}"? This can't be undone.`);
    if (!confirmed) return;
    setDeletingId(lead.id);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev?.filter((l) => l.id !== lead.id) ?? prev);
        if (selectedId === lead.id) setSelectedId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free Trial and Contact submissions from the website, tracked through to enrollment.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["ALL", "FREE_TRIAL", "CONTACT"].map((source) => (
          <button
            key={source}
            type="button"
            onClick={() => setSourceFilter(source)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              sourceFilter === source
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {source === "ALL" ? "All Sources" : SOURCE_LABEL[source]}
          </button>
        ))}
      </div>

      {filtered === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-none bg-background shadow-none">
              <CardContent className="p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-secondary/70" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <Users className="mx-auto h-6 w-6 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            No leads yet. Submissions from Free Trial and Contact will show up here.
          </p>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage) => (
            <div key={stage} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {STAGE_LABEL[stage]}
                </p>
                <span className="text-xs text-muted-foreground">
                  {byStage.get(stage)?.length ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {byStage.get(stage)?.map((lead) => (
                  <Card
                    key={lead.id}
                    className={`cursor-pointer border-none border-t-2 bg-background shadow-none transition hover:-translate-y-0.5 hover:shadow-md ${STAGE_STYLE[stage]}`}
                    onClick={() => openLead(lead)}
                  >
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                        <RowActionButton
                          onClick={() => handleDelete(lead)}
                          disabled={deletingId === lead.id}
                          icon={Trash2}
                          label={`Delete lead ${lead.name}`}
                          variant="danger"
                        />
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </p>
                      {lead.courseName && (
                        <p className="text-xs text-muted-foreground">{lead.courseName}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {SOURCE_LABEL[lead.source]}
                        </span>
                        {lead.noteCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {lead.noteCount}
                          </span>
                        )}
                      </div>
                      <select
                        value={lead.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStageChange(lead, e.target.value)}
                        className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected?.name}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-2 text-sm">
                <p className="flex items-center gap-2 text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {selected.email}
                </p>
                {selected.phone && (
                  <p className="flex items-center gap-2 text-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {selected.phone}
                  </p>
                )}
                <p className="text-muted-foreground">
                  Source: {SOURCE_LABEL[selected.source]}
                  {selected.courseName ? ` · ${selected.courseName}` : ""}
                </p>
                <p className="text-muted-foreground">
                  Received {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>

              {selected.message && (
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Message
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
                    {selected.message}
                  </p>
                </div>
              )}

              {selected.stage !== "ENROLLED" && (
                <Button onClick={handleConvert} disabled={converting}>
                  <UserPlus className="h-4 w-4" />
                  {converting ? "Converting..." : "Convert to Student"}
                </Button>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Notes & Follow-ups
                </p>
                <div className="flex gap-2">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a follow-up note..."
                    className="h-9 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                  <Button size="sm" onClick={handleAddNote} disabled={addingNote || !newNote.trim()}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {notes === null && (
                    <div className="h-4 w-full animate-pulse rounded bg-secondary/70" />
                  )}
                  {notes?.length === 0 && (
                    <p className="text-xs text-muted-foreground">No notes yet.</p>
                  )}
                  {notes?.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border/60 p-3 text-sm">
                      <p className="text-foreground">{n.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.createdByName ?? "Admin"} · {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <SheetClose render={<Button type="button" variant="outline" className="mt-auto" />}>
                Close
              </SheetClose>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
