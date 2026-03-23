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
    maxZoom: 18,
    clickTolerance: 15
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
    const statusColor = ['match', ['get', 'Status'], 1, '#ffaa0dc7', '#0dbaffff'];
    addLineLayer('primarydrains', 'data/json/primarydrains.geojson', { color: statusColor, width: 2.5 });
    addLineLayer('secondarydrains', 'data/json/secondarydrains.geojson', { color: statusColor, width: 2.5, opacity: 0.8 });
    addLineLayer('gbaboundary', 'data/json/gba_boundary.geojson', { color: '#ffffff', width: 2, opacity: 0.8 });

    // Invisible wide buffer layers for easier hover/click on drain lines
    addLayer('primarydrains-buffer', 'data/json/primarydrains.geojson', 'line',
        { 'line-color': 'transparent', 'line-width': 20, 'line-opacity': 0 },
        { 'line-cap': 'round', 'line-join': 'round' }
    );
    addLayer('secondarydrains-buffer', 'data/json/secondarydrains.geojson', 'line',
        { 'line-color': 'transparent', 'line-width': 20, 'line-opacity': 0 },
        { 'line-cap': 'round', 'line-join': 'round' }
    );
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
    const [xlsxBuffer, priJson, secJson] = await Promise.all([
        fetch('data/csv/drains_auditing.xlsx').then(r => r.arrayBuffer()),
        fetch('data/json/primarydrains.geojson').then(r => r.json()),
        fetch('data/json/secondarydrains.geojson').then(r => r.json())
    ]);

    const wb = XLSX.read(new Uint8Array(xlsxBuffer), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

    // Build lookup maps
    const priMap = new Map(); // numeric id -> {area, name}
    const secMap = new Map(); // numeric id -> {area, name}

    rows.forEach(row => {
        const info = {
            area: (row.area || '').trim(),
            name: (row.name || '').trim(),
            status: (row.status || '').trim().toLowerCase(),
            captain: (row.team_captain_name || '').toString().trim(),
            institute: (row.team_captain_institute || '').toString().trim(),
            crew: (row.team_crew_name || '').toString().trim(),
            imgId: (row.img_id || '').toString().trim()
        };
        if (row.pri_drain_id) {
            String(row.pri_drain_id).split(',').map(s => s.trim()).filter(Boolean)
                .forEach(id => priMap.set(Number(id), info));
        }
        if (row.sec_drain_id) {
            String(row.sec_drain_id).split(',').map(s => s.trim()).filter(Boolean)
                .forEach(id => secMap.set(Number(id), info));
        }
    });

    // Tag primary drain features
    const taggedPri = {
        ...priJson,
        features: priJson.features.map(f => {
            const info = priMap.get(f.properties.id);
            return info
                ? { ...f, properties: { ...f.properties, is_audited: true, audit_area: info.area, audit_name: info.name, audit_status: info.status, audit_captain: info.captain, audit_institute: info.institute, audit_crew: info.crew, audit_img: info.imgId } }
                : f;
        })
    };

    // Tag secondary drain features
    const taggedSec = {
        ...secJson,
        features: secJson.features.map(f => {
            const info = secMap.get(f.properties.sec_id);
            return info
                ? { ...f, properties: { ...f.properties, is_audited: true, audit_area: info.area, audit_name: info.name, audit_status: info.status, audit_captain: info.captain, audit_institute: info.institute, audit_crew: info.crew, audit_img: info.imgId } }
                : f;
        })
    };

    map.getSource('primarydrains').setData(taggedPri);
    map.getSource('secondarydrains').setData(taggedSec);

    // Colour by audit status; fall back to drain visibility colour for unassigned
    const drainColor = ['match', ['get', 'Status'], 1, '#ffaa0d81', '#0df7ff96'];
    const auditColor = [
        'case',
        ['==', ['get', 'audit_status'], 'done'],        '#00ff0dff',
        ['==', ['get', 'audit_status'], 'in progress'], '#ff47f0ff',
        drainColor
    ];
    map.setPaintProperty('primarydrains', 'line-color', auditColor);
    map.setPaintProperty('secondarydrains', 'line-color', auditColor);

    // Keep buffer layers in sync with tagged data for correct popup properties
    map.getSource('primarydrains-buffer').setData(taggedPri);
    map.getSource('secondarydrains-buffer').setData(taggedSec);

    addAuditDrainInteractivity('primarydrains-buffer');
    addAuditDrainInteractivity('secondarydrains-buffer');

    const priCount = taggedPri.features.filter(f => f.properties.is_audited).length;
    const secCount = taggedSec.features.filter(f => f.properties.is_audited).length;
    console.log(`✓ Audit assignments: ${priCount} primary, ${secCount} secondary drains`);
    const withInstitute = [...taggedPri.features, ...taggedSec.features].filter(f => f.properties.audit_institute);
    console.log(`✓ Institute data: ${withInstitute.length} drains, sample:`, withInstitute[0]?.properties?.audit_institute);

    // Calculate total length by audit status and update legend
    const allFeatures = [...taggedPri.features, ...taggedSec.features];
    const sumKm = (status) => allFeatures
        .filter(f => (f.properties.audit_status || '').toLowerCase() === status)
        .reduce((acc, f) => acc + (parseFloat(f.properties.length_m) || 0), 0) / 1000;

    const donKm = sumKm('done');
    const inpKm = sumKm('in progress');

    document.getElementById('legend-km-done').textContent =
        donKm > 0 ? `${donKm.toFixed(1)} km` : '—';
    document.getElementById('legend-km-inprogress').textContent =
        inpKm > 0 ? `${inpKm.toFixed(1)} km` : '—';
}

function updateTeamPanel(p) {
    const captain   = p.audit_captain   || '';
    const institute = p.audit_institute || '';
    const crew      = p.audit_crew      || '';
    const imgId     = p.audit_img       || '';

    const el = id => document.getElementById(id);
    const captainRow = el('captain-row');
    const crewRow    = el('crew-row');

    if (captainRow) {
        if (captain) {
            if (el('team-captain')) el('team-captain').innerHTML = `<span class="team-capt-name">${captain}</span>`;
            if (el('captain-desc')) el('captain-desc').style.display = 'none';
            if (el('team-institute')) {
                if (institute) {
                    el('team-institute').innerHTML = `<span class="team-institute-name">${institute}</span>`;
                    el('team-institute').style.display = 'block';
                } else {
                    el('team-institute').style.display = 'none';
                }
            }
            captainRow.style.display = 'flex';
        } else {
            captainRow.style.display = 'none';
        }
    }

    if (crewRow) {
        if (crew) {
            if (el('crew-name')) el('crew-name').innerHTML = `<span class="team-crew-name">${crew}</span>`;
            if (el('crew-desc')) el('crew-desc').style.display = 'none';
            crewRow.style.display = 'flex';
        } else {
            crewRow.style.display = 'none';
        }
    }

    if (el('team-img')) {
        el('team-img').style.backgroundImage = imgId ? `url('data/images/${imgId}.jpeg')` : 'none';
        el('team-img').style.display = imgId ? 'block' : 'none';
    }
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

        if (s === 'done') {
            updateTeamPanel(p);
            document.getElementById('team-img').style.display = 'block';
        } else {
            document.getElementById('team-captain').innerHTML = '';
            document.getElementById('crew-name').innerHTML = '';
            document.getElementById('team-img').style.display = 'none';
        }
    });
}

//#endregion

//#region Map Load

    map.on('load', () => {
        console.log('✓ Map loaded');
        map.resize();

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

        // Clear team details when clicking empty map area
        map.on('click', (e) => {
            if (!e.defaultPrevented) {
                const el = id => document.getElementById(id);
                if (el('team-captain'))   el('team-captain').innerHTML = '';
                if (el('team-institute')) { el('team-institute').innerHTML = ''; el('team-institute').style.display = 'none'; }
                if (el('crew-name'))      el('crew-name').innerHTML = '';
                if (el('team-img'))      el('team-img').style.display = 'none';
                if (el('captain-row'))   el('captain-row').style.display = 'flex';
                if (el('crew-row'))      el('crew-row').style.display = 'flex';
                if (el('captain-desc'))  el('captain-desc').style.display = '';
                if (el('crew-desc'))     el('crew-desc').style.display = '';
            }
        });

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

    window.addEventListener('resize', () => map.resize());

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