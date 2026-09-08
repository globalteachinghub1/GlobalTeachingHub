"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MessageEntry = {
  id: string;
  body: string;
  createdAt: string;
  fromParent: boolean;
  senderName: string;
};

type ParentOption = { id: string; name: string };

export function MessagesPanel({ apiBase }: { apiBase: string }) {
  const [parents, setParents] = useState<ParentOption[] | null>(null);
  const [parentId, setParentId] = useState("");
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const url = parentId
      ? `${apiBase}/messages?parentId=${encodeURIComponent(parentId)}`
      : `${apiBase}/messages`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!active) return;
        setLoadError(false);
        setParents(data.parents ?? []);
        setMessages(data.messages ?? []);
        if (!parentId && data.parents?.[0]) setParentId(data.parents[0].id);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [apiBase, parentId, reloadToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !parentId) return;

    setSending(true);
    setSendError(false);
    try {
      const res = await fetch(`${apiBase}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, body: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setText("");
      } else {
        setSendError(true);
      }
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  }

  if (loadError) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold text-foreground">Messages</h2>
        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="flex flex-col items-start gap-2 px-6 py-4">
            <p className="text-sm text-destructive">
              Couldn&apos;t load messages. Check your connection and try again.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLoadError(false);
                setReloadToken((n) => n + 1);
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (parents === null) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold text-foreground">Messages</h2>
        <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!parents || parents.length === 0) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold text-foreground">Messages</h2>
        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="px-6 py-4 text-sm text-muted-foreground">
            No parent is linked to this student yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Messages</h2>
        {parents.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message-parent">Parent</Label>
            <select
              id="message-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card className="mt-3 border-none bg-background shadow-none">
        <CardContent className="p-4">
          <div ref={scrollRef} className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {messages.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No messages yet — say hello.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-0.5 ${m.fromParent ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.fromParent
                      ? "bg-secondary text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {m.body}
                </div>
                <span className="px-1 text-[11px] text-muted-foreground">
                  {m.senderName} ·{" "}
                  {new Date(m.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="mt-3 flex gap-2">
            <Input
              placeholder="Write a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-9"
            />
            <Button type="submit" size="sm" disabled={sending || !text.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
          {sendError && (
            <p className="mt-1.5 text-xs text-destructive">
              Couldn&apos;t send that message. Try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
