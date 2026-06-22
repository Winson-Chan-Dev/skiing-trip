# Skiing Trip Planning — 🦊 Ski Babies 2027 🦊

## Project Overview
Trip planning workspace for a group skiing trip to Japan (Nozawa Onsen / Shiga Kogen), Jan 22–31, 2027.
Departing from Hong Kong. 8 people: Chan Kit (CK), Chong (SY), Chan Leung (CL), Toby, Oli, Sonija, Rachel (Rac), Tony.

## Master Data
- **Planning spreadsheet**: `🦊 Ski babies 2027 🦊.xlsx`
- Read with: `node scripts/read-excel.js read "Sheet Name"`
- List sheets: `node scripts/read-excel.js list`

## Folder Structure
```
skiing-trip/
├── 🦊 Ski babies 2027 🦊.xlsx   ← master planning spreadsheet
├── CLAUDE.md                      ← this file
├── .env                           ← Google Maps API key
├── data/
│   ├── places.json                ← 28 locations (coords, descriptions, gmapSearch)
│   ├── itinerary.json             ← 6-day plan (Day 2–7, stops reference placeId)
│   ├── config.json                ← trip metadata, map center, categories, day trips
│   └── content/                   ← HTML/CSS/JS fragments for non-map tabs
│       ├── hotels.html            ← hotel comparison cards & ranking table
│       ├── dining.html            ← restaurant recommendations
│       ├── sightseeing.html       ← SVG village map, day plans, activities
│       ├── booking.html           ← countdown, timeline, booking strategy
│       ├── hotel-styles.css       ← content-specific styles (dark mountain theme)
│       └── hotel-scripts.js       ← sorting, countdown, SVG map layer toggles
├── presentation/
│   └── nozawa-trip.html           ← GENERATED: unified 6-tab page
├── scripts/
│   ├── build-map.js               ← builds presentation/ from data/ + content/
│   ├── read-excel.js              ← Excel R/W utility
│   └── format-table.js            ← terminal table formatter
├── research/                      ← hotel/flight/transport research
├── budget/                        ← cost breakdowns, per-person splits
├── templates/                     ← reusable research/comparison templates
└── .claude/commands/
    └── build-map.md               ← skill: regenerate HTML from data
```

## Key Decisions (from Excel)
- **Plan A**: Nozawa (3 nights) → Shiga Kogen (3 nights) → Tokyo
- **Plan B**: Nozawa only (5 nights) → Tokyo (1 night)
- Preferred area: near Nagasaka Gondola or Shinda area
- Flight: HK Express (UO) various departure times Jan 23, return Jan 30-31

---

## Map & Presentation System

### Background
The group needs a visual trip planning page to share on WhatsApp/Line. Everything lives in one unified page with 6 tabs.

### Architecture: Data-Driven
Location data + content fragments are stored in `data/`. The build script reads these + `.env` and generates a single self-contained HTML file.

```
data/places.json + itinerary.json + config.json + content/* + .env
        ↓  node scripts/build-map.js
presentation/nozawa-trip.html  (unified 6-tab page)
```

### Unified Page Tabs
1. **🗺️ 地圖** — Full Google Maps with category toggles, sidebar (places/itinerary/info)
2. **📅 行程** — Day-by-day itinerary with timeline stops + Google Maps links
3. **🏨 住宿** — Hotel comparison (ranking table, analysis cards)
4. **🍜 餐飲** — Restaurant recommendations by category
5. **🗻 觀光** — SVG village map with toggle layers, day trip options, activities
6. **📋 預訂** — Booking countdown, timeline, strategy cards

### Location Accuracy
- **Village center**: lat 36.9225, lng 138.4485
- **Reference point**: Schanze Nozawa @ 36.9197849, 138.4498459 (user-verified from Google Maps)
- **Coordinate source**: Google Places API `textsearch` with romanized/English queries
- **5 estimated locations** (no exact API match): Sanzoku, Den, Faust, Nagai Pan, Kanetsu — placed relative to known landmarks; marked `verified: false` in places.json
- **Tanakaya Brewery** is in Iiyama (~8km from village), coordinates are real

### Design: Nothing Phone UI (Industrial Minimal)

**Style Reference**: Nothing OS design language — flat, industrial, monospace, geometric.

**Foundation**:
- Background: pure `#000000` black
- Font: `'Space Mono', 'Courier New', 'Microsoft JhengHei', monospace` (Google Fonts import)
- Border radius: `0px` everywhere (sharp geometric edges)
- No shadows, no blur, no gradients — flat surfaces with border separation

**Color System** (CSS variables in `:root`):
- `--nothing-black: #000000` — page background
- `--nothing-dark: #0A0A0A` — elevated surfaces
- `--nothing-card: #141414` — card backgrounds
- `--nothing-border: #2A2A2A` — primary borders
- `--nothing-border-light: #3A3A3A` — hover/active borders
- `--nothing-red: #D71921` — primary accent (Nothing brand red)
- `--nothing-red-dim: rgba(215,25,33,0.15)` — red tinted backgrounds
- `--nothing-white: #FFFFFF` — primary text
- `--nothing-gray1: #E0E0E0` — secondary text
- `--nothing-gray2: #999999` — tertiary text
- `--nothing-gray3: #666666` — muted text
- `--nothing-gray4: #444444` — disabled/subtle text
- Semantic: `--nothing-green: #33CC66`, `--nothing-yellow: #FFCC00`, `--nothing-blue: #4DA6FF`

**Components**:
- Top nav: flat boxes with `border: 1px solid` separation, active = red background + white text
- Cards: `background: var(--nothing-card)`, `border: 1px solid var(--nothing-border)`, no radius
- Tags/badges: uppercase, `letter-spacing: 1px`, no radius, tinted transparent backgrounds
- Segmented control: connected border boxes, active = white fill + black text
- Filter chips: uppercase, sharp edges, red active outline
- Tables: flat dark rows, border-separated, uppercase sticky headers
- Hero: red dot `::before` decoration, uppercase h1, `"(  )"` glyph `::after`

**Layout**:
- Map tab: full-viewport Google Map + flat dark sidebar (380px right, hard left border)
- Content tabs: max-width `1400px` centered, card grid with `gap: 16px`
- Mobile (<768px): bottom sheet with flat handle line, single-column stacked

**Interactions**:
- Hover: `border-color` lightens to `--nothing-border-light`, subtle `background` shift
- Transitions: `0.15s` — fast, mechanical feel
- Active states: red accent or white fill inversion
- No transforms, no scale, no elevation changes

**Typography Rules**:
- All headings/labels: `text-transform: uppercase`, `letter-spacing: 1-2px`
- Body text: `0.78rem`, line-height `1.6`
- Monospace throughout — no serif or sans-serif fallback except for Chinese chars

### UI Language
Traditional Chinese (Hong Kong audience).

---

## Commands
```bash
# Map build
npm run build                         # regenerate presentation/ HTML
npm run dev                           # live-server on presentation/ (port 8080)
node scripts/build-map.js             # direct build

# Excel
node scripts/read-excel.js list       # list all sheets
node scripts/read-excel.js read "Hotel"  # read a specific sheet
```

## Deployment: Vercel

### Setup
- **Platform**: Vercel (connected via GitHub)
- **GitHub account**: winsonclfa@hotmail.com
- **Repo**: Push this project to GitHub, deploy via Vercel for sharing with friends
- **Output**: Static site from `presentation/` folder

### Deployment Steps
1. Initialize git repo locally
2. Configure git user (winsonclfa@hotmail.com)
3. Create GitHub repo and push
4. Connect to Vercel for auto-deploy
5. Share Vercel URL with friends

---

## Hotel Tab — UI Style Demo

The **🏨 住宿** (Hotel) tab is used to demo 3 different frontend UI styles. Each style variant renders the same hotel comparison data with a completely different visual identity.

### Style Variants

#### 1. Apple UI (Clean Minimalism)
- **Aesthetic**: SF Pro typography, generous whitespace, frosted glass, soft shadows
- **Colors**: Light mode — white/gray backgrounds, subtle blue accents
- **Components**: Rounded cards (12-16px radius), vibrancy/blur effects, smooth spring animations
- **Typography**: SF Pro Display / -apple-system, thin-to-medium weights, large titles
- **Interactions**: Gentle hover lifts, smooth transitions (0.3-0.5s ease)

#### 2. Nothing Phone UI (Industrial Minimal) — CURRENT DEFAULT
- **Aesthetic**: Flat, industrial, monospace, geometric (as documented in Design section above)
- **Colors**: Pure black `#000`, sharp borders, Nothing brand red accent
- **Components**: Zero radius, no shadows, border-separated flat surfaces
- **Typography**: Space Mono / monospace, uppercase headings, letter-spacing
- **Interactions**: Fast 0.15s mechanical transitions, border-color shifts

#### 3. Muji Format (Japanese Minimalism)
- **Aesthetic**: Natural, understated, warm — inspired by MUJI's "no-brand" philosophy
- **Colors**: Warm neutrals — off-white `#F5F2EB`, kraft paper tan `#D4C5A9`, charcoal text `#333`
- **Components**: Minimal borders, generous padding, subtle 2-4px radius, thin hairline dividers
- **Typography**: Clean sans-serif (Noto Sans JP / system), regular weight, natural hierarchy through size only
- **Interactions**: Barely-there hover states, no flashy animations, content-first

### Implementation Plan
- Each style = separate CSS theme applied to the same hotel HTML structure
- Toggle or separate pages to switch between styles for demo purposes
- Content remains identical (Traditional Chinese), only visual presentation changes

---

## How to Use This Workspace
1. **Map/location updates**: Edit `data/places.json` or `data/itinerary.json`, then `npm run build`
2. **Content updates**: Edit HTML fragments in `data/content/`, then `npm run build`
3. **Research**: Use `/deep-research` for hotel/price/availability investigations
4. **Excel**: Use `scripts/read-excel.js` to read/modify the master spreadsheet
5. **Budget**: Keep running totals in `budget/` folder
6. **Skill**: Use `/build-map` to regenerate HTML after data changes
7. **Deploy**: Push to GitHub → Vercel auto-deploys from `presentation/`
