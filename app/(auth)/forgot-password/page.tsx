"use client";

import { useState } from "react";
import { TransitionLink } from "@/lib/view-transitions";
import { ID } from "appwrite";
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const origin = window.location.origin;
      await account.createMagicURLToken(
        ID.unique(),
        email,
        `${origin}/magic-link/callback`,
      );
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send reset link. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <SEO title="Forgot Password" />
        <div className="rounded-2xl bg-card border border-border p-8 shadow-xl text-center">
          <div className="size-14 rounded-full bg-lime/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="size-7 text-lime" />
          </div>
          <h1 className="font-sans text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
            We sent a magic link to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            Click the link in the email to sign in.
          </p>
          <p className="text-sm text-center mt-8">
            <TransitionLink
              href="/sign-in"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </TransitionLink>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Forgot Password" />
      <div className="rounded-2xl bg-card border border-border p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="font-sans text-2xl font-bold">
            Forgot your password?
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enter your email and we&apos;ll send you a magic link to sign in
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="rounded-xl h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl h-12 bg-lime text-lime-foreground hover:bg-lime/90 font-semibold text-sm"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        {/* Back to sign in */}
        <p className="text-sm text-center mt-6">
          <TransitionLink
            href="/sign-in"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </TransitionLink>
        </p>
      </div>
    </>
  );
}
