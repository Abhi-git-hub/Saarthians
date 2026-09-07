# Supabase setup

Project: Saarthians
Region: ap-south-1

## Local environment

Create `.env.local` from `.env.example` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never commit `.env.local` and never expose a service-role/secret key to the browser.

## Auth dashboard

Configure the production site URL as `https://saarthians.online` and add the local development URL used by the project. Add the authentication callback route used by the app to the allowed redirect URLs.

## Database

The core schema and security hardening migrations are applied to the Saarthians Supabase project. RLS is enabled on all application tables.
