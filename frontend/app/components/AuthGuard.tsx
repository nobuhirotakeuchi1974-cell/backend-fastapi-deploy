"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return null;
    }
  }

  return <>{children}</>;
}