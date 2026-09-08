"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  Receipt,
  FileText,
  UserPlus,
  Settings,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell";
import { useSession } from "@/lib/use-session";

const ADMIN_NAV: PortalNavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: UserPlus },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
  { label: "SOPs", href: "/admin/sops", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useSession();
  const loading = user === undefined;
  const authorized = user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && !authorized) router.replace("/admin/login");
  }, [loading, authorized, router]);

  if (loading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking access...
      </div>
    );
  }

  return (
    <PortalShell
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
      }}
    >
      {children}
    </PortalShell>
  );
}
