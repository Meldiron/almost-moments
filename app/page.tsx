"use client";

import { useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { ThemeContext } from "./layout";
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

          <Button size="sm" className="hidden md:inline-flex rounded-full px-5 bg-lime text-lime-foreground hover:bg-lime/90 font-semibold">
            Create Gallery
          </Button>

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
          <Button className="rounded-full bg-lime text-lime-foreground hover:bg-lime/90 font-semibold w-full">
            Create Gallery
          </Button>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ───────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 size-72 rounded-full bg-lime/10 blur-3xl" />
      <div className="absolute bottom-20 right-10 size-96 rounded-full bg-coral/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-sky/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="animate-slide-up">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full border border-border">
            <Sparkles className="size-3.5 mr-1.5 text-amber" />
            Free for everyone
          </Badge>
        </div>

        <h1 className="animate-slide-up stagger-1 font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]">
          Every guest.{" "}
          <br className="hidden sm:block" />
          <span className="text-lime">Every moment.</span>{" "}
          <br className="hidden sm:block" />
          One gallery.
        </h1>

        <p className="animate-slide-up stagger-2 mt-6 sm:mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Create a shared photo gallery for your event. Guests scan a QR code,
          upload their pics — no app, no sign-up. All your memories in one place.
        </p>

        <div className="animate-slide-up stagger-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="rounded-full px-8 h-13 text-base bg-lime text-lime-foreground hover:bg-lime/90 font-semibold shadow-lg shadow-lime/20"
          >
            Create Your Gallery
            <ArrowRight className="size-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-13 text-base font-medium"
          >
            See How It Works
          </Button>
        </div>

        <div className="animate-slide-up stagger-4 mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground">
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
        <div className="animate-scale-in stagger-5 mt-16 sm:mt-20 relative mx-auto max-w-3xl">
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
                {/* Gallery header */}
                <div className="px-4 pt-3 pb-4">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground font-medium">June 15, 2026</p>
                    <h3 className="font-sans font-bold text-base mt-0.5">Sarah & Tom's Wedding</h3>
                    <p className="text-xs text-muted-foreground mt-1">247 photos by 58 guests</p>
                  </div>
                </div>
                {/* Photo grid */}
                <div className="flex-1 px-3 pb-3 grid grid-cols-3 gap-1.5 auto-rows-min">
                  {[
                    "bg-coral/40", "bg-sky/40", "bg-lime/40",
                    "bg-amber/40", "bg-violet/40", "bg-coral/30",
                    "bg-sky/30", "bg-lime/30", "bg-amber/30",
                    "bg-violet/30", "bg-coral/20", "bg-sky/20",
                  ].map((color, i) => (
                    <div
                      key={i}
                      className={`${color} rounded-lg aspect-square flex items-center justify-center`}
                    >
                      <Camera className="size-4 text-foreground/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -left-20 sm:-left-28 top-16 animate-float">
              <div className="rounded-2xl bg-card border border-border px-4 py-3 shadow-xl flex items-center gap-3">
                <div className="size-10 rounded-full bg-coral/20 flex items-center justify-center">
                  <Heart className="size-5 text-coral" />
                </div>
                <div>
                  <p className="text-sm font-semibold">+24 photos</p>
                  <p className="text-xs text-muted-foreground">just uploaded</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-16 sm:-right-24 bottom-24 animate-float-delayed">
              <div className="rounded-2xl bg-card border border-border px-4 py-3 shadow-xl flex items-center gap-3">
                <div className="size-10 rounded-full bg-lime/20 flex items-center justify-center">
                  <Users className="size-5 text-lime" />
                </div>
                <div>
                  <p className="text-sm font-semibold">58 guests</p>
                  <p className="text-xs text-muted-foreground">contributing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ───────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: <PartyPopper className="size-7" />,
      title: "Create a gallery",
      description: "Give your event a name and get a unique gallery link and QR code in seconds.",
      color: "bg-lime/15 text-lime",
      number: "01",
    },
    {
      icon: <QrCode className="size-7" />,
      title: "Share the QR code",
      description: "Print it, display it, or send the link. Place it where guests can easily scan.",
      color: "bg-sky/15 text-sky",
      number: "02",
    },
    {
      icon: <Upload className="size-7" />,
      title: "Guests upload photos",
      description: "No app, no account. Guests open the link and upload straight from their phone.",
      color: "bg-coral/15 text-coral",
      number: "03",
    },
    {
      icon: <Images className="size-7" />,
      title: "Enjoy every moment",
      description: "All photos and videos from every guest — together in one beautiful gallery.",
      color: "bg-amber/15 text-amber",
      number: "04",
    },
  ];

  return (
    <section id="how-it-works" className="py-28 sm:py-36 relative">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="text-center mb-16 sm:mb-20">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-sm border border-border">
            Simple as 1-2-3-4
          </Badge>
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            From event to shared gallery in under a minute.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <AnimateIn
              key={step.number}
              animation="animate-slide-up"
              delay={`stagger-${i + 1}`}
            >
              <div className="group relative rounded-3xl bg-card border border-border p-7 hover:border-foreground/20 transition-all hover:-translate-y-1 hover:shadow-lg h-full">
                <span className="absolute top-6 right-6 font-sans text-4xl font-extrabold text-foreground/5">
                  {step.number}
                </span>
                <div className={`size-14 rounded-2xl ${step.color} flex items-center justify-center mb-5`}>
                  {step.icon}
                </div>
                <h3 className="font-sans text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-28 sm:py-36 relative">
      {/* Lime section */}
      <div className="absolute inset-0 bg-lime/5" />

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
            <div className="rounded-3xl bg-card border border-border p-8 sm:p-10 h-full flex flex-col justify-between hover:border-foreground/20 transition-all">
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
            <div className="rounded-3xl bg-card border border-border p-8 h-full hover:border-foreground/20 transition-all">
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
            <div className="rounded-3xl bg-card border border-border p-8 h-full hover:border-foreground/20 transition-all">
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
            <div className="rounded-3xl bg-card border border-border p-8 h-full hover:border-foreground/20 transition-all">
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
            <div className="rounded-3xl bg-card border border-border p-8 h-full hover:border-foreground/20 transition-all">
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

// ─── Use Cases / Events ─────────────────────────────────────────
function UseCases() {
  const events = [
    {
      emoji: "💒",
      name: "Weddings",
      description: "Collect every angle of your special day from all your guests",
      color: "bg-coral",
    },
    {
      emoji: "🎂",
      name: "Birthdays",
      description: "No more chasing friends for their photos weeks after the party",
      color: "bg-amber",
    },
    {
      emoji: "🎓",
      name: "Graduations",
      description: "Parents, friends, and classmates all contributing to one collection",
      color: "bg-sky",
    },
    {
      emoji: "🏢",
      name: "Corporate Events",
      description: "Team offsites, holiday parties, conferences — all documented",
      color: "bg-violet",
    },
    {
      emoji: "🎄",
      name: "Holiday Parties",
      description: "Family reunions and holiday get-togethers, beautifully captured",
      color: "bg-lime",
    },
    {
      emoji: "🎵",
      name: "Concerts & Festivals",
      description: "Crowd-sourced memories from the best night of your life",
      color: "bg-coral",
    },
  ];

  return (
    <section className="py-28 sm:py-36 relative">
      <div className="mx-auto max-w-6xl px-6">
        <AnimateIn className="text-center mb-16 sm:mb-20">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-sm border border-border">
            For every occasion
          </Badge>
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Perfect for <span className="text-coral">any event</span>
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, i) => (
            <AnimateIn
              key={event.name}
              animation="animate-scale-in"
              delay={`stagger-${(i % 6) + 1}`}
            >
              <div className="group rounded-3xl bg-card border border-border p-7 hover:border-foreground/20 transition-all hover:-translate-y-1 hover:shadow-lg cursor-default">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{event.emoji}</span>
                  <div>
                    <h3 className="font-sans text-lg font-bold mb-1">{event.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof / Stats ───────────────────────────────────────
function SocialProof() {
  return (
    <section className="py-28 sm:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-sky/5" />

      <div className="relative mx-auto max-w-6xl px-6">
        <AnimateIn className="text-center mb-16">
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Moments <span className="text-sky">captured</span>
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {[
            { number: "10K+", label: "Galleries created", icon: <Images className="size-5" /> },
            { number: "500K+", label: "Photos shared", icon: <Camera className="size-5" /> },
            { number: "100K+", label: "Happy guests", icon: <Users className="size-5" /> },
            { number: "4.9", label: "Average rating", icon: <Star className="size-5" /> },
          ].map((stat, i) => (
            <AnimateIn
              key={stat.label}
              animation="animate-slide-up"
              delay={`stagger-${i + 1}`}
            >
              <div className="text-center p-6 rounded-3xl bg-card border border-border">
                <div className="inline-flex size-12 rounded-2xl bg-sky/15 items-center justify-center text-sky mb-4">
                  {stat.icon}
                </div>
                <div className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {stat.number}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "We got 400+ photos from our wedding guests. Would have lost most of these memories without Almost Moments!",
              name: "Sarah & Tom",
              event: "Wedding, June 2026",
              color: "border-l-coral",
            },
            {
              quote: "Set it up in 30 seconds before my birthday party. Guests loved how easy it was — just scan and upload.",
              name: "Marco R.",
              event: "30th Birthday",
              color: "border-l-lime",
            },
            {
              quote: "We use it for every company event now. No more emailing 'please share your photos' to the whole team.",
              name: "Lisa K.",
              event: "Head of Events, TechCorp",
              color: "border-l-sky",
            },
          ].map((testimonial, i) => (
            <AnimateIn
              key={i}
              animation="animate-slide-up"
              delay={`stagger-${i + 2}`}
            >
              <div className={`rounded-2xl bg-card border border-border p-7 border-l-4 ${testimonial.color} h-full flex flex-col`}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="size-4 fill-amber text-amber" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1">"{testimonial.quote}"</p>
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.event}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comparison ─────────────────────────────────────────────────
function Comparison() {
  return (
    <section className="py-28 sm:py-36 relative">
      <div className="mx-auto max-w-4xl px-6">
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

        <AnimateIn animation="animate-scale-in">
          <div className="rounded-3xl border border-border overflow-hidden">
            <div className="grid grid-cols-3 font-sans text-sm font-semibold bg-secondary">
              <div className="p-5" />
              <div className="p-5 text-center text-muted-foreground">Shared Drive</div>
              <div className="p-5 text-center text-lime">Almost Moments</div>
            </div>
            {[
              { feature: "No app needed", drive: false, am: true },
              { feature: "No account needed", drive: false, am: true },
              { feature: "QR code sharing", drive: false, am: true },
              { feature: "Beautiful gallery", drive: false, am: true },
              { feature: "Mobile optimized", drive: false, am: true },
              { feature: "Setup in seconds", drive: false, am: true },
              { feature: "Free", drive: true, am: true },
            ].map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 border-t border-border text-sm"
              >
                <div className="p-4 sm:p-5 font-medium">{row.feature}</div>
                <div className="p-4 sm:p-5 text-center">
                  {row.drive ? (
                    <Check className="size-5 text-lime mx-auto" />
                  ) : (
                    <X className="size-5 text-muted-foreground/40 mx-auto" />
                  )}
                </div>
                <div className="p-4 sm:p-5 text-center">
                  <Check className="size-5 text-lime mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
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
      <div className="absolute inset-0 bg-amber/5" />

      <div className="relative mx-auto max-w-3xl px-6">
        <AnimateIn className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-sm border border-border">
            Got questions?
          </Badge>
          <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            FAQ
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
  return (
    <section className="py-28 sm:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-lime/8" />
      <div className="absolute top-10 right-0 size-96 rounded-full bg-lime/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 size-72 rounded-full bg-sky/8 blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <AnimateIn>
          <div className="inline-flex mb-6">
            <span className="text-6xl animate-wiggle inline-block">📸</span>
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
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-base bg-lime text-lime-foreground hover:bg-lime/90 font-bold shadow-lg shadow-lime/25"
            >
              Create Your Gallery — It's Free
              <ChevronRight className="size-5 ml-1" />
            </Button>
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
              Bringing scattered memories together. One event, one gallery, every moment.
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
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
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
      <UseCases />
      <SocialProof />
      <Comparison />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
