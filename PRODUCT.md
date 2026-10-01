# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone in Ulaanbaatar looking for a place to sit down and study or work: university and school students, people preparing for exams, freelancers and remote workers. Most visits happen on a phone, often while already out in the city and deciding where to go next.

## Product Purpose

StudySpots UB is a guide to places in Ulaanbaatar where you can study or work: libraries, cafés, coworking spaces, university reading rooms. It helps people find a suitable place, see what it is like (Wi-Fi speed, quietness, power outlets, opening hours, how busy it is right now and usually), share what they know, and meet others through study events. Success is someone leaving the site knowing where to go and finding it as described.

Discovering places, live busyness, reviews and study events matter about equally; none is the single main job.

## Positioning

Crowdsourced, study-specific knowledge about Ulaanbaatar that general map apps do not have: live "I'm here" busyness reports (verified by location), Wi-Fi/quiet/outlet scores from people who studied there, a "usually busy at" pattern built from local check-ins (Google's busyness data is sparse in UB), and study events hosted at these places.

## Operating Context

- Mostly mobile, often outdoors or in transit, sometimes on slow mobile data; desktop use for browsing, adding places and administration.
- A map plus a list of place cards is the main surface; place detail, reviews, check-ins, events, saved places and a paid-parking finder (`/parking`) hang off it.
- Signed-in users (Clerk) review, check in, host and join events; anyone can browse, add places for review and save favourites in the browser.
- Admins moderate submitted places, events, reviews and "wrong info" reports. A sign-in-free admin demo (`/admin/demo`) exists for presentations.
- Built and maintained by a small student team; presented and judged as a team project now, and intended to keep running for real users afterwards.

## Capabilities and Constraints

- Next.js (App Router), React, Tailwind CSS v4, Leaflet + OpenStreetMap tiles, Supabase (data, realtime), Clerk (auth), Cloudinary (uploads), deployed on Vercel.
- Bilingual: Mongolian is the default and primary language, English is fully supported. Text runs long in Mongolian (Cyrillic); layouts must tolerate it.
- Place photos come from user uploads and arbitrary links, so imagery quality varies widely.
- Busyness levels (Empty → No seats) and open/closed status are meaningful state, not decoration.

## Brand Commitments

- Name: "StudySpots UB".
- Mongolian-first, bilingual voice: plain, friendly, practical.
- Dark theme throughout: simple, but with character. The earlier purple/indigo gradient look is rejected and must not return.
- Mascot: a manul (Pallas's cat), the wild cat of the Mongolian steppe. It is the logo mark beside the name, the app icon, and the figure in empty states (`components/Manul.tsx`).
- Places are shown photo-first: the place photo fills the whole card.

## Evidence on Hand

- Real places with coordinates, hours and descriptions: `data/initialSpots.ts` (18 places) and the live Supabase database (21 approved).
- Real paid-parking locations from Easy Parking's public list: `data/paidParking.ts`.
- Real user reviews, check-ins and events exist in Supabase; the busyness history currently includes mock seed data (`supabase/seed/mock_busyness.sql`) for testing.
- No testimonials, user counts, press or partnerships exist; do not invent them.

## Product Principles

1. Answer "where should I go right now?" fast, especially on a phone outside.
2. Trust comes from people who were actually there; show where information comes from and how fresh it is.
3. Equal footing for discovering, judging and joining: places, reviews and events all stay one tap away.
4. Mongolian first, never broken in English.
5. Works for a live demo and for daily real use alike; nothing demo-only leaks into real data.

## Accessibility & Inclusion

Readable on a phone, outdoors included, on the dark theme (strong contrast, large tap targets); state such as busyness and open/closed never conveyed by colour alone; full Cyrillic support.
