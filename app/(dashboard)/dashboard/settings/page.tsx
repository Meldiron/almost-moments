"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, ShieldCheck, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Email */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-sky/15 flex items-center justify-center shrink-0">
              <Mail className="size-5 text-sky" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-sans text-base font-semibold mb-1">Email</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your current email address is used for signing in and
                notifications.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="email"
                  defaultValue={user?.email ?? ""}
                  className="rounded-xl h-10"
                  readOnly
                />
                <Button
                  variant="outline"
                  className="rounded-xl shrink-0 font-medium"
                >
                  Change email
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-amber/15 flex items-center justify-center shrink-0">
              <Lock className="size-5 text-amber" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-sans text-base font-semibold mb-1">
                Password
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Update your password to keep your account secure.
              </p>
              <div className="space-y-3 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="rounded-xl h-10"
                  />
                </div>
                <Button variant="outline" className="rounded-xl font-medium">
                  Update password
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
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
                Add an extra layer of security with a TOTP authenticator app
                like Google Authenticator or Authy.
              </p>
              <Button variant="outline" className="rounded-xl font-medium">
                Enable 2FA
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Delete Account */}
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
                Permanently delete your account and all your galleries. This
                action cannot be undone.
              </p>
              <Button variant="destructive" className="rounded-xl font-medium">
                Delete account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
