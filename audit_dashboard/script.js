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

//#region Data Manager

let auditData = [];

async function loadAuditData() {
    const [f1Text, f2Text] = await Promise.all([
        fetch('data/csv/form-1.csv').then(r => r.text()),
        fetch('data/csv/form-2.csv').then(r => r.text())
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

    addPointLayer('audit-points', geojson, { color: '#ff6b35', radius: 6, strokeColor: '#fff', strokeWidth: 1.5 });

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
    addPointLayer('audit-points-f2', geojsonF2, { color: '#ff80c0', radius: 6, strokeColor: '#fff', strokeWidth: 1.5 });

    console.log(`✓ Loaded ${auditData.length} audit records (${geojson.features.length} with coordinates, ${geojsonF2.features.length} form-2 only)`);

    renderInfrastructureCharts(auditData);
    renderWaterQualityCharts(auditData);
    renderCommunityCharts(auditData);
}

//#endregion

//#region Layers

function addLayers() {
    const statusColor = ['match', ['get', 'Status'], 1, '#ff2222', '#0d6aff'];
    addLineLayer('primarydrains', 'data/json/primarydrains.geojson', { color: statusColor, width: 2 });
    addLineLayer('secondarydrains', 'data/json/secondarydrains.geojson', { color: statusColor, width: 1.5, opacity: 0.8 });
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
    const src = `data/media/form-${formNum}/images/${cleanUuid}/${filename}`;
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
    const uuid = p._uuid || '';
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
    const uuid = p._f2_uuid || '';
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