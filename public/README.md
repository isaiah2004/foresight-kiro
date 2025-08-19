# Public Directory

This directory contains static assets that are served directly by Next.js.

## How it works:
- Files in this directory are served from the root URL path `/`
- For example, `public/logo.png` is accessible at `/logo.png`
- No import statements needed - reference directly in your code

## Common use cases:
- Images: `public/images/logo.png` → `/images/logo.png`
- Icons: `public/favicon.ico` → `/favicon.ico`
- Fonts: `public/fonts/custom.woff2` → `/fonts/custom.woff2`
- Documents: `public/docs/manual.pdf` → `/docs/manual.pdf`

## Example usage in components:
```jsx
// In your React components
<img src="/images/logo.png" alt="Logo" />
<link rel="icon" href="/favicon.ico" />
```

## Important notes:
- Only files inside `public` can be referenced from the root URL
- Don't name files the same as files in the `pages` directory
- Files are served statically at build time
