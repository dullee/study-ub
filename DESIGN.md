---
name: StudySpots UB
description: "Ulaanbaatar under its night sky: a dark map of places to study, full-photo place cards, live busyness as the loudest fact, and a manul for company."
colors:
  azure: "#1466c2"
  azure-deep: "#0f4f98"
  azure-soft: "#14335a"
  link: "#8cc2ff"
  pin: "#1f7ae0"
  chart-bar: "#3d8ef0"
  night: "#050c16"
  sky-day: "#16508f"
  sky-dawn: "#1b3a63"
  sky-dusk: "#1b2f57"
  sky-night: "#0c1a2e"
  sky-edge-dawn: "#ffb27a"
  sun: "#ff8a2a"
  sun-deep: "#ffb070"
  sun-soft: "#3a2412"
  chart-now: "#e86a10"
  ok: "#14804a"
  ok-soft: "#0f2e20"
  good: "#5fd79a"
  alert: "#c8261b"
  alert-soft: "#3a1614"
  danger: "#ff8f85"
  busy-1-empty: "#047857"
  busy-2-quiet: "#a3e635"
  busy-3-moderate: "#fbbf24"
  busy-4-busy: "#c2410c"
  busy-5-full: "#be123c"
  busy-dot-1: "#10b981"
  busy-dot-2: "#84cc16"
  busy-dot-3: "#f59e0b"
  busy-dot-4: "#f97316"
  busy-dot-5: "#f43f5e"
  star-gold: "#e89a00"
  dim: "#3a587f"
  manul-fur: "#b9ad9c"
  manul-fur-dark: "#7e6f5f"
  manul-cream: "#efe7da"
  manul-mark: "#4a3f36"
  manul-eye: "#e9d75a"
  ground: "#0a1626"
  sheet: "#102038"
  panel: "#172c48"
  line: "#233d5e"
  line-strong: "#4f6f99"
  ink: "#eef3f9"
  ink-muted: "#a9b9cd"
  ink-faint: "#8496ae"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "normal"
  body:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  button:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: "normal"
  label:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "normal"
  data:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "normal"
    fontFeature: "tnum"
  micro:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: "normal"
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  3xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.azure}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.azure-deep}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  button-quiet:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-quiet-hover:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
  button-approve:
    backgroundColor: "{colors.ok}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-reject:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-on-sky:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-on-sky-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.azure-deep}"
  button-on-sky-primary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.azure-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-on-sky-primary-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.azure-deep}"
  search-on-sky:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px 0 40px"
    height: "40px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px"
  chip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  chip-hover:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
  chip-selected:
    backgroundColor: "{colors.azure}"
    textColor: "{colors.white}"
  tag:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  tag-category:
    backgroundColor: "{colors.azure-soft}"
    textColor: "{colors.link}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  count-pill:
    backgroundColor: "{colors.sun}"
    textColor: "{colors.night}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: "0 6px"
  busyness-badge-empty:
    backgroundColor: "{colors.busy-1-empty}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  busyness-badge-quiet:
    backgroundColor: "{colors.busy-2-quiet}"
    textColor: "{colors.night}"
  busyness-badge-moderate:
    backgroundColor: "{colors.busy-3-moderate}"
    textColor: "{colors.night}"
  busyness-badge-busy:
    backgroundColor: "{colors.busy-4-busy}"
    textColor: "{colors.white}"
  busyness-badge-full:
    backgroundColor: "{colors.busy-5-full}"
    textColor: "{colors.white}"
  busyness-badge-unknown:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  place-card:
    backgroundColor: "{colors.night}"
    textColor: "{colors.white}"
    typography: "{typography.title}"
    padding: "12px"
    height: "256px"
  photo-icon-button:
    backgroundColor: "{colors.night}"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
    size: "36px"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  inset-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  dropdown-panel:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
    width: "22rem"
  dialog:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    size: "36px"
  icon-button-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
---

# Design System: StudySpots UB

## Overview

**Creative North Star: "High Blue Sky, after dark"**

The app is Ulaanbaatar under its own sky at night. The page is always dark: a deep navy ground with slightly lighter sheets on it, and place photographs as the brightest things in view. One committed sky band runs across the top of every screen and holds the name, the navigation, search and filters in white. The band is tied to the real city: its colour follows Ulaanbaatar's actual sunrise and sunset (dawn, day, dusk, night), a thin warm edge appears at dawn and dusk, and every shadow in the interface leans the way the sun casts it at that minute.

A manul (Pallas's cat, the round, permanently unimpressed wild cat of the Mongolian steppe) is the mascot. Its head sits beside the wordmark and is the app icon; the whole cat, loafing on an open book, appears wherever there is nothing to show. It is the one piece of illustration in the product and the source of its character; everything else stays plain.

This is an Operate surface for someone deciding where to go. A place is a photograph: the picture fills the whole card, the name, open or closed word, rating and facts sit on a dark fade at the bottom, and the live busyness badge sits on the picture's top-left corner. Colour is restrained on the ground so that state can be loud: blue means "you can act or you chose this", orange means "now, live, waiting for you", and the five-step busyness scale is information, never decoration.

The system replaced a slate interface with purple and indigo gradients, emoji icons and glassy blur. It is dark again by choice, but it is not that look: surfaces are flat navy with no gradient fills, icons are drawn, and the only fade in the product is the reading scrim over a photograph.

**Key Characteristics:**
- Always dark: navy ground, navy sheets one step lighter, light ink; one committed sky band on top that changes with real Ulaanbaatar time.
- Places are full-photo cards with a bottom reading fade; busyness sits on the photo.
- A manul mascot: head in the wordmark and icon, loafing on a book in empty states.
- Short shadows whose horizontal offset follows the sun, each with a faint light ring so edges hold on dark; one shadow depth per layer.
- Onest for everything, Cyrillic first; a stepped scale from 10px to 28px; tabular figures wherever numbers line up or tick.
- Square-shouldered 6px corners, 4px for small things inside them; drawn Lucide icons; state always carries a word or a shape as well as a colour.

## Colors

Deep navy neutrals, one saturated blue for fills and a light blue for text, a sun orange held back for what is live, and a state palette that is allowed to be the loudest thing on the ground. Fill colours and text colours are separate tokens: a fill dark enough for white text is too dark to read as text on navy.

### Primary
- **Action Azure** (`azure`): every primary action: filled buttons, selected chips, the checkbox accent. White on it reads 5.7:1. Hover is **Deep Azure** (`azure-deep`), which is also the text colour on the white buttons of the band.
- **Sky Link** (`link`): blue as text or line on dark: links, the focus ring, the caret, selected menu rows, category tags, outlined actions. 9:1 on a sheet.
- **Azure Wash** (`azure-soft`): the tint behind a selected menu row and a category tag.
- **Day Sky** (`sky-day`), **Dawn Sky** (`sky-dawn`), **Dusk Sky** (`sky-dusk`), **Night Sky** (`sky-night`): the band's colour by phase. At dawn its bottom edge is a 3px line of **Dawn Edge** (`sky-edge-dawn`), at dusk Sun, at night Hairline.
- **Map Azure** (`pin`) and **Chart Azure** (`chart-bar`): brighter blues used only as graphic fills, for map pins and chart bars, where Action Azure would sink into the dark.
- **Night** (`night`): the deepest tone: the reading fade on place photos, the dialog scrim at 55%, the round buttons on photos at 70%, and the text colour on Sun, lime and amber fills.

### Secondary
- **Sun** (`sun`): the live and the pending. Count pills, the dusk edge of the band, the highlighted map pin, the user's own location dot, text selection, the focus ring of the search field on the band. Text on Sun is always Night.
- **Sun Text** (`sun-deep`): orange as text or icon on dark: the "popular" flame, the "now" label on the busyness chart, "please check" cautions. **Chart Now** (`chart-now`) is the current-hour bar.
- **Sun Wash** (`sun-soft`): the tint behind pending and caution banners.

### Tertiary
- **Open Green** (`ok`) and **Closed Red** (`alert`) are fills with white text (approve and reject buttons, icon discs), each with a wash (`ok-soft`, `alert-soft`). As text on dark they become **Good** (`good`) and **Danger** (`danger`): the open and closed words, success and error helper text.
- **Busyness scale**, five filled badge colours from Empty to No seats (`busy-1-empty` … `busy-5-full`). Levels 1, 4 and 5 are dark fills with white text; levels 2 and 3 are bright fills with Night text.
- **Busyness dots** (`busy-dot-1` … `busy-dot-5`): the brighter step of each badge hue, used only as the filled dot inside a map pin, ringed in white.
- **Star Gold** (`star-gold`): filled rating stars; unfilled stars are **Dim** (`dim`), which is also the dimmed map pin. The numeric rating always sits beside the stars.
- **Manul** (`manul-fur`, `manul-fur-dark`, `manul-cream`, `manul-mark`, `manul-eye`): the mascot's own warm greys and its yellow eyes. They belong to the cat and are used nowhere else.

### Neutral
- **Night Ground** (`ground`): the page under the band, and the gap between place cards.
- **Navy Sheet** (`sheet`): dialogs, menus, inputs, the search field, list containers.
- **Navy Panel** (`panel`): the second layer inside a sheet: fact tiles, static tags, unselected chips, image placeholders, skeletons.
- **Hairline** (`line`): dividers, panel borders, chart gridlines. **Strong Line** (`line-strong`): input borders, the chart baseline, scrollbars.
- **Ink** (`ink`): all primary text, 14.6:1 on a sheet. **Muted Ink** (`ink-muted`): secondary text, 8.2:1. **Faint Ink** (`ink-faint`): placeholders and icons inside fields, 5.4:1.
- **White** is reserved for the band (text and the white buttons) and for text on photographs.

### Named Rules
**The One Sky Rule.** There is exactly one committed colour field per screen, the band at the top, and it is the only place white-on-colour controls live. Nothing below the band is filled edge to edge with blue.

**The Fill Is Not Text Rule.** `azure`, `ok` and `alert` are fills that carry white text. Blue, green and red text on dark use `link`, `good` and `danger`. Orange text is `sun-deep`.

**The Sun Means Now Rule.** Sun marks what is live or waiting: the current hour, a pending count, the dusk edge, the pin you are pointing at, where you are standing. Selection and ordinary actions are Action Azure. Text on Sun is Night.

**The State Speaks Twice Rule.** A busyness badge is always the five-bar meter plus the level's word on its fill; open and closed are always words. The map-pin dot is an echo of the badge, and the popup names the level.

## Typography

**Display Font:** Onest (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Onest (same family)
**Label/Mono Font:** none; data uses Onest with tabular figures

**Character:** One family drawn with Cyrillic from the start carries headings, buttons and data alike, so Mongolian and English set with the same colour and rhythm. Hierarchy comes from stepped size and from three working weights (500, 600, 700) over a 400 body; semibold is the voice of the interface.

### Hierarchy
- **Display** (700, 28px from 640px and 24px below it, line-height 1.25, tracking -0.02em): the place name at the top of a detail dialog. The largest text in the product.
- **Headline** (700, 22px from 640px and 15px below it, line-height 1, tracking -0.02em): the "StudySpots UB" wordmark on the band beside the manul's head, "UB" at weight 500 and 75% white and hidden below 640px. Below 380px the wordmark is visually hidden and the manul stands alone.
- **Title** (700, 18px, line-height 1.375, tracking -0.01em): the place name on a photo card, white, clamped to two lines. Dialog titles use 16px at 700.
- **Body** (400, 14px, line-height 1.43): helper copy, dialog messages, menu rows. Place descriptions run at 15px with relaxed leading and a 65ch measure.
- **Button** (600, 14px): actions inside dialogs and panels.
- **Label** (600, 12px; 500 for chips and helper lines): band buttons, chips, section labels, status lines, form labels. Sentence case; no uppercase or letter-spacing.
- **Data** (400, 11px, tabular figures): the Wi-Fi / quiet / outlets strip on a card, fact-tile labels and notes, removable filter chips.
- **Micro** (700, 10px, tabular figures): count pills; at weight 400 to 600, chart axis labels and chart annotations.

### Named Rules
**The One Family Rule.** Onest sets everything, including third-party surfaces that accept a font (the map, toasts, the sign-in modal). No second face, no monospace for numbers.

**The Tabular Figures Rule.** Every number that ticks or lines up uses tabular figures: opening hours, distances, Mbps, ratings and counts, chart axes and the chart's table.

## Layout

A 1280px container with a 16px side gutter at every width. The band is two stacked strips of the same colour: the header (manul and wordmark on the left, band buttons on the right, then the Places / Events tabs) and, on the home page, a filter strip (search field plus Sort, Filters and Location menus, then any active filters as removable chips).

From 1024px the home page is two columns, `minmax(340px, 400px)` for the place cards on the left and the remaining width for the map on the right, with a 20px gap. The header and filter strip are both sticky, and the map is sticky beneath them at full remaining viewport height, so the cards scroll past a fixed map. Below 1024px it is one column: the header scrolls away, the filter strip sticks to the top, the map sticks under it at 34dvh (200px to 320px), and the cards scroll beneath; the card nearest the middle of the visible list is highlighted on the map.

Place cards are at least 256px tall and stack with no gap; a 1px Night Ground line separates one photograph from the next.

Rhythm is tight inside a group and wider between groups: 4px to 6px between an icon and its label, 6px between the lines of a card, 8px between chips, 12px card padding, 16px inside panels and menus, 20px to 24px inside dialogs and between dialog sections. Controls are 36px tall on the header, 40px in the filter strip. Below 640px, band buttons collapse to 36px icon squares with their name in `aria-label`, and form fields are forced to 16px text so iOS does not zoom.

Dialogs are full-screen sheets on phones (100dvh, no radius, sticky top bar) and centred sheets from 640px (max width 896px for place detail, 512px for forms, 384px for confirmations). Long Mongolian labels wrap; a status hint that does not fit moves to the next line whole rather than truncating the closing time.

### Named Rules
**The Sky Above, Ground Below Rule.** Wayfinding (name, tabs, search, sort, filter, location, add) lives in the band in white. Content lives below on ground and sheets in ink. A control does not change sides.

## Elevation & Depth

A hybrid. Between the ground and what lies on it, depth is a cast shadow plus a 1px ring of white at 5% to 8%, because a shadow alone disappears on a dark ground. Inside a sheet, depth is tonal (a Navy Panel fill and a Hairline border, no shadow). There are three shadow depths, one per layer.

The horizontal offset of every shadow is the `--sun-x` variable, set from the real time in Ulaanbaatar: about -4px shortly after sunrise (shadow falls west), 0 at solar noon, about +4px before sunset, and 0 at night. Higher layers multiply it (×1.5, ×2.5).

### Shadow Vocabulary
- **Sheet** (`box-shadow: var(--sun-x) 2px 4px -1px rgb(0 0 0 / 0.45), 0 0 0 1px rgb(255 255 255 / 0.05)`): anything lying on the ground or on the band: the card column, the map frame, map controls, the search field, the white band button.
- **Lift** (`box-shadow: calc(var(--sun-x) * 1.5) 8px 16px -6px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.07)`): things that float over the page for a moment: dropdown menus, map popups, toasts, the chart tooltip.
- **Dialog** (`box-shadow: calc(var(--sun-x) * 2.5) 22px 44px -14px rgb(0 0 0 / 0.75), 0 0 0 1px rgb(255 255 255 / 0.08)`): modal sheets, over a Night scrim at 55%.
- **Pin** (`filter: drop-shadow(var(--sun-x) 2px 1.5px rgba(5, 12, 22, 0.45))`): map pins.
- **Sky edge** (`box-shadow: inset 0 -3px 0 var(--sky-edge)`): the line along the bottom of the band at dawn, dusk and night. It is an edge, not a depth; when the filter strip joins the header only the lower strip draws it.

### Named Rules
**The Sun-Cast Rule.** No shadow hard-codes its horizontal offset. It comes from `--sun-x`, so the whole interface leans one way at once and stands straight at noon and at night.

**The One Depth Per Layer Rule.** Sheet, Lift, Dialog: a surface takes the shadow of its layer and no other. Regions inside a sheet are separated by Navy Panel and Hairline, not by another shadow.

## Shapes

Square-shouldered. Containers and controls (sheets, dialogs, menus, buttons, chips, inputs, panels, the map frame, map controls) take a 6px radius. Small things inside them (busyness badges, static tags, thumbnails, removable filter chips, map tooltips) take 4px. Full circles are reserved for round-by-nature marks: count pills, the heart and Google Maps buttons on a photo, icon-only buttons in a dialog's top bar, the icon disc in a confirmation, the spinner, map pins. Full-screen phone dialogs have no radius.

Lines are 1px Hairline; the active tab on the band is a 3px white underline; "no data yet" is a 1px dashed outline in place of a fill. Map pins are circles with a 2.5px white ring rather than Leaflet's teardrop: 26px Map Azure normally, 36px Sun when highlighted, 20px Dim when outside the chosen distance.

Icons are Lucide, drawn at 12, 14, 16 or 20px, stroke 2 by default, 1.75 for category and amenity icons beside a label, 2.25 to 2.5 for small action glyphs (plus, close, chevron, check). Decorative icons are `aria-hidden` and the adjacent text carries the meaning.

The manul is built from a few flat shapes: a head wider than tall, low round ears set on the sides, two dark cheek stripes each side, forehead spots, yellow eyes with round pupils under flat, inward-sloping lids. It has two moods: grumpy (eyes open, the default) and sleepy (eyes closed, for empty and idle states).

## Components

Tactile and plain: flat fills and colour-only hover. Keyboard focus is a 2px Sky Link outline offset by 2px by default (white on the band); text fields replace it with a border or ring change of their own.

### Buttons
- **Shape:** gently squared (6px), semibold label, icon 16px to the left with a 6px gap.
- **Primary:** Action Azure fill, white text, 10px by 16px padding in dialogs (8px by 14px in panels); hover Deep Azure. One per group.
- **Secondary:** Navy Sheet fill, Ink text, 1px Hairline border; hover Navy Panel.
- **Quiet:** Navy Panel fill, Ink text, no border (cancel, neutral admin actions); hover Hairline.
- **Approve / Reject:** Open Green or Closed Red fill with white text, hover at 90% opacity; destructive-but-secondary is an outline with Danger text and a Red Wash hover.
- **On the band:** 36px tall, 12px semibold. Default is a 1px white border at 35% with white text, hover white at 15%. The current page inverts to a white fill with Deep Azure text. The one primary action ("add place") is always a white fill with Deep Azure text and the Sheet shadow; hover white at 90%.
- **Icon button:** 36px square, 6px radius, Muted Ink icon, hover Navy Panel and Ink. In a dialog's top bar the same button is a 36px circle. On a photograph it is a 36px circle of Night at 70% with a white icon, hover solid Night.
- **Disabled:** 40% to 60% opacity, `not-allowed` cursor; never a colour change alone.

### Chips
- **Filter chip (in a menu):** Navy Panel fill, Ink text, 12px medium, 6px by 12px padding, 6px radius, optional 14px icon. Selected is an Action Azure fill with white text and `aria-pressed`.
- **Active filter (on the band):** white at 15% with a 1px white border at 30%, 11px medium white text, 4px radius, a trailing 12px close glyph; the whole chip removes the filter.
- **Static tag:** Navy Panel fill, 12px Ink text, 4px radius, 14px Muted Ink icon. The category tag uses Azure Wash with Sky Link semibold text.
- **Count pill:** Sun fill, Night bold 10px tabular, full radius, minimum 20px wide.

### Cards / Containers
- **Place card:** the photograph fills the whole card (object-fit cover, at least 256px tall) and zooms 3% on hover. A fade from solid Night at the bottom to almost clear at the top sits over it. Top-left: the busyness badge. Top-right: round heart and Google Maps buttons. Bottom, in white: the name (18px bold, two lines at most), the category icon with the open or closed word and its hint (wrapping, never truncated) and the distance, then stars with the numeric rating, the "popular" flame and the data strip at 80% white. The whole card is the click target; keyboard focus draws a 2px inset Sky Link ring. Cards stack with no gap inside one 6px-radius column with the Sheet shadow.
- **Inset panel:** Navy Panel fill, 1px Hairline border, 6px radius, 16px padding (the busyness panel, form field groups). Fact tiles are the same without a border, 12px by 16px padding, in a 2 or 3 column grid.
- **Dropdown panel:** Navy Sheet, Lift shadow, 16px padding, 22rem wide from 640px and inset 16px from both edges on phones, at most 70dvh tall.
- **Dialog:** Navy Sheet, Dialog shadow, 1px Hairline border, sticky top bar with a Hairline underneath; scrim is Night at 55%. The place detail opens with the photograph as a full-width band under the top bar.
- **Empty and loading:** an empty list is the manul loafing on its book (sleepy), one Muted Ink sentence, and one action (clear filters, create an event). Small empties in the admin panel use the sleepy head alone. Loading is Navy Panel blocks pulsing in the card's shape.

### Inputs / Fields
- **Style:** Navy Sheet fill, 1px Strong Line border, 6px radius, 10px padding, label above in Muted Ink; placeholder in Faint Ink.
- **Focus:** the border turns Sky Link. The search field on the band has no border, carries the Sheet shadow, is 40px tall with a 20px search icon inset at the left, and focuses with a 2px Sun ring.
- **Error / Status:** after interaction an invalid field's border turns red; helper text below is Danger for errors, Good for success, Muted Ink for hints, Sun Text for "please check".
- **File picker:** a bordered row holding an Action Azure button with an upload icon and the file name, wrapping a visually hidden native input so the label is in the site's language.

### Navigation
- **Band tabs:** 14px semibold with a 16px icon, 3px bottom border; active is white text and a white underline with `aria-current`.
- **Band menus (Sort, Filters, Location):** band buttons at 40px with a chevron that rotates when open; a button turns white with Deep Azure text while its menu is open or its filter is active. A selected menu row is Azure Wash with Sky Link semibold text and a leading check.
- **Phone:** labels collapse to icons.

### Sky Band
The signature. `data-sky` on the root element is `dawn`, `day`, `dusk` or `night`, computed from an approximate Ulaanbaatar sunrise and sunset for the date (solar noon near 13:00 local) and applied by an inline script before first paint, then every minute. By day the band is the one bright field over the dark page; at night it sinks almost to the ground colour and is held by a Hairline edge. Its colour and edge ease over 1.2s with `cubic-bezier(0.16, 1, 0.3, 1)`; with reduced motion the change is instant.

### Mascot
`components/Manul.tsx`, an inline SVG with no raster assets. `variant="head"` (64 by 56) beside the wordmark at 28 by 32px (20 by 24px on phones), in the app icon on a Night Sky rounded square, and at about 40px for small empty states. `variant="loaf"` (120 by 104) for page-level empty states at about 112px: the cat as a loaf with a ringed tail, paws on an open book. `mood="sleepy"` closes the eyes. It is decorative (`aria-hidden`) unless it is the only content, when it takes a `title`.

### Busyness Badge
The loudest element on a card after the name. A filled 4px-radius badge in the level's colour holding a five-bar meter (bars 4px wide stepping from 20% to 100% of 14px, unlit bars at 30%) and the level's word in 12px bold. With no recent reports the badge is a dashed outline with an empty meter and "no data", so the slot never disappears; on a photograph that empty badge takes a Night 70% fill, white text at 85% and a white 40% dashed border. In the detail panel the same badge is one step larger (14px semibold, 6px radius) beside the count and age of the reports.

### Map
The one light surface below the band (user decision): OpenStreetMap's light tiles, cooled and slightly dimmed with a filter on the tile pane only (`saturate(0.7) brightness(0.96) hue-rotate(-8deg)`) so they do not glare on the dark page and pins read first. The map sits in a 6px-radius frame with the Sheet shadow; zoom and fullscreen controls are Navy Sheet; popups are Navy Sheet with Lift; tooltips are Ink with Night text. The user's location is a Sun dot with a 3px white ring; the distance radius is a 2px dashed Action Azure circle with a 7% fill.

### Usual-Busyness Chart
One series, so one colour: Chart Azure bars with a 4px top radius on a Hairline grid at levels 1, 3 and 5 and a Strong Line baseline; the current hour is Chart Now and labelled "now" in Sun Text. Both bar colours were checked against the Navy Panel behind them. Hover or focus brightens a bar and shows a tooltip. A text table of the same data is always available below.

## Do's and Don'ts

### Do:
- **Do** keep the page dark everywhere (`color-scheme: dark`), including the surfaces others draw: the sign-in modal, toasts, native selects, and the map's controls and popups (its tiles stay light).
- **Do** keep the band as the only committed colour field, and let `data-sky` choose its colour (`#16508f` day, `#1b3a63` dawn, `#1b2f57` dusk, `#0c1a2e` night); never set the band colour by hand.
- **Do** take every shadow from the three layer tokens (Sheet, Lift, Dialog) so its offset follows `--sun-x` and its light ring comes with it.
- **Do** use `link`, `good`, `danger` and `sun-deep` for coloured text, and keep `azure`, `ok` and `alert` for fills under white text.
- **Do** let the photograph fill a place card, with the busyness badge on it and white text on the Night fade.
- **Do** use Night text on Sun, lime and amber fills, and white text on Action Azure, Open Green and Closed Red.
- **Do** use the manul for the wordmark, the icon and empty states, in its own colours, grumpy by default and sleepy when there is nothing to show.
- **Do** use tabular figures for times, distances, speeds, ratings and counts.
- **Do** let Mongolian labels wrap to a second line; collapse band buttons to icons with an `aria-label` below 640px.

### Don't:
- **Don't** bring back the look this system replaced: purple or indigo gradients, emoji as icons, glassy backdrop blur, glowing borders.
- **Don't** use a gradient as a surface fill. The only fade is the reading scrim over a photograph.
- **Don't** add a light mode or light sheets; white belongs to the band and to text on photographs, and the map tiles are the only light surface.
- **Don't** set `azure`, `ok` or `alert` as text on dark surfaces (under 3:1), and don't set white text on Sun.
- **Don't** put more than the badge and two round buttons on the open part of a photograph; everything else sits on the fade.
- **Don't** recolour, restyle or animate the manul, give it speech bubbles, or scatter it as decoration beside content that is already there.
- **Don't** use a busyness colour, Open Green or Closed Red as ornament, and don't show state by colour without its word or meter.
- **Don't** use an offset block shadow for depth or give a panel inside a sheet a shadow of its own.
- **Don't** introduce a second typeface, uppercase tracked labels, or container and control radii other than 4px, 6px and full.
- **Don't** recolour third-party marks (Google Maps pin, language flags, chat-platform colours) into the palette, and don't borrow their colours for anything else.
