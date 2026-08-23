"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText } from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/dashboard/portal-shell";
import { useSession } from "@/lib/use-session";

// Teacher and Staff share this portal route. Staff members aren't tied to a
// Teacher record (no students of their own), so student-specific nav items
// only show up for actual teachers.
function navFor(role: "TEACHER" | "STAFF"): PortalNavItem[] {
  const items: PortalNavItem[] = [{ label: "Overview", href: "/teacher", icon: LayoutDashboard }];
  if (role === "TEACHER") {
    items.push({ label: "My Students", href: "/teacher/students", icon: Users });
  }
  items.push({ label: "SOPs", href: "/teacher/sops", icon: FileText });
  return items;
}

export default function TeacherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useSession();
  const loading = user === undefined;
  const authorized = user?.role === "TEACHER" || user?.role === "STAFF";

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
      roleLabel={user.role === "STAFF" ? "Staff" : "Teacher"}
      navItems={navFor(user.role === "STAFF" ? "STAFF" : "TEACHER")}
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
      }}
    >
      {children}
    </PortalShell>
  );
}
