"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthenticationFactor } from "appwrite";
import { account } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeContext } from "../layout";
import { Sun, Moon, Camera, X } from "lucide-react";

export default function MFALoginPage() {
  const { isDark, toggle } = useContext(ThemeContext);
  const { refresh } = useAuth();
  const router = useRouter();
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(true);

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
      await refresh();
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    try {
      await account.deleteSession("current");
    } catch {
      // ignore
    }
    await refresh();
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
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
          <div className="size-9 rounded-xl bg-lime flex items-center justify-center">
            <Camera className="size-5 text-lime-foreground" />
          </div>
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
            onClick={handleCancel}
            className="size-9 rounded-full flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
            aria-label="Cancel and go back to sign in"
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
                Two-factor authentication
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Enter the 6-digit code from your authenticator app to complete
                sign in.
              </p>
            </div>

            {creating ? (
              <p className="text-sm text-muted-foreground text-center">
                Preparing challenge...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mfa-login-code">Authentication code</Label>
                  <Input
                    id="mfa-login-code"
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
                  {loading ? "Verifying..." : "Verify and sign in"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
