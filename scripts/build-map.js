const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const places = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/places.json'), 'utf8'));
const itinerary = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/itinerary.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/config.json'), 'utf8'));

const envFile = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
const apiKey = envFile.match(/google_api=(.+)/)?.[1]?.trim() || '';

// Read content fragments
const contentDir = path.join(ROOT, 'data/content');
const hotelStyles = fs.readFileSync(path.join(contentDir, 'hotel-styles.css'), 'utf8');
const hotelsHtml = fs.readFileSync(path.join(contentDir, 'hotels.html'), 'utf8');
const diningHtml = fs.readFileSync(path.join(contentDir, 'dining.html'), 'utf8');
const sightseeingHtml = fs.readFileSync(path.join(contentDir, 'sightseeing.html'), 'utf8');
const bookingHtml = fs.readFileSync(path.join(contentDir, 'booking.html'), 'utf8');
const hotelScripts = fs.readFileSync(path.join(contentDir, 'hotel-scripts.js'), 'utf8');

function buildPlaceLookup() {
  const lookup = {};
  for (const cat of Object.keys(places)) {
    for (const p of places[cat]) {
      lookup[p.id] = p;
    }
  }
  return lookup;
}

const placeLookup = buildPlaceLookup();
const cats = config.categories;

// Strip the old switchTab function from hotel scripts (replaced by unified tab system)
const cleanedHotelScripts = hotelScripts.replace(
  /function switchTab\(tabName\)[\s\S]*?^\}/m, ''
).trim();

function generateUnifiedHtml() {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${config.trip.name} — 野沢溫泉旅行計劃</title>
<style>
/* ===== Nothing Phone UI — Page-Level Variables & Reset ===== */
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
:root {
  --nothing-black: #000000;
  --nothing-dark: #0A0A0A;
  --nothing-card: #141414;
  --nothing-border: #2A2A2A;
  --nothing-border-light: #3A3A3A;
  --nothing-red: #D71921;
  --nothing-red-dim: rgba(215,25,33,0.15);
  --nothing-white: #FFFFFF;
  --nothing-gray1: #E0E0E0;
  --nothing-gray2: #999999;
  --nothing-gray3: #666666;
  --nothing-gray4: #444444;
  --nothing-green: #33CC66;
  --nothing-yellow: #FFCC00;
  --nothing-blue: #4DA6FF;
  --radius: 0px;
  --radius-sm: 2px;
  --font: 'Space Mono', 'Courier New', 'Microsoft JhengHei', monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font);
  background: var(--nothing-black);
  color: var(--nothing-white);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ===== Hero Header (Nothing) ===== */
.hero {
  background: var(--nothing-black);
  border-bottom: 1px solid var(--nothing-border);
  padding: 48px 40px 0;
  text-align: center;
  color: var(--nothing-white);
  position: relative;
}
.hero::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--nothing-red);
  box-shadow: 0 0 8px var(--nothing-red);
}
.hero h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 8px; letter-spacing: 2px; text-transform: uppercase; }
.hero .subtitle { font-size: 0.85rem; color: var(--nothing-gray2); margin-bottom: 16px; letter-spacing: 1px; }
.hero .meta { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; font-size: 0.75rem; margin-bottom: 20px; }
.hero .meta span { background: transparent; border: 1px solid var(--nothing-border); padding: 6px 14px; border-radius: 0; color: var(--nothing-gray2); letter-spacing: 0.5px; }

/* ===== Top Tab Navigation (Nothing) ===== */
.top-nav {
  display: inline-flex;
  gap: 0;
  padding: 0;
  overflow-x: auto;
  background: transparent;
  border: 1px solid var(--nothing-border);
  border-radius: 0;
}
.top-nav::-webkit-scrollbar { display: none; }
.top-tab {
  padding: 10px 20px;
  border: none;
  border-right: 1px solid var(--nothing-border);
  background: transparent;
  color: var(--nothing-gray3);
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.top-tab:last-child { border-right: none; }
.top-tab:hover { color: var(--nothing-white); background: var(--nothing-card); }
.top-tab.active {
  background: var(--nothing-red);
  color: var(--nothing-white);
}

/* ===== Tab Content Panels ===== */
.tab-panel-top { display: none; }
.tab-panel-top.active { display: block; }

/* ===== Map Tab (Nothing) ===== */
.map-tab-wrap {
  position: relative;
  width: 100%;
  height: calc(100vh - 180px);
  min-height: 500px;
}
#gmap { width: 100%; height: 100%; position: absolute; inset: 0; z-index: 1; }

.sidebar {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 380px; z-index: 10;
  background: var(--nothing-dark);
  border-left: 1px solid var(--nothing-border);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--nothing-border);
  flex-shrink: 0;
}
.sidebar-header h2 {
  font-size: 0.9rem; font-weight: 700; letter-spacing: 1px;
  color: var(--nothing-white); text-transform: uppercase;
}
.sidebar-header .sub-text {
  font-size: 0.68rem; color: var(--nothing-gray3); margin-top: 4px; letter-spacing: 0.5px;
}

.seg-control {
  display: flex; margin: 12px 18px 0;
  background: transparent;
  border: 1px solid var(--nothing-border);
  border-radius: 0; padding: 0;
  flex-shrink: 0;
}
.seg-control button {
  flex: 1; padding: 8px 0; border: none; background: none;
  font-size: 0.68rem; font-weight: 700; cursor: pointer;
  border-radius: 0; color: var(--nothing-gray3);
  border-right: 1px solid var(--nothing-border);
  transition: all 0.15s;
  font-family: inherit;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.seg-control button:last-child { border-right: none; }
.seg-control button.active {
  background: var(--nothing-white); color: var(--nothing-black);
}

.map-panel { display: none; flex: 1; overflow-y: auto; padding: 12px 0; }
.map-panel.active { display: block; }
.map-panel::-webkit-scrollbar { width: 3px; }
.map-panel::-webkit-scrollbar-thumb { background: var(--nothing-border-light); border-radius: 0; }

.filter-chips {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 0 18px 10px; flex-shrink: 0;
}
.chip {
  padding: 4px 10px; border-radius: 0;
  font-size: 0.65rem; font-weight: 700; cursor: pointer;
  border: 1px solid var(--nothing-border);
  background: transparent; color: var(--nothing-gray3);
  transition: all 0.15s;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-family: inherit;
}
.chip.active { border-color: var(--nothing-red); color: var(--nothing-red); background: var(--nothing-red-dim); }

.place-card {
  margin: 0 14px 4px; padding: 10px 14px;
  border-radius: 0;
  border-bottom: 1px solid var(--nothing-border);
  cursor: pointer; transition: background 0.15s;
  display: flex; align-items: center; gap: 12px;
}
.place-card:hover { background: rgba(255,255,255,0.03); }
.place-card.active { background: var(--nothing-red-dim); border-color: var(--nothing-red); }
.place-card .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.place-card .info { flex: 1; min-width: 0; }
.place-card .name {
  font-size: 0.75rem; font-weight: 700; color: var(--nothing-white);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.place-card .sub {
  font-size: 0.65rem; color: var(--nothing-gray3); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.place-card .arrow { color: var(--nothing-gray3); font-size: 0.7rem; }

.map-day-pills {
  display: flex; gap: 0; padding: 0 18px 12px;
  overflow-x: auto; flex-shrink: 0;
}
.map-day-pills::-webkit-scrollbar { display: none; }
.map-day-pill {
  padding: 6px 12px; border-radius: 0;
  font-size: 0.65rem; font-weight: 700; cursor: pointer;
  white-space: nowrap; border: 1px solid var(--nothing-border);
  border-right: none;
  background: transparent; color: var(--nothing-gray3);
  transition: all 0.15s;
  font-family: inherit;
  letter-spacing: 0.5px;
}
.map-day-pill:last-child { border-right: 1px solid var(--nothing-border); }
.map-day-pill.active { background: var(--nothing-white); color: var(--nothing-black); }

.map-timeline { padding: 0 18px; }
.map-timeline-header {
  font-size: 0.75rem; font-weight: 700; color: var(--nothing-white);
  margin-bottom: 12px; letter-spacing: 1px; text-transform: uppercase;
}
.map-timeline-stop {
  display: flex; gap: 12px; padding: 8px 0;
  cursor: pointer; transition: opacity 0.15s;
  border-bottom: 1px solid var(--nothing-border);
}
.map-timeline-stop:last-child { border-bottom: none; }
.map-timeline-stop:hover { opacity: 0.7; }
.map-timeline-num {
  width: 20px; height: 20px; border-radius: 0;
  background: transparent; color: var(--nothing-red);
  border: 1px solid var(--nothing-red);
  font-size: 0.6rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.map-timeline-stop .stop-time { font-size: 0.65rem; color: var(--nothing-gray3); font-weight: 700; }
.map-timeline-stop .stop-name { font-size: 0.75rem; font-weight: 700; color: var(--nothing-white); }
.map-timeline-stop .stop-note { font-size: 0.65rem; color: var(--nothing-gray3); }

.info-section { padding: 0 18px; }
.info-card {
  background: var(--nothing-card); border-radius: 0;
  border: 1px solid var(--nothing-border);
  padding: 14px 16px; margin-bottom: 10px;
}
.info-card h4 { font-size: 0.7rem; font-weight: 700; color: var(--nothing-gray2); margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase; }
.info-card p { font-size: 0.72rem; color: var(--nothing-gray2); line-height: 1.6; }
.info-card .members { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.info-card .member {
  padding: 3px 10px; border-radius: 0; font-size: 0.65rem;
  background: transparent; border: 1px solid var(--nothing-border);
  color: var(--nothing-gray1); font-weight: 700;
}

.route-toggle-box {
  margin: 12px 18px 0; padding: 10px 14px;
  background: var(--nothing-card); border-radius: 0;
  border: 1px solid var(--nothing-border);
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.route-toggle-box label { font-size: 0.7rem; font-weight: 700; color: var(--nothing-gray2); cursor: pointer; letter-spacing: 0.5px; }
.route-toggle-box input { accent-color: var(--nothing-red); width: 14px; height: 14px; }

.gmap-controls {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  background: var(--nothing-dark);
  border: 1px solid var(--nothing-border);
  border-radius: 0;
  padding: 12px 14px;
}
.gmap-controls h3 { font-size: 0.65rem; font-weight: 700; color: var(--nothing-gray2); margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase; }
.gmap-controls label {
  display: flex; align-items: center; gap: 6px;
  padding: 3px 0; font-size: 0.68rem; color: var(--nothing-gray2); cursor: pointer;
}
.gmap-controls input { accent-color: var(--nothing-red); width: 14px; height: 14px; }

/* Mobile bottom sheet for map tab */
@media (max-width: 768px) {
  .sidebar {
    top: auto; right: 0; left: 0; bottom: 0;
    width: 100%; height: 55vh;
    border-left: none;
    border-top: 1px solid var(--nothing-border);
    transition: height 0.3s ease;
  }
  .sidebar.collapsed { height: 80px; }
  .sidebar.expanded { height: 85vh; }
  .drag-handle {
    display: flex !important; justify-content: center; padding: 10px 0 4px;
    cursor: grab; flex-shrink: 0;
  }
  .drag-handle::after {
    content: ''; width: 36px; height: 2px;
    background: var(--nothing-gray4); border-radius: 0;
  }
  .map-tab-wrap { height: calc(100vh - 140px); }
}
.drag-handle { display: none; }

/* ===== Itinerary Tab (Nothing) ===== */
.itin-wrap {
  padding: 24px 20px;
  min-height: 400px;
}
.itin-container { max-width: 680px; margin: 0 auto; }
.itin-card {
  background: var(--nothing-card);
  border: 1px solid var(--nothing-border);
  border-radius: 0;
  padding: 20px; margin-bottom: 16px;
  position: relative;
}
.itin-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 3px; height: 100%;
  background: var(--nothing-red);
}
.itin-card h3 {
  font-size: 0.8rem; font-weight: 700; color: var(--nothing-white);
  margin-bottom: 12px; padding-bottom: 8px;
  border-bottom: 1px solid var(--nothing-border);
  letter-spacing: 1px; text-transform: uppercase;
}
.itin-card .intro { font-size: 0.75rem; color: var(--nothing-gray3); line-height: 1.7; }

.itin-day-pills { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 12px; }
.itin-day-pill {
  padding: 6px 12px; border-radius: 0;
  font-size: 0.65rem; font-weight: 700; cursor: pointer;
  border: 1px solid var(--nothing-border); border-right: none;
  background: transparent; color: var(--nothing-gray3);
  font-family: inherit; letter-spacing: 0.5px;
}
.itin-day-pill:last-child { border-right: 1px solid var(--nothing-border); }
.itin-day-pill.active { background: var(--nothing-white); color: var(--nothing-black); }

.itin-route-panel { display: none; }
.itin-route-panel.active { display: block; }
.itin-route-stop {
  display: flex; gap: 12px; align-items: flex-start; padding: 8px 0;
  font-size: 0.75rem;
  border-bottom: 1px solid var(--nothing-border);
}
.itin-route-stop:last-child { border-bottom: none; }
.itin-route-stop .time {
  font-weight: 700; color: var(--nothing-red); min-width: 44px; flex-shrink: 0;
  font-size: 0.72rem;
}
.itin-route-stop .what { color: var(--nothing-gray1); }
.itin-route-stop .what a { color: var(--nothing-red); text-decoration: none; font-weight: 700; }
.itin-route-stop .what a:hover { text-decoration: underline; }

.itin-place-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--nothing-border);
}
.itin-place-row:last-child { border-bottom: none; }
.itin-place-info { flex: 1; min-width: 0; }
.itin-place-info .name { font-weight: 700; font-size: 0.78rem; color: var(--nothing-white); }
.itin-place-info .desc { font-size: 0.68rem; color: var(--nothing-gray3); margin-top: 2px; }
.itin-place-btns { display: flex; gap: 6px; flex-shrink: 0; }
.btn-open {
  padding: 5px 12px; border-radius: 0; font-size: 0.65rem;
  font-weight: 700; text-decoration: none;
  background: var(--nothing-red); color: var(--nothing-white);
  font-family: inherit; letter-spacing: 0.5px;
}
.btn-copy {
  padding: 5px 10px; border-radius: 0; font-size: 0.65rem;
  font-weight: 700; cursor: pointer;
  border: 1px solid var(--nothing-border);
  background: transparent; color: var(--nothing-gray2);
  font-family: inherit;
}
.btn-copy.copied { background: rgba(51,204,102,0.15); color: var(--nothing-green); border-color: var(--nothing-green); }

@media (max-width: 600px) {
  .itin-place-row { flex-wrap: wrap; }
  .itin-place-btns { width: 100%; }
}

/* ===== Hotel/Content Tabs (embedded fragment styles) ===== */
${hotelStyles}

/* ===== Responsive top nav (Nothing) ===== */
@media (max-width: 768px) {
  .hero { padding: 32px 16px 0; }
  .hero h1 { font-size: 1.3rem; }
  .hero .subtitle { font-size: 0.75rem; }
  .top-nav { border: none; }
  .top-tab { padding: 8px 10px; font-size: 0.65rem; border-bottom: 1px solid var(--nothing-border); border-right: none; }
  .top-tab.active { border-bottom-color: var(--nothing-red); }
}

/* ===== Nothing Glyph Decoration ===== */
.hero::after {
  content: '( )';
  position: absolute;
  top: 12px;
  right: 20px;
  font-size: 0.65rem;
  color: var(--nothing-gray4);
  letter-spacing: 2px;
}
</style>
</head>
<body>

<!-- Hero Header -->
<div class="hero">
  <h1>${config.trip.name}</h1>
  <div class="subtitle">${config.trip.destination} · ${config.trip.dates}</div>
  <div class="meta">
    <span>👥 ${config.trip.members.length}人</span>
    <span>✈️ ${config.trip.departure}</span>
    <span>🎿 9日行程</span>
  </div>
  <nav class="top-nav">
    <button class="top-tab active" onclick="switchTopTab('map',this)">🗺️ 地圖</button>
    <button class="top-tab" onclick="switchTopTab('itinerary',this)">📅 行程</button>
    <button class="top-tab" onclick="switchTopTab('hotels',this)">🏨 住宿</button>
    <button class="top-tab" onclick="switchTopTab('dining',this)">🍜 餐飲</button>
    <button class="top-tab" onclick="switchTopTab('sightseeing',this)">🗻 觀光</button>
    <button class="top-tab" onclick="switchTopTab('booking',this)">📋 預訂</button>
  </nav>
</div>

<!-- ======== TAB 1: Map ======== -->
<div class="tab-panel-top active" id="toptab-map">
  <div class="map-tab-wrap">
    <div id="gmap"></div>
    <div class="gmap-controls" id="gmap-controls">
      <h3>圖層</h3>
      ${Object.entries(cats).map(([k, v]) => `<label><input type="checkbox" checked data-layer="${k}"> ${v.label}</label>`).join('\n      ')}
    </div>
    <div class="sidebar" id="sidebar">
      <div class="drag-handle" id="drag-handle"></div>
      <div class="sidebar-header">
        <h2>地點總覽</h2>
        <div class="sub-text">${config.trip.destination} · ${Object.values(places).flat().length} 個地點</div>
      </div>
      <div class="seg-control" id="seg-control">
        <button class="active" data-tab="places">地點</button>
        <button data-tab="map-itin">行程</button>
        <button data-tab="map-info">資訊</button>
      </div>
      <div class="map-panel active" id="panel-places">
        <div class="filter-chips" id="filter-chips">
          ${Object.entries(cats).map(([k, v]) => `<span class="chip active" data-cat="${k}">${v.label}</span>`).join('\n          ')}
        </div>
        <div id="place-list"></div>
      </div>
      <div class="map-panel" id="panel-map-itin">
        <div class="map-day-pills" id="map-day-pills"></div>
        <div class="route-toggle-box">
          <input type="checkbox" id="route-toggle">
          <label for="route-toggle">顯示路線</label>
        </div>
        <div class="map-timeline" id="map-timeline"></div>
      </div>
      <div class="map-panel" id="panel-map-info">
        <div class="info-section">
          <div class="info-card">
            <h4>旅程資訊</h4>
            <p>${config.trip.destination}<br>${config.trip.dates}<br>出發地：${config.trip.departure}</p>
          </div>
          <div class="info-card">
            <h4>團員 (${config.trip.members.length}人)</h4>
            <div class="members">
              ${config.trip.members.map(m => `<span class="member">${m}</span>`).join('')}
            </div>
          </div>
          <div class="info-card">
            <h4>周邊一日遊</h4>
            ${config.dayTrips.map(dt => `<p>${dt.title}<br><span style="font-size:0.68rem;color:var(--apple-gray)">${dt.desc}</span><br><a href="${dt.routeUrl}" target="_blank" style="font-size:0.68rem;color:var(--apple-blue);font-weight:600">🚄 查看路線</a></p>`).join('<br>')}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ======== TAB 2: Itinerary ======== -->
<div class="tab-panel-top" id="toptab-itinerary">
  <div class="itin-wrap">
    <div class="itin-container">
      <div class="itin-card">
        <h3>使用方法</h3>
        <div class="intro">點擊「開啟」在手機 Google Maps App 直接查看位置、評價、照片。可存到「想去的地方」清單。「複製」按鈕可直接貼到 WhatsApp / Line 分享給團友。</div>
      </div>
      <div class="itin-card">
        <h3>📅 每日行程</h3>
        <div class="itin-day-pills" id="itin-day-pills">
          ${itinerary.map((d, i) => `<button class="itin-day-pill${i === 0 ? ' active' : ''}" onclick="showItinRoute(${i},this)">${d.day} ${d.shortTitle}</button>`).join('\n          ')}
        </div>
        ${itinerary.map((d, i) => {
          let stopsHtml = d.stops.map(s => {
            const p = s.placeId ? placeLookup[s.placeId] : null;
            const gmapUrl = p ? p.gmapSearch : (s.gmapUrl || '');
            const nameHtml = gmapUrl
              ? `<a href="${gmapUrl}" target="_blank">${s.name}${s.note ? ' ' + s.note : ''}</a>`
              : `${s.name}${s.note ? ' · ' + s.note : ''}`;
            return `          <div class="itin-route-stop"><span class="time">${s.time}</span><span class="what">${nameHtml}</span></div>`;
          }).join('\n');
          return `        <div class="itin-route-panel${i === 0 ? ' active' : ''}" id="itin-route-${i}">\n${stopsHtml}\n        </div>`;
        }).join('\n')}
      </div>

      <!-- Places by category -->
${Object.entries(places).map(([cat, items]) => {
  const catLabel = cats[cat].label;
  const rows = items.map(p => `        <div class="itin-place-row">
          <div class="itin-place-info"><div class="name">${p.title}</div><div class="desc">${p.sub}</div></div>
          <div class="itin-place-btns">
            <a class="btn-open" href="${p.gmapSearch}" target="_blank">開啟</a>
            <button class="btn-copy" onclick="copyLink(this,'${p.gmapSearch.replace(/'/g, "\\'")}')">複製</button>
          </div>
        </div>`).join('\n');
  return `      <div class="itin-card">\n        <h3>${catLabel}</h3>\n${rows}\n      </div>`;
}).join('\n\n')}

      <!-- Day trips -->
      <div class="itin-card">
        <h3>🚄 周邊一日遊</h3>
${config.dayTrips.map(dt => `        <div class="itin-place-row">
          <div class="itin-place-info"><div class="name">${dt.title}</div><div class="desc">${dt.desc}</div></div>
          <div class="itin-place-btns"><a class="btn-open" href="${dt.routeUrl}" target="_blank">🚄 路線</a></div>
        </div>`).join('\n')}
      </div>
    </div>
  </div>
</div>

<!-- ======== TAB 3: Hotels ======== -->
<div class="tab-panel-top" id="toptab-hotels">
  <div class="container">
${hotelsHtml}
  </div>
</div>

<!-- ======== TAB 4: Dining ======== -->
<div class="tab-panel-top" id="toptab-dining">
  <div class="container">
${diningHtml}
  </div>
</div>

<!-- ======== TAB 5: Sightseeing ======== -->
<div class="tab-panel-top" id="toptab-sightseeing">
  <div class="container">
${sightseeingHtml}
  </div>
</div>

<!-- ======== TAB 6: Booking ======== -->
<div class="tab-panel-top" id="toptab-booking">
  <div class="container">
${bookingHtml}
  </div>
</div>

<script>
/* ===== Top-level tab switching ===== */
function switchTopTab(id, btn) {
  document.querySelectorAll('.tab-panel-top').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.top-tab').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('toptab-' + id).classList.add('active');
  btn.classList.add('active');

  // Initialize map on first switch to map tab
  if (id === 'map' && !window._mapInitialized && window.google) {
    initGMap();
  }
}

/* ===== Itinerary Tab ===== */
function showItinRoute(idx, btn) {
  document.querySelectorAll('.itin-day-pill').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.itin-route-panel').forEach(function(r) { r.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('itin-route-' + idx).classList.add('active');
}

function copyLink(btn, url) {
  navigator.clipboard.writeText(url).then(function() {
    btn.textContent = '✓ 已複製';
    btn.classList.add('copied');
    setTimeout(function() { btn.textContent = '複製'; btn.classList.remove('copied'); }, 2000);
  });
}

/* ===== Google Maps (Tab 1) ===== */
var PLACES = ${JSON.stringify(places, null, 2)};
var ITINERARY = ${JSON.stringify(itinerary, null, 2)};
var COLORS = ${JSON.stringify(Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, v.color])))};
var CAT_LABELS = ${JSON.stringify(Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, v.label])))};

var gmap, gmarkers = {}, placePositions = {}, activeInfoWindow = null;
var routeRenderer = null;
var activeCats = new Set(Object.keys(PLACES));
var currentDay = 0;

function initGMap() {
  if (window._mapInitialized) return;
  window._mapInitialized = true;

  gmap = new google.maps.Map(document.getElementById('gmap'), {
    center: ${JSON.stringify(config.map.center)},
    zoom: ${config.map.zoom},
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [{featureType:'poi', stylers:[{visibility:'off'}]}]
  });

  routeRenderer = new google.maps.DirectionsRenderer({
    map: gmap, suppressMarkers: true,
    polylineOptions: { strokeColor: '#007AFF', strokeWeight: 4, strokeOpacity: 0.7 }
  });
  routeRenderer.setMap(null);

  placeAllMarkers();
  buildPlaceList();
  buildMapDayPills();
  showMapDay(0);
  setupMapControls();
  setupBottomSheet();
}

function initMap() { initGMap(); }

function placeAllMarkers() {
  Object.keys(PLACES).forEach(function(cat) {
    gmarkers[cat] = [];
    PLACES[cat].forEach(function(p) {
      var pos = new google.maps.LatLng(p.lat, p.lng);
      placePositions[p.id] = pos;

      var marker = new google.maps.Marker({
        position: pos, map: gmap, title: p.title,
        icon: {
          url: makeSvgIcon(COLORS[cat], p.icon),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      var gmLink = '<a href="https://www.google.com/maps/search/?api=1&query=' + p.lat + ',' + p.lng + '" target="_blank" style="font-size:0.72rem;color:#007AFF;text-decoration:none;font-weight:600;">Google Maps →</a>';
      var infoContent = '<div style="max-width:240px;font-family:-apple-system,sans-serif;">' +
        '<h3 style="font-size:0.9rem;margin-bottom:3px;font-weight:700;">' + p.title + '</h3>' +
        '<div style="font-size:0.74rem;color:#8E8E93;margin-bottom:5px;">' + p.sub + '</div>' +
        '<div style="font-size:0.78rem;color:#3A3A3C;line-height:1.5;margin-bottom:5px;">' + p.desc + '</div>' +
        '<div style="font-size:0.72rem;color:#007AFF;font-weight:600;margin-bottom:5px;">' + p.meta + '</div>' +
        gmLink + '</div>';

      var infoWindow = new google.maps.InfoWindow({ content: infoContent });
      marker.addListener('click', function() {
        if (activeInfoWindow) activeInfoWindow.close();
        infoWindow.open(gmap, marker);
        activeInfoWindow = infoWindow;
      });

      gmarkers[cat].push({ marker: marker, infoWindow: infoWindow, place: p });
    });
  });
}

function makeSvgIcon(color, emoji) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<circle cx="16" cy="16" r="14" fill="' + color + '" stroke="white" stroke-width="3"/>' +
    '<text x="16" y="22" text-anchor="middle" font-size="14">' + emoji + '</text></svg>';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function buildPlaceList() {
  var container = document.getElementById('place-list');
  var html = '';
  Object.keys(PLACES).forEach(function(cat) {
    PLACES[cat].forEach(function(p, idx) {
      html += '<div class="place-card" data-cat="' + cat + '" data-idx="' + idx + '">';
      html += '<div class="dot" style="background:' + COLORS[cat] + '"></div>';
      html += '<div class="info"><div class="name">' + p.title + '</div><div class="sub">' + p.sub + '</div></div>';
      html += '<span class="arrow">›</span>';
      html += '</div>';
    });
  });
  container.innerHTML = html;

  container.querySelectorAll('.place-card').forEach(function(card) {
    card.addEventListener('click', function() {
      focusPlace(this.dataset.cat, parseInt(this.dataset.idx));
    });
  });
}

function buildMapDayPills() {
  var html = '';
  ITINERARY.forEach(function(d, i) {
    html += '<button class="map-day-pill' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' + d.day + ' ' + d.shortTitle + '</button>';
  });
  var container = document.getElementById('map-day-pills');
  container.innerHTML = html;
  container.querySelectorAll('.map-day-pill').forEach(function(pill) {
    pill.addEventListener('click', function() {
      showMapDay(parseInt(this.dataset.idx));
    });
  });
}

function showMapDay(idx) {
  currentDay = idx;
  var d = ITINERARY[idx];
  document.querySelectorAll('.map-day-pill').forEach(function(p, i) { p.classList.toggle('active', i === idx); });

  var html = '<div class="map-timeline-header">' + d.day + ' · ' + d.date + ' — ' + d.title + '</div>';
  d.stops.forEach(function(s, i) {
    html += '<div class="map-timeline-stop" data-place-id="' + (s.placeId || '') + '">';
    html += '<div class="map-timeline-num">' + (i + 1) + '</div>';
    html += '<div><div class="stop-name">' + s.name + '</div>';
    html += '<div class="stop-time">' + s.time + (s.note ? ' · ' + s.note : '') + '</div></div>';
    html += '</div>';
  });
  document.getElementById('map-timeline').innerHTML = html;

  document.querySelectorAll('.map-timeline-stop').forEach(function(stop) {
    stop.addEventListener('click', function() {
      var pid = this.dataset.placeId;
      if (pid && placePositions[pid]) {
        gmap.panTo(placePositions[pid]);
        gmap.setZoom(17);
        Object.keys(gmarkers).forEach(function(cat) {
          gmarkers[cat].forEach(function(m) {
            if (m.place.id === pid) {
              if (activeInfoWindow) activeInfoWindow.close();
              m.infoWindow.open(gmap, m.marker);
              activeInfoWindow = m.infoWindow;
            }
          });
        });
      }
    });
  });

  if (document.getElementById('route-toggle').checked) drawDayRoute(idx);
}

function drawDayRoute(idx) {
  var d = ITINERARY[idx];
  var waypoints = [];
  d.stops.forEach(function(s) {
    if (s.placeId && placePositions[s.placeId]) {
      waypoints.push(placePositions[s.placeId]);
    }
  });
  if (waypoints.length < 2) { routeRenderer.setMap(null); return; }
  routeRenderer.setMap(gmap);
  var dirService = new google.maps.DirectionsService();
  dirService.route({
    origin: waypoints[0],
    destination: waypoints[waypoints.length - 1],
    waypoints: waypoints.slice(1, -1).map(function(w) { return { location: w, stopover: true }; }),
    travelMode: google.maps.TravelMode.WALKING
  }, function(result, status) {
    if (status === 'OK') routeRenderer.setDirections(result);
    else routeRenderer.setMap(null);
  });
}

function focusPlace(cat, idx) {
  document.querySelectorAll('.place-card').forEach(function(c) { c.classList.remove('active'); });
  var card = document.querySelector('.place-card[data-cat="' + cat + '"][data-idx="' + idx + '"]');
  if (card) { card.classList.add('active'); card.scrollIntoView({ block: 'nearest' }); }

  var m = gmarkers[cat] && gmarkers[cat][idx];
  if (m) {
    gmap.panTo(m.marker.getPosition());
    gmap.setZoom(17);
    if (activeInfoWindow) activeInfoWindow.close();
    m.infoWindow.open(gmap, m.marker);
    activeInfoWindow = m.infoWindow;
  }
}

function setupMapControls() {
  document.querySelectorAll('#seg-control button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#seg-control button').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.map-panel').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('panel-' + this.dataset.tab).classList.add('active');
    });
  });

  document.querySelectorAll('.chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      this.classList.toggle('active');
      var cat = this.dataset.cat;
      if (this.classList.contains('active')) { activeCats.add(cat); } else { activeCats.delete(cat); }
      updateMapVisibility();
    });
  });

  document.querySelectorAll('#gmap-controls input[data-layer]').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var layer = this.dataset.layer;
      if (this.checked) activeCats.add(layer); else activeCats.delete(layer);
      var chip = document.querySelector('.chip[data-cat="' + layer + '"]');
      if (chip) chip.classList.toggle('active', this.checked);
      updateMapVisibility();
    });
  });

  document.getElementById('route-toggle').addEventListener('change', function() {
    if (this.checked) drawDayRoute(currentDay);
    else routeRenderer.setMap(null);
  });
}

function updateMapVisibility() {
  Object.keys(gmarkers).forEach(function(cat) {
    var visible = activeCats.has(cat);
    gmarkers[cat].forEach(function(m) { m.marker.setVisible(visible); });
  });
  document.querySelectorAll('.place-card').forEach(function(card) {
    card.style.display = activeCats.has(card.dataset.cat) ? '' : 'none';
  });
  document.querySelectorAll('#gmap-controls input[data-layer]').forEach(function(cb) {
    cb.checked = activeCats.has(cb.dataset.layer);
  });
}

function setupBottomSheet() {
  var sidebar = document.getElementById('sidebar');
  var handle = document.getElementById('drag-handle');
  var startY, startH;
  handle.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
    startH = sidebar.offsetHeight;
    sidebar.style.transition = 'none';
  });
  document.addEventListener('touchmove', function(e) {
    if (startY === undefined) return;
    var dy = startY - e.touches[0].clientY;
    var newH = Math.min(Math.max(startH + dy, 80), window.innerHeight * 0.9);
    sidebar.style.height = newH + 'px';
  });
  document.addEventListener('touchend', function() {
    if (startY === undefined) return;
    sidebar.style.transition = '';
    var h = sidebar.offsetHeight;
    var vh = window.innerHeight;
    if (h < vh * 0.2) sidebar.className = 'sidebar collapsed';
    else if (h > vh * 0.7) sidebar.className = 'sidebar expanded';
    else { sidebar.className = 'sidebar'; sidebar.style.height = ''; }
    startY = undefined;
  });
}

/* ===== Hotel Content Scripts (sorting, countdown, SVG map) ===== */
${cleanedHotelScripts}
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions&callback=initMap"></script>
</body>
</html>`;
}

// Write output
const outDir = path.join(ROOT, 'presentation');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'nozawa-trip.html'), generateUnifiedHtml(), 'utf8');
console.log('Built: presentation/nozawa-trip.html (unified 6-tab version)');
