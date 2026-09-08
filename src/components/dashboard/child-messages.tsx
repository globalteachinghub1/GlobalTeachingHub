"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MessageEntry = {
  id: string;
  body: string;
  createdAt: string;
  fromParent: boolean;
  senderName: string;
};

export function ChildMessages({ studentId }: { studentId: string }) {
  const t = useTranslations("ParentPortal");
  const locale = useLocale();
  const [messages, setMessages] = useState<MessageEntry[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/parent/messages/${studentId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!active) return;
        setLoadError(false);
        setMessages(data?.messages ?? []);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [studentId, reloadToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    setSendError(false);
    try {
      const res = await fetch(`/api/parent/messages/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...(prev ?? []), data.message]);
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

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{t("messages")}</h3>
      <Card className="mt-2 border-none shadow-sm">
        <CardContent className="p-3">
          <div ref={scrollRef} className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {loadError && (
              <div className="flex flex-col items-center gap-1.5 py-4 text-center">
                <p className="text-xs text-destructive">{t("messagesLoadError")}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLoadError(false);
                    setReloadToken((n) => n + 1);
                  }}
                >
                  {t("retry")}
                </Button>
              </div>
            )}
            {!loadError && messages === null && (
              <p className="py-4 text-center text-xs text-muted-foreground">{t("loading")}</p>
            )}
            {!loadError && messages?.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t("noMessagesYet")}
              </p>
            )}
            {messages?.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-0.5 ${m.fromParent ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs ${
                    m.fromParent
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.body}
                </div>
                <span className="px-1 text-[10px] text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="mt-2 flex gap-2">
            <Input
              placeholder={t("messagePlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" disabled={sending || !text.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
          {sendError && (
            <p className="mt-1.5 text-xs text-destructive">{t("messageSendError")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
