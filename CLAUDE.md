**Make sure to read AGENTS.md too.**

# Claude Rules

## Verification

After making changes, always run the following commands to verify everything is correct:

```bash
bun run format
bun run lint
bun run build
```

Fix any errors or warnings before considering the task complete.

## Forms

Always use semantic `<form onSubmit>` with `type="submit"` buttons. Never use `onClick` on a button to submit form data. This ensures proper keyboard support (Enter to submit), accessibility, and browser-native validation (`required`, `min`, etc.). Cancel buttons inside forms must use `type="button"` to prevent accidental submission.

## SEO

When adding or modifying pages, always keep SEO up to date:

- Every page must include the `<SEO>` component from `@/components/seo` with an appropriate `title` prop (home page uses no title).
- Title format: `Page Title | Almost Moments` (the `<SEO>` component handles this automatically).
- If a new page is created, add `<SEO title="..." />` to it.
- If a page is renamed or its purpose changes, update its `<SEO>` title to match.
- The shared OG image lives at `public/og.png` (1200x630). If branding or tagline changes, regenerate it.
