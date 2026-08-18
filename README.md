# Shop Platform — Phase 1 (Backend Foundation)

One codebase, deployed separately per shop (own DB, own `SHOP_THEME`). See
`packages/theme-configs` for the reskinning mechanism.

## What's built in this phase

- **Dynamic RBAC** — `Role` / `Permission` / `RolePermission` are DB tables, not
  a hardcoded enum. `packages/db/prisma/seed.ts` seeds the 10 default roles
  (Super Administrator, Shop Manager, Accountant, Inventory & Catalog Manager,
  Order Fulfillment Specialist, Customer Support, Marketing & Analytics
  Specialist, Copywriter, SEO Specialist, Customer). Editing a role's
  permissions is a data change — no redeploy.
- **CASL ability factory** (`apps/api/src/casl/`) — builds a permission object
  per request from the user's role grants, cached in Redis for 5 minutes
  (`role-permissions-cache.service.ts`) so RBAC doesn't hit Postgres on every
  call.
- **Phone + OTP auth** (`apps/api/src/auth/`) — phone number is the required
  identifier, email is optional. OTP codes live in Redis only (never
  persisted to Postgres), with a resend cooldown and a max-attempts guard
  against brute-forcing. JWT access tokens (15 min) + rotating refresh tokens
  (30 days, hashed in `RefreshToken` table).
- **SMS provider abstraction** (`apps/api/src/sms/`) — `SmsProvider` interface
  with a Kavenegar implementation stubbed in. Swap providers (Melipayamak,
  Twilio for a future non-Iran shop) by implementing the interface and
  changing one binding in `sms.module.ts`.
- **Translatable catalog schema** — `Product`/`Category` hold non-translatable
  fields (price, SKU, stock); `ProductTranslation`/`CategoryTranslation` hold
  per-locale name/description/slug. Only `fa` rows exist today; adding English
  later is a data insert, not a migration.
- **Money as integers** — `price`, `salePrice`, `total` are stored as integers
  in the smallest currency unit (Rial). Format for display (Toman conversion,
  Persian numerals) at the UI layer, never in the DB.
- **Redirect-based payment schema** — `Payment` model shaped for Zarinpal's
  request → authority → redirect → callback → verify flow, with a `provider`
  field so bank gateways or a future webhook-based gateway can slot in later.

## Not built yet (rest of Phase 1)

- Products/Categories controllers actually using `PoliciesGuard` end-to-end
- Role/Permission admin endpoints (create role, assign permissions, invalidate cache)
- Rate limiting beyond the OTP endpoints (general API rate limiting via Redis)
- Zarinpal integration (request/verify calls) — schema is ready, client isn't written
- `apps/storefront` (Next.js) and `packages/ui`

## Setup

```bash
pnpm install

# apps/api/.env — copy from .env.example and fill in DATABASE_URL, REDIS_URL,
# JWT_ACCESS_SECRET, KAVENEGAR_API_KEY

pnpm --filter @shop/db exec prisma migrate dev --name init
pnpm --filter @shop/db run seed

pnpm --filter @shop/api run dev
```

## Trying the auth flow

```bash
curl -X POST http://localhost:3001/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+989121234567"}'

# check server logs / Kavenegar dashboard for the code, then:
curl -X POST http://localhost:3001/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+989121234567","code":"12345"}'
```

A successful verify returns `{ accessToken, refreshToken }` and creates a
`User` with the `Customer` role if the phone number is new.

## A known Phase-1 limitation, worth knowing about

The Super Administrator role is seeded with every permission that exists
*at seed time*. If you add a new `Subject`/`Action` later (in
`casl-types.ts` + `seed.ts`), remember to also grant it to Super Admin in the
seed data — it isn't automatically wildcard. We can automate this
(auto-grant new permissions to Super Admin on creation) in a later phase if
it becomes a recurring annoyance.
