# Supabase + GCP Setup

This project can run with:

- **Supabase Postgres** as registry DB
- **GCP Cloud Storage** as skill artifact storage

## 1) Supabase Postgres

1. Create a Supabase project.
2. Copy the Postgres connection string.
3. Set `DATABASE_URL` in your runtime environment.
4. Run migrations:

```bash
npm run db:migrate
```

## 2) GCP Cloud Storage

1. Create a GCS bucket (example: `gitskills-artifacts`).
2. Create a service account with `Storage Object Admin` access to that bucket.
3. Download its JSON key and set `GOOGLE_APPLICATION_CREDENTIALS` to that file path.
4. Set env vars:

```bash
GCP_PROJECT_ID=<project-id>
GCS_BUCKET=gitskills-artifacts
GCS_PUBLIC_BASE_URL=https://storage.googleapis.com/gitskills-artifacts
GCS_MAKE_PUBLIC=1
```

When `GCS_BUCKET` is set, publish uploads go to GCS. Otherwise local `public/tarballs` storage is used.

## 3) Required App Tokens

```bash
PUBLISH_TOKEN=<token-for-cli-publish>
ADMIN_TOKEN=<token-for-admin-endpoints>
```

## 4) Smoke Checklist

1. `GET /api/skills?q=hello` returns seeded data.
2. `gitskills publish ...` uploads and creates a new release.
3. `GET /api/skills/<slug>` includes the new version with download URL.
4. `GET /api/skills/<slug>/<version>/download` redirects and increments counters.

