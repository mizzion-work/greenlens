# GreenLens AI

> เปลี่ยนมุมร้าง ให้เป็นปอดของเมืองด้วย AI

Take a photo of an empty balcony, yard or rooftop. GreenLens AI then:

1. **Analyses the space** (Gemini vision) and pre-fills space type, sunlight and size.
2. **Picks plants** from a curated list of 15 Thai nursery plants, based on light, size, pets and care level.
3. **Edits your real photo** (Gemini image model) so you can compare Before/After with a slider.
4. **Estimates impact**: cooling, PM2.5 capture, leaf area and budget. It also shows live PM2.5, temperature and UV for your area from Open-Meteo.
5. Links to Shopee/Lazada for each plant and to nurseries near you on Google Maps.
6. **Sun direction**: tell it which way the balcony faces (or use the phone compass) and a sun-path model for Thailand estimates direct-sun hours and sets the light level.
7. **สวนของฉัน (My Plants)**: every generated garden is saved on the device (IndexedDB, up to 30), no login.
8. **เคล็ดลับ (Tips)**: care guide for all 15 plants plus balcony, watering, season, PM2.5 and pet tips.
9. **ถาม AI (plant-advisor chat)**: a floating chat on every screen. Users ask about plants they already own (they can attach a photo), and Gemini answers using their space (type, facing, light, size, pets) and the recommended list, suggesting reuse before buying.

Everything runs in **one Cloudflare Worker**: TanStack Start renders the pages, and its server functions call Gemini and Open-Meteo. There is no separate backend and no database.

If no Gemini key is configured, or a call fails, the app still works. It draws an illustrated preview on the device instead of the AI image.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, file routes, server functions)
- Cloudflare Workers via `@cloudflare/vite-plugin`
- Tailwind CSS v4 + hand-written CSS tokens (light/dark)
- Google Gemini REST API (`generateContent`)
- Open-Meteo air quality + weather (no key)
- Vitest for unit tests

## Run locally

```bash
npm install
cp .dev.vars.example .dev.vars   # then put your key in GEMINI_API_KEY
npm run dev                      # http://localhost:3000
```

Get a Gemini API key at <https://aistudio.google.com/apikey>. You can leave the key empty: the app runs in preview mode.

```bash
npm test          # unit tests (recommender, impact, prompts, Gemini parsing)
npx tsc --noEmit  # typecheck
```

## Deploy to Cloudflare

```bash
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

Non-secret settings live in `wrangler.jsonc`:

| Setting | Default | Purpose |
|---|---|---|
| `GEMINI_IMAGE_MODEL` | `gemini-3.1-flash-image` | Edits the photo |
| `GEMINI_TEXT_MODEL` | `gemini-3.6-flash` | Analyses the space (JSON output) |
| `GENERATE_LIMITER` | 4 / minute / IP | Workers rate-limit binding for image generation |
| `ANALYZE_LIMITER` | 12 / minute / IP | Rate limit for analysis |
| `CHAT_LIMITER` | 10 / minute / IP | Rate limit for the AI chat |

Gemini model names change often. If calls start failing with 404, check <https://aistudio.google.com/docs/models> and update the two vars.

> **Cost note:** each "สร้างภาพ" (generate) costs one Gemini image generation, and each "ลองแบบอื่น" (try another) costs another. The per-IP rate limits stop casual abuse, not a determined attacker. For a public launch, also set a budget alert in Google Cloud, or add Cloudflare Turnstile.

## Project layout

```
src/
  lib/            pure logic, unit-tested
    plants.ts       plant database (Thai names, light, water, pet safety, price)
    recommend.ts    scoring + combination picker ("variant" = next-best mix)
    impact.ts       cooling / PM2.5 / leaf-area / budget estimate
    prompts.ts      Gemini prompts + analysis JSON schema
    air-quality.ts  Thai PCD PM2.5 bands
  server/
    gemini.ts       tiny REST client + response parsing
    functions.ts    TanStack server functions (run inside the Worker)
  lib/sun.ts        sun-path model: facing + latitude -> direct-sun hours
  lib/care.ts       care guides and general tips
  lib/chat.ts       chat system prompt, history trimming, reply formatting
  client/image.ts   resize/strip-EXIF, sample photo, on-device preview
  client/gardens-db.ts  "My Plants" storage (IndexedDB)
  client/compass.ts phone compass reading
  state/garden.tsx  app state (React context, persisted to sessionStorage)
  routes/           /  (capture) · /result (before/after) · /plan (impact)
                    /garden (my plants) · /tips · /about
```

## Privacy

- The browser resizes photos to ≤1280 px and re-encodes them, which strips EXIF/GPS data, before upload.
- Photos go to Gemini for processing and are never stored by GreenLens.
- Results live only in the tab's `sessionStorage`.
- Precise location is used only when the user taps "ใช้ตำแหน่งที่แม่นยำ" (use my precise location). Otherwise the app uses Cloudflare's approximate request location.

## Caveats

- The impact numbers are estimates for comparison, not measurements. See `src/lib/impact.ts` and the in-app About page for the method.
- The Open-Meteo free API is for non-commercial use. A commercial launch needs their paid plan.
