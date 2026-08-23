"use client";

import { useEffect, useState } from "react";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STAFF" | "STUDENT" | "PARENT";
  teacherId: string | null;
  studentId: string | null;
};

/** undefined = still loading, null = not logged in */
export function useSession() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return user;
}
