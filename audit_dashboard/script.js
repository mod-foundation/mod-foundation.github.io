//#region Map Configuration

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

const baseLayers = {
    osm,
    satellite,
    cartoLight,
    cartoPositron
};
//#endregion

//#region Map Initialization
const map = new maplibregl.Map({
    container: 'map-container',
    style: {
        version: 8,
        sources: {},
        layers: []
    },
    center: [77.5946, 12.9716], // Bengaluru coordinates
    zoom: 11,
    pitch: 0,
    bearing: 0,
    minZoom: 5,
    maxZoom: 18
});
//#endregion

//#region Map Controls
// Navigation controls (zoom, rotation)
map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Scale control
map.addControl(new maplibregl.ScaleControl({
    maxWidth: 200,
    unit: 'metric'
}), 'bottom-right');

// Geolocate control
map.addControl(new maplibregl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
}), 'top-right');
//#endregion

//#endregion

//#region Local Data Configuration

const DATA_CONFIG = {
    forms: {
        form1: {
            csvPath: 'data/csv/form-1.csv',
            mediaPath: 'data/media/form-1/e297082545574dd6b81c8a5d2a37e9c8',
            name: 'Form 1 - SWD Audit',
            color: '#007cbf'
        },
        form2: {
            csvPath: 'data/csv/form-2.csv',
            mediaPath: 'data/media/form-2/2f6e2b31633744ff9cb654350986751f',
            name: 'Form 2',
            color: '#e74c3c'
        }
    }
};
//#endregion

//#region Data Loading

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 3) return [];

    // Row 0: short field names (keys), Row 1: verbose labels (skip), Row 2+: data
    const headers = splitCSVLine(lines[0]);
    const rows = [];

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = splitCSVLine(line);
        const obj = {};
        headers.forEach((key, idx) => {
            obj[key] = values[idx] !== undefined ? values[idx] : '';
        });
        rows.push(obj);
    }
    return rows;
}

function splitCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields;
}

async function loadLocalData(formConfig) {
    try {
        const response = await fetch(formConfig.csvPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const data = parseCSV(text);
        console.log(`✓ Loaded ${data.length} submissions from ${formConfig.csvPath}`);
        return data;
    } catch (error) {
        console.warn(`⚠ Could not load ${formConfig.csvPath}:`, error.message);
        return [];
    }
}

async function loadAllForms() {
    console.log('=== LOADING LOCAL DATA ===');
    const results = {};
    for (const [formKey, formConfig] of Object.entries(DATA_CONFIG.forms)) {
        console.log(`Loading ${formConfig.name}...`);
        const data = await loadLocalData(formConfig);
        results[formKey] = { data, config: formConfig };
    }
    return results;
}

//#endregion

//#region Data Processing

function csvToGeoJSON(csvData) {
    const features = csvData.map((row, index) => {
        const latitude = parseFloat(row.lat);
        const longitude = parseFloat(row.long);

        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Row ${index}: Missing or invalid coordinates`);
            return null;
        }

        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            properties: { ...row }
        };
    }).filter(f => f !== null);

    console.log(`✓ Created ${features.length} valid features from ${csvData.length} rows`);
    return { type: 'FeatureCollection', features };
}

//#endregion

//#region Map Filter Manager

const _activeFilters = {};   // canvasId → { layerId, value, defaultColor }
const _chartRegistry = {};   // canvasId → { layerId, fieldName, rawLabels, colors, defaultColor }
let _activeColorChart = null; // canvasId currently coloring the map

window.MapFilterManager = {
    // Called by chart.js after each chart is created
    // filterExprs: optional array of MapLibre expressions per label (used by histograms)
    registerChart(canvasId, layerId, fieldName, rawLabels, colors, defaultColor, filterExprs = null) {
        _chartRegistry[canvasId] = { layerId, fieldName, rawLabels, colors, defaultColor, filterExprs };
    },

    // Per-slice/bar filter (existing)
    applyFilter(canvasId, layerId, fieldName, rawValue, color, defaultColor) {
        const prev = _activeFilters[canvasId];

        // Toggle off if the same slice/bar is clicked again
        if (prev && prev.value === rawValue) {
            map.setFilter(layerId, null);
            map.setPaintProperty(layerId, 'circle-color', defaultColor);
            delete _activeFilters[canvasId];
            return;
        }

        // Reset any active filter on the same layer from a different chart
        for (const [cId, info] of Object.entries(_activeFilters)) {
            if (info.layerId === layerId) {
                map.setFilter(layerId, null);
                map.setPaintProperty(layerId, 'circle-color', info.defaultColor);
                delete _activeFilters[cId];
            }
        }

        // Apply the new filter and recolor
        map.setFilter(layerId, ['==', ['get', fieldName], rawValue]);
        map.setPaintProperty(layerId, 'circle-color', color);
        _activeFilters[canvasId] = { layerId, value: rawValue, defaultColor };
    },

    // Color all points by chart legend — triggered by panel-header click
    colorByChart(canvasId) {
        const reg = _chartRegistry[canvasId];
        if (!reg) return;
        const { layerId, fieldName, rawLabels, colors, defaultColor } = reg;
        const headerEl = document.querySelector(`#${canvasId.replace('chart-', 'panel-')} .panel-header`);

        // Toggle off if this chart is already the active color source
        if (_activeColorChart === canvasId) {
            map.setFilter(layerId, null);
            map.setPaintProperty(layerId, 'circle-color', defaultColor);
            _activeColorChart = null;
            if (headerEl) headerEl.classList.remove('color-active');
            return;
        }

        // Deactivate any previous color-by on the same layer
        if (_activeColorChart) {
            const prev = _chartRegistry[_activeColorChart];
            const prevHeader = document.querySelector(`#${_activeColorChart.replace('chart-', 'panel-')} .panel-header`);
            if (prevHeader) prevHeader.classList.remove('color-active');
            if (prev && prev.layerId === layerId) {
                map.setPaintProperty(layerId, 'circle-color', prev.defaultColor);
            }
        }

        // Clear any active per-slice filter on this layer
        for (const [cId, info] of Object.entries(_activeFilters)) {
            if (info.layerId === layerId) {
                map.setFilter(layerId, null);
                delete _activeFilters[cId];
            }
        }

        // Build MapLibre color expression
        // Histograms supply per-bin filter expressions → use 'case'
        // Pie/bar charts supply exact string values → use 'match'
        let colorExpr;
        if (reg.filterExprs) {
            colorExpr = ['case'];
            reg.filterExprs.forEach((expr, i) => colorExpr.push(expr, colors[i]));
            colorExpr.push(defaultColor);
        } else {
            colorExpr = ['match', ['get', fieldName]];
            rawLabels.forEach((label, i) => colorExpr.push(label, colors[i]));
            colorExpr.push(defaultColor);
        }
        const matchExpr = colorExpr; // alias for the line below

        map.setFilter(layerId, null);
        map.setPaintProperty(layerId, 'circle-color', matchExpr);
        _activeColorChart = canvasId;
        if (headerEl) headerEl.classList.add('color-active');
    },

    // Range filter for histogram bars (numeric field binned into [min, max))
    applyRangeFilter(canvasId, layerId, fieldName, min, max, color, defaultColor) {
        const prev = _activeFilters[canvasId];

        // Toggle off if same bin clicked again
        if (prev && prev.rangeMin === min && prev.rangeMax === max) {
            map.setFilter(layerId, null);
            map.setPaintProperty(layerId, 'circle-color', defaultColor);
            delete _activeFilters[canvasId];
            return;
        }

        // Reset any active filter on this layer
        for (const [cId, info] of Object.entries(_activeFilters)) {
            if (info.layerId === layerId) {
                map.setFilter(layerId, null);
                map.setPaintProperty(layerId, 'circle-color', info.defaultColor);
                delete _activeFilters[cId];
            }
        }

        const filterExpr = ['all',
            ['>=', ['to-number', ['get', fieldName]], min],
            ['<',  ['to-number', ['get', fieldName]], max]
        ];
        map.setFilter(layerId, filterExpr);
        map.setPaintProperty(layerId, 'circle-color', color);
        _activeFilters[canvasId] = { layerId, rangeMin: min, rangeMax: max, defaultColor };
    },

    resetAll() {
        for (const [cId, info] of Object.entries(_activeFilters)) {
            if (map.getLayer(info.layerId)) {
                map.setFilter(info.layerId, null);
                map.setPaintProperty(info.layerId, 'circle-color', info.defaultColor);
            }
            delete _activeFilters[cId];
        }
        if (_activeColorChart) {
            const reg = _chartRegistry[_activeColorChart];
            const headerEl = document.querySelector(`#${_activeColorChart.replace('chart-', 'panel-')} .panel-header`);
            if (headerEl) headerEl.classList.remove('color-active');
            if (reg && map.getLayer(reg.layerId)) {
                map.setFilter(reg.layerId, null);
                map.setPaintProperty(reg.layerId, 'circle-color', reg.defaultColor);
            }
            _activeColorChart = null;
        }
    }
};

//#endregion

//#region Popup Configuration

const POPUP_SKIP = new Set([
    '', 'start', 'end', 'lat', 'long', 'alt', 'precision', 'location',
    '_uuid', '_id', '_submission_time', '_validation_status', '_notes',
    '_status', '_submitted_by', '__version__', '_tags', 'meta/rootUuid',
    'formhub/uuid', '_xform_id_string', 'meta/instanceID',
    // Form 1 section headers / placeholder fields
    'form1', 'section1', 'section2', 'section3', 'section4', 'outdated',
]);

const POPUP_LABELS = {
    _index: 'Index',
    safety: 'Safety',
    team_code: 'Team Code',
    rhs_lhs: 'LHS / RHS',
    date_time: 'Date & Time',
    wall_condition: 'Wall Condition',
    wall_height: 'Wall Height (ft)',
    wall_material: 'Wall Material',
    wall_pic: 'Wall Photo',
    fence: 'Fence Condition',
    street_pic: 'Street Photo',
    bridge_type: 'Bridge Type',
    bridge_condition: 'Bridge Condition',
    bridge_walkable: 'Bridge Walkable',
    bridge_pic: 'Bridge Photo',
    piers_condition: 'Piers Condition',
    piers_num: 'No. of Piers',
    piers_pic: 'Piers Photo',
    elec_condition: 'Electrical Condition',
    elec_pic: 'Electrical Photo',
    cables_condition: 'Cables Condition',
    cables_pic: 'Cables Photo',
    manholes_condition: 'Manholes Condition',
    manholes_pic: 'Manholes Photo',
    inlets: 'Stormwater Inlets',
    inlets_pic: 'Inlets Photo',
    unauthorised_inlets: 'Unauthorised Inlets',
    unauthorised_inlets_pic: 'Unauthorised Inlets Photo',
    observations: 'Observations',
    water_stagnant: 'Water Flow',
    water_contamination: 'Water Contamination',
    water_colour: 'Water Colour',
    water_turbidity: 'Water Turbidity',
    water_smell: 'Water Odour',
    water_pic: 'Water Photo',
    sw_inside: 'Solid Waste Inside SWD',
    sw_inside_type: 'Waste Type (Inside)',
    sw_inside_source: 'Waste Source (Inside)',
    sw_inside_pic: 'Waste Inside Photo',
    sw_outside: 'Solid Waste Outside SWD',
    sw_outside_type: 'Waste Type (Outside)',
    sw_outside_source: 'Waste Source (Outside)',
    sw_outside_pic: 'Waste Outside Photo',
    sw_clean_up: 'Clean-up Efforts',
    community_engagement: 'Community Engagement',
    community_engagement_pic: 'Community Engagement Photo',
};

function popupFieldLabel(key) {
    return POPUP_LABELS[key.trim()] ||
        key.trim().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function popupFieldValue(val) {
    if (!val || val === 'null' || val === 'undefined') return null;
    return val.trim().replace(/__/g, ' — ').replace(/_/g, ' ');
}

//#endregion

//#region Layer Management

async function addLayers() {
    console.log('=== ADDING LAYERS ===');

    // Clear any stale filter state when layers are re-built
    window.MapFilterManager.resetAll();

    // Load data from local CSV files
    const allFormsData = await loadAllForms();

    // Process each form
    for (const [formKey, formResult] of Object.entries(allFormsData)) {
        const { data, config } = formResult;

        if (data.length === 0) {
            console.warn(`⚠ No data for ${config.name}`);
            continue;
        }

        console.log(`\n--- Processing ${config.name} ---`);
        console.log(`✓ Loaded ${data.length} submissions`);

        // Convert to GeoJSON using direct lat/long columns
        const geojsonData = csvToGeoJSON(data);

        if (geojsonData.features.length === 0) {
            console.warn(`✗ No valid points for ${config.name}`);
            continue;
        }

        console.log(`✓ Created ${geojsonData.features.length} points for ${config.name}`);

        // Add source
        const sourceId = `data-${formKey}`;
        const layerId = `data-${formKey}-points`;

        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'geojson',
                data: geojsonData
            });
            console.log(`✓ Added source: ${sourceId}`);
        } else {
            map.getSource(sourceId).setData(geojsonData);
            console.log(`✓ Updated source: ${sourceId}`);
        }

        // Add layer
        if (!map.getLayer(layerId)) {
            map.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': 5,
                    'circle-color': config.color,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                    'circle-opacity': 0.8
                }
            });
            console.log(`✓ Added layer: ${layerId}`);
        }

        // Add popup on click — field/value table with inline images
        map.on('click', layerId, (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;
            const uuid = properties._uuid || '';
            const imageExtRe = /\.(jpg|jpeg|png|gif|webp)$/i;

            const entries = Object.entries(properties).sort(([a], [b]) =>
                a === '_index' ? -1 : b === '_index' ? 1 : 0
            );
            const rows = entries
                .filter(([key]) => !POPUP_SKIP.has(key.trim()))
                .map(([key, val]) => {
                    if (!val || val === 'null' || val === 'undefined') return null;
                    const label = popupFieldLabel(key);
                    const trimVal = String(val).trim();
                    if (imageExtRe.test(trimVal)) {
                        const src = `${config.mediaPath}/${uuid}/${trimVal}`;
                        return `<tr>
                            <td class="popup-label">${label}</td>
                            <td class="popup-value"><img src="${src}" class="popup-img" onclick="window.open('${src}','_blank')" onerror="this.closest('tr').style.display='none';" /></td>
                        </tr>`;
                    }
                    const display = popupFieldValue(trimVal);
                    if (!display) return null;
                    return `<tr>
                        <td class="popup-label">${label}</td>
                        <td class="popup-value">${display}</td>
                    </tr>`;
                })
                .filter(Boolean)
                .join('');

            const popupContent = `<div class="popup-scroll"><table class="popup-table">${rows}</table></div>`;

            new maplibregl.Popup({ closeButton: true, maxWidth: '440px' })
                .setLngLat(coordinates)
                .setHTML(popupContent)
                .addTo(map);
        });

        /* --- Image carousel (commented out) ---
        // map.on('click', layerId, (e) => {
        //   ... slideshow code removed ...
        // });
        */
        
        // Cursor on hover
        map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
        });
    }
    
    // Fit map to show all points from all forms
    const allBounds = new maplibregl.LngLatBounds();
    let hasPoints = false;

    for (const [, formResult] of Object.entries(allFormsData)) {
        const geojsonData = csvToGeoJSON(formResult.data);
        if (geojsonData.features.length > 0) {
            hasPoints = true;
            geojsonData.features.forEach(feature => {
                allBounds.extend(feature.geometry.coordinates);
            });
        }
    }

    if (hasPoints) {
        map.fitBounds(allBounds, {
            padding: 50,
            maxZoom: 15,
            duration: 1000
        });
        console.log('✓ Map fitted to show all points');
    } else {
        console.warn('⚠ No points to display - adding sample data');
        addSampleData();
    }

    // Initialize charts with the data
    if (window.ChartManager) {
        window.ChartManager.initialize(allFormsData);
    }

    console.log('=== LAYERS ADDED SUCCESSFULLY ===');
}

async function addJsonLayers() {
    console.log('=== LOADING GEOJSON LAYERS ===');

    // Define your GeoJSON layers here
    // Each layer needs: id, file path, type, and paint properties
    const layers = [
        // Example polygon layer
        // {
        //     id: 'boundaries',
        //     file: 'datasets/boundaries.geojson',
        //     type: 'fill',
        //     paint: {
        //         'fill-color': '#088',
        //         'fill-opacity': 0.5,
        //         'fill-outline-color': '#000'
        //     }
        // },

         {
             id: 'primary-drains',
             file: 'data/json/primarydrains.geojson',
             type: 'line',
             paint: {
                'line-color': 'rgba(4, 0, 255, 1)',
                'line-width': 1
            }
        },

        {
             id: 'secondary-drains',
             file: 'data/json/secondarydrains.geojson',
             type: 'line',
             paint: {
                'line-color': 'rgba(0, 195, 255, 1)',
                'line-width': 0.8
             }
        },
        // Example point layer
        // {
        //     id: 'sites',
        //     file: 'datasets/sites.geojson',
        //     type: 'circle',
        //     paint: {
        //         'circle-radius': 6,
        //         'circle-color': '#B42222',
        //         'circle-stroke-width': 1,
        //         'circle-stroke-color': '#fff'
        //     }
        // }
    ];

    for (const layer of layers) {
        try {
            const response = await fetch(layer.file);
            if (!response.ok) throw new Error(`Failed to load ${layer.file}`);

            const geojson = await response.json();

            // Add source
            if (!map.getSource(layer.id)) {
                map.addSource(layer.id, {
                    type: 'geojson',
                    data: geojson
                });
            }

            // Add layer
            if (!map.getLayer(layer.id)) {
                map.addLayer({
                    id: layer.id,
                    type: layer.type,
                    source: layer.id,
                    paint: layer.paint
                });
            }

            console.log(`✓ Added layer: ${layer.id}`);
        } catch (error) {
            console.error(`✗ Error loading ${layer.id}:`, error);
        }
    }

    console.log('=== GEOJSON LAYERS LOADED ===');
}
function addSampleData() {
    console.log('Adding sample data as fallback');
    
    const sampleData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [77.6033, 12.9800]
                },
                properties: {
                    title: 'Sample Point - Whitefield',
                    description: 'Example location (No KoboToolbox data available)'
                }
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [77.5946, 12.9716]
                },
                properties: {
                    title: 'Sample Point - City Center',
                    description: 'Example location (No KoboToolbox data available)'
                }
            }
        ]
    };
    
    if (!map.getSource('sample-data')) {
        map.addSource('sample-data', {
            type: 'geojson',
            data: sampleData
        });
    }

    if (!map.getLayer('sample-points')) {
        map.addLayer({
            id: 'sample-points',
            type: 'circle',
            source: 'sample-data',
            paint: {
                'circle-radius': 8,
                'circle-color': '#ff6b6b',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
    }
    
    // Add popup for sample data
    map.on('click', 'sample-points', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        
        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
                <div style="font-family: Arial, sans-serif;">
                    <h3 style="margin: 0 0 10px 0; color: #ff6b6b;">${properties.title}</h3>
                    <p style="margin: 5px 0;">${properties.description}</p>
                </div>
            `)
            .addTo(map);
    });
    
    map.on('mouseenter', 'sample-points', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'sample-points', () => {
        map.getCanvas().style.cursor = '';
    });
}

//#endregion

//#region Map Event Handlers

map.on('load', () => {
    console.log('✓ Map loaded successfully');
    
    // Add basemap control
    const basemapControl = new BasemapControl({ 
        basemaps: baseLayers, 
        initialBasemap: "cartoPositron",
        width: '150px',
        height: '100px',
        keepOpen: false
    });
    map.addControl(basemapControl, 'top-right');
    
    // Add layers after basemap initializes
    setTimeout(() => {
        addJsonLayers();
        addLayers();
        
    }, 100);
});

// Re-add layers when basemap changes
map.on('style.load', () => {
    if (map.isStyleLoaded()) {
        setTimeout(() => {
            addJsonLayers();
            addLayers();
            
        }, 100);
    }
});

// Error handling
map.on('error', (e) => {
    console.error('Map error:', e);
});

// Optional: Log map movements for debugging
map.on('moveend', () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    console.log(`Center: [${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}], Zoom: ${zoom.toFixed(2)}`);
});

//#endregion