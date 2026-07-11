# SCHOOL MANAGEMENT SAAS — FULL MONOREPO ARCHITECTURE (PRODUCTION GRADE)

This document defines a complete multi-school SaaS system using:

- Next.js (Web Dashboard)
- NestJS (Backend API)
- React Native (Mobile App via Expo)
- PostgreSQL (Supabase)
- JWT Authentication
- Multi-tenancy (school-based isolation)
- TypeScript across all layers
- MoMo payments (Ghana)
- Scalable modular architecture

---

# 1. MONOREPO ROOT (TURBOREPO)

school-saas/
│
├── apps/
├── packages/
├── infra/
├── docs/
├── scripts/
├── turbo.json
├── package.json
├── .env
└── README.md

---

# 2. APPLICATION LAYER

---

# 2.1 WEB APP (NEXT.JS SAAS DASHBOARD)

apps/web/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (dashboard)/
│   │   ├── admin/
│   │   ├── schools/
│   │   ├── students/
│   │   ├── staff/
│   │   ├── attendance/
│   │   ├── finance/
│   │   ├── exams/
│   │   ├── results/
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── layout/
│   └── charts/
│
├── features/
│   ├── auth/
│   ├── schools/
│   ├── students/
│   ├── staff/
│   ├── attendance/
│   ├── finance/
│   ├── exams/
│   ├── results/
│   └── notifications/
│
├── hooks/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── tenant.ts
│
├── store/
├── styles/
├── middleware.ts
└── next.config.js

---

# 2.2 BACKEND (NESTJS CORE API)

apps/api/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── env.config.ts
│   │   └── momo.config.ts
│
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── middleware/
│   │   │   ├── tenant.middleware.ts
│   │   │   └── auth.middleware.ts
│   │   └── utils/
│   │
│   ├── modules/
│   │
│   │   ├── auth/
│   │   ├── users/
│   │   ├── schools/
│   │   ├── students/
│   │   ├── staff/
│   │   ├── classes/
│   │   ├── attendance/
│   │   ├── exams/
│   │   ├── results/
│   │   ├── finance/
│   │   ├── payments/
│   │   ├── notifications/
│   │   ├── audit-log/
│   │   ├── reports/
│   │   └── analytics/
│   │
│   ├── database/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── migrations/
│   │   └── prisma.schema.ts
│   │
│   ├── integrations/
│   │   ├── momo/
│   │   ├── sms/
│   │   ├── email/
│   │   └── storage/
│   │
│   ├── shared/
│   │   ├── enums/
│   │   ├── constants/
│   │   └── types/
│   │
│   └── seed/
│
├── test/
├── .env
└── nest-cli.json

---

# 2.3 MOBILE APP (REACT NATIVE / EXPO)

apps/mobile/
│
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── attendance/
│   │   │   ├── results/
│   │   │   ├── payments/
│   │   │   ├── notifications/
│   │   │   └── profile/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── cards/
│   │   ├── forms/
│   │   └── lists/
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── attendance.ts
│   │   ├── payments.ts
│   │   └── notifications.ts
│   │
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── offline/
│   └── assets/
│
├── app.json
├── babel.config.js
└── package.json

---

# 3. SHARED PACKAGES (CRITICAL FOR SCALE)

packages/
│
├── ui/
│   ├── button/
│   ├── modal/
│   ├── table/
│   ├── input/
│   └── index.ts
│
├── types/
│   ├── user.types.ts
│   ├── school.types.ts
│   ├── student.types.ts
│   ├── staff.types.ts
│   ├── attendance.types.ts
│   ├── finance.types.ts
│   └── index.ts
│
├── config/
│   ├── api-routes.ts
│   ├── roles.ts
│   ├── permissions.ts
│   └── constants.ts
│
├── utils/
│   ├── date.utils.ts
│   ├── format.utils.ts
│   ├── validation.utils.ts
│   ├── tenant.utils.ts
│   └── crypto.utils.ts
│
└── api-client/
    ├── axios.ts
    ├── auth.client.ts
    ├── school.client.ts
    └── index.ts

---

# 4. INFRASTRUCTURE LAYER

infra/
│
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── mobile.build
│
├── nginx/
│   └── reverse-proxy.conf
│
├── postgres/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
└── deployment/
    ├── vercel.json
    ├── render.yaml
    ├── expo.config.js
    └── env.example

---

# 5. DOCUMENTATION

docs/
│
├── architecture.md
├── api-spec.md
├── database-design.md
├── multi-tenancy.md
├── rbac-system.md
├── payment-integration.md
├── mobile-architecture.md
└── onboarding.md

---

# 6. SCRIPTS

scripts/
│
├── seed.ts
├── migrate.ts
├── create-school.ts
├── reset-db.ts
└── generate-admin.ts

---

# 7. CORE SYSTEM RULES

---

## 7.1 MULTI-TENANCY (CRITICAL)

Every business table MUST include:

school_id: string

All queries MUST enforce:

WHERE school_id = current_user.school_id

Failure = data leakage across schools.

---

## 7.2 AUTH SYSTEM

- JWT Access Token (short-lived)
- Refresh Token (long-lived)
- httpOnly cookies (web)
- Secure storage (mobile)

SaaS Platform Roles (Cross-Tenant): SUPER_ADMIN, SUPPORT_ADMIN, SYSTEM_AUDITOR
School Admin Roles (Tenant-Scoped): SCHOOL_OWNER, HEADMASTER, VICE_PRINCIPAL, SCHOOL_ADMIN, ACADEMIC_COORDINATOR, ADMIN_OFFICER
Teaching Roles (Tenant-Scoped): TEACHER, HEAD_OF_DEPARTMENT, CLASS_TEACHER, EXAM_OFFICER, LAB_INSTRUCTOR, SUBSTITUTE_TEACHER
Student/Guardian Roles (Tenant-Scoped): STUDENT, PARENT
Support Roles (Tenant-Scoped): ACCOUNTANT, RECEPTIONIST, LIBRARIAN, IT_ADMIN

---

## 7.3 BACKEND RULE

Backend is the ONLY source of truth:
- No business logic in frontend
- No direct DB access from clients

---

## 7.4 MODULE DESIGN

Each NestJS module is independent:

- auth
- users
- schools
- students
- staff
- attendance
- exams
- finance
- payments
- notifications
- audit-log
- reports
- analytics

---

## 7.5 SHARED CONTRACTS

All shared logic must live in /packages:
- types
- enums
- API routes
- validation rules

---

## 7.6 AUDIT LOGGING (MANDATORY)

Track every critical action:

- who changed what
- when
- before/after values

---

## 7.7 NOTIFICATIONS

- Push (Firebase)
- SMS (Ghana gateways)
- Email (optional)

---

## 7.8 PAYMENTS (GHANA MoMo)

Abstract provider:

interface PaymentProvider {
  initializePayment()
  verifyPayment()
  refund()
}

Start with MTN MoMo API.

---

## 7.9 FILE STORAGE

- student images
- documents
- report cards

Use:
- Supabase Storage or AWS S3

---

# 8. SYSTEM SUMMARY

This architecture gives:

- True SaaS multi-school system
- Strong tenant isolation
- Scalable modular backend
- Shared frontend/mobile contracts
- Production-ready structure
- Clear expansion path

---

# 9. BUILD ROADMAP

## Phase 1 — Foundation
- Monorepo structure setup (Turborepo)
- Backend initialization (NestJS)
- PostgreSQL connection (Supabase)
- Auth system (JWT + refresh tokens)
- Tenant middleware (school_id isolation)
- Users + Roles system (full RBAC taxonomy)

## Phase 2 — Core Entities
- Schools module
- Students module
- Staff module
- Classes module

## Phase 3 — Daily Operations
- Attendance system
- Notifications (Push/SMS/Email)
- Basic dashboards (admin + teacher views)

## Phase 4 — Academics
- Exams system
- Results processing
- Reports generation

## Phase 5 — Finance
- Finance module (fee tracking)
- Payments (MTN MoMo integration)

## Phase 6 — Web Dashboard
- Next.js full dashboard UI (all roles)
- Role-based views and navigation

## Phase 7 — Mobile App
- React Native mobile app (Expo)
- Offline caching for critical data
- Mobile-specific role views

---

END OF ARCHITECTURE