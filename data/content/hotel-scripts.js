function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    event.target.classList.add('active');
}

// Sorting
(function() {
    const table = document.getElementById('mainRankTable');
    if (!table) return;
    const headers = table.querySelectorAll('th');
    let currentSort = { col: null, dir: 'asc' };

    headers.forEach((th, colIdx) => {
        th.addEventListener('click', function() {
            const isNum = th.dataset.type === 'num';
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));

            if (currentSort.col === colIdx) {
                currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.col = colIdx;
                currentSort.dir = 'asc';
            }

            headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
            th.classList.add('sorted-' + currentSort.dir);

            rows.sort((a, b) => {
                const cellA = a.cells[colIdx];
                const cellB = b.cells[colIdx];
                let valA = cellA.dataset.sort || cellA.textContent.trim();
                let valB = cellB.dataset.sort || cellB.textContent.trim();

                if (isNum) {
                    valA = parseFloat(valA) || 0;
                    valB = parseFloat(valB) || 0;
                    return currentSort.dir === 'asc' ? valA - valB : valB - valA;
                } else {
                    return currentSort.dir === 'asc'
                        ? valA.localeCompare(valB, 'zh-Hant')
                        : valB.localeCompare(valA, 'zh-Hant');
                }
            });

            rows.forEach(r => tbody.appendChild(r));
        });
    });
})();

// Countdown calculator
(function() {
    const now = new Date();
    const targets = [
        { id: 'countdown-jul1', date: new Date('2026-07-01T04:00:00Z') },
        { id: 'countdown-jul25', date: new Date('2026-07-25') },
        { id: 'countdown-aug', date: new Date('2026-08-15') },
    ];

    targets.forEach(t => {
        const diff = Math.ceil((t.date - now) / (1000 * 60 * 60 * 24));
        const el = document.getElementById(t.id);
        if (el) {
            if (diff > 0) {
                el.textContent = diff + ' 天';
            } else if (diff === 0) {
                el.textContent = '今天！';
            } else {
                el.textContent = '已過期';
            }
        }
    });
})();

// Map layer toggle
function toggleMapLayer(btn) {
    var layer = btn.dataset.layer;
    var activeClass = 'active';
    if (layer === 'route-a') activeClass = 'active-route-a';
    else if (layer === 'route-b') activeClass = 'active-route-b';
    else if (layer === 'route-c') activeClass = 'active-route-c';
    else if (layer === 'food') activeClass = 'active-food';
    else if (layer === 'onsen') activeClass = 'active-onsen';
    else if (layer === 'sight') activeClass = 'active-sight';

    btn.classList.toggle(activeClass);
    var isActive = btn.classList.contains(activeClass);
    var layers = document.querySelectorAll('.map-layer[data-layer="' + layer + '"]');
    layers.forEach(function(el) {
        el.style.display = isActive ? '' : 'none';
    });
}

// Map tooltip
(function() {
    var tooltip = document.getElementById('mapTooltip');
    var svgWrap = document.querySelector('.map-svg-wrap');
    if (!tooltip || !svgWrap) return;

    var markers = document.querySelectorAll('.map-marker');
    markers.forEach(function(marker) {
        marker.style.cursor = 'pointer';
        marker.addEventListener('mouseenter', function(e) {
            var tip = marker.dataset.tip;
            if (!tip) return;
            tooltip.textContent = tip;
            tooltip.classList.add('visible');
            positionTooltip(e);
        });
        marker.addEventListener('mousemove', positionTooltip);
        marker.addEventListener('mouseleave', function() {
            tooltip.classList.remove('visible');
        });
    });

    function positionTooltip(e) {
        var rect = svgWrap.getBoundingClientRect();
        var x = e.clientX - rect.left + 12;
        var y = e.clientY - rect.top - 30;
        if (x + 220 > rect.width) x = x - 240;
        if (y < 0) y = e.clientY - rect.top + 15;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }
})();
