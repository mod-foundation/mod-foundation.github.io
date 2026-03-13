//#region Basemap Definitions

const osm = {
    name: "OpenStreetMap",
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    maxzoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

const satellite = {
    name: "Satellite",
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    maxzoom: 19,
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
};

const cartoLight = {
    name: "Carto Light",
    tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
    ],
    maxzoom: 20,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
};

const cartoPositron = {
    name: "Carto Positron",
    tiles: [
        'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
    ],
    maxzoom: 20,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
};

const cartoDark = {
    name: "Carto Dark",
    tiles: [
        'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'
    ],
    maxzoom: 20,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
};

const baseLayers = { osm, satellite, cartoLight, cartoPositron, cartoDark };

//#endregion

//#region Map Container
const map = new maplibregl.Map({
    container: 'map-container',
    style: { version: 8, sources: {}, layers: [] },
    center: [77.5946, 12.9716],
    zoom: 11,
    pitch: 0,
    bearing: 0,
    minZoom: 5,
    maxZoom: 18
});
//#endregion

//#region Map Controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.addControl(new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: 'metric'
    }), 'bottom-right');

    map.addControl(new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
    }), 'top-right');



//#endregion

//#region Layer Helpers

/**
 * Add a GeoJSON source + layer to the map.
 * @param {string} id        - Unique layer/source id
 * @param {object|string} data - GeoJSON object or URL string
 * @param {'line'|'fill'|'circle'} type - Layer type
 * @param {object} paint     - MapLibre paint properties
 * @param {object} [layout]  - MapLibre layout properties (optional)
 * @param {string} [before]  - Insert before this layer id (optional)
 */
function addLayer(id, data, type, paint, layout = {}, before = undefined) {
    if (map.getSource(id)) {
        map.removeLayer(id);
        map.removeSource(id);
    }

    map.addSource(id, { type: 'geojson', data });

    map.addLayer({ id, type, source: id, paint, layout }, before);
}

/**
 * Add a line layer.
 * @param {string} id
 * @param {object|string} data
 * @param {{color?: string, width?: number, opacity?: number, dasharray?: number[]}} [params]
 */
function addLineLayer(id, data, {
    color = '#0d6aff',
    width = 2,
    opacity = 1,
    dasharray = undefined
} = {}) {
    const paint = {
        'line-color': color,
        'line-width': width,
        'line-opacity': opacity,
        ...(dasharray && { 'line-dasharray': dasharray })
    };
    addLayer(id, data, 'line', paint, { 'line-cap': 'round', 'line-join': 'round' });
}

/**
 * Add a polygon (fill) layer.
 * @param {string} id
 * @param {object|string} data
 * @param {{color?: string, opacity?: number, outlineColor?: string}} [params]
 */
function addPolygonLayer(id, data, {
    color = '#0d6aff',
    opacity = 0.4,
    outlineColor = '#0d6aff'
} = {}) {
    const paint = {
        'fill-color': color,
        'fill-opacity': opacity,
        'fill-outline-color': outlineColor
    };
    addLayer(id, data, 'fill', paint);
}

/**
 * Add a point (circle) layer.
 * @param {string} id
 * @param {object|string} data
 * @param {{color?: string, radius?: number, opacity?: number, strokeColor?: string, strokeWidth?: number}} [params]
 */
function addPointLayer(id, data, {
    color = '#0d6aff',
    radius = 6,
    opacity = 1,
    strokeColor = '#ffffff',
    strokeWidth = 1.5
} = {}) {
    const paint = {
        'circle-color': color,
        'circle-radius': radius,
        'circle-opacity': opacity,
        'circle-stroke-color': strokeColor,
        'circle-stroke-width': strokeWidth
    };
    addLayer(id, data, 'circle', paint);
}

//#endregion

//#region Layers

function addLayers() {
    const statusColor = ['match', ['get', 'Status'], 1, '#0d6aff81', '#0dbaffff'];
    addLineLayer('primarydrains', 'data/json/primarydrains.geojson', { color: statusColor, width: 2.5 });
    addLineLayer('secondarydrains', 'data/json/secondarydrains.geojson', { color: statusColor, width: 2.5, opacity: 0.8 });
    addLineLayer('gbaboundary', 'data/json/gba_boundary.geojson', { color: '#ffffff', width: 2, opacity: 0.8 });
}

//#endregion

//#region Drain Interactivity

/**
 * Add hover + click popup interactivity to a line layer.
 * @param {string} layerId
 * @param {Array<{label: string, key: string}>} attrs  — properties to display in the popup
 */
function addLineInteractivity(layerId, attrs) {
    let popup = null;

    map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; if (popup) { popup.remove(); popup = null; } });

    map.on('click', layerId, (e) => {
        e.preventDefault();
        const p = e.features[0].properties;
        const vals = attrs.map(({ key, format, bold }) => {
            const raw = p[key] ?? '';
            const display = format ? format(raw) : raw;
            return `<div class="drain-val${bold ? ' drain-val-bold' : ''}">${display}</div>`;
        }).join('');
        if (popup) popup.remove();
        popup = new maplibregl.Popup({ className: 'drain-popup', anchor: 'bottom' })
            .setLngLat(e.lngLat)
            .setHTML(`<div class="drain-popup-inner">${vals}</div>`)
            .addTo(map);
    });
}

//#endregion

//#region Audit Drain Assignment

async function loadAuditAssignments() {
    const [csvText, priJson, secJson] = await Promise.all([
        fetch('data/csv/drains_auditing.csv').then(r => r.text()),
        fetch('data/json/primarydrains.geojson').then(r => r.json()),
        fetch('data/json/secondarydrains.geojson').then(r => r.json())
    ]);

    const rows = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;

    // Build lookup maps
    const priMap = new Map(); // numeric id -> {area, name}
    const secMap = new Map(); // Drain num string -> {area, name}

    rows.forEach(row => {
        const info = { area: (row.area || '').trim(), name: (row.name || '').trim(), status: (row.status || '').trim().toLowerCase() };
        if (row.pri_drain_id) {
            row.pri_drain_id.split(',').map(s => s.trim()).filter(Boolean)
                .forEach(id => priMap.set(Number(id), info));
        }
        if (row.sec_drain_num) {
            row.sec_drain_num.split(',').map(s => s.trim()).filter(Boolean)
                .forEach(num => secMap.set(num, info));
        }
    });

    // Tag primary drain features
    const taggedPri = {
        ...priJson,
        features: priJson.features.map(f => {
            const info = priMap.get(f.properties.id);
            return info
                ? { ...f, properties: { ...f.properties, is_audited: true, audit_area: info.area, audit_name: info.name, audit_status: info.status } }
                : f;
        })
    };

    // Tag secondary drain features
    const taggedSec = {
        ...secJson,
        features: secJson.features.map(f => {
            const info = secMap.get((f.properties['Drain num'] || '').trim());
            return info
                ? { ...f, properties: { ...f.properties, is_audited: true, audit_area: info.area, audit_name: info.name, audit_status: info.status } }
                : f;
        })
    };

    map.getSource('primarydrains').setData(taggedPri);
    map.getSource('secondarydrains').setData(taggedSec);

    // Colour by audit status; fall back to drain visibility colour for unassigned
    const drainColor = ['match', ['get', 'Status'], 1, '#0defff63', '#0df7ff96'];
    const auditColor = [
        'case',
        ['==', ['get', 'audit_status'], 'done'],        '#00ff0dff',
        ['==', ['get', 'audit_status'], 'in progress'], '#ff47f0ff',
        drainColor
    ];
    map.setPaintProperty('primarydrains', 'line-color', auditColor);
    map.setPaintProperty('secondarydrains', 'line-color', auditColor);

    addAuditDrainInteractivity('primarydrains');
    addAuditDrainInteractivity('secondarydrains');

    const priCount = taggedPri.features.filter(f => f.properties.is_audited).length;
    const secCount = taggedSec.features.filter(f => f.properties.is_audited).length;
    console.log(`✓ Audit assignments: ${priCount} primary, ${secCount} secondary drains`);
}

function addAuditDrainInteractivity(layerId) {
    let popup = null;

    map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
        if (popup) { popup.remove(); popup = null; }
    });

    map.on('click', layerId, (e) => {
        e.preventDefault();
        const p = e.features[0].properties;
        if (popup) popup.remove();

        const drainNum = p['Drain num'] || '';
        const s = (p.audit_status || '').toLowerCase();
        const headerClass = s === 'done' ? 'adp-header adp-header--done'
            : s === 'in progress' ? 'adp-header adp-header--in-progress'
            : 'adp-header';
        const rows = [
            p.audit_area   ? `<div class="adp-row"><span class="adp-attr">Area</span><span class="adp-val">${p.audit_area}</span></div>` : '',
            p.audit_name   ? `<div class="adp-row"><span class="adp-attr">Auditor</span><span class="adp-val">${p.audit_name}</span></div>` : '',
            p.audit_status ? `<div class="adp-row"><span class="adp-attr">Audit status</span><span class="adp-val">${p.audit_status}</span></div>` : '',
            p.Status != null ? `<div class="adp-row"><span class="adp-attr">Drain visible</span><span class="adp-val">${Number(p.Status) === 0 ? 'Yes' : 'No'}</span></div>` : ''
        ].filter(Boolean).join('');

        popup = new maplibregl.Popup({ className: 'audit-drain-popup', anchor: 'bottom' })
            .setLngLat(e.lngLat)
            .setHTML(`<div class="adp-inner"><div class="${headerClass}">${drainNum}</div>${rows}</div>`)
            .addTo(map);
    });
}

//#endregion

//#region Map Load

    map.on('load', () => {
        console.log('✓ Map loaded');

        //Base Map Control
        const basemapControl = new BasemapControl({
            basemaps: baseLayers,
            initialBasemap: 'satellite',
            width: '150px',
            height: '100px',
            keepOpen: false
        });
        map.addControl(basemapControl, 'top-right');

        addLayers();
        loadAuditAssignments();

        // Dark overlay for satellite basemap
        map.addSource('dark-overlay-src', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]]] } }
        });
        map.addLayer({
            id: 'dark-overlay',
            type: 'fill',
            source: 'dark-overlay-src',
            paint: { 'fill-color': '#000000', 'fill-opacity': 0.3 }
        }, 'primarydrains');

        // Toggle overlay when basemap changes
        document.getElementById('map-container').addEventListener('change', e => {
            if (e.target.type === 'radio') {
                map.setLayoutProperty('dark-overlay', 'visibility',
                    e.target.value === 'satellite' ? 'visible' : 'none');
            }
        });
    });

    map.on('error', (e) => {
        console.error('Map error:', e);
    });

//#endregion

//#region Search

let searchMarker = null;

window.addEventListener('load', () => {
    const searchBox = document.getElementById('search-box');
    searchBox.accessToken = 'pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A';
    searchBox.options = {
        types: 'address,poi',
        proximity: [77.5946, 12.9716]
    };
    searchBox.addEventListener('retrieve', e => {
        const coords = e.detail.features[0].geometry.coordinates;
        map.flyTo({ center: coords, zoom: 15 });
        if (searchMarker) searchMarker.remove();
        searchMarker = new maplibregl.Marker({ color: '#ff69b4' })
            .setLngLat(coords)
            .addTo(map);
    });
});

//#endregion