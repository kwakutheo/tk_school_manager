# Phase 1 — Foundation Implementation Plan

## Overview

This plan executes Phase 1 of the School SaaS platform strictly per `starting_prompt.md`. It covers:
1. Monorepo scaffolding (Turborepo)
2. NestJS backend initialization
3. Prisma + Supabase (PostgreSQL) connection
4. JWT Auth system (access + refresh tokens)
5. Tenant isolation middleware (school_id)
6. Users + full RBAC Roles system (20 roles)

No frontend (Next.js) or mobile (Expo) code will be written in this phase.

---

## User Review Required

> [!IMPORTANT]
> **Where should the monorepo root live?**  
> The current workspace `d:\source_codes\tk_school_manager` contains only planning docs. I propose scaffolding the full monorepo **directly inside this folder** (the docs will coexist). If you'd prefer a sub-folder like `school-saas/`, please say so.

> [!IMPORTANT]
> **Supabase credentials needed.**  
> To configure the database connection you'll need a Supabase project with a PostgreSQL connection string (`DATABASE_URL`). You can add these to a `.env` file after scaffolding. Build will work without it — migrations and the server won't run until credentials are provided.

> [!IMPORTANT]
> **Refresh Token Storage Strategy.**  
> Two options:
> - **Option A (Recommended):** Store hashed refresh tokens in the `refresh_tokens` DB table (secure, revocable per device).
> - **Option B:** Stateless (refresh tokens never stored, cannot be individually revoked).  
>
> Plan uses **Option A**. Say so if you want Option B.

---

## Open Questions

> [!NOTE]
> **Package manager:** Plan uses `pnpm` (recommended for Turborepo monorepos — faster, efficient workspace linking). If you prefer `npm` or `yarn`, let me know.

---

## Proposed Changes

### 1. Monorepo Root

#### [NEW] `package.json` (root)
Turborepo root with `pnpm` workspaces pointing to `apps/*` and `packages/*`.

#### [NEW] `turbo.json`
Pipeline config: `build`, `dev`, `lint`, `test` tasks with proper caching and dependency ordering.

#### [NEW] `pnpm-workspace.yaml`
Declares `apps/*` and `packages/*` as workspace members.

#### [NEW] `.env.example`
Template for all required environment variables.

#### [NEW] `.gitignore`
Standard monorepo gitignore (node_modules, .env, dist, .turbo, prisma/generated).

---

### 2. Shared Packages

#### [NEW] `packages/types/package.json`
Package definition for `@school-saas/types`.

#### [NEW] `packages/types/src/user.types.ts`
```ts
IUser, IUserPublic, IUserWithRole
```

#### [NEW] `packages/types/src/auth.types.ts`
```ts
ITokenPair, IRefreshTokenPayload, IJwtPayload
```

#### [NEW] `packages/types/src/school.types.ts`
```ts
ISchool
```

#### [NEW] `packages/types/src/index.ts`
Barrel export.

---

#### [NEW] `packages/config/package.json`
Package definition for `@school-saas/config`.

#### [NEW] `packages/config/src/roles.enum.ts`
Full 20-role enum:
```ts
export enum Role {
  // SaaS Platform (Cross-Tenant)
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',
  SYSTEM_AUDITOR = 'SYSTEM_AUDITOR',
  // School Administration
  SCHOOL_OWNER = 'SCHOOL_OWNER',
  HEADMASTER = 'HEADMASTER',
  VICE_PRINCIPAL = 'VICE_PRINCIPAL',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  ACADEMIC_COORDINATOR = 'ACADEMIC_COORDINATOR',
  ADMIN_OFFICER = 'ADMIN_OFFICER',
  // Teaching & Academic
  TEACHER = 'TEACHER',
  HEAD_OF_DEPARTMENT = 'HEAD_OF_DEPARTMENT',
  CLASS_TEACHER = 'CLASS_TEACHER',
  EXAM_OFFICER = 'EXAM_OFFICER',
  LAB_INSTRUCTOR = 'LAB_INSTRUCTOR',
  SUBSTITUTE_TEACHER = 'SUBSTITUTE_TEACHER',
  // Students & Guardians
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  // Support Staff
  ACCOUNTANT = 'ACCOUNTANT',
  RECEPTIONIST = 'RECEPTIONIST',
  LIBRARIAN = 'LIBRARIAN',
  IT_ADMIN = 'IT_ADMIN',
}
```

#### [NEW] `packages/config/src/api-routes.ts`
Centralized API route constants (e.g. `API_ROUTES.AUTH.LOGIN`).

#### [NEW] `packages/config/src/constants.ts`
App-wide constants (e.g. token expiry times, pagination defaults).

#### [NEW] `packages/config/src/index.ts`
Barrel export.

---

### 3. Backend — `apps/api`

Scaffolded with the NestJS CLI. All modules follow `controller / service / dto / module` structure.

#### Prisma Schema — `apps/api/prisma/schema.prisma`

Tables for Phase 1:

| Model | Key Fields |
|---|---|
| `School` | `id`, `name`, `slug`, `is_active`, `created_at` |
| `User` | `id`, `school_id?`, `email`, `password_hash`, `role (Role enum)`, `is_active`, `created_at` |
| `RefreshToken` | `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at` |
| `AuditLog` | `id`, `school_id?`, `user_id`, `action`, `entity`, `entity_id`, `before`, `after`, `ip`, `created_at` |

> `school_id` is **nullable** on `User` and `AuditLog` to support cross-tenant SaaS roles (`SUPER_ADMIN`, `SUPPORT_ADMIN`, `SYSTEM_AUDITOR`).

---

#### Config Layer — `apps/api/src/config/`

| File | Purpose |
|---|---|
| `env.config.ts` | `ConfigModule` schema via `joi` validation |
| `jwt.config.ts` | Access token + refresh token secrets, expiry |
| `database.config.ts` | Prisma service provider |

---

#### Common Layer — `apps/api/src/common/`

| File | Purpose |
|---|---|
| `decorators/roles.decorator.ts` | `@Roles(...Role[])` decorator |
| `decorators/current-user.decorator.ts` | `@CurrentUser()` param decorator |
| `decorators/school-id.decorator.ts` | `@SchoolId()` param decorator |
| `guards/jwt-auth.guard.ts` | Global JWT access token guard |
| `guards/roles.guard.ts` | Enforces `@Roles()` decorator |
| `middleware/tenant.middleware.ts` | Extracts `school_id` from JWT, attaches to `req.schoolId` |
| `interceptors/audit-log.interceptor.ts` | Auto-logs mutating operations |
| `filters/global-exception.filter.ts` | Sanitized error responses (no stack traces in prod) |
| `utils/hash.util.ts` | bcrypt helpers |

---

#### Auth Module — `apps/api/src/modules/auth/`

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Validates credentials, returns `{ accessToken, refreshToken }` |
| `POST` | `/auth/refresh` | Validates refresh token, returns new token pair |
| `POST` | `/auth/logout` | Revokes refresh token from DB |
| `GET` | `/auth/me` | Returns current user profile (no password) |

**Files:**

| File | Contents |
|---|---|
| `auth.module.ts` | Module definition |
| `auth.controller.ts` | Route handlers |
| `auth.service.ts` | Login, refresh, logout logic |
| `strategies/jwt.strategy.ts` | Passport JWT strategy (access token) |
| `strategies/refresh-jwt.strategy.ts` | Passport JWT strategy (refresh token) |
| `dto/login.dto.ts` | `{ email, password }` with class-validator |
| `dto/refresh.dto.ts` | `{ refreshToken }` |

---

#### Users Module — `apps/api/src/modules/users/`

**Endpoints** (all guarded by `JwtAuthGuard` + `RolesGuard`):

| Method | Path | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/users` | `SUPER_ADMIN`, `SCHOOL_OWNER`, `SCHOOL_ADMIN` | Create user |
| `GET` | `/users` | Admin-tier roles | List users (scoped by school_id) |
| `GET` | `/users/:id` | Admin-tier roles | Get single user |
| `PATCH` | `/users/:id` | Admin-tier roles | Update user |
| `DELETE` | `/users/:id` | `SUPER_ADMIN`, `SCHOOL_OWNER` | Soft-delete user |

**Files:**

| File | Contents |
|---|---|
| `users.module.ts` | Module definition |
| `users.controller.ts` | Route handlers |
| `users.service.ts` | CRUD, always scoped by `school_id` |
| `dto/create-user.dto.ts` | `email, password, role, school_id` (validated) |
| `dto/update-user.dto.ts` | Partial of create DTO |

---

#### Schools Module — `apps/api/src/modules/schools/`

Minimal for Phase 1 (SUPER_ADMIN only). Manages school creation for tenant provisioning.

**Endpoints:**

| Method | Path | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/schools` | `SUPER_ADMIN` | Create a new school (tenant) |
| `GET` | `/schools` | `SUPER_ADMIN` | List all schools |
| `GET` | `/schools/:id` | `SUPER_ADMIN`, scoped school admins | Get school details |
| `PATCH` | `/schools/:id` | `SUPER_ADMIN`, `SCHOOL_OWNER` | Update school |

---

#### Audit Log Module — `apps/api/src/modules/audit-log/`

Internal service only — no public endpoints in Phase 1. Consumed by the `AuditLogInterceptor`.

| File | Contents |
|---|---|
| `audit-log.module.ts` | Global module (exported) |
| `audit-log.service.ts` | `log(action, entity, before, after, user, ip)` |

---

## Environment Variables (`.env.example`)

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"

# JWT
JWT_ACCESS_SECRET="your-strong-access-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-strong-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# App
NODE_ENV="development"
PORT=3001
API_PREFIX="api/v1"
```

---

## Verification Plan

### Automated
- `pnpm turbo run build` — verifies full monorepo builds without errors.
- `pnpm turbo run lint` — all packages must pass strict TypeScript lint.

### Manual API Tests (via curl / Postman)
1. `POST /api/v1/auth/login` with valid credentials → returns token pair.
2. `POST /api/v1/auth/refresh` → returns new access token.
3. `POST /api/v1/auth/logout` → refresh token is revoked (next refresh fails).
4. `GET /api/v1/auth/me` with valid access token → returns user profile.
5. `POST /api/v1/users` as `SUPER_ADMIN` → creates user.
6. `GET /api/v1/users` as a `TEACHER` role → **403 Forbidden** (RBAC enforcement verified).
7. Create two schools, create a user in School A, verify `GET /api/v1/users` from School B JWT does **not** return School A's user (tenant isolation verified).
8. `POST /api/v1/schools` without SUPER_ADMIN token → **403**.
