# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite, default port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint (quiet mode)
npm run lint:fix     # ESLint with auto-fix
npm run typecheck    # TypeScript type check via jsconfig.json
```

Environment: copy `.env.example` to `.env` and set `VITE_API_URL` (defaults to `http://localhost:8000`).

## Architecture

**MisGastos** is a personal expense management SPA (Spanish-language UI). React 18 + Vite, styled with Tailwind CSS using HSL CSS variables for theming. Path alias `@` maps to `./src`.

### Key patterns

- **API layer**: all backend calls go through `src/utils/api.js`. The base URL is read from `import.meta.env.VITE_API_URL`.
- **UI components**: `src/components/ui/` contains shadcn/ui (Radix UI) primitives — do not lint or modify these generated files (they are in the ESLint ignore list).
- **App components**: `src/components/expenses/` contains the actual business-logic components.
- **Routing**: React Router v6, configured in `src/App.jsx`. `src/pages.config.js` is auto-generated.
- **Forms**: React Hook Form + Zod for validation.
- **Charts**: Recharts for data visualization.
- **Notifications**: Sonner is the primary toast library; React Hot Toast is also installed.

### ESLint scope

Linting only applies to `src/components/**/*.{js,jsx}`, `src/pages/**/*.{js,jsx}`, and `src/Layout.jsx`. Files in `src/lib/` and `src/components/ui/` are ignored. PropTypes are not required.

### Docker

Multi-stage Dockerfile: Node build → Nginx serve on port 80. `docker-compose.yml` orchestrates the container.
