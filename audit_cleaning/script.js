//#region Basemap Definitions

const osm = {
    name: "OpenStreetMap",
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    maxzoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A';

const satellite = {
    name: "Satellite",
    tiles: [`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.jpg90?access_token=${MAPBOX_TOKEN}`],
    maxzoom: 20,
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

const baseLayers = { osm, satellite, cartoLight, cartoPositron };

//#endregion

const DATA_ROOT = '../download_center/data';

//#region Map Container
const map = new maplibregl.Map({
    container: 'map-container',
    style: { version: 8, sources: {}, layers: [], glyphs: `https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=${MAPBOX_TOKEN}` },
    center: [77.6, 12.99],
    zoom: 10.6,
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

//#region Data Manager

let auditData = [];
let communityData = [];

async function loadAuditData() {
    const [f1Text, f2Text, f3Text] = await Promise.all([
        fetch('../audit_dashboard/data/csv/form-1.csv').then(r => r.text()),
        fetch('../audit_dashboard/data/csv/form-2.csv').then(r => r.text()),
        fetch('../audit_dashboard/data/csv/form-3.csv').then(r => r.text()),
    ]);

    const f1 = Papa.parse(f1Text, { header: true, skipEmptyLines: true }).data.slice(1);
    const f2 = Papa.parse(f2Text, { header: true, skipEmptyLines: true }).data.slice(1);

    // form-2 lookup keyed by _index_f1 (references form-1._index)
    const f2ByIndex = new Map(f2.map(row => [row._index_f1, row]));

    // Joined records — form-1 fields win shared columns; _f2_uuid and _f2_index preserved separately
    auditData = f1.map(row => {
        const f2row = f2ByIndex.get(row._index) ?? {};
        return { ...f2row, ...row,_f2_index: f2row._index, _f2_rootUuid: f2row._rootUuid ?? null };
    });

    // GeoJSON — coordinates always from form-1; _f2_uuid preserved for image paths
    const geojson = {
        type: 'FeatureCollection',
        features: f1
            .filter(r => r.lat && r.long)
            .map(r => {
                const f2row = f2ByIndex.get(r._index) ?? {};
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [+r.long, +r.lat] },
                    properties: { ...f2row, ...r, _f2_rootUuid: f2row._rootUuid ?? null, _f2_index: f2row._index ?? null }
                };
            })
    };

    // Green if _validation_status = yes, otherwise orange
    const validatedColor = ['case', ['==', ['get', '_validation_status'], 'yes'], '#00c853', '#ff6b35'];
    addPointLayer('audit-points', geojson, { color: validatedColor, radius: 6, strokeColor: '#fff', strokeWidth: 1.5 });
    map.setFilter('audit-points', ['!=', ['get', '_validation_status'], 'no']);

    if (map.getLayer('audit-points-labels')) map.removeLayer('audit-points-labels');
    map.addLayer({
        id: 'audit-points-labels', type: 'symbol', source: 'audit-points', minzoom: 13,
        layout: {
            'text-field': ['get', '_index'],
            'text-size': 13,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-anchor': 'bottom',
            'text-offset': [0, -1.2],
            'text-allow-overlap': true
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#e53935',
            'text-halo-width': 9
        }
    });
    map.setFilter('audit-points-labels', ['!=', ['get', '_validation_status'], 'no']);

    // Form-2 records with no matching form-1 entry — plot using form-2 coordinates
    const f1IndexSet = new Set(f1.map(r => r._index));
    const unmatchedF2 = f2.filter(r => r.lat && r.long && !f1IndexSet.has(r._index_f1));
    const geojsonF2 = {
        type: 'FeatureCollection',
        features: unmatchedF2.map(r => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [+r.long, +r.lat] },
            properties: { ...r, _f2_rootUuid: r._rootUuid ?? null, _f2_index: r._index ?? null, _f2_only: true }
        }))
    };
    // Green if _validation_status = yes, otherwise pink
    const validatedColorF2 = ['case', ['==', ['get', '_validation_status'], 'yes'], '#00c853', '#ff80c0'];
    addPointLayer('audit-points-f2', geojsonF2, { color: validatedColorF2, radius: 6, strokeColor: '#fff', strokeWidth: 1.5 });
    map.setFilter('audit-points-f2', ['!=', ['get', '_validation_status'], 'no']);

    if (map.getLayer('audit-points-f2-labels')) map.removeLayer('audit-points-f2-labels');
    map.addLayer({
        id: 'audit-points-f2-labels', type: 'symbol', source: 'audit-points-f2', minzoom: 13,
        layout: {
            'text-field': ['get', '_index'],
            'text-size': 13,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-anchor': 'top',
            'text-offset': [0, 1.2],
            'text-allow-overlap': true
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#7878ffff',
            'text-halo-width': 9
        }
    });
    map.setFilter('audit-points-f2-labels', ['!=', ['get', '_validation_status'], 'no']);

    const f3Raw = Papa.parse(f3Text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() }).data;
    communityData = f3Raw.map(row => ({
        team_code:        row['1.2 Team code']?.trim(),
        _drain:           row['_drain']?.trim(),
        _secondarydrain:  row['_secondarydrain']?.trim(),
        flood_history:    row['2.1 Does the drain have a history of flooding?']?.trim(),
        flood_height:     row['2.2 During heavy rain, approx. height of water that flows on the road?']?.trim(),
        desilting:        row['2.3 Does desilting happen often?']?.trim(),
        last_cleaned:     row['2.4 When was this SWD last cleaned?']?.trim(),
        drain_maintainer: row['2.5 Does the local community know who maintains the drain?']?.trim(),
        _uuid:            row['_uuid'],
        _validation_status: row['_validation_status'],
    })).filter(r => r._drain);

    console.log(`✓ Loaded ${auditData.length} audit records (${geojson.features.length} with coordinates, ${geojsonF2.features.length} form-2 only), ${communityData.length} community interviews`);

    window._dropdownFilters = {};
    window._chartFilters = {};
    window._applyChartFilters = buildAndApplyFilter;
    renderInfrastructureCharts(auditData);
    renderWaterQualityCharts(auditData);
    renderCommunityCharts(auditData, communityData);

    makeFilterDropdown({ id: 'team-filter', fields: ['team_code'], el: teamSelect });
    makeFilterDropdown({
        id: 'drain-filter',
        placeholder: 'Drain',
        fields: ['_drain', '_secondarydrain'],
        insertAfter: '#team-filter',
    });
}

//#endregion

//#region Layers

function addLayers() {
    const statusColor = ['match', ['get', 'Status'], 1, '#ff2222', '#0d6aff'];
    addLineLayer('primarydrains', `${DATA_ROOT}/json/primarydrains.geojson`, { color: statusColor, width: 2 });
    addLineLayer('secondarydrains', `${DATA_ROOT}/json/secondarydrains.geojson`, { color: statusColor, width: 1.5, opacity: 0.8 });

    addLayer('typology', `${DATA_ROOT}/json/typology.geojson`, 'line', {
        'line-color': [
            'match', ['get', 'typology_code'],
            't1',  '#FF0000',
            't2',  '#ff7900',
            't4',  '#db3ee9',
            't5',  '#4ed84e',
            't6',  '#F1C40F',
            't7',  '#7D3C98',
            't8',  '#27AE60',
            't9',  '#BA4A00',
            't10', '#10611e',
            't11', '#2C3E50',
            't12', '#efc700',
            '#999999'
        ],
        'line-opacity': 1,
        'line-width': 6
    }, { 'line-cap': 'round', 'line-join': 'round' });
}

//#endregion

//#region Interactivity Audit Points

let activePopups = [];

function closeAuditPopups() {
    if (activePopups.length === 0) return;
    const toClose = activePopups;
    activePopups = [];
    toClose.forEach(p => p.remove());
}

function imgTag(uuid, filename, formNum) {
    if (!filename || !uuid) return '';
    const cleanUuid = uuid.replace('uuid:', '');
    const src = `../audit_dashboard/data/media_compressed/form-${formNum}/images/${cleanUuid}/${filename}`;
    return `<img src="${src}" onerror="this.style.display='none'" alt="" />`;
}

function row(label, value) {
    if (!value) return '';
    return `<div class="popup-row"><div class="popup-attr">${label}</div><div class="popup-val">${value}</div></div>`;
}

function imgRow(label, uuid, filename, formNum) {
    if (!filename || !uuid) return '';
    const tag = imgTag(uuid, filename, formNum);
    if (!tag) return '';
    return `<div class="popup-row"><div class="popup-attr">${label}</div><div class="popup-val popup-val-img">${tag}</div></div>`;
}

function buildForm1HTML(p) {
    if (!p._index) return null;
    const uuid = p._rootUuid || '';
    return `<div class="popup-form popup-f1">
        <div class="popup-header">Form 1 — Structural Audit</div>
        <div class="popup-subheader">${p._drain || ''} · ${p.team_code || ''} · ${p.rhs_lhs || ''}</div>
        ${row('Index', p._index)}
        ${row('Condition of the retaining wall', p.wall_condition)}
        ${row('Height of retaining wall (approx.)', p.wall_height ? p.wall_height + ' ft' : null)}
        ${row('Fence on top of retaining wall', p.fence)}
        ${row('Material of retaining wall', p.wall_material)}
        ${imgRow('Picture of the retaining wall', uuid, p.wall_pic, 1)}
        ${imgRow('Photo of the street', uuid, p.street_pic, 1)}
        ${row('Type of bridge', p.bridge_type)}
        ${row('Bridge condition', p.bridge_condition)}
        ${row('Bridge walkable', p.bridge_walkable)}
        ${imgRow('Picture of the bridge', uuid, p.bridge_pic, 1)}
        ${row('Does the bridge have piers', p.piers_condition)}
        ${row('Number of piers', p.piers_num)}
        ${imgRow('Picture of bridge underside / piers', uuid, p.piers_pic, 1)}
        ${row('Electricity lines / transformers outside SWD', p.elec_condition)}
        ${imgRow('Picture of electricity lines', uuid, p.elec_pic, 1)}
        ${row('Cables or lines crossing the SWD', p.cables_condition)}
        ${imgRow('Picture of utility lines inside SWD', uuid, p.cables_pic, 1)}
        ${row('Manholes in the SWD', p.manholes_condition)}
        ${imgRow('Picture of manhole', uuid, p.manholes_pic, 1)}
    </div>`;
}

function buildForm2HTML(p) {
    if (!p._f2_index) return null;
    const uuid = p._f2_rootUuid || '';
    return `<div class="popup-form popup-f2">
        <div class="popup-header">Form 2 — Water Quality Audit</div>
        <div class="popup-subheader">${p._drain || ''} · ${p.team_code || ''} · ${p.rhs_lhs || ''}</div>
        ${row('Index', p._f2_index)}
        ${row('Authorised inlets connecting to SWD', p.inlets)}
        ${imgRow('Picture of stormwater inlets', uuid, p.inlets_pic, 2)}
        ${row('Unauthorised inlets connecting to SWD', p.unauthorised_inlets)}
        ${imgRow('icture of unauthorised inlets', uuid, p.unauthorised_inlets_pic, 2)}
        ${row('Any other observation', p.observations)}
        ${row('Is the water stagnant or flowing', p.water_stagnant)}
        ${row('Signs of contamination (visible indicators)', p.water_contamination)}
        ${row('Water colour', p.water_colour)}
        ${row('Turbidity', p.water_turbidity)}
        ${row('Odour (smell)', p.water_smell)}
        ${imgRow('Picture of water', uuid, p.water_pic, 2)}
        ${row('Solid waste inside the SWD', p.sw_inside)}
        ${row('Type of solid waste', p.sw_inside_type)}
        ${row('Likely source of waste', p.sw_inside_source)}
        ${imgRow('Picture of waste inside SWD', uuid, p.sw_inside_pic, 2)}
        ${row('Solid waste outside the SWD', p.sw_outside)}
        ${row('Type of waste outside', p.sw_outside_type)}
        ${row('Likely source of waste outside', p.sw_outside_source)}
        ${imgRow('Picture of waste outside SWD', uuid, p.sw_outside_pic, 2)}
        ${row('Signs of clean up effort', p.sw_clean_up)}
        ${row('Signs of community engagement', p.community_engagement)}
        ${imgRow('Picture of community engagement', uuid, p.community_engagement_pic, 2)}
    </div>`;
}

function openAuditPopup(lngLat, properties) {
    closeAuditPopups();

    const popup = new maplibregl.Popup({
        anchor: 'bottom',
        className: 'audit-popup'
    })
        .setLngLat(lngLat)
        .setHTML(`<div class="popup-container">${[buildForm1HTML(properties), buildForm2HTML(properties)].filter(Boolean).join('')}</div>`)
        .addTo(map);

    popup.on('close', closeAuditPopups);
    activePopups = [popup];
}

map.on('click', 'audit-points', (e) => {
    e.preventDefault();
    openAuditPopup(e.lngLat, e.features[0].properties);
});

map.on('mouseenter', 'audit-points', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'audit-points', () => { map.getCanvas().style.cursor = ''; });

map.on('click', 'audit-points-f2', (e) => {
    e.preventDefault();
    openAuditPopup(e.lngLat, e.features[0].properties);
});

map.on('mouseenter', 'audit-points-f2', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'audit-points-f2', () => { map.getCanvas().style.cursor = ''; });

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

addLineInteractivity('primarydrains', [
    { key: 'Drain num', bold: true },
    { key: 'Status', format: v => Number(v) === 0 ? 'Visible' : 'Not Visible' }
]);
//#endregion

//#region Map Load

    map.on('load', () => {
        console.log('✓ Map loaded');

        //Base Map Control
        const basemapControl = new BasemapControl({
            basemaps: baseLayers,
            initialBasemap: 'cartoPositron',
            width: '150px',
            height: '100px',
            keepOpen: false
        });
        map.addControl(basemapControl, 'top-right');

        addLayers();
        loadAuditData();
    });

    map.on('error', (e) => {
        console.error('Map error:', e);
    });

//#endregion

//#region Search

let searchMarker = null;

document.getElementById('typology-switch').addEventListener('change', (e) => {
    map.setLayoutProperty('typology', 'visibility', e.target.checked ? 'visible' : 'none');
});

function makeFilterDropdown({ id, placeholder, fields, insertAfter, el: existingEl }) {
    const sel = existingEl || (() => {
        const s = document.createElement('wa-select');
        s.id = id;
        s.setAttribute('size', 'small');
        s.setAttribute('with-clear', '');
        s.setAttribute('placeholder', placeholder);
        s.className = 'team-filter-select';
        const anchor = typeof insertAfter === 'string'
            ? document.querySelector(insertAfter)
            : insertAfter;
        anchor.insertAdjacentElement('afterend', s);
        return s;
    })();

    sel.setAttribute('multiple', '');

    // Register entry first so populateOptions can read .values
    window._dropdownFilters[id] = { fields, values: new Set(), refresh: null };

    function populateOptions(data) {
        const available = new Set();
        for (const row of data) {
            for (const f of fields) {
                const v = row[f];
                if (v != null && v !== '') available.add(v);
            }
        }
        // Add options that don't exist yet; disable those not in available
        const existing = new Map([...sel.querySelectorAll('wa-option')].map(o => [o.value, o]));
        for (const v of [...available].sort()) {
            if (!existing.has(v)) {
                const opt = document.createElement('wa-option');
                opt.value = v;
                opt.textContent = v;
                sel.appendChild(opt);
                existing.set(v, opt);
            }
        }
        for (const [v, opt] of existing) {
            opt.disabled = !available.has(v);
        }
        // Drop selections that are no longer available
        const current = window._dropdownFilters[id].values;
        const stillValid = [...current].filter(v => available.has(v));
        window._dropdownFilters[id].values = new Set(stillValid);
    }

    window._dropdownFilters[id].refresh = populateOptions;
    populateOptions(auditData);

    sel.addEventListener('change', () => {
        const raw = sel.value;
        const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        window._dropdownFilters[id].values = new Set(arr);
        buildAndApplyFilter();
    });
    sel.addEventListener('wa-clear', () => {
        window._dropdownFilters[id].values = new Set();
        buildAndApplyFilter();
    });
}

const teamSelect = document.getElementById('team-filter');

function getFilteredCommunityData() {
    return communityData.filter(row => {
        for (const { fields, values } of Object.values(window._dropdownFilters || {})) {
            if (values.size > 0 && !fields.some(f => values.has(row[f]))) return false;
        }
        return true;
    });
}

function getFilteredAuditData() {
    return auditData.filter(row => {
        for (const { fields, values } of Object.values(window._dropdownFilters || {})) {
            if (values.size > 0 && !fields.some(f => values.has(row[f]))) return false;
        }
        for (const [field, keys] of Object.entries(window._chartFilters || {})) {
            if (keys && keys.size > 0 && !keys.has(row[field])) return false;
        }
        return true;
    });
}

function refreshDropdownOptions() {
    for (const [fid, fdef] of Object.entries(window._dropdownFilters || {})) {
        const crossData = auditData.filter(row => {
            for (const [oid, odef] of Object.entries(window._dropdownFilters)) {
                if (oid === fid) continue;
                if (odef.values.size > 0 && !odef.fields.some(f => odef.values.has(row[f]))) return false;
            }
            return true;
        });
        fdef.refresh(crossData);
    }
}

function buildAndApplyFilter() {
    const base = ['!=', ['get', '_validation_status'], 'no'];
    const parts = [base];
    for (const { fields, values } of Object.values(window._dropdownFilters || {})) {
        if (values.size > 0) {
            const exprs = [...values].flatMap(v => fields.map(f => ['==', ['get', f], v]));
            parts.push(['any', ...exprs]);
        }
    }
    for (const [field, keys] of Object.entries(window._chartFilters || {})) {
        if (keys && keys.size > 0) {
            parts.push(['in', ['get', field], ['literal', [...keys]]]);
        }
    }
    const filter = parts.length === 1 ? parts[0] : ['all', ...parts];
    if (map.getLayer('audit-points'))         map.setFilter('audit-points', filter);
    if (map.getLayer('audit-points-f2'))      map.setFilter('audit-points-f2', filter);
    if (map.getLayer('audit-points-labels'))    map.setFilter('audit-points-labels', filter);
    if (map.getLayer('audit-points-f2-labels')) map.setFilter('audit-points-f2-labels', filter);

    const filtered = getFilteredAuditData();
    renderInfrastructureCharts(filtered);
    renderWaterQualityCharts(filtered);
    renderCommunityCharts(filtered, getFilteredCommunityData());
    refreshDropdownOptions();

    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) resetBtn.style.display = Object.keys(window._chartFilters || {}).length ? '' : 'none';
}

function resetAllChartFilters() {
    window._chartFilters = {};
    buildAndApplyFilter();
}

document.getElementById('reset-filters-btn')?.addEventListener('click', resetAllChartFilters);


window.addEventListener('load', () => {
    const searchBox = document.getElementById('search-box');
    searchBox.accessToken = 'pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A';
    searchBox.options = {
        types: 'address,poi',
        proximity: [77.5946, 12.9716]
    };
    searchBox.addEventListener('retrieve', e => {
        const coords = e.detail.features[0].geometry.coordinates;
        map.flyTo({ center: coords, zoom: 10 });
        if (searchMarker) searchMarker.remove();
        searchMarker = new maplibregl.Marker({ color: '#ff0000ff' })
            .setLngLat(coords)
            .addTo(map);
    });
});

//#endregion