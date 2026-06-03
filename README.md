# Read

A minimal reading app for long-form ideas and essays. Built with Expo and React Native. The library ships with **468 ideas** from [Noah Zender](https://www.noahzender.com/ideas), grouped by category, with full article text available offline.

## Features

- **Library** — category-grouped list with scrollable header logo
- **Reader** — serif typography, paper-like light/dark theme, swipe back on iOS
- **Offline-first** — bundled summaries and full articles; Supabase refresh when online
- **Branding** — book logo used for app icon, splash, and in-app UI (single SVG source)

## Stack

- [Expo SDK 56](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/)
- React Native 0.85, TypeScript, Bun
- [Supabase](https://supabase.com/) for article storage (public read)
- EAS Build for iOS TestFlight / App Store

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (or Node 20+)
- iOS Simulator, Android emulator, or Expo Go for local dev
- Supabase project (optional for dev — app works offline via bundled JSON)

### Install and run

```bash
bun install
cp .env.example .env
# Edit .env with your Supabase URL and publishable key
bun start
```

Press `i` for iOS simulator or scan the QR code with Expo Go.

### Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | App + scripts | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | App + scripts | Public API key (safe in the app) |
| `SUPABASE_SECRET_KEY` | Scripts only | Never ship in the mobile build |
| `SUPABASE_DB_URL` | Scripts only | Direct Postgres for import/setup |

## Project layout

```
src/
  app/              # Expo Router screens (library, reader)
  components/       # AppLogo, LaunchSplash
  constants/        # Reading theme, category order
  data/             # Bundled article-summaries.json, articles.json
  hooks/            # useArticles, useArticle
  lib/              # Supabase client, articles fetch, cache
scripts/            # Import, export, Supabase setup, brand assets
supabase/migrations/
assets/images/      # app-logo.svg (source), generated PNG icons
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun start` | Start Expo dev server |
| `bun run lint` | ESLint |
| `bun run verify:supabase` | Test Supabase connection |
| `bun run setup:supabase` | Apply migrations + seed |
| `bun run import:noah` | Scrape and upsert all ideas from noahzender.com |
| `bun run export:summaries` | Regenerate `src/data/article-summaries.json` |
| `bun run export:articles` | Regenerate `src/data/articles.json` (~527 KB) |
| `bun run generate:brand-assets` | Regenerate icons/splash PNGs from `app-logo.svg` |

After changing content in Supabase, run `export:summaries` and `export:articles` so offline bundles stay in sync.

## Brand assets

All platform icons are generated from `assets/images/app-logo.svg`:

```bash
bun run generate:brand-assets
```

Then rebuild with EAS if you need a new home-screen icon on device.

## iOS TestFlight (EAS)

1. Register Bundle ID `com.notcodesid.read` in Apple Developer
2. Create the app in App Store Connect with the same bundle ID
3. Link the project (once): `eas init`
4. Set EAS secrets for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Build and submit:

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

6. Add yourself under **TestFlight → Internal Testing** and install via the TestFlight app

Project: [@notcodesid-2/read](https://expo.dev/accounts/notcodesid-2/projects/read)

## Data model

Table `public.articles`: `id`, `title`, `source`, `author`, `category`, `source_url`, `paragraphs` (jsonb), `added_at`. RLS allows public read.

## License

Private project. Content sourced from Noah Zender’s site for personal reading; respect original attribution and terms when distributing publicly.