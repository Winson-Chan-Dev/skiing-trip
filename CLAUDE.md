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
- **Coordinate source**: Google Places API `textsearch` with romanized/English/Japanese queries
- **Cafe Olive** (Hikage area): estimated, too small for Places API
- **Tanakaya Brewery** is in Iiyama (~8km from village), coordinates are real

### Getting Accurate Coordinates (MANDATORY APPROACH)

Use Google Places API Text Search to get real coordinates. **NEVER estimate or guess coordinates.**

```bash
# Example: Get coordinates for a restaurant
$apiKey = "<from .env>"
$query = "Restaurant Name Nozawa Onsen"  # Use Japanese name for better results
$url = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=$query&key=$apiKey"
$resp = Invoke-RestMethod -Uri $url -Method Get
$resp.results[0].geometry.location  # → { lat: XX.XXX, lng: XXX.XXX }
```

**Rules**:
1. Always query Google Places API first for any new location
2. Try Japanese name first (e.g. `蕎麦処 大門 野沢温泉村`), fallback to English
3. Mark `"verified": true` when coordinates come from the API
4. Mark `"verified": false` ONLY when API returns no results — add a `note` explaining
5. For places not found, position relative to verified nearby landmarks

### Design: Apple UI (Clean Minimalism)

**Style Reference**: Apple's design language — light, spacious, rounded, premium.

**Foundation**:
- Background: `#F5F5F7` (Apple light gray)
- Font: `'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, system-ui, sans-serif, 'PingFang HK', 'PingFang TC'`
- Border radius: `12px` cards, `8px` badges/tags
- Soft shadows: `0 2px 12px rgba(0,0,0,0.08)`

**Color System** (CSS variables in `:root`):
- `--bg: #F5F5F7` — page background
- `--bg-elevated: #FFFFFF` — card backgrounds
- `--text-primary: #1D1D1F` — primary text
- `--text-secondary: #86868B` — secondary text
- `--text-tertiary: #AEAEB2` — muted text
- `--border: #E5E5EA` — borders
- `--border-light: #F2F2F7` — subtle borders
- `--accent: #007AFF` — primary accent (Apple blue)
- `--accent-dim: rgba(0,122,255,0.1)` — blue tinted backgrounds
- Semantic: `--success: #34C759`, `--warning: #FF9500`, `--danger: #FF3B30`, `--blue: #5AC8FA`

**Components**:
- Top nav: pill-shaped container with shadow, active tab = blue fill + white text
- Cards: white background, 12px radius, soft shadow, hover lifts with shadow increase
- Tags/badges: pill-shaped (full border-radius), soft tinted backgrounds
- Segmented control: rounded pill, active = accent fill
- Filter chips: pill-shaped `border-radius: 20px`, light border
- Tables: clean with subtle alternating rows (#F9F9FB), no heavy borders
- Hero: clean centered text, no decorations

**Layout**:
- Map tab: full-viewport Google Map + white sidebar (380px right)
- Content tabs: max-width `1400px` centered, card grid with `gap: 24px`
- Mobile (<768px): bottom sheet with rounded top corners

**Interactions**:
- Hover: subtle lift `translateY(-1px)` + shadow increase
- Transitions: `0.3s cubic-bezier(0.25, 0.1, 0.25, 1)` — smooth Apple-like
- Active states: accent color fill

**Typography Rules**:
- NO `text-transform: uppercase` anywhere
- NO `letter-spacing` beyond default
- Font weights: 700 headings, 500 subheadings, 400 body
- Body text: `0.9rem`, line-height `1.6`

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
- **GitHub account**: winsonclfa@hotmail.com (GitHub user: Winson-Chan-Dev)
- **Repo**: https://github.com/Winson-Chan-Dev/skiing-trip
- **Output**: Static site from `presentation/` folder (configured in `vercel.json`)
- **Live URL**: https://skiing-trip.vercel.app

### Deploy Workflow
```bash
# After making changes:
npm run build                          # regenerate HTML
git add -A && git commit -m "..."      # commit changes
git push origin master                 # push to GitHub
vercel --prod                          # deploy to production
```

### Notes
- `.env` is in `.gitignore` — API key not pushed to repo
- Google Maps API key IS embedded in generated HTML (visible in page source) — acceptable for a friends-only sharing site
- `vercel.json` sets `outputDirectory: "presentation"` — only that folder is served

---

## How to Use This Workspace
1. **Map/location updates**: Edit `data/places.json` or `data/itinerary.json`, then `npm run build`
2. **New locations**: Use Google Places API to get exact coordinates (see "Getting Accurate Coordinates" above)
3. **Content updates**: Edit HTML fragments in `data/content/`, then `npm run build`
4. **Research**: Use `/deep-research` for hotel/price/availability investigations
5. **Excel**: Use `scripts/read-excel.js` to read/modify the master spreadsheet
6. **Budget**: Keep running totals in `budget/` folder
7. **Skill**: Use `/build-map` to regenerate HTML after data changes
8. **Deploy**: `npm run build` → `git push` → `vercel --prod`
