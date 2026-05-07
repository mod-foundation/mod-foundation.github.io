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

//#region Map Container
const map = new maplibregl.Map({
    container: 'map-container',
    style: { version: 8, sources: {}, layers: [] },
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
        fetch('data/csv/form-1.csv').then(r => r.text()),
        fetch('data/csv/form-2.csv').then(r => r.text()),
        fetch('data/csv/form-3.csv').then(r => r.text()),
    ]);

    const f1 = Papa.parse(f1Text, { header: true, skipEmptyLines: true }).data.slice(1);
    const f2 = Papa.parse(f2Text, { header: true, skipEmptyLines: true }).data.slice(1);

    // form-2 lookup keyed by _index_f1 (references form-1._index)
    const f2ByIndex = new Map(f2.map(row => [row._index_f1, row]));

    // Joined records — form-1 fields win shared columns; _f2_uuid and _f2_index preserved separately
    auditData = f1.map(row => {
        const f2row = f2ByIndex.get(row._index) ?? {};
        return { ...f2row, ...row,_f2_index: f2row._index, _f2_uuid: f2row._uuid ?? null };
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
                    properties: { ...f2row, ...r, _f2_uuid: f2row._uuid ?? null, _f2_index: f2row._index ?? null }
                };
            })
    };

    // Green if _validation_status = yes, otherwise orange
    const validatedColor = ['case', ['==', ['get', '_validation_status'], 'yes'], '#00c853', '#ff6b35'];
    addPointLayer('audit-points', geojson, { color: validatedColor, radius: 6, strokeColor: '#fff', strokeWidth: 1.5 });
    map.setFilter('audit-points', ['!=', ['get', '_validation_status'], 'no']);

    // Form-2 records with no matching form-1 entry — plot using form-2 coordinates
    const f1IndexSet = new Set(f1.map(r => r._index));
    const unmatchedF2 = f2.filter(r => r.lat && r.long && !f1IndexSet.has(r._index_f1));
    const geojsonF2 = {
        type: 'FeatureCollection',
        features: unmatchedF2.map(r => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [+r.long, +r.lat] },
            properties: { ...r, _f2_uuid: r._uuid ?? null, _f2_index: r._index ?? null, _f2_only: true }
        }))
    };
    // Green if _validation_status = yes, otherwise pink
    const validatedColorF2 = ['case', ['==', ['get', '_validation_status'], 'yes'], '#00c853', '#ff80c0'];
    addPointLayer('audit-points-f2', geojsonF2, { color: validatedColorF2, radius: 6, strokeColor: '#fff', strokeWidth: 1.5 });
    map.setFilter('audit-points-f2', ['!=', ['get', '_validation_status'], 'no']);

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
    addLineLayer('primarydrains', 'data/json/primarydrains.geojson', { color: statusColor, width: 2 });
    addLineLayer('secondarydrains', 'data/json/secondarydrains.geojson', { color: statusColor, width: 1.5, opacity: 0.8 });

    addLayer('typology', 'data/json/typology.geojson', 'line', {
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
    if (map.getLayer('audit-points'))    map.setFilter('audit-points', filter);
    if (map.getLayer('audit-points-f2')) map.setFilter('audit-points-f2', filter);

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
        map.flyTo({ center: coords, zoom: 15 });
        if (searchMarker) searchMarker.remove();
        searchMarker = new maplibregl.Marker({ color: '#ff0000ff' })
            .setLngLat(coords)
            .addTo(map);
    });
});

//#endregion

//#region Audit Point Click — Panel Update

function buildImgSrc(filename, uuid, formNum) {
    if (!filename || !uuid) return null;
    return `data/media_compressed/form-${formNum}/images/${uuid.replace('uuid:', '')}/${filename}`;
}

// fieldPicMap: field key → ordered list of pic candidates (first non-null src wins)
// fieldChartLabel: field key → chart container label used by charts.js
const PANEL_CONFIG = {
    'cat-retaining-wall': {
        defaultField: 'wall_condition',
        renderFn: () => renderInfrastructureCharts(getFilteredAuditData()),
        fieldPicMap: {
            wall_condition: [{ picField: 'wall_pic', uuidField: '_uuid', form: 1 }],
            wall_height:    [{ picField: 'wall_pic', uuidField: '_uuid', form: 1 }],
            fence:          [{ picField: 'wall_pic', uuidField: '_uuid', form: 1 }],
            wall_material:  [{ picField: 'wall_pic', uuidField: '_uuid', form: 1 }],
        },
        fieldChartLabel: {
            wall_condition: 'Wall Condition',
            wall_height:    'Wall Height (feet)',
            fence:          'Fence',
            wall_material:  'Wall Material',
        },
    },
    'cat-utilities': {
        defaultField: 'manholes_condition',
        renderFn: () => renderInfrastructureCharts(getFilteredAuditData()),
        fieldPicMap: {
            elec_condition:     [{ picField: 'elec_pic',     uuidField: '_uuid', form: 1 }],
            cables_condition:   [{ picField: 'cables_pic',   uuidField: '_uuid', form: 1 }],
            manholes_condition: [{ picField: 'manholes_pic', uuidField: '_uuid', form: 1 }],
        },
        fieldChartLabel: {
            elec_condition:     'Electrical',
            cables_condition:   'Cables',
            manholes_condition: 'Manholes',
        },
    },
    'cat-bridge': {
        defaultField: 'bridge_condition',
        renderFn: () => renderInfrastructureCharts(getFilteredAuditData()),
        fieldPicMap: {
            bridge_type:      [{ picField: 'bridge_pic', uuidField: '_uuid', form: 1 }],
            bridge_condition: [{ picField: 'bridge_pic', uuidField: '_uuid', form: 1 }],
            bridge_walkable:  [{ picField: 'bridge_pic', uuidField: '_uuid', form: 1 }],
            piers_condition:  [{ picField: 'piers_pic',  uuidField: '_uuid', form: 1 }],
            piers_num:        [{ picField: 'piers_pic',  uuidField: '_uuid', form: 1 }],
        },
        fieldChartLabel: {
            bridge_type:      'Bridge Type',
            bridge_condition: 'Bridge Condition',
            bridge_walkable:  'Walkable',
            piers_condition:  'Piers Condition',
            piers_num:        'Piers Count',
        },
    },
    'cat-water-quality': {
        defaultField: 'water_contamination',
        renderFn: () => renderWaterQualityCharts(getFilteredAuditData()),
        fieldPicMap: {
            inlets:              [{ picField: 'inlets_pic',              uuidField: '_f2_uuid', form: 2 }],
            unauthorised_inlets: [{ picField: 'unauthorised_inlets_pic', uuidField: '_f2_uuid', form: 2 }],
            water_stagnant:      [{ picField: 'water_pic', uuidField: '_f2_uuid', form: 2 }],
            water_contamination: [{ picField: 'water_pic', uuidField: '_f2_uuid', form: 2 }],
            water_colour:        [{ picField: 'water_pic', uuidField: '_f2_uuid', form: 2 }],
            water_turbidity:     [{ picField: 'water_pic', uuidField: '_f2_uuid', form: 2 }],
            water_smell:         [{ picField: 'water_pic', uuidField: '_f2_uuid', form: 2 }],
        },
        fieldChartLabel: {
            inlets:              'Authorised Inlets',
            unauthorised_inlets: 'Unauthorised Inlets',
            water_stagnant:      'Water Flow',
            water_contamination: 'Water Contamination',
            water_colour:        'Water Colour',
            water_turbidity:     'Water Turbidity',
            water_smell:         'Water Smell',
        },
    },
    'cat-solid-waste': {
        defaultField: 'sw_inside',
        renderFn: () => renderWaterQualityCharts(getFilteredAuditData()),
        fieldPicMap: {
            sw_inside:         [{ picField: 'sw_inside_pic',  uuidField: '_f2_uuid', form: 2 }],
            sw_inside_type:    [{ picField: 'sw_inside_pic',  uuidField: '_f2_uuid', form: 2 }],
            sw_inside_source:  [{ picField: 'sw_inside_pic',  uuidField: '_f2_uuid', form: 2 }],
            sw_outside:        [{ picField: 'sw_outside_pic', uuidField: '_f2_uuid', form: 2 }],
            sw_outside_type:   [{ picField: 'sw_outside_pic', uuidField: '_f2_uuid', form: 2 }],
            sw_outside_source: [{ picField: 'sw_outside_pic', uuidField: '_f2_uuid', form: 2 }],
        },
        fieldChartLabel: {
            sw_inside:         'Solid Waste Inside',
            sw_inside_type:    'Solid Waste Inside - Type',
            sw_inside_source:  'Solid Waste Inside',
            sw_outside:        'Solid Waste Outside',
            sw_outside_type:   'Solid Waste Outside - Type',
            sw_outside_source: 'Solid Waste Outside',
        },
    },
    'cat-street': {
        defaultField: 'community_engagement',
        renderFn: () => renderCommunityCharts(getFilteredAuditData(), communityData),
        fieldPicMap: {
            community_engagement: [
                { picField: 'community_engagement_pic', uuidField: '_f2_uuid', form: 2 },
                { picField: 'street_pic',               uuidField: '_uuid',    form: 1 },
            ],
        },
        fieldChartLabel: {
            community_engagement: 'Community Participation',
        },
    },
};

let _lastAuditProps = null;
const _activeField = {};

function _updatePic(el, catId, props) {
    const config = PANEL_CONFIG[catId];
    const img = el.querySelector('.panel-pic-img');
    if (!img) return;
    const field = _activeField[catId] || config.defaultField;
    const candidates = config.fieldPicMap[field] || [];
    let src = null;
    for (const p of candidates) {
        src = buildImgSrc(props[p.picField], props[p.uuidField], p.form);
        if (src) break;
    }
    img.src = src || '';
    img.style.display = src ? 'block' : 'none';
    img.onerror = () => { img.style.display = 'none'; };
}

function _updateChart(el, catId) {
    const config = PANEL_CONFIG[catId];
    const field = _activeField[catId] || config.defaultField;
    const label = config.fieldChartLabel[field];
    if (!label) return;
    const slot = el.querySelector('.chart-slot');
    const title = el.querySelector('.chart-title');
    if (slot)  slot.setAttribute('data-chart', label);
    if (title) title.textContent = label;
    // Suppress _resolveContainer warnings for unfound containers during targeted re-render
    const origWarn = console.warn;
    console.warn = () => {};
    config.renderFn();
    console.warn = origWarn;
}

function _applyBadge(badge, field, val) {
    badge.textContent = val;
    const color = getValueColor(field, val);
    badge.style.background = color || '#FAE49C';
    badge.style.color = color ? '#fff' : '#5E5E5E';
}

function initPanelDropdownListeners() {
    for (const [catId, config] of Object.entries(PANEL_CONFIG)) {
        _activeField[catId] = config.defaultField;
        const el = document.getElementById(catId);
        if (!el) continue;
        const select = el.querySelector('.attr-select');
        if (!select) continue;
        select.addEventListener('change', () => {
            const field = select.value;
            _activeField[catId] = field;
            const badge = el.querySelector('.attr-badge');
            if (badge) _applyBadge(badge, field, (_lastAuditProps && _lastAuditProps[field]) || '—');
            if (_lastAuditProps) _updatePic(el, catId, _lastAuditProps);
            _updateChart(el, catId);
        });
    }
}

initPanelDropdownListeners();

function updatePanels(props) {
    _lastAuditProps = props;
    const idText = [props._drain, props._index].filter(Boolean).join(' · ');

    for (const [catId, config] of Object.entries(PANEL_CONFIG)) {
        const el = document.getElementById(catId);
        if (!el) continue;

        const idEl = el.querySelector('.panel-id');
        if (idEl) idEl.textContent = idText || '—';

        _updatePic(el, catId, props);

        const field = _activeField[catId] || config.defaultField;
        const badge = el.querySelector('.attr-badge');
        if (badge) _applyBadge(badge, field, props[field] || '—');
    }
}

map.on('click', 'audit-points',     (e) => { e.preventDefault(); updatePanels(e.features[0].properties); });
map.on('click', 'audit-points-f2',  (e) => { e.preventDefault(); updatePanels(e.features[0].properties); });
map.on('mouseenter', 'audit-points',    () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'audit-points',    () => { map.getCanvas().style.cursor = ''; });
map.on('mouseenter', 'audit-points-f2', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'audit-points-f2', () => { map.getCanvas().style.cursor = ''; });

//#endregion