"use client";

import Link from "next/link";
import { Sun, Moon, Camera, X } from "lucide-react";
import { ThemeContext } from "../layout";
import { useContext } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDark, toggle } = useContext(ThemeContext);

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      {/* Dot pattern background — fades out toward center */}
      <div
        className="absolute inset-0 pattern-dots-lime"
        style={{
          maskImage: "radial-gradient(ellipse at center, transparent 20%, black 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 20%, black 75%)",
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
          <Link
            href="/"
            className="size-9 rounded-full flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </main>
    </div>
  );
}
