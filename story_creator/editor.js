// Story Map Editor

maplibregl.addProtocol('cog', MaplibreCOGProtocol.cogProtocol);

// ─── State ────────────────────────────────────────────────────────────────────

let chapters = [...storyConfig.chapters];
let activeChapterIndex = null;
let editorMap = null;
let currentBasemap = mapConfig.defaultBasemap;
let userLayers = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeUI();
    renderChaptersList();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
}

// Returns the actual MapLibre layer IDs for a userLayer entry.
// Polygons use two sub-layers; everything else uses entry.id directly.
function getMapLayerIds(entry) {
    return entry.category === 'polygon'
        ? [`${entry.id}-fill`, `${entry.id}-outline`]
        : [entry.id];
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function initializeMap() {
    const bm = mapConfig.basemaps[mapConfig.defaultBasemap];

    editorMap = new maplibregl.Map({
        container: 'editor-map',
        style: {
            version: 8,
            glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
            sources: {
                basemap: {
                    type: 'raster',
                    tiles: bm.tiles,
                    tileSize: 256,
                    attribution: bm.attribution,
                },
            },
            layers: [
                { id: 'basemap-layer', type: 'raster', source: 'basemap', paint: { 'raster-opacity': 1 } },
            ],
        },
        center: mapConfig.initialView.center,
        zoom: mapConfig.initialView.zoom,
    });

    editorMap.on('move', updateViewInfo);
    editorMap.on('pitch', updateViewInfo);
    editorMap.on('rotate', updateViewInfo);
    editorMap.on('zoom', updateViewInfo);
}

function updateViewInfo() {
    document.getElementById('current-zoom').textContent = editorMap.getZoom().toFixed(2);
    document.getElementById('current-pitch').textContent = Math.round(editorMap.getPitch());
    document.getElementById('current-bearing').textContent = Math.round(editorMap.getBearing());
}

function switchBasemap(key) {
    currentBasemap = key;
    const bm = mapConfig.basemaps[key];
    if (editorMap && editorMap.getSource('basemap')) {
        editorMap.getSource('basemap').setTiles(bm.tiles);
    }
}

// ─── UI Initialisation ────────────────────────────────────────────────────────

function initializeUI() {
    initSidebarTabs();
    initBasemapButtons();
    initUploadPanel();

    document.getElementById('add-chapter-btn').addEventListener('click', addNewChapter);
    document.getElementById('capture-view-btn').addEventListener('click', captureCurrentView);

    document.getElementById('view-type').addEventListener('change', (e) => {
        const isBounds = e.target.value === 'bounds';
        document.getElementById('center-zoom-inputs').style.display = isBounds ? 'none' : 'block';
        document.getElementById('bounds-inputs').style.display = isBounds ? 'block' : 'none';
    });

    // Viewport overlay helpers
    const overlays = {
        desktop: document.getElementById('viewport-overlay-desktop'),
        ipad: document.getElementById('viewport-overlay-ipad'),
        'ipad-portrait': document.getElementById('viewport-overlay-ipad-portrait'),
        mobile: document.getElementById('viewport-overlay-mobile'),
    };
    const showOverlay = (key) => Object.entries(overlays).forEach(([k, el]) => el.style.display = k === key ? 'block' : 'none');
    const hideOverlays = () => Object.values(overlays).forEach(el => el.style.display = 'none');

    const boundsGroups = [
        { btn: 'get-bounds-button', sw: ['bounds-sw-lng', 'bounds-sw-lat'], ne: ['bounds-ne-lng', 'bounds-ne-lat'], device: 'desktop' },
        { btn: 'get-bounds-ipad-button', sw: ['bounds-ipad-sw-lng', 'bounds-ipad-sw-lat'], ne: ['bounds-ipad-ne-lng', 'bounds-ipad-ne-lat'], device: 'ipad' },
        { btn: 'get-bounds-ipad-portrait-button', sw: ['bounds-ipad-portrait-sw-lng', 'bounds-ipad-portrait-sw-lat'], ne: ['bounds-ipad-portrait-ne-lng', 'bounds-ipad-portrait-ne-lat'], device: 'ipad-portrait' },
        { btn: 'get-bounds-mobile-button', sw: ['bounds-mobile-sw-lng', 'bounds-mobile-sw-lat'], ne: ['bounds-mobile-ne-lng', 'bounds-mobile-ne-lat'], device: 'mobile' },
    ];

    boundsGroups.forEach(({ btn, sw, ne, device }) => {
        const button = document.getElementById(btn);
        button.addEventListener('click', () => {
            const bounds = editorMap.getBounds();
            document.getElementById(sw[0]).value = bounds.getWest().toFixed(6);
            document.getElementById(sw[1]).value = bounds.getSouth().toFixed(6);
            document.getElementById(ne[0]).value = bounds.getEast().toFixed(6);
            document.getElementById(ne[1]).value = bounds.getNorth().toFixed(6);
        });
        button.addEventListener('mouseenter', () => showOverlay(device));
        button.addEventListener('mouseleave', hideOverlays);
        [...sw, ...ne].forEach(id => {
            const el = document.getElementById(id);
            el.addEventListener('focus', () => showOverlay(device));
            el.addEventListener('blur', hideOverlays);
        });
    });

    document.getElementById('save-chapter-btn').addEventListener('click', saveCurrentChapter);
    document.getElementById('save-all-btn').addEventListener('click', saveAllChanges);
    document.getElementById('delete-chapter-btn').addEventListener('click', deleteChapter);

    document.getElementById('export-btn').addEventListener('click', openExportModal);
    document.getElementById('copy-story-btn').addEventListener('click', () => copyTextarea('export-story-output'));
    document.getElementById('copy-map-btn').addEventListener('click', () => copyTextarea('export-map-output'));
    document.getElementById('download-story-btn').addEventListener('click', () => downloadFile(generateStoryConfigString(), 'storyConfig.js'));
    document.getElementById('download-map-btn').addEventListener('click', () => downloadFile(generateMapConfigString(), 'mapConfig.js'));

    document.querySelector('.close-modal').addEventListener('click', closeExportModal);
    document.getElementById('export-modal').addEventListener('click', (e) => {
        if (e.target.id === 'export-modal') closeExportModal();
    });

    setupCollapsibleSections();
    setupKeyboardShortcuts();
}

function initSidebarTabs() {
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sidebar-tab-content').forEach(c => c.style.display = 'none');
            tab.classList.add('active');
            document.querySelector(`.sidebar-tab-content[data-panel="${tab.dataset.tab}"]`).style.display = 'flex';
        });
    });
}

function initBasemapButtons() {
    document.querySelectorAll('input[name="basemap"]').forEach(radio => {
        radio.addEventListener('change', (e) => switchBasemap(e.target.value));
    });
}

function initUploadPanel() {
    document.querySelectorAll('.upload-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            handleFileUpload(file, input.dataset.category);
            input.value = '';
        });
    });
}

// ─── Layer Upload ─────────────────────────────────────────────────────────────

function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function handleFileUpload(file, category) {
    const id = uid();
    const layerId = `ul-${id}`;
    const sourceId = `us-${id}`;
    const name = file.name.replace(/\.[^.]+$/, '');

    if (category === 'raster') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const blob = new Blob([e.target.result], { type: 'image/tiff' });
            const blobUrl = URL.createObjectURL(blob);
            const entry = { id: layerId, sourceId, name, filename: file.name, category, blobUrl };
            userLayers.push(entry);
            withMap(() => addRasterLayerToMap(entry));
            renderUploadedLayersList();
            showNotification(`Raster "${name}" added`);
        };
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            let data;
            try { data = JSON.parse(e.target.result); } catch {
                showNotification('Invalid GeoJSON — could not parse file', true);
                return;
            }
            const defaultStyle = category === 'line'
                ? { strokeColor: '#0d6aff', strokeWidth: 2 }
                : category === 'polygon'
                ? { fillColor: '#0064ff', fillOpacity: 0.3, strokeColor: '#0d6aff', strokeWidth: 1 }
                : null;
            const entry = { id: layerId, sourceId, name, filename: file.name, category, data, style: defaultStyle };
            userLayers.push(entry);
            withMap(() => addVectorLayerToMap(entry));
            renderUploadedLayersList();
            showNotification(`"${name}" added`);
        };
        reader.readAsText(file);
    }
}

function withMap(fn) {
    if (editorMap.loaded()) fn();
    else editorMap.once('load', fn);
}

function addRasterLayerToMap(entry) {
    if (!editorMap.getSource(entry.sourceId)) {
        editorMap.addSource(entry.sourceId, {
            type: 'raster',
            url: `cog://${entry.blobUrl}`,
            tileSize: 256,
        });
    }
    if (!editorMap.getLayer(entry.id)) {
        editorMap.addLayer({ id: entry.id, type: 'raster', source: entry.sourceId, paint: { 'raster-opacity': 1 } });
    }
}

function detectTextField(geojsonData) {
    const candidates = ['name', 'label', 'title', 'text', 'Name', 'LABEL', 'TITLE', 'TEXT'];
    const props = (geojsonData.features?.[0]?.properties) ?? {};
    for (const c of candidates) {
        if (props[c] !== undefined) return ['get', c];
    }
    for (const [key, val] of Object.entries(props)) {
        if (typeof val === 'string') return ['get', key];
    }
    return ['get', 'name'];
}

function addVectorLayerToMap(entry) {
    if (!editorMap.getSource(entry.sourceId)) {
        editorMap.addSource(entry.sourceId, { type: 'geojson', data: entry.data });
    }
    if (editorMap.getLayer(entry.id)) return;

    if (entry.category === 'line') {
        editorMap.addLayer({ id: entry.id, type: 'line', source: entry.sourceId, paint: { 'line-color': entry.style.strokeColor, 'line-width': entry.style.strokeWidth } });
    } else if (entry.category === 'polygon') {
        const fillColor = hexToRgba(entry.style.fillColor, entry.style.fillOpacity);
        if (!editorMap.getLayer(`${entry.id}-fill`))
            editorMap.addLayer({ id: `${entry.id}-fill`, type: 'fill', source: entry.sourceId, paint: { 'fill-color': fillColor } });
        if (!editorMap.getLayer(`${entry.id}-outline`))
            editorMap.addLayer({ id: `${entry.id}-outline`, type: 'line', source: entry.sourceId, paint: { 'line-color': entry.style.strokeColor, 'line-width': entry.style.strokeWidth } });
    } else if (entry.category === 'text') {
        const tf = detectTextField(entry.data);
        editorMap.addLayer({
            id: entry.id, type: 'symbol', source: entry.sourceId,
            layout: { 'text-field': tf, 'text-font': ['Open Sans Regular'], 'text-size': 14 },
            paint: { 'text-color': '#333333', 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
        });
    } else if (entry.category === 'symbol') {
        editorMap.addLayer({ id: entry.id, type: 'circle', source: entry.sourceId, paint: { 'circle-color': '#ff6b6b', 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 } });
    }
}

function removeUserLayer(layerId) {
    const index = userLayers.findIndex(l => l.id === layerId);
    if (index === -1) return;
    const entry = userLayers[index];

    getMapLayerIds(entry).forEach(lid => { if (editorMap.getLayer(lid)) editorMap.removeLayer(lid); });
    if (editorMap.getSource(entry.sourceId)) editorMap.removeSource(entry.sourceId);
    if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);

    userLayers.splice(index, 1);
    chapters.forEach(ch => { if (ch.layers) delete ch.layers[layerId]; });

    renderUploadedLayersList();
    if (activeChapterIndex !== null) populateLayerToggles(chapters[activeChapterIndex]);
}

function renderUploadedLayersList() {
    ['raster', 'line', 'polygon', 'text', 'symbol'].forEach(cat => {
        const container = document.getElementById(`uploaded-${cat}`);
        if (!container) return;
        container.innerHTML = '';
        userLayers.filter(l => l.category === cat).forEach(layer => {
            container.appendChild(buildUploadedFileItem(layer));
        });
    });
}

function buildUploadedFileItem(layer) {
    const item = document.createElement('div');
    item.className = 'uploaded-file-item';

    const topRow = document.createElement('div');
    topRow.className = 'uploaded-file-top-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'uploaded-file-name';
    nameEl.textContent = layer.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-file-btn';
    removeBtn.title = 'Remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeUserLayer(layer.id));

    topRow.append(nameEl, removeBtn);
    item.appendChild(topRow);

    if (layer.category === 'line') item.appendChild(buildLineStyleControls(layer));
    else if (layer.category === 'polygon') item.appendChild(buildPolygonStyleControls(layer));

    return item;
}

function buildLineStyleControls(entry) {
    const wrap = document.createElement('div');
    wrap.className = 'layer-style-controls';
    wrap.innerHTML = `
        <div class="style-row">
            <label class="style-label">Stroke</label>
            <input type="color" class="style-color" value="${entry.style.strokeColor}" title="Stroke colour">
            <input type="number" class="style-width" value="${entry.style.strokeWidth}" min="0.5" max="20" step="0.5" title="Width (px)">
            <span class="style-unit">px</span>
        </div>
    `;
    wrap.querySelector('.style-color').addEventListener('input', (e) => {
        entry.style.strokeColor = e.target.value;
        applyLayerStyle(entry);
    });
    wrap.querySelector('.style-width').addEventListener('input', (e) => {
        entry.style.strokeWidth = parseFloat(e.target.value) || 1;
        applyLayerStyle(entry);
    });
    return wrap;
}

function buildPolygonStyleControls(entry) {
    const wrap = document.createElement('div');
    wrap.className = 'layer-style-controls';
    wrap.innerHTML = `
        <div class="style-row">
            <label class="style-label">Fill</label>
            <input type="color" class="style-color" data-prop="fillColor" value="${entry.style.fillColor}" title="Fill colour">
            <input type="range" class="style-opacity" data-prop="fillOpacity" value="${entry.style.fillOpacity}" min="0" max="1" step="0.05" title="Fill opacity">
            <span class="style-opacity-val">${Math.round(entry.style.fillOpacity * 100)}%</span>
        </div>
        <div class="style-row">
            <label class="style-label">Stroke</label>
            <input type="color" class="style-color" data-prop="strokeColor" value="${entry.style.strokeColor}" title="Stroke colour">
            <input type="number" class="style-width" data-prop="strokeWidth" value="${entry.style.strokeWidth}" min="0" max="20" step="0.5" title="Width (px)">
            <span class="style-unit">px</span>
        </div>
    `;
    wrap.querySelector('[data-prop="fillColor"]').addEventListener('input', (e) => {
        entry.style.fillColor = e.target.value;
        applyLayerStyle(entry);
    });
    const opacityInput = wrap.querySelector('[data-prop="fillOpacity"]');
    opacityInput.addEventListener('input', (e) => {
        entry.style.fillOpacity = parseFloat(e.target.value);
        wrap.querySelector('.style-opacity-val').textContent = Math.round(entry.style.fillOpacity * 100) + '%';
        applyLayerStyle(entry);
    });
    wrap.querySelector('[data-prop="strokeColor"]').addEventListener('input', (e) => {
        entry.style.strokeColor = e.target.value;
        applyLayerStyle(entry);
    });
    wrap.querySelector('[data-prop="strokeWidth"]').addEventListener('input', (e) => {
        entry.style.strokeWidth = parseFloat(e.target.value) || 0;
        applyLayerStyle(entry);
    });
    return wrap;
}

function applyLayerStyle(entry) {
    if (!editorMap) return;
    if (entry.category === 'line') {
        if (editorMap.getLayer(entry.id)) {
            editorMap.setPaintProperty(entry.id, 'line-color', entry.style.strokeColor);
            editorMap.setPaintProperty(entry.id, 'line-width', entry.style.strokeWidth);
        }
    } else if (entry.category === 'polygon') {
        if (editorMap.getLayer(`${entry.id}-fill`)) {
            editorMap.setPaintProperty(`${entry.id}-fill`, 'fill-color', hexToRgba(entry.style.fillColor, entry.style.fillOpacity));
        }
        if (editorMap.getLayer(`${entry.id}-outline`)) {
            editorMap.setPaintProperty(`${entry.id}-outline`, 'line-color', entry.style.strokeColor);
            editorMap.setPaintProperty(`${entry.id}-outline`, 'line-width', entry.style.strokeWidth);
        }
    }
}

// ─── Chapter List ─────────────────────────────────────────────────────────────

function renderChaptersList() {
    const container = document.getElementById('chapters-list');
    container.innerHTML = '';

    chapters.forEach((chapter, index) => {
        const item = document.createElement('div');
        item.className = 'chapter-item' + (index === activeChapterIndex ? ' active' : '');
        item.draggable = true;
        item.dataset.index = index;
        item.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <div class="chapter-item-content">
                <span class="chapter-number">Chapter ${index + 1}</span>
                <h4>${chapter.title || 'Untitled'}</h4>
                <p>${chapter.description || 'No description'}</p>
            </div>
        `;
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('click', () => selectChapter(index));
        container.appendChild(item);
    });
}

function addNewChapter() {
    const newChapter = {
        id: `chapter-${Date.now()}`,
        title: 'New Chapter',
        description: 'Description for this chapter',
        center: editorMap.getCenter().toArray(),
        zoom: editorMap.getZoom(),
        pitch: editorMap.getPitch(),
        bearing: editorMap.getBearing(),
        duration: 2000,
        layers: {},
        image: null,
        alignment: 'center',
    };
    userLayers.forEach(layer => {
        newChapter.layers[layer.id] = { visible: false, opacity: 1 };
    });

    if (activeChapterIndex !== null) {
        chapters.splice(activeChapterIndex + 1, 0, newChapter);
        renderChaptersList();
        selectChapter(activeChapterIndex + 1);
    } else {
        chapters.push(newChapter);
        renderChaptersList();
        selectChapter(chapters.length - 1);
    }
}

function selectChapter(index) {
    activeChapterIndex = index;
    renderChaptersList();
    populateChapterForm(chapters[index]);

    const ch = chapters[index];
    if (ch.bounds) {
        editorMap.fitBounds(ch.bounds, { padding: 50, pitch: ch.pitch || 0, bearing: ch.bearing || 0, duration: 1000 });
    } else if (ch.center) {
        editorMap.flyTo({ center: ch.center, zoom: ch.zoom, pitch: ch.pitch || 0, bearing: ch.bearing || 0, duration: 1000 });
    }

    userLayers.forEach(layer => {
        const cfg = ch.layers?.[layer.id];
        const visible = cfg?.visible ?? false;
        const opacity = cfg?.opacity ?? 1;
        getMapLayerIds(layer).forEach(lid => {
            if (editorMap.getLayer(lid)) editorMap.setLayoutProperty(lid, 'visibility', visible ? 'visible' : 'none');
        });
        applyOpacity(layer.id, opacity);
    });
}

function applyOpacity(layerId, opacity) {
    const entry = userLayers.find(l => l.id === layerId);
    if (!entry) return;
    if (entry.category === 'polygon') {
        const fillId = `${layerId}-fill`;
        if (editorMap.getLayer(fillId)) editorMap.setPaintProperty(fillId, 'fill-opacity', opacity);
        return;
    }
    if (!editorMap.getLayer(layerId)) return;
    const type = editorMap.getLayer(layerId).type;
    const props = { raster: 'raster-opacity', line: 'line-opacity', fill: 'fill-opacity', symbol: 'text-opacity', circle: 'circle-opacity' };
    if (props[type]) editorMap.setPaintProperty(layerId, props[type], opacity);
}

// ─── Chapter Form ─────────────────────────────────────────────────────────────

function populateChapterForm(chapter) {
    document.getElementById('no-chapter-selected').style.display = 'none';
    document.getElementById('chapter-form').style.display = 'block';

    const set = (id, val) => { document.getElementById(id).value = val ?? ''; };
    set('chapter-id', chapter.id);
    set('chapter-title', chapter.title);
    set('chapter-description', chapter.description);
    set('chapter-quote', chapter.quote);
    set('chapter-subtitle1', chapter.subtitle);
    set('chapter-subtitle2', chapter.subtitle2);
    set('chapter-year', chapter.year);
    set('chapter-population', chapter.population);
    set('chapter-image', chapter.image);
    set('chapter-image-caption', chapter.imageCaption);
    set('chapter-description-source', chapter.descriptionSource);
    set('chapter-quote-source', chapter.quoteSource);
    document.getElementById('chapter-alignment').value = chapter.alignment || 'center';
    set('chapter-button-text', chapter.buttonText);
    set('chapter-button-url', chapter.buttonUrl);

    if (chapter.bounds) {
        document.getElementById('view-type').value = 'bounds';
        document.getElementById('bounds-sw-lng').value = chapter.bounds[0].toFixed(6);
        document.getElementById('bounds-sw-lat').value = chapter.bounds[1].toFixed(6);
        document.getElementById('bounds-ne-lng').value = chapter.bounds[2].toFixed(6);
        document.getElementById('bounds-ne-lat').value = chapter.bounds[3].toFixed(6);

        const loadBounds = (key, prefix) => {
            if (chapter[key]) {
                document.getElementById(`${prefix}-sw-lng`).value = chapter[key][0].toFixed(6);
                document.getElementById(`${prefix}-sw-lat`).value = chapter[key][1].toFixed(6);
                document.getElementById(`${prefix}-ne-lng`).value = chapter[key][2].toFixed(6);
                document.getElementById(`${prefix}-ne-lat`).value = chapter[key][3].toFixed(6);
            } else {
                ['sw-lng', 'sw-lat', 'ne-lng', 'ne-lat'].forEach(s => { document.getElementById(`${prefix}-${s}`).value = ''; });
            }
        };
        loadBounds('boundsIpad', 'bounds-ipad');
        loadBounds('boundsIpadPortrait', 'bounds-ipad-portrait');
        loadBounds('boundsMobile', 'bounds-mobile');

        document.getElementById('center-zoom-inputs').style.display = 'none';
        document.getElementById('bounds-inputs').style.display = 'block';
    } else {
        document.getElementById('view-type').value = 'center-zoom';
        document.getElementById('chapter-center-lng').value = (chapter.center?.[0] ?? 0).toFixed(6);
        document.getElementById('chapter-center-lat').value = (chapter.center?.[1] ?? 0).toFixed(6);
        document.getElementById('chapter-zoom').value = (chapter.zoom ?? 2).toFixed(2);
        document.getElementById('center-zoom-inputs').style.display = 'block';
        document.getElementById('bounds-inputs').style.display = 'none';
    }

    set('chapter-pitch', chapter.pitch ?? 0);
    set('chapter-bearing', chapter.bearing ?? 0);
    set('chapter-duration', chapter.duration ?? 2000);

    populateLayerToggles(chapter);
}

function populateLayerToggles(chapter) {
    const container = document.getElementById('layer-toggles');
    container.innerHTML = '';

    if (userLayers.length === 0) {
        container.innerHTML = '<p style="color:#999;font-size:0.85rem;padding:0.5rem 0">No layers uploaded yet. Add layers using the Layers tab.</p>';
        return;
    }

    const categoryMeta = [
        { key: 'raster', label: 'Raster' },
        { key: 'line', label: 'Lines' },
        { key: 'polygon', label: 'Polygons' },
        { key: 'text', label: 'Text Labels' },
        { key: 'symbol', label: 'Symbols' },
    ];

    categoryMeta.forEach(({ key, label }) => {
        const layers = userLayers.filter(l => l.category === key);
        if (!layers.length) return;

        const catDiv = document.createElement('div');
        catDiv.className = 'layer-category';

        const header = document.createElement('div');
        header.className = 'layer-category-header';
        header.innerHTML = `<span>${label} (${layers.length})</span><span class="layer-category-arrow">▼</span>`;
        header.addEventListener('click', () => catDiv.classList.toggle('collapsed'));

        const content = document.createElement('div');
        content.className = 'layer-category-content';

        layers.forEach(layer => {
            const cfg = chapter.layers?.[layer.id];
            const isVisible = cfg?.visible ?? false;
            const opacityVal = cfg?.opacity ?? 1;

            const row = document.createElement('div');
            row.className = 'layer-toggle';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = `layer-${layer.id}`;
            cb.checked = isVisible;
            cb.dataset.layerId = layer.id;
            cb.addEventListener('change', (e) => {
                const vis = e.target.checked ? 'visible' : 'none';
                getMapLayerIds(layer).forEach(lid => {
                    if (editorMap.getLayer(lid)) editorMap.setLayoutProperty(lid, 'visibility', vis);
                });
            });

            const lbl = document.createElement('label');
            lbl.htmlFor = `layer-${layer.id}`;
            lbl.textContent = layer.name;

            const opRow = document.createElement('div');
            opRow.className = 'opacity-control';

            const opLabel = document.createElement('span');
            opLabel.className = 'opacity-label';
            opLabel.textContent = 'Opacity:';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'opacity-slider';
            slider.id = `opacity-${layer.id}`;
            slider.min = '0'; slider.max = '1'; slider.step = '0.1';
            slider.value = opacityVal;
            slider.dataset.layerId = layer.id;
            slider.addEventListener('input', (e) => {
                const op = parseFloat(e.target.value);
                document.getElementById(`opv-${layer.id}`).textContent = Math.round(op * 100) + '%';
                applyOpacity(layer.id, op);
            });

            const opVal = document.createElement('span');
            opVal.className = 'opacity-value';
            opVal.id = `opv-${layer.id}`;
            opVal.textContent = Math.round(opacityVal * 100) + '%';

            opRow.append(opLabel, slider, opVal);
            row.append(cb, lbl, opRow);
            content.appendChild(row);
        });

        catDiv.append(header, content);
        container.appendChild(catDiv);
    });
}

function captureCurrentView() {
    if (activeChapterIndex === null) return;
    if (document.getElementById('view-type').value === 'bounds') {
        const b = editorMap.getBounds();
        document.getElementById('bounds-sw-lng').value = b.getWest().toFixed(6);
        document.getElementById('bounds-sw-lat').value = b.getSouth().toFixed(6);
        document.getElementById('bounds-ne-lng').value = b.getEast().toFixed(6);
        document.getElementById('bounds-ne-lat').value = b.getNorth().toFixed(6);
    } else {
        const c = editorMap.getCenter();
        document.getElementById('chapter-center-lng').value = c.lng.toFixed(6);
        document.getElementById('chapter-center-lat').value = c.lat.toFixed(6);
        document.getElementById('chapter-zoom').value = editorMap.getZoom().toFixed(2);
    }
    document.getElementById('chapter-pitch').value = Math.round(editorMap.getPitch());
    document.getElementById('chapter-bearing').value = Math.round(editorMap.getBearing());
}

function saveCurrentChapter() {
    if (activeChapterIndex === null) return;
    const ch = chapters[activeChapterIndex];
    const get = (id) => document.getElementById(id).value;

    ch.id = get('chapter-id');
    ch.title = get('chapter-title');
    ch.description = get('chapter-description');
    ch.quote = get('chapter-quote') || null;
    ch.subtitle = get('chapter-subtitle1') || null;
    ch.subtitle2 = get('chapter-subtitle2') || null;
    ch.year = get('chapter-year') || null;
    ch.population = get('chapter-population') || null;
    ch.image = get('chapter-image') || null;
    ch.imageCaption = get('chapter-image-caption') || null;
    ch.descriptionSource = get('chapter-description-source') || null;
    ch.quoteSource = get('chapter-quote-source') || null;
    ch.alignment = get('chapter-alignment');
    ch.buttonText = get('chapter-button-text') || null;
    ch.buttonUrl = get('chapter-button-url') || null;
    ch.pitch = parseInt(get('chapter-pitch')) || 0;
    ch.bearing = parseInt(get('chapter-bearing')) || 0;
    ch.duration = parseInt(get('chapter-duration')) || 2000;

    if (get('view-type') === 'bounds') {
        ch.bounds = ['bounds-sw-lng', 'bounds-sw-lat', 'bounds-ne-lng', 'bounds-ne-lat'].map(id => parseFloat(get(id)));
        const saveBounds = (key, prefix) => {
            const vals = ['sw-lng', 'sw-lat', 'ne-lng', 'ne-lat'].map(s => get(`${prefix}-${s}`));
            if (vals.every(v => v)) ch[key] = vals.map(parseFloat);
            else delete ch[key];
        };
        saveBounds('boundsIpad', 'bounds-ipad');
        saveBounds('boundsIpadPortrait', 'bounds-ipad-portrait');
        saveBounds('boundsMobile', 'bounds-mobile');
        delete ch.center; delete ch.zoom;
    } else {
        ch.center = [parseFloat(get('chapter-center-lng')), parseFloat(get('chapter-center-lat'))];
        ch.zoom = parseFloat(get('chapter-zoom'));
        delete ch.bounds; delete ch.boundsIpad; delete ch.boundsIpadPortrait; delete ch.boundsMobile;
    }

    ch.layers = {};
    document.querySelectorAll('#layer-toggles input[type="checkbox"]').forEach(cb => {
        const layerId = cb.dataset.layerId;
        const slider = document.getElementById(`opacity-${layerId}`);
        ch.layers[layerId] = { visible: cb.checked, opacity: slider ? parseFloat(slider.value) : 1 };
    });

    renderChaptersList();
    showNotification('Chapter saved!');
}

function saveAllChanges() {
    if (activeChapterIndex !== null) saveCurrentChapter();
    showNotification('All changes saved — use Export to download configs.');
}

function deleteChapter() {
    if (activeChapterIndex === null) return;
    if (confirm('Delete this chapter?')) {
        chapters.splice(activeChapterIndex, 1);
        activeChapterIndex = null;
        document.getElementById('no-chapter-selected').style.display = 'flex';
        document.getElementById('chapter-form').style.display = 'none';
        renderChaptersList();
    }
}

// ─── Drag & Drop ──────────────────────────────────────────────────────────────

let draggedElement = null;
let draggedIndex = null;

function handleDragStart(e) {
    draggedElement = e.currentTarget;
    draggedIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (e.currentTarget !== draggedElement) e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

function handleDrop(e) {
    e.stopPropagation();
    const dropIndex = parseInt(e.currentTarget.dataset.index);
    if (draggedIndex !== dropIndex) {
        const moved = chapters.splice(draggedIndex, 1)[0];
        chapters.splice(dropIndex, 0, moved);
        if (activeChapterIndex === draggedIndex) activeChapterIndex = dropIndex;
        else if (draggedIndex < activeChapterIndex && dropIndex >= activeChapterIndex) activeChapterIndex--;
        else if (draggedIndex > activeChapterIndex && dropIndex <= activeChapterIndex) activeChapterIndex++;
        renderChaptersList();
    }
    return false;
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.chapter-item').forEach(el => el.classList.remove('drag-over'));
}

// ─── Collapsible Sections & Shortcuts ────────────────────────────────────────

function setupCollapsibleSections() {
    document.addEventListener('click', (e) => {
        const header = e.target.classList.contains('editor-section-header') ? e.target
            : e.target.parentElement?.classList.contains('editor-section-header') ? e.target.parentElement : null;
        if (header) header.parentElement.classList.toggle('collapsed');
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveAllChanges();
        }
    });
}

// ─── Export ───────────────────────────────────────────────────────────────────

function openExportModal() {
    if (activeChapterIndex !== null) saveCurrentChapter();
    document.getElementById('export-story-output').value = generateStoryConfigString();
    document.getElementById('export-map-output').value = generateMapConfigString();
    document.getElementById('export-modal').classList.add('active');
}

function closeExportModal() {
    document.getElementById('export-modal').classList.remove('active');
}

function generateStoryConfigString() {
    // Expand polygon entries to their actual sub-layer IDs so the story viewer can use them directly
    const exportChapters = chapters.map(ch => {
        const expandedLayers = {};
        Object.entries(ch.layers || {}).forEach(([layerId, state]) => {
            const entry = userLayers.find(l => l.id === layerId);
            if (entry?.category === 'polygon') {
                expandedLayers[`${layerId}-fill`] = state;
                expandedLayers[`${layerId}-outline`] = { visible: state.visible, opacity: 1 };
            } else {
                expandedLayers[layerId] = state;
            }
        });
        return { ...ch, layers: expandedLayers };
    });

    return `// Story Map Configuration
// Generated on ${new Date().toLocaleString()}

const storyConfig = ${JSON.stringify({ chapters: exportChapters }, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = storyConfig;
}`;
}

function generateMapConfigString() {
    const sources = {};
    const layers = [];

    userLayers.forEach(entry => {
        if (entry.category === 'raster') {
            sources[entry.sourceId] = { type: 'raster', url: `cog://./datasets/geotiff/${entry.filename}`, tileSize: 256 };
            layers.push({ id: entry.id, type: 'raster', source: entry.sourceId, paint: { 'raster-opacity': 1 } });
        } else {
            sources[entry.sourceId] = { type: 'geojson', data: entry.data };
            if (entry.category === 'line') {
                layers.push({ id: entry.id, type: 'line', source: entry.sourceId, paint: { 'line-color': entry.style.strokeColor, 'line-width': entry.style.strokeWidth } });
            } else if (entry.category === 'polygon') {
                layers.push({ id: `${entry.id}-fill`, type: 'fill', source: entry.sourceId, paint: { 'fill-color': hexToRgba(entry.style.fillColor, entry.style.fillOpacity) } });
                layers.push({ id: `${entry.id}-outline`, type: 'line', source: entry.sourceId, paint: { 'line-color': entry.style.strokeColor, 'line-width': entry.style.strokeWidth } });
            } else if (entry.category === 'text') {
                layers.push({ id: entry.id, type: 'symbol', source: entry.sourceId, layout: { 'text-field': detectTextField(entry.data), 'text-font': ['Open Sans Regular'], 'text-size': 14 }, paint: { 'text-color': '#333333', 'text-halo-color': '#ffffff', 'text-halo-width': 1 } });
            } else if (entry.category === 'symbol') {
                layers.push({ id: entry.id, type: 'circle', source: entry.sourceId, paint: { 'circle-color': '#ff6b6b', 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 } });
            }
        }
    });

    const view = editorMap ? editorMap.getCenter().toArray() : mapConfig.initialView.center;
    const zoom = editorMap ? editorMap.getZoom() : mapConfig.initialView.zoom;

    const config = {
        initialView: { center: view, zoom },
        defaultBasemap: currentBasemap,
        basemaps: mapConfig.basemaps,
        sources,
        layers,
    };

    return `// Map Configuration
// Generated on ${new Date().toLocaleString()}
// Note: update raster source paths before deploying

const mapConfig = ${JSON.stringify(config, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = mapConfig;
}`;
}

function copyTextarea(id) {
    const ta = document.getElementById(id);
    ta.select();
    document.execCommand('copy');
    showNotification('Copied to clipboard!');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Notifications ────────────────────────────────────────────────────────────

function showNotification(message, isError = false) {
    const el = document.createElement('div');
    el.className = 'notification';
    el.textContent = message;
    el.style.cssText = `position:fixed;top:20px;right:20px;background:${isError ? '#dc3545' : '#28a745'};color:white;padding:1rem 1.5rem;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10000;font-weight:500;animation:slideIn .3s ease`;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideOut .3s ease';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}
