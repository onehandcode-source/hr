# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Deploy DB migrations + build (prisma migrate deploy && next build)
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check
npx prisma migrate dev --name <name>  # Create a new migration
npx prisma db seed   # Seed the database
npx prisma studio    # Open Prisma Studio
```

No test runner is configured.

## Environment Variables

Create `.env.local` with:

```
DATABASE_URL="postgresql://user:password@host:port/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

For local development, use Docker: `docker compose up -d` starts a PostgreSQL 16 instance.

## Architecture Overview

HR management system built with **Next.js App Router**, **Prisma + PostgreSQL**, **NextAuth.js (JWT + Credentials)**, **TanStack React Query**, **shadcn/ui + Tailwind CSS v4**.

### Route Structure

- `src/app/(dashboard)/` — Protected routes, wrapped by `DashboardShell` (Navbar + Sidebar + BottomNav)
  - `admin/` — Employee management, leave approval, evaluations, calendar, statistics
  - `employee/` — Leave requests, evaluations, calendar
  - `profile/` — Profile management
- `src/app/api/` — REST API routes (all validate session via `getServerSession(authOptions)`)
- `src/app/login/` — Public login page

### Key Layers

| Layer | Location | Purpose |
|---|---|---|
| API Routes | `src/app/api/` | HTTP handlers; auth check → DB call → response |
| DB Utilities | `src/lib/db/` | Prisma query functions (leaves, users, evaluations, notifications, statistics) |
| Components | `src/components/` | `ui/` (shadcn), `layout/`, `common/` |
| Auth | `src/lib/auth.ts` | NextAuth config; JWT contains `id`, `role`, `department`, `position` |
| Prisma | `src/lib/prisma.ts` | Singleton client instance |

### Data Model Summary

- **User** — role: `ADMIN | EMPLOYEE`, department, position, `isActive`, annual leave days
- **AnnualLeave** — type: `ANNUAL | HALF | HALF_AM | HALF_PM | SICK | SPECIAL`, status: `PENDING | APPROVED | REJECTED | CANCELLED`
- **Evaluation / EvaluationItem / EvaluationScore** — Periodic performance evaluation with weighted scoring by category
- **Notification** — Per-user notifications with `isRead` flag

### Patterns

**API routes** follow this structure:
```ts
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: '...' }, { status: 401 });
// optional role check
// parse body / query params
// call lib/db function
// return NextResponse.json(...)
```

**Client components** use React Query (`useQuery` + `useMutation`) for all data fetching. Mutations call `queryClient.invalidateQueries()` on success. Toast feedback via `sonner`.

**Admin-only access** is enforced both in API routes (`session.user.role !== 'ADMIN'`) and via page-level role checks.

### Test Accounts (after seeding)

- Admin: `admin@company.com`
- Employee: `john@company.com`
