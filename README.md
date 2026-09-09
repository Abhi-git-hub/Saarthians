# Saarthians Web Experience

Production-oriented foundation for **saarthians.online**.

## Product
- Premium public brand + portfolio experience
- Secure student workspace
- Secure teacher workspace
- Reasoning-augmented learning assistant
- Security-first architecture and testing

## Stack
- Next.js 16.3.4 App Router + TypeScript
- Tailwind CSS 4.3
- Supabase-ready authentication/data layer
- Vitest

## Important
Authentication, database authorization, score persistence and AI tools are intentionally not faked in this foundation. They will be wired to real server-side services in subsequent milestones.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

**Deployment trigger: production Worker.**

See [`docs/PRD.md`](docs/PRD.md) and [`docs/TRD.md`](docs/TRD.md) for the product and technical contract.
