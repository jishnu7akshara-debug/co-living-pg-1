# Saathi Living · co-living pg1

Static marketing site for the **Co-Living, PG & Student Housing Operators** sector. Plain HTML/CSS/JS, no build step.

## Run locally
```
node server.js
```
Then open http://localhost:3000 (the server supports video range requests). Opening `index.html` directly won't work because asset paths are root-relative (`/assets/...`).

## Deploy
- **Vercel:** import the folder, framework "Other", no build command, output directory `.`. `vercel.json` and `.vercelignore` are already set (server.js is excluded so Vercel treats it as static and doesn't 404).
- **Netlify:** drag the folder in, or connect the repo; `netlify.toml` publishes `.`.

## Before handing to a client, replace
- Brand name "Saathi Living", phone `+91 90000 00000`, WhatsApp link (`wa.me/919000000000`) and email in `index.html`.
- Prices, bed counts and house names in the Rooms, Receipt and Locations sections.
- Photos/videos in `assets/` with the client's own (keep file names), then update `CREDITS.md`.
- Form submit: `js/main.js` has a marked spot to post to the client's CRM / email.

## What's in it
Door-opening loader · arch window hero that opens to full-screen video on scroll · who-it's-for tabs · horizontal 3D room reel · exploded isometric 5-floor building · all-inclusive rent receipt · sticky "weekday" timeline with arch image reveals · kitchen video band · parallax gallery · locations with cursor-follow photos · parents/safety section · FAQ · book-a-visit form over a rain video.
