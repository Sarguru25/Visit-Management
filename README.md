
```
visit-management
├─ README.md
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ prisma
│  ├─ dev.db
│  ├─ schema.prisma
│  └─ seed.ts
├─ public
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ activity-logs
│  │  │  │  └─ page.tsx
│  │  │  ├─ customers
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ dashboard
│  │  │  │  └─ page.tsx
│  │  │  ├─ email-templates
│  │  │  │  └─ page.tsx
│  │  │  ├─ employees
│  │  │  │  └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ reports
│  │  │  │  └─ page.tsx
│  │  │  ├─ settings
│  │  │  │  └─ page.tsx
│  │  │  └─ visits
│  │  │     └─ page.tsx
│  │  ├─ api
│  │  │  ├─ activity-logs
│  │  │  │  └─ route.ts
│  │  │  ├─ auth
│  │  │  │  ├─ change-password
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ logout
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ me
│  │  │  │     └─ route.ts
│  │  │  ├─ companies
│  │  │  │  └─ route.ts
│  │  │  ├─ customers
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ email-templates
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ employees
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ reports
│  │  │  │  ├─ export
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  ├─ settings
│  │  │  │  └─ route.ts
│  │  │  ├─ upload
│  │  │  │  └─ route.ts
│  │  │  └─ visits
│  │  │     ├─ [id]
│  │  │     │  └─ route.ts
│  │  │     └─ route.ts
│  │  ├─ employee
│  │  │  ├─ customers
│  │  │  │  ├─ [id]
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ dashboard
│  │  │  │  └─ page.tsx
│  │  │  ├─ profile
│  │  │  │  └─ page.tsx
│  │  │  └─ visits
│  │  │     └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  └─ page.tsx
│  ├─ components
│  │  ├─ layout
│  │  │  ├─ Breadcrumbs.tsx
│  │  │  ├─ LayoutWrapper.tsx
│  │  │  ├─ Navbar.tsx
│  │  │  └─ Sidebar.tsx
│  │  ├─ leads
│  │  │  ├─ LeadDetailsClient.tsx
│  │  │  └─ LeadsClient.tsx
│  │  ├─ theme-provider.tsx
│  │  ├─ ui
│  │  │  ├─ badge.tsx
│  │  │  ├─ card.tsx
│  │  │  └─ dialog.tsx
│  │  └─ visits
│  │     └─ VisitsClient.tsx
│  ├─ lib
│  │  ├─ api.ts
│  │  ├─ auth.ts
│  │  ├─ email.ts
│  │  ├─ logger.ts
│  │  └─ prisma.ts
│  └─ middleware.ts
└─ tsconfig.json

```