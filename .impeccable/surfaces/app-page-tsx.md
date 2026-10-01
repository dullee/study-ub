---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/SpotCard.tsx","components/SpotDetailDialog.tsx","app/events/page.tsx","app/parking/page.tsx","components/AdminPanel.tsx"]
---

# Surface brief: StudySpots UB app (home map + list, and every surface that inherits it)

Scope: the whole web app's visual world — home (map, filters, place cards), place detail, dialogs, events, parking, admin. Visitor mode: Operate. Layout may change; nothing visual is protected. Must not feel bland or corporate.

Audience/job: anyone in Ulaanbaatar choosing where to sit and study or work, mostly on a phone outdoors; discovering, judging (busyness, reviews, scores) and joining events weigh equally.

## Direction contract

THESIS: The app is Ulaanbaatar under its own sky after dark: a deep navy page, one sky band that follows the city's real sunrise and sunset, places shown as photographs, and a manul for company. It refuses the slate SaaS dashboard with purple gradients, and equally the white photo-card listings grid.

OWN-WORLD: Always dark (user decision, 2026-10-01): ground #0A1626, sheets #102038, panels #172C48, ink #EEF3F9. Sky band #16508F by day, #0C1A2E at night, with a sun-orange #FF8A2A edge at dusk, driven by real UB time. Fills (azure #1466C2, green, red) carry white text; coloured text on dark uses separate light tokens (link #8CC2FF, good, danger). Shadows keep the sun-following offset and gain a faint light ring. Mascot: a manul (Pallas's cat) drawn in flat shapes, head in the wordmark and app icon, loafing on a book in empty states. Drawn icons (Lucide), never emoji. Onest throughout, stepped scale, tabular figures. 6px corners. No gradient fills; the only fade is the reading scrim over a place photo.

STORY: The visitor sees the city's sky over the map, scans place photographs with live busyness on them, opens one, decides, goes.

FIRST VIEWPORT: Sky band across the top (manul and name, search, filters in white); a light map as the ground; a column of full-photo place cards (left on desktop, below on phone), each with the busyness badge on the photo and name, status, rating and facts in white on a dark fade; primary action "add place" as a white button on the sky.

FORM: Grounded candidate 6 of 7 (High Blue Sky), seed key f9abce48; redirected by the user to a dark theme with a manul mascot and full-photo cards.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
