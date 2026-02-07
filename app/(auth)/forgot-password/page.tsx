"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl bg-card border border-border p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="font-sans text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Reset Form */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="rounded-xl h-12"
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl h-12 bg-lime text-lime-foreground hover:bg-lime/90 font-semibold text-sm"
        >
          Send reset link
        </Button>
      </form>

      {/* Back to sign in */}
      <p className="text-sm text-center mt-6">
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
