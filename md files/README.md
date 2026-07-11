# TK School Manager

Production-grade multi-school SaaS foundation for school management.

This repository has a stable Phase 1 foundation and has started Phase 2:

- Turborepo monorepo
- NestJS API
- Prisma + PostgreSQL/Supabase schema
- JWT access and refresh tokens
- Hashed, revocable refresh-token storage
- Tenant-aware user model
- RBAC role taxonomy
- Schools, users, auth, and audit-log modules
- Classes module foundation for Phase 2 core entities

## Workspace Layout

```txt
apps/
  api/                 NestJS backend API
packages/
  config/              Shared constants, routes, roles, role groups
  types/               Shared TypeScript contracts
```

The planning documents in the repository root remain the source guidance for later phases.

Environment files are discovered from both the API package and the repository root. By default,
the API checks `apps/api/.env.local`, `apps/api/.env`, `.env.local`, and `.env`. You can also set
`ENV_FILE=path/to/file` for a custom env file.

## Setup

Install dependencies:

```bash
corepack pnpm install
```

Create `.env` from `.env.example` and set a real Supabase/PostgreSQL `DATABASE_URL`.

Generate Prisma client:

```bash
corepack pnpm db:generate
```

Run migrations:

```bash
corepack pnpm db:migrate
```

Seed the first platform admin by setting these values in `.env`:

```env
SEED_SUPER_ADMIN_EMAIL="admin@example.com"
SEED_SUPER_ADMIN_PASSWORD="ChangeMe123!"
```

Then run:

```bash
corepack pnpm --filter @school-saas/api seed
```

Start the API:

```bash
corepack pnpm --filter @school-saas/api dev
```

## Verification

Run the full local quality gate before pushing backend changes:

```bash
corepack pnpm check
```

This runs Prisma schema validation, lint, tests, and build in the same order used by CI.

Individual checks:

```bash
corepack pnpm build
corepack pnpm lint
corepack pnpm test
```

Prisma schema validation:

```bash
corepack pnpm --filter @school-saas/api exec prisma validate --schema prisma/schema.prisma
```

## Development Rules

Keep Prisma schema changes and migration files together in the same commit.

Run `corepack pnpm check` before pushing.

Keep tenant isolation in API services. Every school-scoped query should resolve the current user's school context before reading or writing data.

## Architecture Notes

School-scoped roles must always have `school_id`. Platform roles are the explicit exception and use `school_id = null`:

- `SUPER_ADMIN`
- `SUPPORT_ADMIN`
- `SYSTEM_AUDITOR`

Business modules should keep tenant checks in backend services, not in frontend code.
