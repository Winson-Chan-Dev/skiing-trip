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
/* ===== Apple UI — Page-Level Variables & Reset ===== */
:root {
  --bg: #F5F5F7;
  --bg-elevated: #FFFFFF;
  --text-primary: #1D1D1F;
  --text-secondary: #86868B;
  --text-tertiary: #AEAEB2;
  --border: #E5E5EA;
  --border-light: #F2F2F7;
  --accent: #007AFF;
  --accent-dim: rgba(0,122,255,0.1);
  --success: #34C759;
  --warning: #FF9500;
  --danger: #FF3B30;
  --blue: #5AC8FA;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-hover: 0 8px 24px rgba(0,0,0,0.12);
  --font: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, system-ui, sans-serif, 'PingFang HK', 'PingFang TC';
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-primary);
  min-height: 100vh;
  line-height: 1.6;
}

/* ===== Hero Header ===== */
.hero {
  background: var(--bg);
  padding: 48px 40px 0;
  text-align: center;
  position: relative;
}
.hero h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 8px; }
.hero .subtitle { font-size: 1rem; color: var(--text-secondary); margin-bottom: 16px; }
.hero .meta { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; font-size: 0.75rem; margin-bottom: 20px; }
.hero .meta span { 
  background: var(--bg-elevated); 
  border: 1px solid var(--border); 
  border-radius: var(--radius-sm); 
  padding: 8px 16px; 
  color: var(--text-secondary); 
}

/* ===== Top Tab Navigation ===== */
.top-nav {
  display: inline-flex;
  gap: 0;
  padding: 4px;
  overflow-x: auto;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: none;
}
.top-nav::-webkit-scrollbar { display: none; }
.top-tab {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  font-family: inherit;
  white-space: nowrap;
}
.top-tab:hover { background: rgba(0,0,0,0.04); color: var(--text-primary); }
.top-tab.active {
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius-sm);
}

/* ===== Tab Content Panels ===== */
.tab-panel-top { display: none; }
.tab-panel-top.active { display: block; }

/* ===== Map Tab ===== */
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
  background: var(--bg-elevated);
  border-left: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.sidebar-header h2 {
  font-size: 1.3rem; font-weight: 700; color: var(--text-primary);
}
.sidebar-header .sub-text {
  font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;
}

.seg-control {
  display: flex; margin: 12px 18px 0;
  background: var(--bg);
  border-radius: var(--radius); 
  padding: 4px;
  flex-shrink: 0;
}
.seg-control button {
  flex: 1; padding: 8px 0; border: none; background: none;
  font-size: 0.85rem; font-weight: 500; cursor: pointer;
  border-radius: var(--radius-sm); color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  font-family: inherit;
}
.seg-control button.active {
  background: var(--bg-elevated); color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.map-panel { display: none; flex: 1; overflow-y: auto; padding: 12px 0; }
.map-panel.active { display: block; }
.map-panel::-webkit-scrollbar { width: 4px; }
.map-panel::-webkit-scrollbar-thumb { background: var(--text-tertiary); border-radius: var(--radius-sm); }

.filter-chips {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 0 18px 10px; flex-shrink: 0;
}
.chip {
  padding: 6px 12px; border-radius: 20px;
  font-size: 0.85rem; font-weight: 500; cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-elevated); color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  font-family: inherit;
}
.chip.active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }

.place-card {
  margin: 0 14px 8px; padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--bg-elevated);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid transparent;
  cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  display: flex; align-items: center; gap: 12px;
}
.place-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); }
.place-card.active { background: var(--accent-dim); border-color: var(--accent); }
.place-card .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.place-card .info { flex: 1; min-width: 0; }
.place-card .name {
  font-size: 0.9rem; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.place-card .sub {
  font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.place-card .arrow { color: var(--text-tertiary); font-size: 1rem; }

.map-day-pills {
  display: flex; gap: 6px; padding: 0 18px 12px;
  overflow-x: auto; flex-shrink: 0;
}
.map-day-pills::-webkit-scrollbar { display: none; }
.map-day-pill {
  padding: 6px 14px; border-radius: 20px;
  font-size: 0.85rem; font-weight: 500; cursor: pointer;
  white-space: nowrap; border: 1px solid var(--border);
  background: var(--bg-elevated); color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  font-family: inherit;
}
.map-day-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.map-timeline { padding: 0 18px; }
.map-timeline-header {
  font-size: 1rem; font-weight: 700; color: var(--text-primary);
  margin-bottom: 12px; 
}
.map-timeline-stop {
  display: flex; gap: 12px; padding: 12px 0;
  cursor: pointer; transition: opacity 0.3s;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}
.map-timeline-stop:last-child { border-bottom: none; }
.map-timeline-stop:hover { opacity: 0.7; }
.map-timeline-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--accent); color: #fff;
  font-size: 0.8rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.map-timeline-stop .stop-time { font-size: 0.85rem; color: var(--accent); font-weight: 600; }
.map-timeline-stop .stop-name { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
.map-timeline-stop .stop-note { font-size: 0.85rem; color: var(--text-secondary); }

.info-section { padding: 0 18px; }
.info-card {
  background: var(--bg-elevated); border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: none;
  padding: 24px; margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.info-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); }
.info-card h4 { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.info-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; }
.info-card .members { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.info-card .member {
  padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;
  background: var(--bg); border: 1px solid var(--border);
  color: var(--text-primary); font-weight: 500;
}

.route-toggle-box {
  margin: 12px 18px; padding: 12px 16px;
  background: var(--bg-elevated); border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: none;
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.route-toggle-box label { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); cursor: pointer; }
.route-toggle-box input { accent-color: var(--accent); width: 16px; height: 16px; }

.gmap-controls {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  background: var(--bg-elevated);
  border: none;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}
.gmap-controls h3 { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; }
.gmap-controls label {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 0; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;
}
.gmap-controls input { accent-color: var(--accent); width: 16px; height: 16px; }

/* Mobile bottom sheet for map tab */
@media (max-width: 768px) {
  .sidebar {
    top: auto; right: 0; left: 0; bottom: 0;
    width: 100%; height: 55vh;
    border-left: none;
    border-top: 1px solid var(--border);
    border-radius: 16px 16px 0 0;
    transition: height 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  }
  .sidebar.collapsed { height: 80px; }
  .sidebar.expanded { height: 85vh; }
  .drag-handle {
    display: flex !important; justify-content: center; padding: 12px 0 8px;
    cursor: grab; flex-shrink: 0;
  }
  .drag-handle::after {
    content: ''; width: 36px; height: 5px;
    background: var(--text-tertiary); border-radius: 3px;
  }
  .map-tab-wrap { height: calc(100vh - 140px); }
}
.drag-handle { display: none; }

/* ===== Itinerary Tab ===== */
.itin-wrap {
  padding: 32px 20px;
  min-height: 400px;
}
.itin-container { max-width: 680px; margin: 0 auto; }
.itin-card {
  background: var(--bg-elevated);
  border: none;
  box-shadow: var(--shadow);
  border-radius: var(--radius);
  padding: 24px; margin-bottom: 24px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.itin-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-hover); }
.itin-card h3 {
  font-size: 1.3rem; font-weight: 600; color: var(--text-primary);
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}
.itin-card .intro { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; }

.itin-day-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.itin-day-pill {
  padding: 8px 16px; border-radius: 20px;
  font-size: 0.9rem; font-weight: 500; cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-elevated); color: var(--text-secondary);
  font-family: inherit; transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.itin-day-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.itin-route-panel { display: none; }
.itin-route-panel.active { display: block; }
.itin-route-stop {
  display: flex; gap: 16px; align-items: flex-start; padding: 12px 0;
  font-size: 0.95rem;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}
.itin-route-stop:last-child { border-bottom: none; }
.itin-route-stop .time {
  font-weight: 600; color: var(--accent); min-width: 50px; flex-shrink: 0;
  font-size: 0.9rem; margin-top: 2px;
}
.itin-route-stop .what { color: var(--text-primary); }
.itin-route-stop .what a { color: var(--accent); text-decoration: none; font-weight: 600; }
.itin-route-stop .what a:hover { text-decoration: underline; }

.itin-place-row {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 0; border-bottom: 1px solid var(--border-light);
}
.itin-place-row:last-child { border-bottom: none; }
.itin-place-info { flex: 1; min-width: 0; }
.itin-place-info .name { font-weight: 600; font-size: 1rem; color: var(--text-primary); }
.itin-place-info .desc { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }
.itin-place-btns { display: flex; gap: 8px; flex-shrink: 0; }
.btn-open {
  padding: 6px 14px; border-radius: var(--radius-sm); font-size: 0.85rem;
  font-weight: 600; text-decoration: none;
  background: var(--accent); color: #fff;
  font-family: inherit; transition: opacity 0.3s;
}
.btn-open:hover { opacity: 0.85; }
.btn-copy {
  padding: 6px 14px; border-radius: var(--radius-sm); font-size: 0.85rem;
  font-weight: 500; cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-elevated); color: var(--text-secondary);
  font-family: inherit; transition: all 0.3s;
}
.btn-copy:hover { background: var(--bg); }
.btn-copy.copied { background: rgba(52,199,89,0.1); color: var(--success); border-color: var(--success); }

@media (max-width: 600px) {
  .itin-place-row { flex-wrap: wrap; }
  .itin-place-btns { width: 100%; }
}

/* ===== Hotel/Content Tabs (embedded fragment styles) ===== */
${hotelStyles}

/* ===== Responsive top nav ===== */
@media (max-width: 768px) {
  .hero { padding: 32px 16px 0; }
  .hero h1 { font-size: 1.8rem; }
  .hero .subtitle { font-size: 0.9rem; }
  .top-nav { border: none; padding: 4px; background: transparent; box-shadow: none; border-radius: 0; }
  .top-tab { padding: 8px 12px; font-size: 0.8rem; border-radius: var(--radius-sm); background: var(--bg-elevated); border: 1px solid var(--border); margin-right: 4px; margin-bottom: 4px; }
  .top-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }
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
