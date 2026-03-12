# Mosaic

A private, accessible system management app for plural and dissociative systems. Built with care for privacy, accessibility, and trauma-informed design.

## What is Mosaic?

Mosaic helps plural systems track fronting, communicate internally, journal, manage tasks, and maintain safety plans — all in one calm, private space.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage) via Lovable Cloud
- **Charts**: Recharts
- **Accessibility**: Atkinson Hyperlegible font, WCAG 2.1 AA target, semantic HTML

## Features

- 🧠 **Front tracking** — Log who is fronting, co-fronting, or blurry
- 📓 **Journal** — Write entries with mood, type, and tags
- 💬 **Internal messages** — Leave notes between alters
- ✅ **Tasks** — Medication, hygiene, therapy, and daily tasks
- 📅 **Calendar** — Events with sensory prep and fronter preferences
- 🛡️ **Safety plans** — Grounding, crisis, and medical plans
- 📊 **Daily check-in** — Mood, stress, pain, fatigue, dissociation tracking
- ♿ **Accessibility** — High contrast, large text, reduced motion, screen reader support
- 🔒 **Privacy** — Row-level security, audit logging, no public access

## Getting Started

```bash
# Clone the repository
git clone <your-repo-url>
cd mosaic

# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — Self-hosting on DigitalOcean
- [Security Architecture](docs/SECURITY.md) — Privacy model, encryption, audit logging
- [Accessibility Notes](docs/ACCESSIBILITY.md) — Design decisions and assistive tech support

## Privacy

- All data is per-user with Row-Level Security
- No public sharing unless explicitly enabled
- Sensitive fields marked for future field-level encryption
- Append-only audit log for accountability
- Three visibility levels: private, shared, emergency-only

## License

Private. Not for redistribution.
