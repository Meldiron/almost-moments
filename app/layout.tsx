"use client";

import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import {
  useState,
  useSyncExternalStore,
  createContext,
  useContext,
} from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ViewTransitions } from "@/lib/view-transitions";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ThemeContextType = {
  isDark: boolean;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [, forceRender] = useState(0);

  const isDark = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => {
      const stored = localStorage.getItem("almost-moments-theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    () => true,
  );

  const toggle = () => {
    const next = !isDark;
    localStorage.setItem("almost-moments-theme", next ? "dark" : "light");
    forceRender((n) => n + 1);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#a3e635" />
      </head>
      <body
        className={`${sora.variable} ${dmSans.variable} antialiased ${isDark ? "dark" : ""}`}
      >
        <ThemeContext.Provider value={{ isDark, toggle }}>
          <ViewTransitions>
            <AuthProvider>{children}</AuthProvider>
          </ViewTransitions>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
