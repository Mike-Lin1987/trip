This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Scope

The live site is a Vercel-hosted Next.js travel tool for the 2026 Hokuriku
family trip. It focuses on itinerary, destinations, transport, hotels,
checklists, and shared accounting. The standalone photo album page was removed
to keep the trip site simpler; family photos can be collected directly in
Google Drive outside this app.

## Travel Password Auth

The travel password is verified on the server. Do not put the shared password or
its hash in any `NEXT_PUBLIC_` variable or client component.

Set these server-only environment variables before running or deploying:

```env
TRAVEL_PASSWORD_HASH=your-64-character-sha256-password-hash
TRAVEL_SESSION_SECRET=replace-with-at-least-32-random-characters
TRAVEL_SESSION_TTL_SECONDS=1209600
```

Use PowerShell to generate the password hash:

```powershell
[System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes("replace-with-travel-password"))).Replace("-", "").ToLowerInvariant()
```

This app uses Next.js proxy and HttpOnly cookies for the password session, so it
must be deployed to a runtime that supports Next.js server logic. Do not deploy
the protected site as a static `out` directory. The deployment target for this
project is Vercel.

## Getting Started

First, run the development server:

```bash
npm.cmd run dev
# or
yarn.cmd dev
# or
pnpm.cmd dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This repository stores the Next.js app in `next-redesign`. When importing the
Git repository into Vercel, set **Root Directory** to `next-redesign`.

Required Vercel environment variables:

```env
TRAVEL_PASSWORD_HASH=your-64-character-sha256-password-hash
TRAVEL_SESSION_SECRET=replace-with-at-least-32-random-characters
TRAVEL_SESSION_TTL_SECONDS=1209600
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

CLI deployment from this directory:

```powershell
vercel.cmd link
vercel.cmd env add TRAVEL_PASSWORD_HASH production
vercel.cmd env add TRAVEL_SESSION_SECRET production
vercel.cmd env add TRAVEL_SESSION_TTL_SECONDS production
vercel.cmd deploy --prod
```

Before production deploy, apply the Supabase hardening migration:

```text
supabase/migrations/202606250001_harden_accounting_policies.sql
```
