# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

City residents in Thailand who live in condos, townhouses or detached houses and have an unused balcony, front yard or rooftop. Secondary: café owners and local agencies (กทม./เทศบาล) looking for ideas to add green space on a small budget. They often think their space is too small, or that they don't know how to garden or pick plants, so the space stays empty.

## Product Purpose

The user photographs an empty space. The AI shows how it would look with air-purifying plants (Before/After), recommends specific plants that suit the sunlight and space, and estimates how much the plants could cool the area and capture PM2.5. Success: the user feels inspired enough to actually buy and plant.

## Positioning

Most environment apps show dry statistics such as dust charts. GreenLens AI uses beauty and inspiration as the driver: it shows the user's own space made beautiful, so improving the environment becomes a win-win for the user.

## Operating Context

Used on a phone, standing in the space being photographed (balcony or yard), usually in daylight. The flow is: take photo → set up the space → Before/After → plant list, impact and where to buy.

## Capabilities and Constraints

- Analyse the photo (Gemini) to suggest space type, sunlight and size; the user can adjust.
- Pick plants from a curated database of 15 Thai plants (light, size, pets, care level).
- AI edits the real photo; if unavailable, an on-device simulated preview.
- Estimates of temperature drop, PM2.5, leaf area and budget are estimates, not measurements, and must say so.
- Live air quality from Open-Meteo; links to Shopee, Lazada and Google Maps.
- Deployed as a single Cloudflare Worker (TanStack Start). No accounts and no database.

## Brand Commitments

- Name: GreenLens AI. Tagline: “เปลี่ยนมุมร้าง ให้เป็นปอดของเมืองด้วย AI” (Turn empty corners into the city's lungs with AI).
- The poster mockups (`../S__26730504_0.jpg`, `../S__26730505_0.jpg`) are the approved design reference the app must match.
- Primary language is Thai, mixed with short English labels as in the mockups (Before/After, Let AI Generate, Regenerate, View Action Plan).

## Evidence on Hand

- Project posters: `../S__26730504_0.jpg` (mockups of 3 screens, features, expected benefits) and `../S__26730505_0.jpg` (problem, target users, how the AI works, data required).
- There are no real testimonials, user numbers or measured results. Do not invent them.

## Product Principles

1. Inspiration first: the before/after image is the heart of the product.
2. Honest numbers: every estimate says it is an estimate.
3. Beginner-friendly: someone who has never gardened must be able to finish the flow.
4. Usable for real: every recommended plant can actually be bought, with a link to a shop.
