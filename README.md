# Astra Study

An AI-powered learning companion for Nigerian students preparing for JAMB, WAEC, NECO, Post-UTME, BECE, and Common Entrance — built as a high-fidelity, interactive frontend prototype with realistic mock data for a sample student, Amara.

## Stack

React + TypeScript + Tailwind CSS v4, React Router, Lucide icons. Mobile-first and responsive from 360px up through desktop, with a persistent sidebar on larger screens and a bottom nav on mobile.

## Running locally

```bash
npm install
npm run dev
```

```bash
npm run build   # type-check + production build
npm run preview # preview the production build
```

## Structure

- `src/lib` — domain types and mock data (`mockData.ts`), designed so a real API client can be swapped in behind the same shapes.
- `src/state` — app-wide preferences, sync/offline status, and onboarding state (persisted to `localStorage`).
- `src/components/ui` — the shared design-system component library (buttons, inputs, cards, tags, progress, modals/drawers, toasts, skeletons, empty states).
- `src/components/domain` — small components tied to app concepts (assignment cards, insight cards, mastery cards) reused across features.
- `src/components/layout` — the app shell: sidebar, bottom nav, top bar.
- `src/features/*` — one folder per product area (onboarding, home, learn, practice, examsimulator, tutor, assignments, progress, revision, profile, parent, teacher).

## Notes

- Practice and mock-exam sessions render outside the main app shell intentionally, so they're distraction-free and exits always go through an explicit confirmation rather than a stray nav tap.
- The parent portal and school/teacher dashboard are scaffolded per the product brief's "later expansion" priority — functional and on-brand, but lower fidelity than the student-facing MVP surfaces.
- AI tutor replies and essay/assignment grading are simulated (canned, context-aware logic) rather than backed by a live model, to keep the prototype self-contained.
