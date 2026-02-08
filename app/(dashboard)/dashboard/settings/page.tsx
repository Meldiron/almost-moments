"use client";

import { useState, useEffect } from "react";
import { useViewTransitionRouter } from "@/lib/view-transitions";
import { AuthenticatorType } from "appwrite";
import { account } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SEO } from "@/components/seo";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  Lock,
  ShieldCheck,
  Trash2,
  Check,
  Copy,
  KeyRound,
  Download,
} from "lucide-react";

function isMFAChallengeRequired(err: unknown): boolean {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    "type" in err &&
    (err as { code: number }).code === 401 &&
    (err as { type: string }).type === "user_challenge_required"
  ) {
    return true;
  }
  return false;
}

// ─── Email Section ──────────────────────────────────────────────
function EmailSection() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await account.updateEmail(newEmail, password);
      await refresh();
      setSuccess(true);
      setEditing(false);
      setNewEmail("");
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-xl bg-sky/15 flex items-center justify-center shrink-0">
          <Mail className="size-5 text-sky" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-base font-semibold mb-1">Email</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your current email address is used for signing in and notifications.
          </p>

          {success && (
            <p className="text-sm text-lime mb-4 flex items-center gap-1.5">
              <Check className="size-4" /> Email updated successfully.
            </p>
          )}

          {!editing ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <Input
                type="email"
                value={user?.email ?? ""}
                className="rounded-xl h-10"
                readOnly
              />
              <Button
                variant="outline"
                className="rounded-xl shrink-0 font-medium"
                onClick={() => {
                  setEditing(true);
                  setSuccess(false);
                }}
              >
                Change email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="new-email">New email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="new@example.com"
                  className="rounded-xl h-10"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-password">Current password</Label>
                <Input
                  id="email-password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl h-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90 font-medium"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update email"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Password Section ───────────────────────────────────────────
function PasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await account.updatePassword(newPassword, oldPassword);
      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-xl bg-amber/15 flex items-center justify-center shrink-0">
          <Lock className="size-5 text-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-base font-semibold mb-1">Password</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Update your password to keep your account secure.
          </p>

          {success && (
            <p className="text-sm text-lime mb-4 flex items-center gap-1.5">
              <Check className="size-4" /> Password updated successfully.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                className="rounded-xl h-10"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="rounded-xl h-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="rounded-xl h-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              variant="outline"
              className="rounded-xl font-medium"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── 2FA Section ────────────────────────────────────────────────
type TwoFAStep = "idle" | "qr" | "recovery" | "done";

function TwoFASection() {
  const { user } = useAuth();
  const router = useViewTransitionRouter();
  const [step, setStep] = useState<TwoFAStep>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkTotpStatus() {
      if (!user?.mfa) {
        setStep("idle");
        setVerified(false);
        setChecking(false);
        return;
      }
      try {
        const factors = await account.listMfaFactors();
        const hasTOTP = factors.totp;
        setStep(hasTOTP ? "done" : "idle");
        setVerified(hasTOTP);
      } catch {
        setStep("idle");
        setVerified(false);
      } finally {
        setChecking(false);
      }
    }
    checkTotpStatus();
  }, [user?.mfa]);
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  async function handleDisable() {
    setError("");
    setDisableLoading(true);
    try {
      await account.deleteMFAAuthenticator(AuthenticatorType.Totp);
      await account.updateMFA(false);
      setStep("idle");
      setVerified(false);
    } catch (err: unknown) {
      if (isMFAChallengeRequired(err)) {
        router.push("/mfa-challenge");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setDisableLoading(false);
    }
  }

  async function handleEnable() {
    setError("");
    setLoading(true);
    try {
      await account.updateMFA(true);
      const authenticator = await account.createMFAAuthenticator(
        AuthenticatorType.Totp,
      );
      setSecret(authenticator.secret);
      setUri(authenticator.uri);
      setStep("qr");
      setDialogOpen(true);
    } catch (err: unknown) {
      if (isMFAChallengeRequired(err)) {
        router.push("/mfa-challenge");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await account.updateMFAAuthenticator(AuthenticatorType.Totp, otpCode);
      setVerified(true);
      let codes;
      try {
        codes = await account.createMFARecoveryCodes();
      } catch (recErr: unknown) {
        if (
          recErr &&
          typeof recErr === "object" &&
          "code" in recErr &&
          "type" in recErr &&
          (recErr as { code: number }).code === 409 &&
          (recErr as { type: string }).type ===
            "user_recovery_codes_already_exists"
        ) {
          codes = await account.getMFARecoveryCodes();
        } else {
          throw recErr;
        }
      }
      setRecoveryCodes(codes.recoveryCodes);
      setStep("recovery");
    } catch (err: unknown) {
      if (isMFAChallengeRequired(err)) {
        router.push("/mfa-challenge");
        return;
      }
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewRecoveryCodes() {
    setRecoveryError("");
    setRecoveryLoading(true);
    setRecoveryDialogOpen(true);
    try {
      const codes = await account.getMFARecoveryCodes();
      setRecoveryCodes(codes.recoveryCodes);
    } catch (err: unknown) {
      if (isMFAChallengeRequired(err)) {
        setRecoveryDialogOpen(false);
        router.push("/mfa-challenge");
        return;
      }
      setRecoveryError(
        err instanceof Error ? err.message : "Failed to load recovery codes",
      );
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function handleRegenerateRecoveryCodes() {
    setRecoveryError("");
    setRegenerateLoading(true);
    try {
      const codes = await account.updateMFARecoveryCodes();
      setRecoveryCodes(codes.recoveryCodes);
    } catch (err: unknown) {
      if (isMFAChallengeRequired(err)) {
        setRecoveryDialogOpen(false);
        router.push("/mfa-challenge");
        return;
      }
      setRecoveryError(
        err instanceof Error
          ? err.message
          : "Failed to regenerate recovery codes",
      );
    } finally {
      setRegenerateLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSavedCodes() {
    setDialogOpen(false);
    setStep("done");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-xl bg-violet/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="size-5 text-violet" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-base font-semibold mb-1">
            Two-factor authentication
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add an extra layer of security with a TOTP authenticator app like
            Google Authenticator or Authy.
          </p>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {checking ? (
            <div className="h-9 w-32 rounded-xl bg-muted animate-pulse" />
          ) : verified ? (
            <div className="space-y-3">
              <p className="text-sm text-lime flex items-center gap-1.5">
                <Check className="size-4" /> Two-factor authentication is
                enabled.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl font-medium"
                  onClick={handleViewRecoveryCodes}
                >
                  <KeyRound className="size-4 mr-1.5" />
                  Recovery codes
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-xl font-medium text-destructive hover:text-destructive"
                      disabled={disableLoading}
                    >
                      {disableLoading ? "Disabling..." : "Disable 2FA"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable 2FA?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the extra layer of security from your
                        account. You can always re-enable it later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDisable}
                      >
                        Disable 2FA
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="rounded-xl font-medium"
              onClick={handleEnable}
              disabled={loading}
            >
              {loading ? "Setting up..." : "Enable 2FA"}
            </Button>
          )}
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            if (verified) {
              setStep("done");
            } else {
              setStep("idle");
            }
            setOtpCode("");
            setError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {step === "qr" && (
            <>
              <DialogHeader>
                <DialogTitle>Set up two-factor authentication</DialogTitle>
                <DialogDescription>
                  Scan this QR code with your authenticator app, then enter the
                  6-digit code to verify.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-5 py-2">
                {/* QR Code */}
                <div className="rounded-xl border border-border p-3 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uri)}`}
                    alt="2FA QR Code"
                    width={180}
                    height={180}
                  />
                </div>

                {/* Manual entry */}
                <div className="w-full space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="size-4" />
                    Or enter the secret manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-3 py-2 rounded-lg font-mono break-all flex-1">
                      {secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="size-8 rounded-lg flex items-center justify-center bg-secondary hover:bg-accent transition-colors shrink-0"
                      aria-label="Copy secret"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-lime" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* TOTP verification */}
                <form onSubmit={handleVerify} className="w-full space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="totp-code">
                      Enter the 6-digit code from your app
                    </Label>
                    <Input
                      id="totp-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      className="rounded-xl h-10 text-center font-mono text-lg tracking-widest"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    type="submit"
                    className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90 font-medium w-full"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify and enable"}
                  </Button>
                </form>
              </div>
            </>
          )}

          {step === "recovery" && (
            <>
              <DialogHeader>
                <DialogTitle>Save your recovery codes</DialogTitle>
                <DialogDescription>
                  Store these codes in a safe place. You can use them to sign in
                  if you lose access to your authenticator app.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code) => (
                    <code
                      key={code}
                      className="text-sm bg-muted px-3 py-2 rounded-lg font-mono text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl font-medium flex-1"
                    onClick={() => {
                      const text = `Almost Moments - Recovery Codes\n\n${recoveryCodes.join("\n")}\n`;
                      const blob = new Blob([text], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "almost-moments-recovery-codes.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="size-4 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    className="rounded-xl bg-lime text-lime-foreground hover:bg-lime/90 font-medium flex-1"
                    onClick={handleSavedCodes}
                  >
                    I&apos;ve saved my codes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={recoveryDialogOpen}
        onOpenChange={(open) => {
          setRecoveryDialogOpen(open);
          if (!open) {
            setRecoveryError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recovery codes</DialogTitle>
            <DialogDescription>
              Use these codes to sign in if you lose access to your
              authenticator app. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {recoveryLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : recoveryError ? (
              <p className="text-sm text-destructive">{recoveryError}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code) => (
                  <code
                    key={code}
                    className="text-sm bg-muted px-3 py-2 rounded-lg font-mono text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl font-medium flex-1"
                disabled={recoveryLoading || !!recoveryError}
                onClick={() => {
                  const text = `Almost Moments - Recovery Codes\n\n${recoveryCodes.join("\n")}\n`;
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "almost-moments-recovery-codes.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="size-4 mr-1.5" />
                Download
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-medium flex-1"
                disabled={regenerateLoading || recoveryLoading}
                onClick={handleRegenerateRecoveryCodes}
              >
                {regenerateLoading ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Delete Account Section ─────────────────────────────────────
function DeleteAccountSection() {
  const router = useViewTransitionRouter();
  const { refresh } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await account.updateStatus();
      await refresh();
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
          <Trash2 className="size-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-sans text-base font-semibold mb-1">
            Delete account
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all your galleries. This action
            cannot be undone.
          </p>

          <Button
            variant="destructive"
            className="rounded-xl font-medium"
            onClick={() => setDialogOpen(true)}
          >
            Delete account
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setConfirmText("");
            setError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all your galleries.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDelete} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-bold">DELETE</span> to
                confirm
              </Label>
              <Input
                id="delete-confirm"
                type="text"
                placeholder="DELETE"
                className="rounded-xl h-10"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="rounded-xl font-medium w-full"
              disabled={confirmText !== "DELETE" || loading}
            >
              {loading ? "Deleting..." : "Permanently delete"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Settings Page ──────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div>
      <SEO title="Settings" />
      <h1 className="font-sans text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <EmailSection />
        <PasswordSection />
        <TwoFASection />
        <Separator />
        <DeleteAccountSection />
      </div>
    </div>
  );
}
