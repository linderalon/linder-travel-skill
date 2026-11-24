---
name: linder-travel-skill
description: Builds a personal, offline-capable trip guide app (installable on iPhone/Android via Netlify) from a user's destinations, dates and plan. Use when the user runs /linder-travel-skill or asks to turn a trip plan into an app.
---

# Linder Travel Skill – build a trip guide app

The user ends up with a mobile web app for their trip: a home screen with a countdown and destination cards, one screen per day (plan, options by time of day, map, food / plan B / shopping / tips), a bookings checklist, a full-trip map, and general tips. It works offline, installs to the phone home screen, and every place has an English name that opens in Google Maps.

This skill folder contains everything needed to build it:

| Path | What it is |
|---|---|
| `assets/app.css`, `assets/app.js`, `assets/index.template.html`, `assets/sw.template.js` | The app shell (design, screens, maps, offline cache). Do not rewrite these per trip – fill `trip.json` instead. |
| `scripts/extract_coast.mjs` | Extracts country coastlines for the offline maps. |
| `scripts/build.py` | Turns `trip.json` + coastline + art into the Netlify folder, a one-file preview and a zip. |
| `scripts/make_icons.mjs` | Renders the home-screen icons (called by build.py). |
| `examples/lisbon-sample/trip.json` | A complete small example of the data format. Read it before writing a trip.json. |

Work in five phases. Do not start building until phase 2 is approved.

## Phase 1 – Intake

Use AskUserQuestion (batches of up to 4 questions). Ask:

1. Destinations – countries/cities, in order if known.
2. Dates – arrival and departure dates, arrival/departure airports.
3. Travellers – who is going (couple, kids and ages, older parents, mobility limits).
4. App language – Hebrew (right-to-left), English, or another; English place names are always included.
5. Style – pace (relaxed / balanced / packed), budget, interests (food, shopping, nature, history, nightlife, hiking, hobbies), must-dos and things to avoid.
6. What is already booked – flights, hotels (names), tickets, rail passes.
7. Existing plan – ask them to upload any plan they have: Excel/CSV, Word, PDF, notes, or images (maps, infographics, their own photos). Say plainly that uploading a spreadsheet gives the best result.

If the user has no plan, do not send them elsewhere – tell them you will draft one together in phase 2.

## Phase 2 – The plan (approve before building)

- If they uploaded a plan: read it fully. Treat it as the source of truth and do not change it; only add to it. List contradictions you find (e.g. hotel column says one city, activities another) and ask how to resolve them.
- If they have no plan: research and draft a day-by-day itinerary that fits their dates, pace, interests and bookings (one row per day: date, city, hotel/area, how to get there, main activities). Show it as a compact table and iterate until they approve.
- Fact-check with web search before building: transport routes and recent changes, closures and renovations, seasonal events on their exact dates, what needs advance booking and when sales open, tax/visa/entry rules, local tourist taxes. Record conflicts with the plan as "things to check" notes – never silently rewrite the plan.

## Phase 3 – Content → `trip.json`

Write one `trip.json` following `examples/lisbon-sample/trip.json`:

- `meta`: `id`, `title`, `short_name`, `subtitle`, `badge` (2–3 chars or a word in the local script), `lang` (`he`/`en`), `dir` (`rtl`/`ltr`), `country` (appended to Google Maps searches), `range`, `routeSummary`, `segments` (region key → `{color, name}`), optional `nolink` (words that must not become map links: dish names, ticket types, brands).
- `days[]`: `iso` date, `title` (app language), `title_en`, optional `label` (local-script name, e.g. 京都), `art` key, `seg`, `ctx` (city for map searches), `weather`, `hotel`, `area`, `how`, `travel`, `bags`, `steps` (3–5 English directions, names exactly as Google Maps knows them, joined with " → "), `plan` (the user's original items, unchanged), `gem`, `morning`/`noon`/`evening` (2–5 options each), `food`, `planb`, `shop`, `tips`, `check`, and `stops` (3–6 in visiting order: `name`, English `q` for Google Maps, `lat`, `lon`, `k` = s/f/h/t/x for sight/food/hotel/transit/shopping; mark the hotel `h`).
- Multi-line text fields use one item per line starting with "• "; a line starting with "⭐" shows a top-pick tag and "⚠️" a check tag; "Label: text" renders the label bold.
- `dests[]` (destination cards), `route[]` (overview map nodes in travel order), `book[]`, `notes[]` (`priority` high/mid/low), `shop[]`, `tips[]`.
- Every place mentioned in another language also appears in English (in parentheses) so it links to Google Maps. Double-check coordinates – a wrong pin is worse than none.

If the user gave a spreadsheet, also return it with your additions as new sheets – never modify their original sheet.

## Phase 4 – Build

1. Set up a working folder: `npm init -y && npm i world-atlas topojson-client @fontsource-variable/rubik` (Playwright is needed for icons; use the preinstalled one if present).
2. Coastline: `node <skill>/scripts/extract_coast.mjs "Japan" [minLon minLat maxLon maxLat] > coast.json` (Natural Earth names; several countries with `"Spain|Portugal"`). Optional lakes: add `"lakes": [[[lat,lon],...]]` to trip.json for big lakes on the route.
3. Art: one image per `art` key in an `art/` folder (`<key>.webp|png|jpg|svg`, square, ideally circular illustrations ~480px). Use the user's own images first (crop illustrations from their uploads). If photo sites are blocked by the network, do not work around it – use the user's images, draw simple illustrated SVG scenes per destination, or let build.py fall back to coloured initials. Never use photos of public figures or recognisable brand characters.
4. Build: `python3 <skill>/scripts/build.py trip.json --coast coast.json --art art --out <name>-app`.
5. If the user shared a visual reference, adjust `assets/app.css` variables (`--night`, `--sakura`, `--paper`…) in a copy rather than rewriting the shell.

QA before delivering: serve the folder (`python3 -m http.server`), open it with Playwright's iPhone 13 profile, screenshot home, a travel day (all four tabs), trip map and bookings. Check console errors, overlapping or clipped text, mixed-direction dates, map pins in the right places, and that the service worker registers. Fix and re-check.

## Phase 5 – Deliver and teach the user to publish it

Deliver the zip, the one-file preview (`<name>-app-single.html`; publish it as an artifact when that tool exists), and the updated spreadsheet if any. Then give these steps, numbered, in the user's language:

1. Create a free Netlify account at netlify.com (sign up with Google or email). Do this first: sites dropped without an account are deleted after about an hour.
2. Unzip the downloaded file.
3. Go to app.netlify.com/drop and drag the whole app folder onto the page.
4. When it finishes, open Site configuration → Change site name and pick a hard-to-guess name (the link is public and contains hotels and dates).
5. iPhone: open the link in Safari → Share → Add to Home Screen → Add. Android: Chrome → ⋮ menu → Add to Home screen / Install app.
6. Open the app once from the new home-screen icon while on Wi-Fi – that is when it saves itself for offline use (on iPhone, Safari and the home-screen app keep separate storage). Test with Airplane Mode.
7. Repeat on each traveller's phone. Checklist ticks are saved per phone.
8. Google Maps buttons need internet – download offline areas in the Google Maps app before the trip.
9. To update later: ask for changes, rebuild, then in Netlify open the site → Deploys → drag the new folder onto the drop area. The app updates the next time it is opened online.

Close by offering to update the app when plans change.
