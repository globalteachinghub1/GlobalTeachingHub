import type { Metadata } from "next";
import Image from "next/image";
import { StaffLoginForm } from "@/components/sections/staff-login-form";

export const metadata: Metadata = {
  title: "Staff Login — Global Teaching Hub",
  robots: { index: false, follow: false },
};

export default function StaffLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/20 px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Image
            src="/logo-full.png"
            alt="Global Teaching Hub"
            width={160}
            height={147}
            className="mx-auto h-24 w-auto object-contain"
            priority
          />
          <h1 className="mt-4 text-3xl font-bold text-foreground">Staff Login</h1>
          <p className="mt-3 text-muted-foreground">
            Login to the Admin or Teacher portal.
          </p>
        </div>

        <div className="mt-10">
          <StaffLoginForm />
        </div>
      </div>
    </main>
  );
}
