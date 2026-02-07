**Make sure to read README.md too**

# AGENTS.md — Almost Moments

## What We're Building

**Almost Moments** is a free web app that lets anyone create custom photo/video galleries for events. The core flow works like this:

1. **An organizer creates a gallery** for their event (wedding, party, birthday, corporate gathering, etc.).
2. **The gallery gets a public URL and a QR code.** The organizer prints or displays the QR code at the event venue.
3. **Guests scan the QR code** with their phone, which opens the gallery in their browser.
4. **Guests upload photos and videos** they took during the event — no account required, no app to install.
5. **Everyone can browse the full gallery** — all the pictures and videos from every guest, collected in one place.

The goal is simple: when a group of people attend an event, everyone captures different moments. Almost Moments brings all those scattered memories together into a single shared gallery so nobody misses out on the moments they didn't personally capture.

### Key Product Principles

- **Zero friction for guests** — no sign-up, no app download. Scan QR, upload, done.
- **Free to use** — anyone can create a gallery at no cost.
- **Mobile-first** — most guests will access via phone after scanning a QR code.
- **Media-focused** — the gallery experience should feel like browsing a beautiful collection of photos and videos, not a file manager.

## Project Overview

**Almost Moments** is a client-side only Next.js 16 application built with React 19, TypeScript 5, and Tailwind CSS v4. There is no server-side rendering — all pages and components run entirely in the browser.

## Tech Stack

| Technology               | Version | Purpose                                  |
| ------------------------ | ------- | ---------------------------------------- |
| Next.js                  | 16.1.6  | Framework (App Router, client-side only) |
| React                    | 19.2.3  | UI library                               |
| TypeScript               | 5.x     | Type safety                              |
| Tailwind CSS             | 4.x     | Utility-first styling (PostCSS plugin)   |
| shadcn/ui                | latest  | Component library (New York style)       |
| Radix UI                 | 1.4.x   | Accessible primitives (via shadcn/ui)    |
| Lucide React             | 0.563.x | Icon library                             |
| class-variance-authority | 0.7.x   | Component variant management             |
| clsx + tailwind-merge    | latest  | Conditional class merging                |

## Client-Side Only Architecture

This application does **not** use server-side rendering. Every page and component must be a client component.

### Rules

1. **Every page and layout must include `"use client"` at the top of the file.** There are no server components in this project.
2. **Do not use server-only features:**
   - No `getServerSideProps`, `getStaticProps`, or server actions (`"use server"`)
   - No server-side data fetching in components (no `async` component functions)
   - No `next/headers`, `next/cookies`, or other server-only Next.js APIs
   - No React Server Components patterns (no `async` components, no server-only imports)
3. **Data fetching** happens exclusively on the client using `useEffect`, `useSWR`, `fetch` in event handlers, or similar client-side patterns.
4. **Environment variables** exposed to the client must be prefixed with `NEXT_PUBLIC_`.
5. **Routing** uses the Next.js App Router (`app/` directory) but all route segments are client components.
6. **Metadata** should be defined via `export const metadata` in layout files (this still works in client layouts for static metadata).

### Next.js Configuration

The `next.config.ts` should be configured for client-side only output when building for production:

```ts
const nextConfig: NextConfig = {
  output: "export", // Static export for client-side only
};
```

## shadcn/ui — Component Library

This project uses **shadcn/ui** exclusively for all UI components. Do not create custom UI primitives from scratch — always use or extend shadcn/ui components.

### Configuration (`components.json`)

- **Style:** New York
- **Base color:** Neutral
- **CSS variables:** Enabled (defined in `app/globals.css`)
- **Icon library:** Lucide React
- **Path aliases:**
  - Components: `@/components`
  - UI components: `@/components/ui`
  - Utilities: `@/lib/utils`
  - Hooks: `@/hooks`
  - Library code: `@/lib`

### Installing New Components

Use the shadcn CLI to add components. Always use `pnpm` as the package manager:

```bash
# Add a single component
pnpm dlx shadcn@latest add button

# Add multiple components at once
pnpm dlx shadcn@latest add card dialog dropdown-menu

# Add a component with all its dependencies
pnpm dlx shadcn@latest add form

# List all available components
pnpm dlx shadcn@latest add --help
```

### Available Components Reference

Browse all available components at: https://ui.shadcn.com/docs/components

Common components you may need:

- **Layout:** `card`, `separator`, `sheet`, `sidebar`, `tabs`, `collapsible`
- **Forms:** `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `form`, `label`
- **Feedback:** `alert`, `alert-dialog`, `toast`, `sonner`, `progress`, `skeleton`
- **Overlay:** `dialog`, `drawer`, `dropdown-menu`, `popover`, `tooltip`, `hover-card`
- **Data:** `table`, `data-table`, `badge`, `avatar`, `calendar`
- **Navigation:** `breadcrumb`, `command`, `menubar`, `navigation-menu`, `pagination`

### Component Usage Guidelines

1. **Always check if a shadcn/ui component exists before building custom UI.** If it exists, install and use it.
2. **Installed components** live in `@/components/ui/` and can be customized directly since they are copied into the project.
3. **Compose complex components** by combining shadcn/ui primitives rather than building from scratch.
4. **Use the `cn()` utility** from `@/lib/utils` for merging Tailwind classes conditionally:

   ```tsx
   import { cn } from "@/lib/utils";

   <div className={cn("base-classes", conditional && "conditional-classes")} />;
   ```

5. **Variants** are managed via `class-variance-authority` (CVA). Extend existing component variants rather than overriding styles inline.

### Currently Installed Components

- `button` — `@/components/ui/button`

## Styling

### Tailwind CSS v4

This project uses Tailwind CSS v4 with the PostCSS plugin (`@tailwindcss/postcss`). There is no `tailwind.config` file — configuration is done via CSS in `app/globals.css`.

- **Theme tokens** are defined as CSS custom properties in `:root` and `.dark` selectors using `oklch` color space.
- **Dark mode** uses the class strategy (`@custom-variant dark (&:is(.dark *))`) — toggle by adding/removing the `dark` class on a parent element.
- **Animations** are provided by `tw-animate-css`.

### Color Tokens

All colors are defined as CSS variables and mapped in the `@theme inline` block. Use semantic color names in Tailwind classes:

```
bg-background, text-foreground
bg-primary, text-primary-foreground
bg-secondary, text-secondary-foreground
bg-muted, text-muted-foreground
bg-accent, text-accent-foreground
bg-destructive
bg-card, text-card-foreground
bg-popover, text-popover-foreground
border-border, ring-ring, bg-input
```

### Fonts

The project uses Geist font family (loaded via `next/font/google`):

- `font-sans` — Geist Sans (variable: `--font-geist-sans`)
- `font-mono` — Geist Mono (variable: `--font-geist-mono`)

## Project Structure

```
app/                    → Next.js App Router pages and layouts
  globals.css           → Global styles, Tailwind imports, theme tokens
  layout.tsx            → Root layout (fonts, base HTML structure)
  page.tsx              → Home page
components/
  ui/                   → shadcn/ui components (auto-generated via CLI)
lib/
  utils.ts              → Utility functions (cn helper, etc.)
hooks/                  → Custom React hooks
public/                 → Static assets
```

### Path Aliases (tsconfig)

- `@/*` → project root (e.g., `@/components/ui/button`, `@/lib/utils`, `@/hooks/use-something`)

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Available Skills (`.claude/skills`)

Three skills are available in this project to assist with development:

### 1. `/frontend-design` — Distinctive UI Design

Creates production-grade frontend interfaces with high design quality. Use this skill when building new pages, components, or layouts. It enforces bold, intentional aesthetic choices and avoids generic AI-generated aesthetics.

**When to use:** Building new pages, components, dashboards, landing pages, or any visual UI work.

### 2. `/vercel-react-best-practices` — Performance Optimization

Contains 57 performance rules across 8 categories from Vercel Engineering. Covers waterfall elimination, bundle optimization, re-render prevention, and more.

**When to use:** Writing new components, reviewing code for performance, refactoring, or optimizing bundle size and load times.

### 3. `/web-design-guidelines` — UI Compliance Review

Reviews UI code against Web Interface Guidelines for accessibility, usability, and design best practices.

**When to use:** Reviewing existing UI code, checking accessibility, auditing design quality.

## Code Conventions

1. **TypeScript strict mode** is enabled — no `any` types unless absolutely necessary.
2. **Functional components only** — no class components.
3. **Named exports** for components, default exports only for page/layout files.
4. **File naming:** kebab-case for files (`my-component.tsx`), PascalCase for component names (`MyComponent`).
5. **Imports:** Use the `@/` path alias for all imports. Never use relative paths that go up more than one level.
6. **State management:** Use React's built-in state (`useState`, `useReducer`, `useContext`) unless the complexity warrants a library.
7. **No `console.log` in production code** — use it only during debugging and remove before committing.
