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

//#region Pin Image
// FA location-dot (solid) rendered to ImageData via an off-screen canvas
function loadFAPin(color = '#82f984', height = 42) {
    const w = Math.round(height * 384 / 512);
    const h = height;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="${w}" height="${h}" overflow="visible">
        <path fill="${color}"  d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
    </svg>`;
    return new Promise(resolve => {
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        const img = new Image(w, h);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(ctx.getImageData(0, 0, w, h));
        };
        img.src = url;
    });
}
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
const _filterBroadcast = new BroadcastChannel('audit-filters');

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

    // Joined records — form-1 fields win shared columns; _f2_rootUuid and _f2_index preserved separately
    auditData = f1.map(row => {
        const f2row = f2ByIndex.get(row._index) ?? {};
        return { ...f2row, ...row,_f2_index: f2row._index, _f2_rootUuid: f2row._rootUuid ?? null };
    });

    // GeoJSON — coordinates always from form-1; _f2_rootUuid preserved for image paths
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
    addPointLayer('audit-points', geojson, { color: validatedColor, radius: 6, strokeColor: '#ffffff3f', strokeWidth: 1.5 });
    map.setFilter('audit-points', ['!=', ['get', '_validation_status'], 'no']);

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
    addPointLayer('audit-points-f2', geojsonF2, { color: validatedColorF2, radius: 6, strokeColor: '#ffffff67', strokeWidth: 1.5 });
    map.setFilter('audit-points-f2', ['!=', ['get', '_validation_status'], 'no']);

    // Location pin — marks the selected audit point
    if (!map.hasImage('location-pin')) map.addImage('location-pin', await loadFAPin('#ff00f2ff', 30));
    addLayer('audit-point-highlight',
        { type: 'FeatureCollection', features: [] },
        'symbol',
        {},
        {
            'icon-image': 'location-pin',
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
        }
    );

    const f3Raw = Papa.parse(f3Text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() }).data;
    // f3Raw[0] is KoboToolbox's sub-header row (long question text) — skip it
    communityData = f3Raw.slice(1).map(row => ({
        team_code:        row['team_code']?.trim(),
        _drain:           row['_drain']?.trim(),
        _secondarydrain:  row['_secondarydrain']?.trim(),
        flood_history:    row['flood_history']?.trim(),
        flood_height:     row['flood_height']?.trim(),
        desilting:        row['desiliting']?.trim(),    // CSV col is 'desiliting'
        last_cleaned:     row['last_cleaned']?.trim(),
        drain_maintainer: row['maintenance']?.trim(),   // CSV col is 'maintenance'
        _rootUuid:            row['_rootUuid'],
        _validation_status: row['_validation_status'],
    })).filter(r => r._drain);

    console.log(`✓ Loaded ${auditData.length} audit records (${geojson.features.length} with coordinates, ${geojsonF2.features.length} form-2 only), ${communityData.length} community interviews`);

    window._dropdownFilters = {};
    window._chartFilters = {};
    window._applyChartFilters = buildAndApplyFilter;
    renderInfrastructureCharts(auditData);
    renderWaterQualityCharts(auditData);
    renderCommunityCharts(auditData, communityData);

    makeFilterDropdown({ 
        id: 'team-filter', 
        fields: ['team_name'], el: teamSelect });
    makeFilterDropdown({
        id: 'drain-filter',
        placeholder: 'Drain',
        fields: ['_drain', '_secondarydrain'],
        insertAfter: '#team-filter',
    });
    makeFilterDropdown({
        id: 'corp-filter',
        placeholder: 'Corporation',
        fields: ['corporatio'],
        insertAfter: '#drain-filter',
    });
    makeFilterDropdown({
        id: 'valley-filter',
        placeholder: 'Valley',
        fields: ['valley'],
        insertAfter: '#corp-filter',
    });

    const defaultFeature = geojson.features.find(f => f.properties._index === '20');
    if (defaultFeature) {
        updatePanels(defaultFeature.properties);
        setHighlight(defaultFeature);
    }

    applyAttributeColor('water_colour');
}

//#endregion

//#region Layers

function addLayers() {
    const statusColor = ['match', ['get', 'Status'], 1, '#ff222267', '#0d6aff'];
    addLineLayer('primarydrains', '../data/json/primarydrains.geojson', { color: statusColor, width: 1.5, opacity: 0.8 });
    addLineLayer('secondarydrains', '../data/json/secondarydrains.geojson', { color: statusColor, width: 1, opacity: 0.8 });
    addLineLayer('gbaboundary', '../data/json/gba_boundary.geojson', { color: '#575757ff', width: 1, opacity: 0.8 });
    addLineLayer('gbacorporations', '../data/json/gba_corporations.geojson', { color: '#7a7a7aff', width: 0.5, opacity: 0.8 });
    addLineLayer('valleys', '../data/json/valley.geojson', { color: '#8a4343ff', width: 0.5, opacity: 0.3 });




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


addLineInteractivity('secondarydrains', [
    { key: 'Drain num', bold: true },
    { key: 'Status', format: v => Number(v) === 0 ? 'Visible' : 'Not Visible' }
]);
//#endregion

//#region Upload Control

class UploadControl {
    constructor() {
        this._layers = [];
    }

    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group upload-ctrl';
        this._container.innerHTML = `
            <button class="upload-toggle-btn" title="Upload KML layers">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
            </button>
            <div class="upload-panel" style="display:none">
                <div class="upload-panel-header">
                    <span>Uploaded Layers</span>
                    <span class="upload-count">0 / 5</span>
                </div>
                <label class="upload-browse-label">
                    <input type="file" class="upload-file-input" accept=".kml" style="display:none">
                    + Upload KML
                </label>
                <div class="upload-layer-list"></div>
            </div>
        `;
        this._container.querySelector('.upload-toggle-btn')
            .addEventListener('click', () => this._togglePanel());
        this._container.querySelector('.upload-file-input')
            .addEventListener('change', e => { this._handleFile(e.target.files[0]); e.target.value = ''; });
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }

    _togglePanel() {
        const panel = this._container.querySelector('.upload-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    _handleFile(file) {
        if (!file) return;
        if (this._layers.length >= 5) {
            alert('Maximum 5 layers can be uploaded. Remove a layer first.');
            return;
        }
        if (!file.name.toLowerCase().endsWith('.kml')) {
            alert('Only .kml files are supported.');
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(e.target.result, 'text/xml');
                if (kmlDoc.querySelector('parsererror')) throw new Error('Invalid KML');
                const geojson = toGeoJSON.kml(kmlDoc);
                if (!geojson.features?.length) throw new Error('No features found in file');
                this._addLayer(geojson, file.name);
            } catch (err) {
                alert('Could not read KML file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    _addLayer(geojson, filename) {
        const id = 'upload-' + Date.now();
        const color = '#e05c2a';
        const opacity = 0.8;
        const sublayers = [];

        const types = new Set(geojson.features.map(f => f.geometry?.type).filter(Boolean));
        const hasPolygon = types.has('Polygon') || types.has('MultiPolygon');
        const hasLine    = types.has('LineString') || types.has('MultiLineString');
        const hasPoint   = types.has('Point') || types.has('MultiPoint');

        this._map.addSource(id, { type: 'geojson', data: geojson });

        if (hasPolygon) {
            const fillId = id + '-fill';
            this._map.addLayer({
                id: fillId, type: 'fill', source: id,
                filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
                paint: { 'fill-color': color, 'fill-opacity': opacity * 0.4 }
            }, 'primarydrains');
            const outlineId = id + '-outline';
            this._map.addLayer({
                id: outlineId, type: 'line', source: id,
                filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
                paint: { 'line-color': color, 'line-width': 2, 'line-opacity': opacity }
            }, 'primarydrains');
            sublayers.push(fillId, outlineId);
        }
        if (hasLine) {
            const lineId = id + '-line';
            this._map.addLayer({
                id: lineId, type: 'line', source: id,
                filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
                paint: { 'line-color': color, 'line-width': 3, 'line-opacity': opacity }
            }, 'primarydrains');
            sublayers.push(lineId);
        }
        if (hasPoint) {
            const pointId = id + '-point';
            this._map.addLayer({
                id: pointId, type: 'circle', source: id,
                filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
                paint: { 'circle-color': color, 'circle-radius': 6, 'circle-opacity': opacity, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 }
            }, 'primarydrains');
            sublayers.push(pointId);
        }

        this._layers.push({ id, filename, sublayers, color, opacity });
        this._renderList();
    }

    _removeLayer(id) {
        const entry = this._layers.find(l => l.id === id);
        if (!entry) return;
        entry.sublayers.forEach(sl => { if (this._map.getLayer(sl)) this._map.removeLayer(sl); });
        if (this._map.getSource(id)) this._map.removeSource(id);
        this._layers = this._layers.filter(l => l.id !== id);
        this._renderList();
    }

    _setColor(id, color) {
        const entry = this._layers.find(l => l.id === id);
        if (!entry) return;
        entry.color = color;
        entry.sublayers.forEach(sl => {
            if (!this._map.getLayer(sl)) return;
            const type = this._map.getLayer(sl).type;
            if (type === 'fill')   this._map.setPaintProperty(sl, 'fill-color', color);
            if (type === 'line')   this._map.setPaintProperty(sl, 'line-color', color);
            if (type === 'circle') this._map.setPaintProperty(sl, 'circle-color', color);
        });
    }

    _setOpacity(id, opacity) {
        const entry = this._layers.find(l => l.id === id);
        if (!entry) return;
        entry.opacity = opacity;
        entry.sublayers.forEach(sl => {
            if (!this._map.getLayer(sl)) return;
            const type = this._map.getLayer(sl).type;
            if (type === 'fill')   this._map.setPaintProperty(sl, 'fill-opacity', opacity * 0.4);
            if (type === 'line')   this._map.setPaintProperty(sl, 'line-opacity', opacity);
            if (type === 'circle') this._map.setPaintProperty(sl, 'circle-opacity', opacity);
        });
    }

    _renderList() {
        const list  = this._container.querySelector('.upload-layer-list');
        const count = this._container.querySelector('.upload-count');
        const label = this._container.querySelector('.upload-browse-label');

        count.textContent = `${this._layers.length} / 5`;
        label.style.opacity = this._layers.length >= 5 ? '0.4' : '1';
        label.style.pointerEvents = this._layers.length >= 5 ? 'none' : '';

        list.innerHTML = this._layers.map(l => `
            <div class="upload-layer-item" data-id="${l.id}">
                <div class="upload-layer-name" title="${l.filename}">${l.filename}</div>
                <div class="upload-layer-controls">
                    <label class="upload-ctrl-label">Colour
                        <input type="color" class="upload-color" value="${l.color}">
                    </label>
                    <label class="upload-ctrl-label">Opacity
                        <input type="range" class="upload-opacity" min="0" max="1" step="0.05" value="${l.opacity}">
                    </label>
                    <button class="upload-remove-btn" title="Remove layer">&times;</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.upload-color').forEach(input => {
            const id = input.closest('[data-id]').dataset.id;
            input.addEventListener('input', e => this._setColor(id, e.target.value));
        });
        list.querySelectorAll('.upload-opacity').forEach(input => {
            const id = input.closest('[data-id]').dataset.id;
            input.addEventListener('input', e => this._setOpacity(id, parseFloat(e.target.value)));
        });
        list.querySelectorAll('.upload-remove-btn').forEach(btn => {
            const id = btn.closest('[data-id]').dataset.id;
            btn.addEventListener('click', () => this._removeLayer(id));
        });
    }
}

class DownloadControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group download-ctrl';
        this._container.innerHTML = `
            <button class="download-toggle-btn" title="Download data">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
            </button>
            <div class="download-panel" style="display:none">
                <div class="download-panel-header">Download Data</div>
                <a class="download-link" href="data/csv/form-1.csv" download="form-1.csv">
                    <span class="download-link-icon">&#8675;</span>
                    <span>
                        <span class="download-link-name">Form 1 Audit Data</span>
                        <span class="download-link-meta">CSV</span>
                    </span>
                </a>
                <a class="download-link" href="data/csv/form-2.csv" download="form-2.csv">
                    <span class="download-link-icon">&#8675;</span>
                    <span>
                        <span class="download-link-name">Form 2 Audit Data</span>
                        <span class="download-link-meta">CSV</span>
                    </span>
                </a>
                <a class="download-link" href="data/json/primarydrains.geojson" download="primarydrains.geojson">
                    <span class="download-link-icon">&#8675;</span>
                    <span>
                        <span class="download-link-name">Primary Drains</span>
                        <span class="download-link-meta">GeoJSON</span>
                    </span>
                </a>
                <a class="download-link" href="data/json/secondarydrains.geojson" download="secondarydrains.geojson">
                    <span class="download-link-icon">&#8675;</span>
                    <span>
                        <span class="download-link-name">Secondary Drains</span>
                        <span class="download-link-meta">GeoJSON</span>
                    </span>
                </a>
            </div>
        `;
        this._container.querySelector('.download-toggle-btn')
            .addEventListener('click', () => {
                const panel = this._container.querySelector('.download-panel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            });
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

//#endregion

//#region Map Load

    map.on('load', async () => {
        console.log('✓ Map loaded');

        // Add all basemap raster sources/layers at the bottom of the stack
        const _initialBasemap = 'cartoPositron';
        Object.entries(baseLayers).forEach(([key, bm]) => {
            map.addSource(key, {
                type: 'raster',
                tiles: bm.tiles,
                tileSize: 256,
                maxzoom: bm.maxzoom,
                attribution: bm.attribution,
            });
            map.addLayer({
                id: key,
                type: 'raster',
                source: key,
                layout: { visibility: key === _initialBasemap ? 'visible' : 'none' },
            });
        });

        addLayers();
        await loadAuditData();

        const layerLegend = new LayerManager({
            layers: [
                { id: 'primarydrains',   name: 'Primary Drains',   visible: true },
                { id: 'secondarydrains', name: 'Secondary Drains', visible: true },
                { id: 'gbaboundary',     name: 'GBA Boundary',     visible: true },
                { id: 'gbacorporations', name: 'Corporations',     visible: true },
                { id: 'audit-points',    name: 'Audit Points',     visible: true },
                { id: 'cartoPositron',   name: 'Carto Positron',   visible: true },
                { id: 'satellite',       name: 'Satellite',        visible: false },
                { id: 'osm',             name: 'OpenStreetMap',    visible: false },
            ],
            position: 'bottom-left',
            collapsed: true,
        });
        map.addControl(layerLegend, 'bottom-left');

        map.addControl(new UploadControl(), 'top-left');
        map.addControl(new DownloadControl(), 'top-left');
    });

    map.on('error', (e) => {
        console.error('Map error:', e);
    });

//#endregion

//#region Search

let searchMarker = null;


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
            if (keys && keys.size > 0) {
                if (MULTI_SELECT_FIELDS.has(field)) {
                    const tokens = new Set(String(row[field] ?? '').split(/\s+/).filter(Boolean));
                    if (![...keys].some(k => tokens.has(k))) return false;
                } else {
                    if (!keys.has(row[field])) return false;
                }
            }
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
            if (MULTI_SELECT_FIELDS.has(field)) {
                // Pad haystack and each needle with spaces so 'poster' won't match 'poster_murals'
                parts.push(['any', ...[...keys].map(k =>
                    ['in', ` ${k} `, ['concat', ' ', ['get', field], ' ']]
                )]);
            } else {
                parts.push(['in', ['get', field], ['literal', [...keys]]]);
            }
        }
    }
    const filter = parts.length === 1 ? parts[0] : ['all', ...parts];
    if (map.getLayer('audit-points'))    map.setFilter('audit-points', filter);
    if (map.getLayer('audit-points-f2')) map.setFilter('audit-points-f2', filter);

    // Filter drain + corporation layers by valley and/or corporation selection
    const valleyVals = window._dropdownFilters?.['valley-filter']?.values;
    const corpVals   = window._dropdownFilters?.['corp-filter']?.values;

    const drainParts = [];
    if (valleyVals?.size > 0) drainParts.push(['in', ['get', 'valley'],      ['literal', [...valleyVals]]]);
    if (corpVals?.size   > 0) drainParts.push(['in', ['get', 'corporatio'],  ['literal', [...corpVals]]]);
    const drainFilter = drainParts.length === 0 ? null
                      : drainParts.length === 1 ? drainParts[0]
                      : ['all', ...drainParts];

    if (map.getLayer('primarydrains'))   map.setFilter('primarydrains',   drainFilter);
    if (map.getLayer('secondarydrains')) map.setFilter('secondarydrains', drainFilter);

    const corpLayerFilter = corpVals?.size > 0
        ? ['in', ['get', 'corporatio'], ['literal', [...corpVals]]]
        : null;
    if (map.getLayer('gbacorporations')) map.setFilter('gbacorporations', corpLayerFilter);

    const filtered = getFilteredAuditData();
    renderInfrastructureCharts(filtered);
    renderWaterQualityCharts(filtered);
    renderCommunityCharts(filtered, getFilteredCommunityData());
    refreshDropdownOptions();

    const resetBtn = document.getElementById('reset-filters-btn');

    const filterState = {};
    for (const [id, def] of Object.entries(window._dropdownFilters || {})) {
        filterState[id] = { fields: def.fields, values: [...def.values] };
    }
    _filterBroadcast.postMessage(filterState);
}

function resetAllChartFilters() {
    window._chartFilters = {};
    buildAndApplyFilter();
}

document.getElementById('reset-filters-btn')?.addEventListener('click', resetAllChartFilters);

// Fields whose CSV values are space-separated multi-select tokens (KoboToolbox style)
const MULTI_SELECT_FIELDS = new Set(['community_engagement']);

let _activeColorField = 'water_contamination';

function applyAttributeColor(field = _activeColorField) {
    _activeColorField = field;
    document.querySelectorAll('.category-panel').forEach(p => p.classList.remove('panel-color-active'));
    const activePanelId = Object.keys(PANEL_CONFIG).find(id => field in PANEL_CONFIG[id].fieldPicMap);
    if (activePanelId) document.getElementById(activePanelId)?.classList.add('panel-color-active');
    const fallback = '#b6b6b6b4';
    let expr;
    if (MULTI_SELECT_FIELDS.has(field)) {
        // Explode multi-value strings to get unique tokens, then colour by first match
        const unique = [...new Set(
            auditData.flatMap(r => String(r[field] ?? '').split(/\s+/).filter(Boolean))
        )];
        if (!unique.length) {
            expr = fallback;
        } else {
            const pairs = unique.flatMap(val => [
                ['in', ` ${val} `, ['concat', ' ', ['get', field], ' ']],
                getValueColor(field, val) || fallback
            ]);
            expr = ['case', ...pairs, fallback];
        }
    } else {
        const unique = [...new Set(auditData.map(r => r[field]).filter(v => v != null && v !== ''))];
        if (!unique.length) {
            expr = fallback;
        } else {
            const pairs = unique.flatMap(val => [val, getValueColor(field, val) || fallback]);
            expr = ['match', ['get', field], ...pairs, fallback];
        }
    }
    if (map.getLayer('audit-points'))    map.setPaintProperty('audit-points',    'circle-color', expr);
    if (map.getLayer('audit-points-f2')) map.setPaintProperty('audit-points-f2', 'circle-color', expr);
}


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

function buildImgSrc(filename, _rootUuid, formNum) {
    if (!filename || !_rootUuid) return null;
    const cleanUuid = _rootUuid.replace('uuid:', '');
    return `https://pub-4d67c97c1d2843adbeffa3b98cd45d19.r2.dev/form-${formNum}/images/${cleanUuid}/${filename}`;
    //return `data/media/form-${formNum}/images/${uuid.replace('uuid:', '')}/${filename}`;
}

// fieldPicMap: field key → ordered list of pic candidates (first non-null src wins)
// fieldChartLabel: field key → chart container label used by charts.js
const PANEL_CONFIG = {
    'cat-retaining-wall': {
        defaultField: 'wall_condition',
        renderFn: () => renderInfrastructureCharts(getFilteredAuditData()),
        fieldPicMap: {
            wall_condition: [{ picField: 'wall_pic', uuidField: '_rootUuid', form: 1 }],
            wall_height:    [{ picField: 'wall_pic', uuidField: '_rootUuid', form: 1 }],
            fence:          [{ picField: 'wall_pic', uuidField: '_rootUuid', form: 1 }],
            wall_material:  [{ picField: 'wall_pic', uuidField: '_rootUuid', form: 1 }],
        },
        fieldChartLabel: {
            wall_condition: 'Wall Condition',
            wall_height:    'Wall Height (feet)',
            fence:          'Fence',
            wall_material:  'Wall Material',
        },
    },
    'cat-utilities': {
        defaultField: 'elec_condition',
        renderFn: () => renderInfrastructureCharts(getFilteredAuditData()),
        fieldPicMap: {
            elec_condition:     [{ picField: 'elec_pic',     uuidField: '_rootUuid', form: 1 }],
            cables_condition:   [{ picField: 'cables_pic',   uuidField: '_rootUuid', form: 1 }],
            manholes_condition: [{ picField: 'manholes_pic', uuidField: '_rootUuid', form: 1 }],
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
            bridge_type:      [{ picField: 'bridge_pic', uuidField: '_rootUuid', form: 1 }],
            bridge_condition: [{ picField: 'bridge_pic', uuidField: '_rootUuid', form: 1 }],
            bridge_walkable:  [{ picField: 'bridge_pic', uuidField: '_rootUuid', form: 1 }],
            piers_condition:  [{ picField: 'piers_pic',  uuidField: '_rootUuid', form: 1 }],
            piers_num:        [{ picField: 'piers_pic',  uuidField: '_rootUuid', form: 1 }],
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
            inlets:              [{ picField: 'inlets_pic',              uuidField: '_f2_rootUuid', form: 2 }],
            unauthorised_inlets: [{ picField: 'unauthorised_inlets_pic', uuidField: '_f2_rootUuid', form: 2 }],
            water_stagnant:      [{ picField: 'water_pic', uuidField: '_f2_rootUuid', form: 2 }],
            water_contamination: [{ picField: 'water_pic', uuidField: '_f2_rootUuid', form: 2 }],
            water_colour:        [{ picField: 'water_pic', uuidField: '_f2_rootUuid', form: 2 }],
            water_turbidity:     [{ picField: 'water_pic', uuidField: '_f2_rootUuid', form: 2 }],
            water_smell:         [{ picField: 'water_pic', uuidField: '_f2_rootUuid', form: 2 }],
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
            sw_inside:         [{ picField: 'sw_inside_pic',  uuidField: '_f2_rootUuid', form: 2 }],
            sw_inside_type:    [{ picField: 'sw_inside_pic',  uuidField: '_f2_rootUuid', form: 2 }],
            sw_inside_source:  [{ picField: 'sw_inside_pic',  uuidField: '_f2_rootUuid', form: 2 }],
            sw_outside:        [{ picField: 'sw_outside_pic', uuidField: '_f2_rootUuid', form: 2 }],
            sw_outside_type:   [{ picField: 'sw_outside_pic', uuidField: '_f2_rootUuid', form: 2 }],
            sw_outside_source: [{ picField: 'sw_outside_pic', uuidField: '_f2_rootUuid', form: 2 }],
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
                { picField: 'community_engagement_pic', uuidField: '_f2_rootUuid', form: 2 },
                { picField: 'street_pic',               uuidField: '_rootUuid',    form: 1 },
            ],
        },
        fieldChartLabel: {
            community_engagement: 'Community Participation',
        },
    },
};

let _lastAuditProps = null;
const _activeField = {};
const _picGeneration = {};

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
    const gen = (_picGeneration[catId] = (_picGeneration[catId] || 0) + 1);
    img.style.display = 'none';
    if (!src) { img.src = ''; return; }
    img.onerror = () => { if (_picGeneration[catId] === gen) img.style.display = 'none'; };
    img.onload  = () => { if (_picGeneration[catId] === gen) img.style.display = 'block'; };
    img.src = src;
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
    badge.textContent = getValueLabel(field, val) || val;
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
            applyAttributeColor(field);
        });
    }
}

initPanelDropdownListeners();

const auditPopup = new maplibregl.Popup({ className: 'audit-popup', maxWidth: '320px', anchor: 'top' });

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

function setHighlight(feature) {
    map.getSource('audit-point-highlight').setData({ type: 'FeatureCollection', features: [feature] });
}

map.on('click', 'audit-points', (e) => {
    e.preventDefault();
    const feat = e.features[0];
    updatePanels(feat.properties);
    setHighlight(feat);
    const obs = feat.properties.observations;
    if (obs && obs.trim()) {
        auditPopup.setLngLat(feat.geometry.coordinates.slice()).setText(obs).addTo(map);
    } else {
        auditPopup.remove();
    }
});
map.on('click', 'audit-points-f2', (e) => {
    e.preventDefault();
    const feat = e.features[0];
    updatePanels(feat.properties);
    setHighlight(feat);
    const obs = feat.properties.observations;
    if (obs && obs.trim()) {
        auditPopup.setLngLat(feat.geometry.coordinates.slice()).setText(obs).addTo(map);
    } else {
        auditPopup.remove();
    }
});
map.on('mouseenter', 'audit-points',    () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'audit-points',    () => { map.getCanvas().style.cursor = ''; });
map.on('mouseenter', 'audit-points-f2', () => { map.getCanvas().style.cursor = 'pointer'; });
map.on('mouseleave', 'audit-points-f2', () => { map.getCanvas().style.cursor = ''; });

//#region Info Panel Toggle
document.getElementById('info-toggle-btn').addEventListener('click', () => {
    document.body.classList.toggle('info-collapsed');
    map.resize();
});
//#endregion


//#endregion