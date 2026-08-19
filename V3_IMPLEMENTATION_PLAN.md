# Ninefold V3 World Builder — Implementation Plan

Baseline: `bfd1c83be7560b431427c1c9225b0dba05abd026`

Worktree: `/Users/zhangxiang/Documents/Ninefold-WorldBuilder`

Branch: `feat/world-builder-v3`

## Product boundary

This worktree becomes a polished local V3 demo. The stable V2 checkout remains reference-only. No branch is pushed, no merge is performed, and GitHub Pages is not changed.

The core story is deliberately narrow: empty sky → birth day and zodiac motif → cloud identity → one of nine Path worlds → seed → one quiet minute and a bare tree → nickname → four preference choices → mood and energy → deterministic reading → daily breathing → exactly one persistent leaf.

## Foundations reused from V2

- React 19, TypeScript, Vite, `HashRouter`, `ErrorBoundary`, and `ScrollToTop`.
- Route-localised `en` / `zh` mapping and route-preserving language changes.
- Nine typed Path grammars and their tree geometry.
- SVG/CSS landscape layering, deterministic geometry patterns, focus-visible conventions, and reduced-motion foundations.
- Local-first storage validation patterns, but never V2 keys or V2 clearing behavior.
- Existing Web Audio lifecycle principles only; V3 uses a new non-musical Ocean/Rain controller.

Legacy landing, onboarding, Today, Reframe, sample-week and panel-heavy Growth screens are not used as the primary V3 flow.

## Design direction

Subject: a private illustrated world that remembers deliberate pauses. Audience: someone seeking a calm daily self-check without accounts, diagnosis, or gamification. The page’s single job is to make the next small choice feel as if it physically shapes the world.

Motion personality: quiet premium-organic. Emotional target: calm curiosity, followed by earned wonder during tree birth.

Token palette:

- night ink `#10231f`
- deep lake `#174b52`
- dawn sky `#87cbd2`
- warm horizon `#f3d9a4`
- living moss `#3f7558`
- leaf light `#d8e89d`

Typography:

- display: Iowan Old Style / Baskerville for a storybook-editorial voice;
- body: Inter/system sans for clear controls;
- utility: spaced uppercase system sans only for quiet metadata.

Layout: the SVG world always fills the viewport; controls float at the lower edge in translucent ink/ivory surfaces, never as a dashboard.

Signature: the user’s zodiac motif becomes a permanent constellation and silent progress marker while the seed grows through the same persistent SVG tree used later.

The deliberate visual risk is an almost UI-less first frame: the scene, not a hero card, teaches the product. This is specific to Ninefold and avoids a generic landing-page pattern.

## New V3 architecture

### Domain

- `src/v3/domain/types.ts`: V3 profile, draft, daily check-in, reading semantics, meditation progress, session record, cloud and personality types.
- `src/v3/domain/zodiac.ts`: validated month/day and a fixed tropical zodiac table, including Feb 29.
- `src/v3/domain/personality.ts`: four binary dimensions and safe four-letter derivation.
- `src/v3/domain/reading.ts`: mood/energy bands, nine state cells, deterministic locale-neutral reading IDs, and weather values.
- `src/v3/domain/leaves.ts`: deterministic branch-attached leaf slots stable across reload and locale.
- `src/v3/domain/storage.ts`: validated `ninefold:v3:*` envelopes, V3-only reset, and corrupt-state fallback.

### State and routing

- `src/v3/V3App.tsx`: V3 provider/controller, explicit bilingual routes, and guards.
- New user `/{lang}/` → World Builder.
- Returning valid V3 user `/{lang}/` → Today.
- `/{lang}/today`, `/{lang}/growth`, `/{lang}/about`, `/{lang}/preferences`.
- Compatibility redirects map legacy paths without writing V2 state.
- Draft identity lives above routes so language changes do not reroll or reset it.

### UI

- `src/v3/components/V3Shell.tsx`: immersive brand/language chrome and quiet post-creation navigation.
- `src/v3/components/WorldBuilderScene.tsx`: dedicated 2.5D SVG scene for staged sky, zodiac, clouds, terrain, seed, bare tree and leaves.
- `src/v3/pages/WorldBuilderPage.tsx`: birth date, cloud, nine prototypes, first breathing, nickname, preferences, mood and energy.
- `src/v3/pages/TodayPage.tsx`: persistent world, existing/today check-in, reading and daily breathing.
- `src/v3/pages/GrowthPage.tsx`: same tree identity plus leaves, session count, minutes and recent sessions.
- `src/v3/pages/AboutPage.tsx`: truthful method and V3-only reset.
- `src/v3/pages/PreferencesPage.tsx`: secondary preference editing.
- `src/v3/components/BreathingSession.tsx`: first-birth and daily modes, Escape exit, focus restoration and injectable timing.
- `src/v3/components/DailyReading.tsx`: compact four-layer editorial reading.
- `src/v3/copy.ts`: typed bilingual UI and semantic-fragment formatting, with no mixed hard-coded component copy.
- `src/v3/v3.css`: isolated responsive visual system.

## World identity and previews

Cloud archetypes: high/thin, layered, soft/voluminous, and wind-drawn. Hover/focus temporarily previews on desktop; click/tap selects. Main-scene changes crossfade without a generation delay.

Nine prototypes map one-to-one to Path numbers 1–9 and preserve `PATH_GRAMMARS`: Initiation/meadow, Connection/streams, Expression/flower field, Structure/terraces, Movement/wind-water, Care/grove, Reflection/lake, Realisation/highland, Integration/seasons. Each thumbnail uses the real path-specific bare-tree geometry over a terrain miniature. Confirmation removes the ghost tree and leaves only the seed.

Twelve zodiac motifs are original coordinate graphs stored in source as symbolic Ninefold star maps, not astronomical reconstructions.

## Motion score

Signature easing: `power2.inOut` / premium `cubic-bezier(0.4,0,0.2,1)`. UI duration palette: 160ms quick, 420ms standard, 760ms slow. Ambient loops use sine easing and low amplitude.

First birth timeline, real 60 seconds:

- 0–6s: controls recede; ambient audio fades in; seed becomes focal.
- 6–15s: constellation and cloud depth breathe.
- 15–28s: roots draw and shoot emerges.
- 28–50s: trunk draws continuously; major and secondary branches stagger in Path order.
- 50–58s: branch motion settles and the whole composition opens.
- 58–60s: stable bare tree, zero leaves.

GSAP is scoped to component refs with `useGSAP`; animations use transform, opacity and SVG stroke reveal; every timeline is reverted on unmount. Reduced motion resolves through short crossfades to the identical bare-tree state. Skip resolves to that same state and awards no leaf. A DEV-only acceleration multiplier supports browser QA and is absent from production UI.

Daily leaf completion animates only the new leaf from a bud to its deterministic final slot. Existing leaves and the tree remain stable.

## Audio approach

Native Web Audio only, with a module-level singleton `AudioContext` created/resumed from the Begin button gesture.

- Ocean: broad deterministic noise → low-pass/body filters → slow irregular gain swells.
- Rain: deterministic noise → high-pass and softened upper band → layered low-amplitude texture.
- No oscillators, notes, melody, bells, chimes, click/hover sounds, birds, fire, cafe ambience, downloaded media or remote services.
- Gain ramps never use exponential zero; mode switches crossfade; stop/destroy disconnect every node; tab visibility suspends/resumes safely; audio failure never blocks visuals.

## Persistence

Keys are strictly `ninefold:v3:*`: profile, draft, daily check-ins, meditation progress and locale. V1/V2 keys are neither read as V3 identity nor removed. Draft and complete profile are separate. A coherent profile is first committed only after the bare-tree birth and naming moment; personality completes setup. Daily state and semantic reading IDs are keyed by local calendar date.

First birth adds zero leaves. Every fully completed 60s or 300s daily session increments session count and leaf count by exactly one. Abort adds nothing. Leaf placement derives from stable profile seed, Path and leaf index.

## Accessibility and responsive behavior

- One logical route heading, meaningful scene description, text equivalent for zodiac, and no color-only state.
- Native button/radio semantics, selected state, keyboard-operable date/cloud/prototype/preference/1–9 controls, visible focus and ~44px targets.
- Escape exits breathing; focus returns to the initiating button; no trap.
- Reduced motion provides equivalent information and final states.
- Mobile targets 320–375px; tablet 768px; desktop 1024/1440px. The 1–9 control wraps/fits without horizontal scroll, and controls avoid the tree focal area and safe-area edges.

## Automated checks

- Zodiac: all ranges, boundaries, Feb 29 and invalid dates.
- Personality: each dimension, all 16 codes, invalid data rejection.
- Daily state: band boundaries and all nine cells.
- Determinism: stable inputs and locale-independent semantics/world identity.
- Leaves/sessions: first birth 0, 1m +1, 5m +1, abort 0, repeated completions +1 each, stable slots.
- Storage: validation/corruption fallback and V3-only reset preserving seeded V1/V2 keys.
- Audio: mode enum, no pre-gesture start, lifecycle and cleanup through injected doubles where practical.
- Routing/smoke: new user builder, returning Today, bilingual mapping and no core crash.

Required validation: lint, both TypeScript projects, full tests, build, real browser QA on port 5174, responsive/keyboard/reduced-motion checks, and production preview QA on port 4174.

Screenshots go only to gitignored `artifacts/v3-screenshots/`.

## Commit plan

Logical local commits after green checks:

1. domain, V3 storage and deterministic tests;
2. world-first builder and birth sequence;
3. daily reading, breathing audio and persistent leaves;
4. responsive/accessibility polish and final tests.

Commit grouping may be compressed if the final diff is clearer as fewer cohesive commits. No remote push or deployment.
