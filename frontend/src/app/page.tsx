"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function RootRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === "patient") router.replace("/patient/dashboard");
        else if (user.role === "hospital") router.replace("/hospital/dashboard");
        else if (user.role === "insurer") router.replace("/insurer/dashboard");
        else router.replace("/home");
      } else {
        // First-time splash initialization
        router.replace("/loading");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
