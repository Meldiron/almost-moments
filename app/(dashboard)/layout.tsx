"use client";

import { useEffect, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Sun,
  Moon,
  LogOut,
  Images,
  Settings,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { ThemeContext } from "../layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { isDark, toggle } = useContext(ThemeContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  const isGalleries = pathname === "/dashboard";

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Left: Logo + Galleries link */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <div className="size-8 rounded-lg bg-lime flex items-center justify-center">
                <Camera className="size-4 text-lime-foreground" />
              </div>
              <span className="font-sans font-bold text-base hidden sm:inline">
                Almost Moments
              </span>
            </Link>

            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isGalleries
                  ? "bg-lime/15 text-lime"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Images className="size-4" />
              Galleries
            </Link>
          </div>

          {/* Right: Theme toggle + user menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="size-9 rounded-full flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="size-9 rounded-full flex items-center justify-center bg-lime/15 hover:bg-lime/25 transition-colors"
                  aria-label="User menu"
                >
                  <User className="size-4 text-lime" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
