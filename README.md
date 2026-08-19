# Ninefold V3.1 · 九境生息

> **Return for a moment. Leave something growing.**
> **回来片刻，留下一点生长。**

Ninefold is a bilingual, local-first symbolic reflection experience built around a personal world and a persistent tree. It is reflective and entertainment-oriented: it does not diagnose, clinically assess, or claim that zodiac symbols predict events.

[Open Ninefold](https://simonxz578.github.io/Ninefold/) · English `#/en/` · 简体中文 `#/zh/`

## The V3.1 experience

The world-first onboarding begins with an empty sky:

1. Enter a birth month and day to reveal a symbolic zodiac constellation.
2. Choose a cloud form.
3. Choose one of nine distinct world/tree prototypes.
4. Stay for a one-minute seed-to-bare-tree birth, or skip the animation without receiving a leaf.
5. Optionally add a nickname and answer four lightweight personality-preference questions. This is not an official MBTI assessment.

Once the world is born:

- **Today** records Mood `1–9` and Energy `1–9` and produces a deterministic local reading.
- The first check-in for a local date seals that day’s **Keyword / 宜 / 不宜**; later same-day state updates do not reroll those fields.
- **Breathing** offers one- and five-minute sessions with Ocean or Rain, persistent mute and volume controls, and safe early exit.
- Each completed daily breathing session adds exactly one persistent leaf. Early exit and first tree birth add none.
- **My Ninefold** redraws cloud and world choices while preserving leaves, sessions, check-ins and daily history.
- **Growth** provides the persistent tree, session history and a monthly calendar with lunar dates, festivals, official 2026 Chinese holiday/workday labels and day detail.

## Product boundaries

- Browser-local persistence only; no account, authentication, cloud sync or database.
- No analytics, tracking, advertising or device fingerprinting.
- No remote AI model or paid API.
- No streaks, rankings, coins or missed-day punishment.
- No medical, counselling, legal, financial or deterministic prediction claims.

Deleting browser storage deletes the local world. Language changes presentation only; they do not reroll semantic readings or leaf placement.

## Nine worlds

The nine prototypes share a common tree system while retaining different silhouettes, terrain and branch grammars: Dawn Ridge, Confluence Meadow, Windvoice Hill, Stone Terrace, Riverbend, Sheltering Grove, Quiet Mirror, Far Horizon and Returning Plain. Leaf positions are deterministic from the stable world seed, selected path and leaf index, so existing leaves remain fixed as the tree grows or is redrawn.

## Architecture

Ninefold is a Vite, React and TypeScript application using hash routing for static GitHub Pages hosting.

```text
src/v3/pages/       World Builder, Today, My Ninefold, Growth, Method, Preferences
src/v3/components/  world scene, breathing, reading, calendar and controls
src/v3/domain/      validated storage, readings, leaves, zodiac, personality, calendar
src/v3/audio/       recorded Ocean lifecycle and procedural Ocean/Rain fallback
src/i18n/           route-driven English and Simplified Chinese infrastructure
```

State is stored in a validated `ninefold:v3:*` namespace. V3 clear/reset operations do not delete legacy V1/V2 keys. Daily readings and leaf placements use stable locale-independent semantic identifiers.

The lunar display uses [`lunar-javascript`](https://github.com/6tail/lunar-javascript) only for Gregorian/lunar dates, festivals and solar terms. Ninefold does not expose almanac advice or auspicious/inauspicious claims.

## Audio and third-party material

Ocean uses the locally hosted CC0 recording “Gentle Ocean Waves Mix (2018)” by esh9419. Rain is procedurally generated in the browser. Full provenance, hashes and dependency licensing are in [`THIRD_PARTY_ASSETS.md`](THIRD_PARTY_ASSETS.md).

## Local development

```bash
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5174 --strictPort
```

Production validation:

```bash
pnpm lint
pnpm exec tsc -p tsconfig.app.json --noEmit --incremental false
pnpm exec tsc -p tsconfig.node.json --noEmit --incremental false
pnpm test --configLoader runner
pnpm build --configLoader runner
pnpm preview --host 127.0.0.1 --port 4174 --strictPort
```

## Accessibility and privacy

The application uses native controls, keyboard-visible focus, route and stage focus management, reduced-motion behavior, bilingual semantic labels and local-only data. No secrets or environment configuration are required for the browser build.

## Deployment

`.github/workflows/deploy-pages.yml` validates and deploys `main` through GitHub Actions Pages. Vite’s relative base and `import.meta.env.BASE_URL` keep application and audio assets valid under the `/Ninefold/` project path.
