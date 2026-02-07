"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AuthenticationFactor } from "appwrite";
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeContext } from "../layout";
import { SEO } from "@/components/seo";
import { Sun, Moon, X } from "lucide-react";

export default function MFAChallengePage() {
  const { isDark, toggle } = useContext(ThemeContext);
  const router = useRouter();
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(true);

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard/settings");
    }
  }

  useEffect(() => {
    async function createChallenge() {
      try {
        const challenge = await account.createMfaChallenge(
          AuthenticationFactor.Totp,
        );
        setChallengeId(challenge.$id);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create MFA challenge.",
        );
      } finally {
        setCreating(false);
      }
    }
    createChallenge();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await account.updateMfaChallenge(challengeId, otp);
      goBack();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      <SEO title="MFA Challenge" />
      {/* Dot pattern background — fades out toward center */}
      <div
        className="absolute inset-0 pattern-dots-lime"
        style={{
          maskImage:
            "radial-gradient(ellipse at center, transparent 20%, black 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, transparent 20%, black 75%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.svg"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-xl"
          />
          <span className="font-sans font-bold text-lg">Almost Moments</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="size-9 rounded-full flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={goBack}
            className="size-9 rounded-full flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
            aria-label="Go back"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="rounded-2xl bg-card border border-border p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="font-sans text-2xl font-bold">
                Verify your identity
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Enter the 6-digit code from your authenticator app to continue.
              </p>
            </div>

            {creating ? (
              <p className="text-sm text-muted-foreground text-center">
                Preparing challenge...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Authentication code</Label>
                  <Input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    className="rounded-xl h-12 text-center font-mono text-lg tracking-widest"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-xl h-12 bg-lime text-lime-foreground hover:bg-lime/90 font-semibold text-sm"
                  disabled={loading || !challengeId}
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
