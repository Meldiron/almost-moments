"use client";

import { useContext, useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ThemeContext } from "./layout";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Camera,
  QrCode,
  Upload,
  Images,
  Smartphone,
  Users,
  Zap,
  Shield,
  PartyPopper,
  Sun,
  Moon,
  ChevronRight,
  Star,
  Heart,
  Sparkles,
  Globe,
  ArrowRight,
  Check,
  Menu,
  X,
} from "lucide-react";

// ─── Scroll-triggered animation hook ────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimateIn({
  children,
  animation = "animate-slide-up",
  className = "",
  delay = "",
}: {
  children: ReactNode;
  animation?: string;
  className?: string;
  delay?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`${className} ${visible ? `${animation} ${delay}` : "opacity-0"}`}
    >
      {children}
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────
function Navbar() {
  const { isDark, toggle } = useContext(ThemeContext);
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="size-9 rounded-xl bg-lime flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="size-5 text-lime-foreground" />
          </div>
          <span className="font-sans text-lg font-bold tracking-tight">
            Almost Moments
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="size-9 rounded-full flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <Link href={user ? "/dashboard" : "/sign-in"}>
            <Button size="sm" className="hidden md:inline-flex rounded-full px-5 bg-lime text-lime-foreground hover:bg-lime/90 font-semibold">
              {user ? "My Galleries" : "Sign in"}
            </Button>
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden size-9 rounded-full flex items-center justify-center bg-secondary hover:bg-accent transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-6 pb-6 pt-2 flex flex-col gap-4 animate-slide-up">
          <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">
            How It Works
          </a>
          <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">
            Features
          </a>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">
            FAQ
          </a>
          <Link href={user ? "/dashboard" : "/sign-in"}>
            <Button className="rounded-full bg-lime text-lime-foreground hover:bg-lime/90 font-semibold w-full">
              {user ? "My Galleries" : "Sign in"}
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ───────────────────────────────────────────────────────
const galleries = [
  {
    emoji: "💒",
    label: "Wedding",
    date: "June 15, 2026",
    title: "Sarah & Tom's Wedding",
    stats: "247 photos by 58 guests",
    photos: [
      "photo-1519741497674-611481863552",
      "photo-1606216794074-735e91aa2c92",
      "photo-1583939003579-730e3918a45a",
      "photo-1511285560929-80b456fea0bc",
      "photo-1465495976277-4387d4b0b4c6",
      "photo-1460978812857-470ed1c77af0",
      "photo-1532712938310-34cb3982ef74",
      "photo-1507504031003-b417219a0fde",
      "photo-1522673607200-164d1b6ce486",
      "photo-1544078751-58fee2d8a03b",
      "photo-1470290378698-263fa7ca60ab",
      "photo-1587271407850-8d438ca9fdf2",
    ],
    floatIcon: <Heart className="size-5 text-coral" />,
    floatBg: "bg-coral/20",
    floatText: "+24 photos",
    floatSub: "just uploaded",
    guestCount: "58 guests",
    leftCardTop: 160,    // px from top
    rightCardBottom: 140, // px from bottom
  },
  {
    emoji: "🎂",
    label: "Birthday",
    date: "March 22, 2026",
    title: "Marco's 30th Birthday",
    stats: "183 photos by 34 guests",
    photos: [
      "photo-1530103862676-de8c9debad1d",
      "photo-1464349095431-e9a21285b5f3",
      "photo-1513151233558-d860c5398176",
      "photo-1504196606672-aef5c9cefc92",
      "photo-1527529482837-4698179dc6ce",
      "photo-1602631985686-1bb0e6a8696e",
      "photo-1558636508-e0db3814bd1d",
      "photo-1496843916299-590492c751f4",
      "photo-1519671482749-fd09be7ccebf",
      "photo-1533174072545-7a4b6ad7a6c3",
      "photo-1551024709-8f23befc6f87",
      "photo-1514525253161-7a46d19cd819",
    ],
    floatIcon: <PartyPopper className="size-5 text-amber" />,
    floatBg: "bg-amber/20",
    floatText: "+12 photos",
    floatSub: "just uploaded",
    guestCount: "34 guests",
    leftCardTop: 140,
    rightCardBottom: 140,
  },
  {
    emoji: "🏢",
    label: "Corporate",
    date: "Jan 10, 2026",
    title: "TechCorp Annual Summit",
    stats: "312 photos by 95 guests",
    photos: [
      "photo-1540575467063-178a50c2df87",
      "photo-1505373877841-8d25f7d46678",
      "photo-1475721027785-f74eccf877e2",
      "photo-1591115765373-5207764f72e7",
      "photo-1556761175-5973dc0f32e7",
      "photo-1528605248644-14dd04022da1",
      "photo-1515187029135-18ee286d815b",
      "photo-1523580494863-6f3031224c94",
      "photo-1559223607-a43c990c692c",
      "photo-1577962917302-cd874c4e31d2",
      "photo-1558403194-611308249627",
      "photo-1531058020387-3be344556be6",
    ],
    floatIcon: <Zap className="size-5 text-sky" />,
    floatBg: "bg-sky/20",
    floatText: "+41 photos",
    floatSub: "just uploaded",
    guestCount: "95 guests",
    leftCardTop: 200,
    rightCardBottom: 140,
  },
  {
    emoji: "📚",
    label: "Book Club",
    date: "Feb 5, 2026",
    title: "Downtown Book Reading",
    stats: "86 photos by 22 guests",
    photos: [
      "photo-1481627834876-b7833e8f5570",
      "photo-1524995997946-a1c2e315a42f",
      "photo-1512820790803-83ca734da794",
      "photo-1507003211169-0a1dd7228f2d",
      "photo-1456513080510-7bf3a84b82f8",
      "photo-1519682337058-a94d519337bc",
      "photo-1495446815901-a7297e633e8d",
      "photo-1491841573634-28140fc7ced7",
      "photo-1529007196863-d07650a3f0ea",
      "photo-1506880018603-83d5b814b5a6",
      "photo-1497633762265-9d179a990aa6",
      "photo-1532012197267-da84d127e765",
    ],
    floatIcon: <Sparkles className="size-5 text-violet" />,
    floatBg: "bg-violet/20",
    floatText: "+8 photos",
    floatSub: "just uploaded",
    guestCount: "22 guests",
    leftCardTop: 240,
    rightCardBottom: 140,
  },
];

function GalleryScreen({ gallery }: { gallery: typeof galleries[number] }) {
  return (
    <div className="w-full flex-shrink-0 flex flex-col">
      {/* Gallery header */}
      <div className="px-4 pt-3 pb-4">
        <div className="text-left">
          <p className="text-xs text-muted-foreground font-medium">{gallery.date}</p>
          <h3 className="font-sans font-bold text-base mt-0.5">{gallery.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{gallery.stats}</p>
        </div>
      </div>
      {/* Photo grid */}
      <div className="flex-1 px-3 pb-3 grid grid-cols-3 gap-1.5 auto-rows-min">
        {gallery.photos.map((id, i) => (
          <div key={i} className="rounded-lg aspect-square overflow-hidden">
            <img
              src={`https://images.unsplash.com/${id}?w=100&h=100&fit=crop&q=60`}
              alt={`${gallery.label} photo`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  const { user } = useAuth();
  const [activeGallery, setActiveGallery] = useState(0);
  // "visible" = at rest, "out" = fading out (drifting up), "in" = fading in (rising from below)
  const [floatPhase, setFloatPhase] = useState<"visible" | "out" | "in">("visible");
  const [floatGallery, setFloatGallery] = useState(0);
  const gallery = galleries[activeGallery];
  const floatData = galleries[floatGallery];

  const handleSwitch = (index: number) => {
    if (index === activeGallery) return;
    setActiveGallery(index);
    // Fade out (drift up)
    setFloatPhase("out");
    setTimeout(() => {
      // Swap data, start in "in" phase (starts below, no transition yet)
      setFloatGallery(index);
      setFloatPhase("in");
      // Next frame: transition to visible (rises up into place)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFloatPhase("visible");
        });
      });
    }, 250);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Dot pattern background — fades out toward center */}
      <div
        className="absolute inset-0 pattern-dots-lime"
        style={{ maskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%)", WebkitMaskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%)" }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="animate-slide-up">
          <Badge variant="secondary" className="mb-6 mt-4 px-4 py-1.5 text-sm font-medium rounded-full border border-border">
            <Sparkles className="size-3.5 mr-1.5 text-amber" />
            Version 1.0.0 is live!
          </Badge>
        </div>

        <h1 className="animate-slide-up stagger-1 font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]">
          Every guest.{" "}
          <br className="hidden sm:block" />
          <span className="text-lime">Every moment.</span>{" "}
          <br className="hidden sm:block" />
          One gallery.
        </h1>

        <p className="animate-slide-up stagger-2 mt-12 sm:mt-12 text-xl sm:text-2xl text-foreground font-medium italic max-w-2xl mx-auto">
          &ldquo;Collect moments that almost slipped away&rdquo;
        </p>

        <div className="animate-slide-up stagger-4 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={user ? "/dashboard" : "/sign-in"}>
            <Button
              size="lg"
              className="rounded-full px-8 h-13 text-base bg-lime text-lime-foreground hover:bg-lime/90 font-semibold shadow-lg shadow-lime/20"
            >
              {user ? "My Galleries" : "Get Started"}
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-13 text-base font-medium"
          >
            See How It Works
          </Button>
        </div>

        <div className="animate-slide-up stagger-5 mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-lime" /> No app needed
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-lime" /> 100% free
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-lime" /> No sign-up for guests
          </span>
        </div>

        {/* Phone mockup area */}
        <div className="animate-scale-in stagger-6 mt-16 sm:mt-20 relative mx-auto max-w-3xl">
          <div className="relative mx-auto w-64 sm:w-72">
            {/* Phone frame */}
            <div className="rounded-[2.5rem] border-4 border-foreground/15 bg-card p-3 shadow-2xl">
              <div className="rounded-[2rem] bg-secondary overflow-hidden aspect-[9/16] flex flex-col">
                {/* Phone status bar */}
                <div className="px-5 pt-3 pb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>9:41</span>
                  <div className="w-20 h-5 rounded-full bg-foreground/10" />
                  <span>100%</span>
                </div>
                {/* Sliding gallery screens */}
                <div className="flex-1 overflow-hidden relative">
                  <div
                    className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                    style={{ transform: `translateX(-${activeGallery * 100}%)` }}
                  >
                    {galleries.map((g, i) => (
                      <GalleryScreen key={i} gallery={g} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating card — left side */}
            <div
              className="absolute -left-20 sm:-left-28 animate-float"
              style={{
                top: floatData.leftCardTop,
                opacity: floatPhase === "visible" ? 1 : 0,
                transform: floatPhase === "out" ? "translateY(-14px)" : floatPhase === "in" ? "translateY(14px)" : "translateY(0)",
                transition: floatPhase === "in" ? "none" : "opacity 250ms ease-out, transform 250ms ease-out",
              }}
            >
              <div className="rounded-2xl bg-card border border-border px-4 py-3 shadow-xl flex items-center gap-3">
                <div className={`size-10 rounded-full ${floatData.floatBg} flex items-center justify-center`}>
                  {floatData.floatIcon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{floatData.floatText}</p>
                  <p className="text-xs text-muted-foreground">{floatData.floatSub}</p>
                </div>
              </div>
            </div>

            {/* Floating card — right side */}
            <div
              className="absolute -right-16 sm:-right-24 animate-float-delayed"
              style={{
                bottom: floatData.rightCardBottom,
                opacity: floatPhase === "visible" ? 1 : 0,
                transform: floatPhase === "out" ? "translateY(-14px)" : floatPhase === "in" ? "translateY(14px)" : "translateY(0)",
                transition: floatPhase === "in" ? "none" : "opacity 250ms ease-out, transform 250ms ease-out",
              }}
            >
              <div className="rounded-2xl bg-card border border-border px-4 py-3 shadow-xl flex items-center gap-3">
                <div className="size-10 rounded-full bg-lime/20 flex items-center justify-center">
                  <Users className="size-5 text-lime" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{floatData.guestCount}</p>
                  <p className="text-xs text-muted-foreground">contributing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery type chips — below phone */}
        <div className="animate-slide-up stagger-6 mt-10 flex items-center justify-center gap-2 flex-wrap">
          {galleries.map((g, i) => (
            <button
              key={g.label}
              onClick={() => handleSwitch(i)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeGallery === i
                  ? "bg-foreground text-background shadow-lg scale-105"
                  : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className="mr-1.5">{g.emoji}</span>
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: <PartyPopper className="size-9" />,
      title: "Create a gallery",
      description: "Give your event a name and get a unique gallery link and QR code in seconds.",
      bgClass: "bg-lime/15",
      textClass: "text-lime",
      borderClass: "border-lime/30",
      dotClass: "bg-lime",
      number: "01",
    },
    {
      icon: <QrCode className="size-9" />,
      title: "Share the QR code",
      description: "Print it, display it, or send the link. Place it where guests can easily scan.",
      bgClass: "bg-sky/15",
      textClass: "text-sky",
      borderClass: "border-sky/30",
      dotClass: "bg-sky",
      number: "02",
    },
    {
      icon: <Upload className="size-9" />,
      title: "Guests upload photos",
      description: "No app, no account. Guests open the link and upload straight from their phone.",
      bgClass: "bg-coral/15",
      textClass: "text-coral",
      borderClass: "border-coral/30",
      dotClass: "bg-coral",
      number: "03",
    },
    {
      icon: <Images className="size-9" />,
      title: "Enjoy every moment",
      description: "All photos and videos from every guest — together in one beautiful gallery.",
      bgClass: "bg-amber/15",
      textClass: "text-amber",
      borderClass: "border-amber/30",
      dotClass: "bg-amber",
      number: "04",
    },
  ];

  return (
    <section id="how-it-works" className="py-28 sm:py-36 relative overflow-hidden">
      {/* Dot pattern background — fades out toward center and bottom */}
      <div
        className="absolute inset-0 pattern-dots-lime"
        style={{
          maskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%), linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%), linear-gradient(to bottom, black 60%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "destination-in",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6">
        <AnimateIn className="text-center mb-20 sm:mb-28">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-sm border border-border">
            Quick and simple
          </Badge>
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            From event to shared gallery in under a minute.
          </p>
        </AnimateIn>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

          <div className="space-y-16 sm:space-y-24">
            {steps.map((step, i) => {
              const isRight = i % 2 === 1;
              return (
                <AnimateIn
                  key={step.number}
                  animation={isRight ? "animate-slide-in-right" : "animate-slide-in-left"}
                  delay={`stagger-${i + 1}`}
                >
                  <div className={`flex flex-col md:flex-row items-center gap-8 ${isRight ? "md:flex-row-reverse" : ""}`}>
                    {/* Content card */}
                    <div className="flex-1 w-full">
                      <div className="relative rounded-3xl bg-card border border-border p-8 sm:p-10">
                        {/* Large background number */}
                        <span className={`absolute top-6 right-8 font-sans text-7xl sm:text-8xl font-black ${step.textClass} opacity-[0.07] select-none`}>
                          {step.number}
                        </span>

                        <div className="relative">
                          <div className={`size-16 sm:size-20 rounded-2xl ${step.bgClass} flex items-center justify-center mb-6`}>
                            <div className={step.textClass}>{step.icon}</div>
                          </div>
                          <h3 className="font-sans text-2xl sm:text-3xl font-bold mb-3">{step.title}</h3>
                          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline node */}
                    <div className="hidden md:flex items-center justify-center shrink-0">
                      <div className={`size-4 rounded-full ${step.dotClass} shadow-lg ring-4 ring-background`} />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 hidden md:block" />
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-16 sm:py-28 relative">
      {/* Lime section */}
      <div className="absolute inset-0 bg-white dark:bg-black" />

      <div className="relative mx-auto max-w-6xl px-6">
        <AnimateIn className="text-center mb-16 sm:mb-20">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-sm border border-border">
            Built for real events
          </Badge>
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Everything you need.{" "}
            <br className="hidden sm:block" />
            <span className="text-lime">Nothing you don't.</span>
          </h2>
        </AnimateIn>

        {/* Feature bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Large feature card */}
          <AnimateIn animation="animate-slide-in-left" className="lg:col-span-2">
            <div className="rounded-3xl bg-card border border-border p-8 sm:p-10 h-full flex flex-col justify-between ">
              <div>
                <div className="size-14 rounded-2xl bg-lime/15 flex items-center justify-center mb-6">
                  <Smartphone className="size-7 text-lime" />
                </div>
                <h3 className="font-sans text-2xl sm:text-3xl font-bold mb-3">
                  Zero friction for guests
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
                  No app to download. No account to create. Guests scan the QR code with
                  their phone camera, tap the link, and start uploading. That's it.
                  Works on any phone, any browser.
                </p>
              </div>
              <div className="mt-8 flex gap-3 flex-wrap">
                {["No app install", "No sign-up", "Works on all phones", "Instant access"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3.5 py-1.5 rounded-full bg-lime/10 text-lime text-sm font-medium border border-lime/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </AnimateIn>

          <AnimateIn animation="animate-slide-in-right">
            <div className="rounded-3xl bg-card border border-border p-8 h-full ">
              <div className="size-14 rounded-2xl bg-coral/15 flex items-center justify-center mb-6">
                <QrCode className="size-7 text-coral" />
              </div>
              <h3 className="font-sans text-xl font-bold mb-2">
                QR code ready
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get a beautiful, print-ready QR code the moment you create your gallery.
                Display it at the entrance, on tables, or in your event program.
              </p>
            </div>
          </AnimateIn>

          <AnimateIn animation="animate-slide-up" delay="stagger-1">
            <div className="rounded-3xl bg-card border border-border p-8 h-full ">
              <div className="size-14 rounded-2xl bg-sky/15 flex items-center justify-center mb-6">
                <Zap className="size-7 text-sky" />
              </div>
              <h3 className="font-sans text-xl font-bold mb-2">
                Lightning fast uploads
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Photos and videos upload in seconds, even on spotty event Wi-Fi.
                Optimized for mobile connections so nothing gets lost.
              </p>
            </div>
          </AnimateIn>

          <AnimateIn animation="animate-slide-up" delay="stagger-2">
            <div className="rounded-3xl bg-card border border-border p-8 h-full ">
              <div className="size-14 rounded-2xl bg-amber/15 flex items-center justify-center mb-6">
                <Images className="size-7 text-amber" />
              </div>
              <h3 className="font-sans text-xl font-bold mb-2">
                Beautiful gallery view
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Photos aren't dumped in a folder. They're displayed in a gorgeous,
                responsive gallery that makes browsing a joy.
              </p>
            </div>
          </AnimateIn>

          <AnimateIn animation="animate-slide-up" delay="stagger-3">
            <div className="rounded-3xl bg-card border border-border p-8 h-full ">
              <div className="size-14 rounded-2xl bg-violet/15 flex items-center justify-center mb-6">
                <Shield className="size-7 text-violet" />
              </div>
              <h3 className="font-sans text-xl font-bold mb-2">
                Private & secure
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Only people with the link can see your gallery. Your memories stay
                between you and your guests. No data mining, no ads.
              </p>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison ─────────────────────────────────────────────────
function Comparison() {
  return (
    <section className="py-28 sm:py-36 relative overflow-hidden">
      {/* Dot pattern background — fades out toward center, top and bottom */}
      <div
        className="absolute inset-0 pattern-dots-lime"
        style={{
          maskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%), linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%), linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "destination-in",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6">
        <AnimateIn className="text-center mb-16">
          <h2 className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight">
            Why not just use{" "}
            <span className="line-through text-muted-foreground/50 decoration-coral decoration-4">
              Google Drive
            </span>
            ?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Shared folders weren't designed for event photos. Almost Moments was.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shared Drive card */}
          <AnimateIn animation="animate-slide-in-left">
            <div className="rounded-3xl bg-card border border-border p-8 sm:p-10 h-full opacity-60">
              <h3 className="font-sans text-xl font-bold mb-2 text-muted-foreground">Google Drive</h3>
              <p className="text-sm text-muted-foreground/60 mb-8">The old way</p>
              <div className="space-y-5">
                {[
                  { feature: "Free to use", has: true },
                  { feature: "Optimized or mobile", has: true },
                  { feature: "One click export", has: true },
                  { feature: "No app installation", has: false },
                  { feature: "No account for guests", has: false },
                  { feature: "QR code sharing", has: false },
                  { feature: "Live photo feed", has: false },
                ].map((row) => (
                  <div key={row.feature} className="flex items-center gap-3">
                    {row.has ? (
                      <Check className="size-5 text-lime shrink-0" />
                    ) : (
                      <X className="size-5 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className={`text-sm ${row.has ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                      {row.feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* Almost Moments card */}
          <AnimateIn animation="animate-slide-in-right">
            <div className="rounded-3xl bg-card border-2 border-lime/30 p-8 sm:p-10 h-full shadow-xl">
              <h3 className="font-sans text-xl font-bold mb-2 text-lime">Almost Moments</h3>
              <p className="text-sm text-muted-foreground mb-8">Built for events</p>
              <div className="space-y-5">
                {[
                  "Free to use",
                  "Optimized or mobile",
                  "One click export",
                  "No app installation",
                  "No account for guests",
                  "QR code sharing",
                  "Live photo feed",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="size-5 text-lime shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    {
      question: "Is Almost Moments really free?",
      answer: "Yes, 100% free. Create unlimited galleries, invite unlimited guests, upload unlimited photos. No hidden fees, no premium plans, no catches.",
    },
    {
      question: "Do guests need to download an app?",
      answer: "Nope! Guests just scan the QR code with their phone camera (or tap a link). It opens right in their browser. Works on iPhone, Android, and any device with a camera.",
    },
    {
      question: "Do guests need to create an account?",
      answer: "No account needed. Guests can start uploading immediately — zero friction. The organizer can optionally create an account to manage their galleries.",
    },
    {
      question: "What types of files can guests upload?",
      answer: "Photos (JPG, PNG, HEIC, WebP) and videos (MP4, MOV) from their phone. We handle the compression and optimization automatically.",
    },
    {
      question: "How long are galleries kept?",
      answer: "Your gallery stays online for 30 days after your event. You can download all the photos at any time. Need more time? Just extend it for free.",
    },
    {
      question: "Is my gallery private?",
      answer: "Yes. Only people with the unique link or QR code can access your gallery. It's not indexed by search engines and can't be found by browsing.",
    },
    {
      question: "Can I download all the photos?",
      answer: "Absolutely. You can download the entire gallery as a ZIP file with one click, or download individual photos. Full resolution, no watermarks.",
    },
  ];

  return (
    <section id="faq" className="py-28 sm:py-36 relative">
      <div className="absolute inset-0 bg-white dark:bg-black" />

      <div className="relative mx-auto max-w-3xl px-6">
        <AnimateIn className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-sm border border-border">
            Still not sure?
          </Badge>
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
        </AnimateIn>

        <AnimateIn animation="animate-slide-up">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base font-semibold font-sans hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimateIn>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────
function CTA() {
  const { user } = useAuth();
  return (
    <section className="py-28 sm:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-white dark:bg-black" />
      {/* Dot pattern background — fades out toward center and top */}
      <div
        className="absolute inset-0 pattern-dots-lime"
        style={{
          maskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%), linear-gradient(to bottom, transparent 0%, black 35%, black 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 30%, black 90%), linear-gradient(to bottom, transparent 0%, black 35%, black 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "destination-in",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <AnimateIn>
          <div className="inline-flex mb-6">
            <span className="text-6xl inline-block">📸</span>
          </div>
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Ready to capture{" "}
            <br className="hidden sm:block" />
            <span className="text-lime">every moment?</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Create your gallery in under 30 seconds. Free forever.
            No credit card, no catch.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={user ? "/dashboard" : "/sign-in"}>
              <Button
                size="lg"
                className="rounded-full px-10 h-14 text-base bg-lime text-lime-foreground hover:bg-lime/90 font-bold shadow-lg shadow-lime/25"
              >
                {user ? "My Galleries" : "Get Started — It\u2019s Free"}
                <ChevronRight className="size-5 ml-1" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No sign-up required to get started
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-9 rounded-xl bg-lime flex items-center justify-center">
                <Camera className="size-5 text-lime-foreground" />
              </div>
              <span className="font-sans text-lg font-bold tracking-tight">
                Almost Moments
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Bringing scattered memories together. One event, one gallery, all the moment.
            </p>
          </div>

          <div>
            <h4 className="font-sans font-bold text-sm mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="https://appwrite.io/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="https://appwrite.io/terms" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="https://appwrite.io/cookies" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-sm mb-4">Connect</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Almost Moments. Made with{" "}
            <Heart className="inline size-3.5 text-coral fill-coral" /> for unforgettable events.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="size-3.5" />
            <span>Available worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Comparison />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
