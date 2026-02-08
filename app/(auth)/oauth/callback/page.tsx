"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useViewTransitionRouter } from "@/lib/view-transitions";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { SEO } from "@/components/seo";
import { Loader2 } from "lucide-react";

function OAuthCallbackContent() {
  const router = useViewTransitionRouter();
  const { refresh } = useAuth();
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
      .then(() => refresh())
      .then(() => {
        router.replace("/dashboard");
      })
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to complete sign in. Please try again.";
        setError(message);
      });
  }, [searchParams, router, refresh]);

  if (error) {
    return (
      <div className="rounded-2xl bg-card border border-border p-8 shadow-xl text-center">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <a
          href="/sign-in"
          className="text-sm text-lime font-semibold hover:underline"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-8 shadow-xl text-center">
      <Loader2 className="size-8 text-lime animate-spin mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <>
      <SEO title="Signing In" />
      <Suspense
        fallback={
          <div className="rounded-2xl bg-card border border-border p-8 shadow-xl text-center">
            <Loader2 className="size-8 text-lime animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <OAuthCallbackContent />
      </Suspense>
    </>
  );
}
