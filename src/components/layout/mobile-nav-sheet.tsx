"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type MobileNavSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: { label: string; href: string }[];
  loginLabel: string;
  getStartedLabel: string;
};

export default function MobileNavSheet({
  open,
  onOpenChange,
  links,
  loginLabel,
  getStartedLabel,
}: MobileNavSheetProps) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            Global Teaching Hub
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={close}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={close}
              className={buttonVariants({ variant: "outline" })}
            >
              {loginLabel}
            </Link>
            <Link href="/register" onClick={close} className={buttonVariants()}>
              {getStartedLabel}
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
