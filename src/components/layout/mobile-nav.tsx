"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MobileNavSheetProps } from "@/components/layout/mobile-nav-sheet";

// The drawer (Base UI Dialog + focus trap + portal) is only needed once a
// visitor opens the menu, and never on desktop, so keep it out of the
// initial bundle and fetch it on demand.
const loadSheet = () => import("@/components/layout/mobile-nav-sheet");
const MobileNavSheet = dynamic(loadSheet);

type MobileNavProps = Omit<MobileNavSheetProps, "open" | "onOpenChange"> & {
  openLabel: string;
};

export function MobileNav({ openLabel, ...sheetProps }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        // Warm the chunk as soon as intent is likely, so the drawer opens
        // without a visible delay.
        onPointerEnter={loadSheet}
        onFocus={loadSheet}
        onTouchStart={loadSheet}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">{openLabel}</span>
      </button>
      {mounted && (
        <MobileNavSheet open={open} onOpenChange={setOpen} {...sheetProps} />
      )}
    </>
  );
}
