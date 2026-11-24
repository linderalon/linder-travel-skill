# linder-travel-skill

A Claude skill that turns a trip plan into a personal travel app: day-by-day screens, offline maps, English place names that open in Google Maps, a bookings checklist and tips. The app works offline and installs to your iPhone or Android home screen through Netlify, for free.

## What you get

- A home screen with a countdown and destination cards
- One screen per day: transport (with English directions), the plan, options for morning / afternoon / evening, a map, food, plan B, shopping and tips
- A full-trip map, a bookings checklist and a "things to check" list
- Hebrew (right-to-left) or English interface

## Install the skill

**Claude apps (claude.ai / desktop / Cowork):** download this repo as a ZIP (Code → Download ZIP), then go to Settings → Capabilities → Skills → Upload skill and choose the ZIP.

**Claude Code:** copy the folder into `~/.claude/skills/linder-travel-skill/`:

```bash
git clone https://github.com/linderalon/linder-travel-skill ~/.claude/skills/linder-travel-skill
```

Code execution needs to be enabled, because the skill runs Node and Python to build the app.

## Use it

Type `/linder-travel-skill` (or ask "turn my trip plan into an app"). Claude will:

1. Ask about destinations, dates, travellers, language, style and bookings, and ask you to upload any plan or spreadsheet you have.
2. Draft or review the itinerary with you, and fact-check it (closures, transport changes, events, what to book).
3. Build the app and check it on an iPhone-sized screen.
4. Give you a ZIP plus step-by-step instructions to publish it on Netlify and add it to your home screen.

## Try the sample

```bash
npm init -y && npm i world-atlas topojson-client @fontsource-variable/rubik
node scripts/extract_coast.mjs "Portugal" -10 36.5 -6 42.5 > coast.json
python3 scripts/build.py examples/lisbon-sample/trip.json --coast coast.json --out lisbon-app
```

Then drag `lisbon-app/` onto [app.netlify.com/drop](https://app.netlify.com/drop).

## Privacy

The published Netlify link is public. Pick a hard-to-guess site name, and don't put booking numbers or passport details in the app.

## Credits

Map data: [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas) (public domain). Font: [Rubik](https://fonts.google.com/specimen/Rubik) (SIL Open Font License) via Fontsource.

## License

MIT
