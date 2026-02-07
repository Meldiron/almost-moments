"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";
import { Loader2 } from "lucide-react";

function MagicLinkCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (!userId || !secret) {
      router.replace("/sign-in");
      return;
    }

    account
      .createSession(userId, secret)
      .then(() => {
        router.replace("/dashboard");
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "This link has expired or is invalid. Please request a new one.";
        setError(message);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="rounded-2xl bg-card border border-border p-8 shadow-xl text-center">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <a href="/forgot-password" className="text-sm text-lime font-semibold hover:underline">
          Request a new link
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-8 shadow-xl text-center">
      <Loader2 className="size-8 text-lime animate-spin mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </div>
  );
}

export default function MagicLinkCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-card border border-border p-8 shadow-xl text-center">
          <Loader2 className="size-8 text-lime animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <MagicLinkCallbackContent />
    </Suspense>
  );
}
