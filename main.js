//#region config

//#region layerConfig

// 🧱 Single source of truth for all layers and groups
const layerConfig = {
    primarydrains: {
        label: 'Primary Drains',
        layers: ['primary-drains', 'primary-drains-interaction', 'Halo']
    },

    secondarydrains: {
        label: 'Secondary Drains',
        layers: ['secondary-drains', 'secondary-drains-interaction', 'Secondary Drains Halo']
    },

    tanks: {
        label: 'Existing Tanks',
        layers: ['Lakes', 'Lakes_existing_overlap']
    },

    losttanks: {
        label: 'Lost Tanks',
        layers: ['Lakes_lost']
    },

    tanks1700: {
        label: 'Tanks 1700',
        layers: ['lakes_1700', '1790-boundary']
    },

    tanks1800: {
        label: 'Tanks 1800',
        layers: ['lakes_lost_1800', 'lakes_existing_1800', '1870-boundary']
    },

    tanks1900: {
        label: 'Tanks 1900',
        layers: ['lakes_lost_1900', 'lakes_existing_1900', '1968-boundary', 'Lakes_lost_1800_1900']
    },

    existingtanks: {
        label: 'Existing Tanks',
        layers: ['tanks_existing', 'Lakes_lost_1900_2000']
    },

    valleys: {
        label: 'Valleys',
        layers: ['valleys']
    },

    valleyscategory: {
        label: 'Valley Categories',
        layers: ['valleys category']
    },

    subvalleys: {
        label: 'Sub Valleys',
        layers: ['sub-valleys']
    },

    ridge: {
        label: 'Ridge Line',
        layers: ['Ridge']
    },

    streamorder: {
        label: 'Watershed',
        layers: ['streamorder', 'streamorder-arrows']
    },

    allbasins: {
        label: 'All Basins',
        layers: ['all-basins']
    },

    basinbg: {
        label: 'Basin BG',
        layers: ['basin-bg']
    },

    valleylabels: {
        label: 'valley labels',
        layers: ['valleys-label', 'river-label', 'largerriver-label']
    },

    dem: {
        label: 'DEM',
        layers: ['dem']
    },

    hillshade: {
        label: 'Hillshade',
        layers: ['hillshade']
    },

    placelabels: {
        label: 'Place Labels',
        layers: ['settlement-minor-label', 'settlement-subdivision-label']
    },

    gba: {
        label: 'GBA Boundary',
        layers: ['gba']
    },

    wards: {
        label: 'GBA wards',
        layers: ['gba-wards']
    },

    roads: {
        label: 'Roads',
        layers: ['road-label', 'road-motorway-trunk', 'road-primary', 'road-secondary-tertiary']
    },

    bg: {
        label: 'background',
        layers: ['background', 'satellite']
    },

    typologyanalysis: {
        label: 'typologies',
        layers: ['typ_analysis', 'typ_analysis-glow']
    },

    previousboundaries: {
        label: 'Old Boundaries',
        layers: ['year-boundaries']
    },

    greens: {
        label: 'Greens',
        layers: ['parks', 'wetlands']
    }
};

// EXTRACT FROM CONFIG

// 1. All labels
const allLabels = Object.values(layerConfig).map(group => group.label);

// 2. All layer IDs regardless of group
const allLayerIds = Object.values(layerConfig).flatMap(group => group.layers);

// 3. All groups (group keys)
const allGroups = Object.keys(layerConfig);

// Also useful: groupMapping for toggle functions
const groupMapping = Object.fromEntries(Object.entries(layerConfig).map(([key, value]) => [key, value.layers]));

//#endregion

//#region viewPresets

// Responsive bounds-based views (SW corner, NE corner)
const defaultViewBounds = {
    bounds: [
        [77.5, 12.87], // Southwest coordinates
        [77.74, 13.1] // Northeast coordinates
    ],
    pitch: 0,
    bearing: 0,
    padding: 0
};

const dem3DViewBounds = {
    bounds: [
        [77.55, 12.85], // Southwest coordinates
        [77.75, 13.05] // Northeast coordinates
    ],
    pitch: 45,
    bearing: -45,
    padding: { top: 50, bottom: 50, left: 50, right: 50 }
};

const valleyViewBounds = {
    bounds: [
        [77.4, 12.78], // Southwest coordinates
        [77.85, 13.08] // Northeast coordinates
    ],
    pitch: 0,
    bearing: 0,
    padding: { top: 50, bottom: 50, left: 50, right: 50 }
};

// Legacy fallback views (for backwards compatibility)
const defaultView = {
    center: [77.616, 12.986],
    zoom: 11.2,
    pitch: 0,
    bearing: 0
};

const dem3DView = {
    center: [77.65, 12.95],
    zoom: 11,
    pitch: 45, // tilt for 3D
    bearing: -45 // rotate if you like
};

const valleyView = {
    center: [77.616, 12.93],
    zoom: 10.1,
    pitch: 0,
    bearing: 0,
    minZoom: 10.5
};

//#endregion

//#region constants

const lineLayers = resolveLayers({
    layers: ['primary-drains', 'secondary-drains', 'Lakes_existing_overlap']
});

// hide on load:
const hideLayers = resolveLayers({
    groups: [
        'allbasins',
        'basinbg',
        'valleyscategory',
        'streamorder',
        'ridge',
        'tanks1700',
        'tanks1800',
        'tanks1900',
        'typologyanalysis',
        'existingtanks'
    ]
});

const alwaysVisible = resolveLayers({ groups: ['bg', 'gba'] });

// interactive layers
const interactiveLayers = [
    'primary-drains-interaction',
    'secondary-drains-interaction',
    'Lakes',
    'Lakes_lost',
    'lakes_lost_1800',
    'lakes_existing_1800',
    'tanks_existing',
    'lakes_lost_1900',
    'lakes_1700',
    'gba-wards',
    'parks'
];

let currentHighlight = null;

let activePopup = null;

let activeCallouts = {};

let basinHighlight = null;

// Typology code to label mapping
const typologyLabels = {
    t1: 'Road Adjacent with Footpath',
    t2: 'Road Adjacent without Footpath',
    t3: 'Road Adjacent Ring Road/ Highway',
    t4: 'Property Adjacent Abutting Buildings',
    t5: 'Property Adjacent with Setback',
    t6: 'Lake Adjacent with Pathway',
    t7: 'Lake Adjacent without Pathway',
    t8: 'Inside Private Property/ Campus',
    t9: 'Railway Adjacent',
    t10: 'Open Space (Parks, Playgrounds, etc) Adjacent',
    t11: 'Agricultural Land Adjacent',
    t12: 'Vacant Land Adjacent'
};

let basinPlayInterval = null;
let isBasinPlaying = false;
let lakesPlayInterval = null;
let isLakesPlaying = false;
let valleysCategoryTimeout = null;
let demTimeouts = [];

//#endregion

//#endregion

//#region Components

//#region mapsetup

//api
mapboxgl.accessToken =
    'pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A';

//map container
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mod-foundation/cmimsj4eh00q401qw4s9b2ogt',
    bounds: [
        [77.5, 12.87], // Southwest coordinates
        [77.74, 13.1] // Northeast coordinates
    ],
    pitch: 0,
    bearing: 0,
    padding: 0,
    preserveDrawingBuffer: true
});

//close legend on page load
const details = document.querySelector('sl-details');
details.open = false;

//#endregion

//#region legend

// Generate legend from layerConfig
// Generate legend from HTML structure (reads data-group attributes)
// Generate legend structure and controls from layerConfig
function generateLegend() {
    const layerList = document.getElementById('legend-list');
    layerList.innerHTML = ''; // Clear existing content

    // Define legend structure (references layerConfig keys)
    const legendStructure = [
        {
            label: 'Drains',
            isGroup: true,
            children: ['primarydrains', 'secondarydrains']
        },
        {
            label: 'Tanks',
            isGroup: true,
            children: ['tanks', 'losttanks']
        },
        {
            label: 'Valleys',
            isGroup: true,
            children: ['valleys', 'valleylabels', 'subvalleys']
        },
        {
            label: 'Greens',
            isGroup: true,
            children: ['greens']
        },

        {
            label: 'Boundaries',
            isGroup: true,
            children: ['wards', 'gba']
        },
        {
            label: 'Background',
            isGroup: true,
            children: ['dem', 'roads', 'placelabels', 'bg']
        },
        {
            label: 'Typologies',
            key: 'typologyanalysis'
        }
    ];

    // Generate legend from structure
    legendStructure.forEach(item => {
        if (item.isGroup && item.children) {
            createExpandableGroup(item, layerList);
        } else if (item.key) {
            const groupConfig = layerConfig[item.key];
            if (groupConfig) {
                createRegularLayerControl(item.key, groupConfig, layerList);
            }
        }
    });
}

// Create expandable group with dropdown
function createExpandableGroup(groupItem, parentElement) {
    // Create group container
    const groupContainer = document.createElement('div');
    groupContainer.className = 'legend-group-container';

    // Create group header (clickable to expand/collapse)
    const groupHeader = document.createElement('div');
    groupHeader.className = 'legend-group-header collapsed';

    // Create chevron icon
    const chevron = document.createElement('sl-icon');
    chevron.className = 'group-arrow';
    chevron.name = 'chevron-right';

    // Create label
    const label = document.createElement('span');
    label.className = 'group-label';
    label.textContent = groupItem.label;

    groupHeader.appendChild(label);
    groupHeader.appendChild(chevron);

    // Create children container (initially hidden)
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'legend-group-children';
    childrenContainer.style.display = 'none';

    // Add children by looking up their configs
    groupItem.children.forEach(childKey => {
        const childConfig = layerConfig[childKey];
        if (childConfig) {
            createRegularLayerControl(childKey, childConfig, childrenContainer);
        }
    });

    // Toggle expand/collapse on click
    groupHeader.addEventListener('click', () => {
        const isExpanded = childrenContainer.style.display === 'block';
        childrenContainer.style.display = isExpanded ? 'none' : 'block';
        chevron.name = isExpanded ? 'chevron-right' : 'chevron-down';
        groupHeader.classList.toggle('collapsed', isExpanded);
    });

    // Assemble and add to parent
    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(childrenContainer);
    parentElement.appendChild(groupContainer);
}

// Create regular layer control (checkbox + slider)
function createRegularLayerControl(groupKey, groupConfig, parentElement) {
    const layers = groupConfig.layers;

    // Find the first actual layer that exists
    const firstLayer = layers.find(id => map.getLayer(id));
    if (!firstLayer) return;

    // Check if visible
    const isVisible = map.getLayoutProperty(firstLayer, 'visibility') !== 'none';

    // Create layer item container
    const layerItem = document.createElement('div');
    layerItem.className = 'group-control';

    // Create checkbox
    const checkbox = createCheckbox(groupKey, groupConfig, layers, isVisible);
    layerItem.appendChild(checkbox);

    // Create slider
    const slider = createOpacitySlider(groupKey, firstLayer, layers, isVisible);
    layerItem.appendChild(slider);

    // Add to parent
    parentElement.appendChild(layerItem);

    // Setup event listeners
    setupCheckboxEvents(checkbox, slider, groupKey);
    setupSliderEvents(slider, groupKey);
}
// Create checkbox for a layer group
function createCheckbox(groupKey, groupConfig, layers, isVisible) {
    // Create a Shoelace checkbox element
    const checkbox = document.createElement('sl-checkbox');
    // Add CSS class for styling
    checkbox.className = 'group-checkbox';
    // Set unique ID for this checkbox
    checkbox.id = `checkbox-${groupKey}`;
    // Set initial state based on layer visibility
    checkbox.checked = isVisible;
    // Set the checkbox label text from config
    checkbox.textContent = groupConfig.label;

    // Return the checkbox element
    return checkbox;
}

// Create opacity slider for a layer group
function createOpacitySlider(groupKey, firstLayer, layers, isVisible) {
    // Get the opacity property for this layer type
    const opacityProp = getOpacityProperty(firstLayer);

    // Safety check - skip if no opacity property found
    if (!opacityProp) {
        console.warn(`⚠️ Could not get opacity property for ${firstLayer}`);
        const emptyDiv = document.createElement('div');
        return emptyDiv;
    }

    // Get the current opacity value with better error handling
    let currentOpacity = 1; // default
    try {
        const paintValue = map.getPaintProperty(firstLayer, opacityProp);
        currentOpacity = paintValue !== undefined && paintValue !== null ? paintValue : 1;
    } catch (e) {
        console.warn(`⚠️ Could not get paint property ${opacityProp} for ${firstLayer}:`, e);
        currentOpacity = 1;
    }

    // Create a Shoelace range slider
    const slider = document.createElement('sl-range');
    slider.className = 'opacity-slider';
    slider.id = `slider-${groupKey}`;
    slider.min = 0;
    slider.max = 100;
    slider.value = currentOpacity * 100;
    slider.step = 1;
    slider.setAttribute('tooltip', 'top');

    slider.style.display = isVisible ? 'block' : 'none';

    return slider;
}

//#endregion

//#endregion

//#region utilities

//#region helpers

//resolve groups and layers to array of layer ids
function resolveLayers(config) {
    return [...(config.groups?.flatMap(groupKey => groupMapping[groupKey] || []) || []), ...(config.layers || [])];
}

// Helper function: Get the correct opacity property name based on layer type
function getOpacityProperty(layerId) {
    // Get the layer object from the map
    const layer = map.getLayer(layerId);
    // Return null if layer not found
    if (!layer) {
        console.warn(`⚠️ Layer not found: ${layerId}`);
        return null; // ← FIX: Return null instead of console.log
    }

    // Map each layer type to its opacity property name
    const opacityMap = {
        line: 'line-opacity',
        fill: 'fill-opacity',
        circle: 'circle-opacity',
        raster: 'raster-opacity',
        'fill-extrusion': 'fill-extrusion-opacity',
        symbol: 'text-opacity',
        background: 'background-opacity'
    };

    // Return the opacity property for this layer type, default to fill-opacity
    return opacityMap[layer.type] || 'fill-opacity';
}

//#endregion

//#region Interactive Helpers
// Highlight selected feature
// Highlight selected feature - FIXED to use unique property-based filtering
function highlightFeature(feature) {
    clearHighlight();

    const layerId = feature.layer.id;
    const sourceLayer = feature.layer['source-layer'];
    const props = feature.properties;

    // Build a unique filter based on available properties
    // Priority: fid > id_dup > Drain num > OBJECTID > feature.id
    let filter;

    if (props.fid !== undefined) {
        filter = ['==', ['get', 'fid'], props.fid];
    } else if (props.id_dup !== undefined) {
        filter = ['==', ['get', 'id_dup'], props.id_dup];
    } else if (props['Drain num'] !== undefined) {
        filter = ['==', ['get', 'Drain num'], props['Drain num']];
    } else if (props.OBJECTID !== undefined) {
        filter = ['==', ['get', 'OBJECTID'], props.OBJECTID];
    } else if (feature.id !== undefined) {
        filter = ['==', ['id'], feature.id];
    } else {
        // Fallback: use name or first available unique property
        const uniqueKey = Object.keys(props).find(k => props[k] !== null && props[k] !== undefined);
        if (uniqueKey) {
            filter = ['==', ['get', uniqueKey], props[uniqueKey]];
        } else {
            console.warn('⚠️ Cannot create unique filter for feature:', feature);
            return;
        }
    }

    // Add highlight layer based on feature type
    if (feature.layer.type === 'line') {
        map.addLayer({
            id: 'feature-highlight',
            type: 'line',
            source: feature.layer.source,
            'source-layer': sourceLayer,
            filter: filter,
            paint: {
                'line-color': '#82f984',
                'line-width': 6,
                'line-opacity': 1
            }
        }); // Insert right above the original layer
    } else if (feature.layer.type === 'fill') {
        map.addLayer(
            {
                id: 'feature-highlight',
                type: 'line',
                source: feature.layer.source,
                'source-layer': sourceLayer,
                filter: filter,
                paint: {
                    'line-color': '#82f984',
                    'line-width': 4,
                    'line-opacity': 1
                }
            },
            layerId
        );
    }

    currentHighlight = 'feature-highlight';
}

// Clear highlight
function clearHighlight() {
    if (!currentHighlight) return;

    // Handle array of highlight layers (e.g., typology pairs)
    if (Array.isArray(currentHighlight)) {
        currentHighlight.forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
        });
    } else if (map.getLayer(currentHighlight)) {
        // Handle single highlight layer
        map.removeLayer(currentHighlight);
    }

    currentHighlight = null;
}

// Helpers
function getType(id) {
    if (id.includes('primary')) return 'Primary Drain';
    if (id.includes('secondary')) return 'Secondary Drain';
    if (id.includes('overlap')) return 'Lost Tank Outline';
    if (id === 'Lakes') return 'Existing Tank';
    if (id === 'Lakes_lost') return 'Lost Tank';
    if (id === 'Lakes_lost_1900') return 'Lost Tank (1969)';
    if (id === 'Lakes_lost_1800') return 'Lost Tank (1880s)';
    if (id === 'lakes_1700') return 'Lost Tank (1700s)';
    if (id === 'Lakes_lost_1800_button') return 'Lost Tank';
    if (id === 'Lakes_lost_1900_button') return 'Lost Tank';
    if (id === 'lakes_existing_1800') return 'Existing Tank';
    if (id === 'lakes_existing_1900') return 'Existing Tank';
    if (id === 'tanks_existing') return 'Existing Tank';
    if (id === 'typ_analysis') return 'Typology';
    if (id === 'gba-wards') return 'Ward';
    if (id === 'parks') return 'Park';
    return 'Feature';
}

function getColor(id) {
    if (id.includes('primary')) return '#4e4cf0';
    if (id.includes('secondary')) return '#00aaff';
    if (id.includes('overlap')) return '#cb5151';
    if (id === 'Lakes') return '#4e4cf0';
    if (id === 'Lakes_lost') return '#ae2e2e';
    if (id === 'Lakes_lost_1900') return '#ae2e2e';
    if (id === 'lakes_1700') return '#ae2e2e';
    if (id === 'Lakes_lost_1800') return '#8e3838';
    if (id === 'Lakes_lost_1800_button') return '#0085eb';
    if (id === 'Lakes_lost_1900_button') return '#0056eb';
    if (id === 'lakes_existing_1800') return '#0085eb';
    if (id === 'lakes_existing_1900') return '#0056eb';
    if (id === 'tanks_existing') return '#4e4cf0';
    if (id === 'typ_analysis') return '#FF69B4';
    if (id === 'parks') return '#296b2f';
    return '#999';
}

map.on('click', () => {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }
    // Clear typology popups when clicking elsewhere
    clearTypologyMarkers();
    window.typologyPopupsActive = false;
});

// Simple remover
function removeAllCallouts() {
    Object.keys(activeCallouts).forEach(id => {
        activeCallouts[id].remove();
        delete activeCallouts[id];
    });
}
//#endregion

//#region Typology Helper

// Get typology label
function getTypologyLabel(typCode) {
    return typologyLabels[typCode] || 'Unknown';
}

// Handle click anywhere on map when typology layer is active

// Helper function to get typology color from the layer paint property
function getTypologyColor(typValue) {
    const layer = map.getLayer('typ_analysis');
    if (!layer) return '#999999';

    const linePaint = map.getPaintProperty('typ_analysis', 'line-color');

    // linePaint is a match expression: ['match', ['get', 'typ'], 't1', '#FF0000', 't2', '#FFFF00', ...]
    if (Array.isArray(linePaint) && linePaint[0] === 'match') {
        // Iterate through the match pairs to find the color for this typValue
        for (let i = 2; i < linePaint.length - 1; i += 2) {
            if (linePaint[i] === typValue) {
                return linePaint[i + 1];
            }
        }
        // Return default color (last item in match array)
        return linePaint[linePaint.length - 1];
    }

    return '#999999';
}

/*Handle click anywhere on map when typology layer is active
function handleTypologyMapClick(lngLat) {
    map.on('click', e => {
        // Check if typology layer is visible
        const typLayer = map.getLayer('typ_analysis');
        if (!typLayer || map.getLayoutProperty('typ_analysis', 'visibility') === 'none') {
            return;
        }

        const lngLat = e.lngLat;
        const clickPoint = turf.point([lngLat.lng, lngLat.lat]);
        window.lastTypologyClickLngLat = lngLat;

        // Create a 0.05km buffer around click point
        const bufferZone = turf.buffer(clickPoint, 0.05, { units: 'kilometers' });

        // Query all features in typ_source
        const allFeatures = map.querySourceFeatures('typ_source', {
            sourceLayer: 'typ_analysis-6bvc7g'
        });

        //console.log(`📍 Click point: ${lngLat.lng}, ${lngLat.lat}`);
        //console.log(`📊 Searching through ${allFeatures.length} features`);

        // Group features by drain_id
        const byDrainId = {};
        allFeatures.forEach(f => {
            const drainId = f.properties['Drain num'];
            if (!byDrainId[drainId]) {
                byDrainId[drainId] = { lhs: null, rhs: null };
            }

            // Calculate distance from click point to feature line
            try {
                const line = turf.lineString(f.geometry.coordinates);
                const distance = turf.pointToLineDistance(clickPoint, line, { units: 'kilometers' });
                const side = f.properties.side;

                // Only keep features within buffer (0.05km)
                if (distance <= 0.05) {
                    if (!byDrainId[drainId][side] || distance < byDrainId[drainId][side].distance) {
                        byDrainId[drainId][side] = {
                            feature: f,
                            distance: distance
                        };
                    }
                }
            } catch (e) {
                console.warn('Error calculating distance:', e);
            }
        });

        // Find the drain_id with both lhs and rhs closest to click point
        let bestMatch = null;
        let bestTotalDistance = Infinity;

        Object.keys(byDrainId).forEach(drainId => {
            const pair = byDrainId[drainId];
            if (pair.lhs && pair.rhs) {
                const totalDistance = pair.lhs.distance + pair.rhs.distance;
                console.log(
                    `Drain ${drainId}: LHS dist=${pair.lhs.distance.toFixed(4)}km, RHS dist=${pair.rhs.distance.toFixed(
                        4
                    )}km, Total=${totalDistance.toFixed(4)}km`
                );

                if (totalDistance < bestTotalDistance) {
                    bestTotalDistance = totalDistance;
                    bestMatch = {
                        lhsFeature: pair.lhs.feature,
                        rhsFeature: pair.rhs.feature,
                        drainId: drainId
                    };
                }
            }
        });

        if (bestMatch) {
            console.log(`✅ Best match: Drain ${bestMatch.drainId}`);
            displayTypologyPair(bestMatch.lhsFeature, bestMatch.rhsFeature);
        } else {
            console.log('❌ No complete LHS/RHS pair found within 0.15km buffer');
        }
    });
}*/

// Display both LHS and RHS features as custom popups
function displayTypologyPair(lhsFeature, rhsFeature) {
    const lhsProps = lhsFeature.properties;
    const rhsProps = rhsFeature.properties;

    const lhsValue = lhsProps.typ || 'N/A';
    const rhsValue = rhsProps.typ || 'N/A';
    const drainId = lhsProps['drain_id'] || 'N/A'; // 🔥 CHANGED from drain_id

    const lhsColor = getTypologyColor(lhsValue);
    const rhsColor = getTypologyColor(rhsValue);

    const clickPoint = turf.point([window.lastTypologyClickLngLat.lng, window.lastTypologyClickLngLat.lat]);

    // Find closest point on LHS line to click
    const lhsLine = turf.lineString(lhsFeature.geometry.coordinates);
    const lhsClosestPoint = turf.nearestPointOnLine(lhsLine, clickPoint);

    // Find closest point on RHS line to click
    const rhsLine = turf.lineString(rhsFeature.geometry.coordinates);
    const rhsClosestPoint = turf.nearestPointOnLine(rhsLine, clickPoint);

    // Extract image URLs from description attribute (fallback to img attribute)
    const lhsImgHtml = lhsProps.description
        ? extractImageUrl(lhsProps.description)
        : lhsProps.img
        ? extractImageUrl(lhsProps.img)
        : '';
    const rhsImgHtml = rhsProps.description
        ? extractImageUrl(rhsProps.description)
        : rhsProps.img
        ? extractImageUrl(rhsProps.img)
        : '';

    // Close existing popups
    if (window.typologyPopups) {
        window.typologyPopups.forEach(popup => popup.remove());
    }

    // Mark that typology popups are active
    window.typologyPopupsActive = true;

    // Create LHS popup
    const lhsHtml = `<div style="background-color: white; color: ${lhsColor}; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap;">LHS: ${lhsValue}</div>${lhsImgHtml}`;

    const lhsPopup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        anchor: 'bottom' // Popup appears on top
    })
        .setLngLat(lhsClosestPoint.geometry.coordinates)
        .setHTML(lhsHtml)
        .addTo(map);

    // Create RHS popup
    const rhsHtml = `<div style="background-color: white; color: ${rhsColor}; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap;">RHS: ${rhsValue}</div>${rhsImgHtml}`;

    const rhsPopup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        anchor: 'top' // Popup appears on bottom
    })
        .setLngLat(rhsClosestPoint.geometry.coordinates)
        .setHTML(rhsHtml)
        .addTo(map);

    // Store popups for later cleanup
    window.typologyPopups = [lhsPopup, rhsPopup];

    // Update panel with information
    updateTypologyPanel(drainId, lhsValue, rhsValue);
}

// Helper function to extract image URL from img attribute
function extractImageUrl(imgAttribute) {
    // Extract src value from img tag
    const srcMatch = imgAttribute.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
        return `<img style="max-width: 200px; margin-top: 8px; border-radius: 4px;" src="${srcMatch[1]}" alt="Typology image">`;
    }
    return '';
}

function updateTypologyPanel(drainId, lhsValue, rhsValue) {
    // Get labels
    const lhsLabel = getTypologyLabel(lhsValue);
    const rhsLabel = getTypologyLabel(rhsValue);

    // Get colors for each typology
    const lhsColor = getTypologyColor(lhsValue);
    const rhsColor = getTypologyColor(rhsValue);

    // Update all elements by ID
    document.getElementById('typology-drain-id').textContent = drainId;
    document.getElementById('typology-lhs-code').textContent = lhsValue;
    document.getElementById('typology-lhs-label').textContent = lhsLabel;
    document.getElementById('typology-rhs-code').textContent = rhsValue;
    document.getElementById('typology-rhs-label').textContent = rhsLabel;

    // Set background colors for the columns
    const lhsColumn = document.querySelector('.typology-lhs');
    const rhsColumn = document.querySelector('.typology-rhs');

    if (lhsColumn) {
        lhsColumn.style.backgroundColor = lhsColor;
        lhsColumn.style.opacity = '1';
    }
    if (rhsColumn) {
        rhsColumn.style.backgroundColor = rhsColor;
        rhsColumn.style.opacity = '1';
    }

    // Update image
    const imagePath = `typology_axos/${lhsValue}-${rhsValue}.png`;
    const imageEl = document.getElementById('typology-image');
    imageEl.src = imagePath;
    imageEl.style.display = 'block';

    console.log('✅ Panel updated');
}

// Highlight both LHS and RHS features
function highlightTypologyPair(lhsFeature, rhsFeature) {
    clearHighlight();

    // Use the typ_analysis layer's source and sourceLayer
    const source = 'typ_source';
    const sourceLayer = 'typ_analysis-6bvc7g';

    // Highlight LHS feature
    map.addLayer({
        id: 'feature-highlight-lhs',
        type: 'line',
        source: source,
        'source-layer': sourceLayer,
        filter: ['==', ['id'], lhsFeature.id],
        paint: {
            'line-color': '#82f984',
            'line-width': 6,
            'line-opacity': 1
        }
    });

    // Highlight RHS feature
    map.addLayer({
        id: 'feature-highlight-rhs',
        type: 'line',
        source: source,
        'source-layer': sourceLayer,
        filter: ['==', ['id'], rhsFeature.id],
        paint: {
            'line-color': '#82f984',
            'line-width': 6,
            'line-opacity': 1
        }
    });

    currentHighlight = ['feature-highlight-lhs', 'feature-highlight-rhs'];
}

function resetTypologyPanel() {
    // Reset text fields to default values
    document.getElementById('typology-drain-id').textContent = '—';
    document.getElementById('typology-lhs-code').textContent = '—';
    document.getElementById('typology-lhs-label').textContent = 'Select to view';
    document.getElementById('typology-rhs-code').textContent = '—';
    document.getElementById('typology-rhs-label').textContent = 'Select to view';

    // Reset column colors
    const lhsColumn = document.querySelector('.typology-lhs');
    const rhsColumn = document.querySelector('.typology-rhs');

    if (lhsColumn) {
        lhsColumn.style.backgroundColor = 'transparent';
        lhsColumn.style.opacity = '1';
    }
    if (rhsColumn) {
        rhsColumn.style.backgroundColor = 'transparent';
        rhsColumn.style.opacity = '1';
    }

    // Reset the image reliably
    const imageEl = document.getElementById('typology-image');
    if (imageEl) {
        imageEl.src = ''; // clear the src first
        imageEl.removeAttribute('src'); // remove attribute
        imageEl.style.display = 'none'; // hide it
    }

    // Clear typology popups forcefully
    if (window.typologyPopups) {
        window.typologyPopups.forEach(popup => {
            if (popup && popup.remove) {
                popup.remove();
            }
        });
        window.typologyPopups = null;
    }
    window.typologyPopupsActive = false;

    console.log('🔄 Typology panel fully reset');
}

// Clean up typology popups
function clearTypologyMarkers() {
    if (window.typologyPopups) {
        window.typologyPopups.forEach(popup => popup.remove());
        window.typologyPopups = null;
    }
}
//#endregion

//#region counterHelpers

// Function to count features in a layer

let existingCount = null;
let lostCount = null;

function countFeaturesInLayer(layerId, customFilter = null) {
    //console.log(`\n🔢 === Counting features for ${layerId} ===`);

    const layer = map.getLayer(layerId);
    if (!layer) {
        console.warn(`Layer ${layerId} not found`);
        return 0;
    }

    const filterToUse = customFilter !== null ? customFilter : map.getFilter(layerId);
    //console.log(`📋 Filter being used:`, filterToUse);
    //console.log(`📋 Current zoom level:`, map.getZoom());
    //console.log(`📋 Current bounds:`, map.getBounds());

    const features = map.querySourceFeatures(layer.source, {
        sourceLayer: layer['source-layer'],
        filter: filterToUse
    });

    //console.log(`📊 Total features queried: ${features.length}`);

    // Deduplicate by fid (handles tile boundary splitting)
    const uniqueFids = new Set();
    const duplicates = [];

    features.forEach(feature => {
        if (feature.properties.fid) {
            if (uniqueFids.has(feature.properties.fid)) {
                duplicates.push(feature.properties.fid);
            }
            uniqueFids.add(feature.properties.fid);
        } else {
            console.warn(`⚠️ Feature without fid:`, feature.properties);
        }
    });

    //console.log(`✅ Unique features (by fid): ${uniqueFids.size}`);
    if (duplicates.length > 0) {
        //console.log(`🔄 Duplicates found: ${duplicates.length} features`);
        //console.log(`   Duplicate fids:`, [...new Set(duplicates)]);
    }

    return uniqueFids.size;
}

// Function to update the lakes counter display
// Replace your updateLakesCounter function with this debug version:
function updateLakesCounter(existingCount, lostCount, showLost = true) {
    //console.log(`\n📊 === Updating Lakes Counter ===`);
    //console.log(`  Existing: ${existingCount}`);
    //console.log(`  Lost: ${lostCount}`);
    //console.log(`  Show Lost: ${showLost}`);
    //console.log(`  Current zoom: ${map.getZoom()}`);

    const existingElement = document.querySelector('#existing_lakes #count');
    const lostElement = document.querySelector('#lost_lakes #count');
    const totalElement = document.querySelector('#existing_lakes:last-child #count');

    if (existingElement) {
        existingElement.textContent = existingCount;
        //console.log(`  ✅ Set existing element to: ${existingCount}`);
    } else {
        console.warn(`  ⚠️ Existing element not found`);
    }

    if (lostElement) {
        if (showLost && lostCount !== null) {
            lostElement.textContent = lostCount;
            //console.log(`  ✅ Set lost element to: ${lostCount}`);
        } else {
            lostElement.textContent = '—';
            //console.log(`  ℹ️ Set lost element to: —`);
        }
    } else {
        console.warn(`  ⚠️ Lost element not found`);
    }

    if (totalElement) {
        const total = showLost && lostCount !== null ? existingCount + lostCount : existingCount;
        totalElement.textContent = total;
        //console.log(`  ✅ Set total element to: ${total}`);
    } else {
        console.warn(`  ⚠️ Total element not found`);
    }
}

//#region Filter Counter Functions

function getDrainIdsAndLength(layerId) {
    const layer = map.getLayer(layerId);
    if (!layer) return { ids: new Set(), totalLength: 0 };

    const currentFilter = map.getFilter(layerId);
    const features = map.querySourceFeatures(layer.source, {
        sourceLayer: layer['source-layer'],
        filter: currentFilter
    });

    //console.log(`\n🔍 Analyzing ${layerId}:`);
    //console.log(`📊 Raw features queried: ${features.length}`);

    const drainIds = new Set();
    const uniqueSegments = new Map();

    features.forEach(feature => {
        const drainId = feature.properties['Drain num'];
        const lengthM = feature.properties['length_m'];
        const idDup = feature.properties['id_dup']; // Use the unique ID attribute

        if (!drainId || !lengthM || !idDup) return;

        drainIds.add(drainId);

        // Use id_dup as the unique key - this should be truly unique!
        const uniqueKey = idDup;

        // Store unique segments (deduplicate by id_dup)
        if (!uniqueSegments.has(uniqueKey)) {
            uniqueSegments.set(uniqueKey, {
                drainId: drainId,
                length: parseFloat(lengthM)
            });
        }
    });

    //console.log(`✅ Unique segments: ${uniqueSegments.size}`);
    //console.log(`📉 Duplicates removed: ${features.length - uniqueSegments.size}`);

    // Sum lengths by drain ID
    const drainLengths = new Map();

    uniqueSegments.forEach(segment => {
        const currentLength = drainLengths.get(segment.drainId) || 0;
        drainLengths.set(segment.drainId, currentLength + segment.length);
    });

    // Debug specific drains
    if (drainLengths.has('K103')) {
        //console.log(`🔍 K103 breakdown:`);
        const k103Segments = Array.from(uniqueSegments.values()).filter(s => s.drainId === 'K103');
        //console.log(`  Segments found: ${k103Segments.length}`);
        k103Segments.forEach((s, i) => {
            //console.log(`  Segment ${i + 1}: ${(s.length / 1000).toFixed(3)} km`);
        });
        //console.log(`  ✅ Total K103: ${(drainLengths.get('K103') / 1000).toFixed(2)} km`);
    }

    // Calculate total
    let totalLength = 0;
    drainLengths.forEach(length => {
        totalLength += length;
    });

    //console.log(`📊 Total: ${(totalLength / 1000).toFixed(2)} km\n`);

    return {
        ids: drainIds,
        totalLength: totalLength
    };
}

// Function to format length in appropriate units
function formatLength(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
}

// Function to get unique ward names from filtered features
function getUniqueWards() {
    const wards = new Set();

    // Get wards from Lakes layer
    const lakesLayer = map.getLayer('Lakes');
    if (lakesLayer) {
        const lakesFilter = map.getFilter('Lakes');
        const lakesFeatures = map.querySourceFeatures(lakesLayer.source, {
            sourceLayer: lakesLayer['source-layer'],
            filter: lakesFilter
        });

        lakesFeatures.forEach(feature => {
            const wardName = feature.properties.ward_name;
            if (wardName) {
                // Handle comma-separated wards
                if (wardName.includes(',')) {
                    wardName.split(',').forEach(w => wards.add(w.trim()));
                } else {
                    wards.add(wardName.trim());
                }
            }
        });
    }

    // Get wards from Lakes_lost layer
    const lostLayer = map.getLayer('Lakes_lost');
    if (lostLayer) {
        const lostFilter = map.getFilter('Lakes_lost');
        const lostFeatures = map.querySourceFeatures(lostLayer.source, {
            sourceLayer: lostLayer['source-layer'],
            filter: lostFilter
        });

        lostFeatures.forEach(feature => {
            const wardName = feature.properties.ward_name;
            if (wardName) {
                if (wardName.includes(',')) {
                    wardName.split(',').forEach(w => wards.add(w.trim()));
                } else {
                    wards.add(wardName.trim());
                }
            }
        });
    }

    // Get wards from drain layers
    ['primary-drains', 'secondary-drains'].forEach(layerId => {
        const layer = map.getLayer(layerId);
        if (layer) {
            const filter = map.getFilter(layerId);
            const features = map.querySourceFeatures(layer.source, {
                sourceLayer: layer['source-layer'],
                filter: filter
            });

            features.forEach(feature => {
                const wardName = feature.properties.ward_name;
                if (wardName) {
                    if (wardName.includes(',')) {
                        wardName.split(',').forEach(w => wards.add(w.trim()));
                    } else {
                        wards.add(wardName.trim());
                    }
                }
            });
        }
    });

    return Array.from(wards).sort();
}

// Function to update the filter counter display
function updateFilterCounter() {
    console.log(`\n📊 === Updating Filter Counter ===`);

    // Wait for map to be idle
    const doUpdate = () => {
        // Count lakes
        const existingCount = countFeaturesInLayer('Lakes');
        const lostCount = countFeaturesInLayer('Lakes_lost');

        // Get drain IDs and lengths
        const primaryData = getDrainIdsAndLength('primary-drains');
        const secondaryData = getDrainIdsAndLength('secondary-drains');

        // Get unique wards
        const wards = getUniqueWards();

        // Update lakes counts
        const existingEl = document.getElementById('filter-existing-count');
        const lostEl = document.getElementById('filter-lost-count');

        if (existingEl) existingEl.textContent = existingCount;
        if (lostEl) lostEl.textContent = lostCount;

        // Update primary drains
        const primaryListEl = document.getElementById('filter-primary-drains-list');
        const primaryLengthEl = document.getElementById('filter-primary-length');

        if (primaryListEl) {
            if (primaryData.ids.size > 0) {
                const sortedIds = Array.from(primaryData.ids).sort((a, b) => {
                    // Sort numerically if possible, otherwise alphabetically
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                    }
                    return a.localeCompare(b);
                });
                primaryListEl.textContent = sortedIds.join(', ');
            } else {
                primaryListEl.textContent = '—';
            }
        }

        if (primaryLengthEl) {
            if (primaryData.totalLength > 0) {
                primaryLengthEl.textContent = `Total: ${formatLength(primaryData.totalLength)}`;
            } else {
                primaryLengthEl.textContent = 'Total: —';
            }
        }

        // Update secondary drains
        const secondaryListEl = document.getElementById('filter-secondary-drains-list');
        const secondaryLengthEl = document.getElementById('filter-secondary-length');

        if (secondaryListEl) {
            if (secondaryData.ids.size > 0) {
                const sortedIds = Array.from(secondaryData.ids).sort((a, b) => {
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                    }
                    return a.localeCompare(b);
                });
                secondaryListEl.textContent = sortedIds.join(', ');
            } else {
                secondaryListEl.textContent = '—';
            }
        }

        if (secondaryLengthEl) {
            if (secondaryData.totalLength > 0) {
                secondaryLengthEl.textContent = `Total: ${formatLength(secondaryData.totalLength)}`;
            } else {
                secondaryLengthEl.textContent = 'Total: —';
            }
        }

        // Update wards
        const wardsEl = document.getElementById('filter-wards-list');
        if (wardsEl) {
            if (wards.length > 0) {
                wardsEl.textContent = wards.join(', ');
            } else {
                wardsEl.textContent = '—';
            }
        }

        console.log(`✅ Filter counter updated:`);
        console.log(`  - Existing Lakes: ${existingCount}`);
        console.log(`  - Lost Lakes: ${lostCount}`);
        console.log(`  - Primary Drains: ${primaryData.ids.size} (${formatLength(primaryData.totalLength)})`);
        console.log(`  - Secondary Drains: ${secondaryData.ids.size} (${formatLength(secondaryData.totalLength)})`);
        console.log(`  - Wards: ${wards.length}`);
    };

    // If map is moving, wait for idle
    if (map.isMoving() || map.isZooming() || map.isRotating()) {
        console.log('  ⏳ Map is moving, waiting for idle...');
        map.once('idle', doUpdate);
    } else {
        doUpdate();
    }
}

//#endregion

//#endregion

//#region Generic Layer Filter System - IMPROVED INDUSTRY STANDARD

// Store filter states for multiple layer/attribute combinations
const filterStates = {};
const filterControls = {}; // Store filter control objects for cross-filter updates

/**
 * Creates a dynamic dropdown filter with industry-standard UX
 * Features:
 * - OR logic within each filter, AND logic between filters
 * - Show counts for each option
 * - Disable unavailable options (don't hide them)
 * - Show "Selected: X of Y" indicator
 * - Search box for ward filter
 */
function createLayerFilter(config) {
    const { dropdownId, sampleLayerId, attributeName, layerIds, onFilterChange = null } = config;

    // Initialize filter state
    const filterKey = dropdownId;
    filterStates[filterKey] = {
        selectedValues: new Set(),
        allValues: [],
        originalAllValues: [],
        layerIds: layerIds,
        attributeName: attributeName,
        sampleLayerId: sampleLayerId
    };

    const state = filterStates[filterKey];

    // Get unique values with counts from the layer
    // Get unique values with counts from the layer
    // Get unique values with counts from the layer
    function getUniqueValuesWithCounts(considerOtherFilters = false) {
        const layer = map.getLayer(sampleLayerId);
        if (!layer) {
            console.warn(`⚠️ Layer ${sampleLayerId} not found`);
            return {};
        }

        let features = [];

        // ✅ ALWAYS use querySourceFeatures instead of queryRenderedFeatures
        const queryOptions = {
            sourceLayer: layer['source-layer']
        };

        // If considering other filters, include the current map filter
        if (considerOtherFilters) {
            const currentFilter = map.getFilter(sampleLayerId);
            if (currentFilter) {
                queryOptions.filter = currentFilter;
            }
        }

        features = map.querySourceFeatures(layer.source, queryOptions);

        // 🔥 ALSO query Lakes_lost if it's in the layerIds
        if (state.layerIds.includes('Lakes_lost')) {
            const lostLayer = map.getLayer('Lakes_lost');
            if (lostLayer) {
                const lostQueryOptions = {
                    sourceLayer: lostLayer['source-layer']
                };

                if (considerOtherFilters) {
                    const currentFilter = map.getFilter('Lakes_lost');
                    if (currentFilter) {
                        lostQueryOptions.filter = currentFilter;
                    }
                }

                const lostFeatures = map.querySourceFeatures(lostLayer.source, lostQueryOptions);
                features = [...features, ...lostFeatures];
            }
        }

        // Deduplicate by fid
        const uniqueFeatures = new Map();
        features.forEach(feature => {
            const fid = feature.properties.fid || feature.properties['Drain num'];
            if (fid && !uniqueFeatures.has(fid)) {
                uniqueFeatures.set(fid, feature);
            }
        });

        // Count values from unique features
        const valueCounts = {};
        uniqueFeatures.forEach(feature => {
            const value = feature.properties[attributeName];
            if (value !== null && value !== undefined && String(value).trim() !== '') {
                const valueStr = String(value);

                // ✅ NEW: Handle comma-separated lists (for ward_name in drains)
                if (attributeName === 'ward_name' && valueStr.includes(',')) {
                    // Split by comma, trim whitespace, and count each ward separately
                    const wards = valueStr
                        .split(',')
                        .map(w => w.trim())
                        .filter(w => w !== '');
                    wards.forEach(ward => {
                        valueCounts[ward] = (valueCounts[ward] || 0) + 1;
                    });
                } else {
                    // Normal single value
                    valueCounts[valueStr] = (valueCounts[valueStr] || 0) + 1;
                }
            }
        });

        return valueCounts;
    }

    // Add this helper to identify layer types
    function getLayerType(layerId) {
        if (layerId.includes('Lakes') || layerId.includes('lakes') || layerId.includes('tanks')) {
            return 'lake';
        }
        if (layerId.includes('drain') || layerId.includes('Halo')) {
            return 'drain';
        }
        return 'other';
    }

    function buildCombinedFilter(forLayerType = null) {
        const allFilters = [];

        Object.keys(filterStates).forEach(key => {
            const filterState = filterStates[key];

            if (
                filterState.selectedValues.size === 0 ||
                filterState.selectedValues.size === filterState.originalAllValues.length
            ) {
                return;
            }

            // 🔥 NEW: Skip filters that don't apply to this layer type
            if (forLayerType) {
                const filterLayerType = getLayerType(filterState.sampleLayerId);

                // Skip lake-specific filters for drain layers and vice versa
                if (filterLayerType === 'lake' && forLayerType === 'drain') {
                    // Only apply common filters (valley, ward_name)
                    if (!['valley', 'ward_name'].includes(filterState.attributeName)) {
                        return; // Skip this filter
                    }
                }
                if (filterLayerType === 'drain' && forLayerType === 'lake') {
                    // Only apply common filters (valley, ward_name)
                    if (!['valley', 'ward_name'].includes(filterState.attributeName)) {
                        return; // Skip this filter
                    }
                }
            }

            const valueArray = Array.from(filterState.selectedValues);

            const orFilters = valueArray.map(value => ['in', value, ['get', filterState.attributeName]]);

            allFilters.push(orFilters.length === 1 ? orFilters[0] : ['any', ...orFilters]);
        });

        if (allFilters.length === 0) return null;
        if (allFilters.length === 1) return allFilters[0];
        return ['all', ...allFilters];
    }

    // Modify applyFilter to use layer-specific filters
    function applyFilter(shouldRefreshOthers = true) {
        const state = filterStates[filterKey];

        state.layerIds.forEach(layerId => {
            if (!map.getLayer(layerId)) return;

            // ❌ REMOVE THIS ENTIRE BLOCK:
            // if (layerId === 'gba-wards') {
            //     map.setFilter(layerId, null);
            //     return;
            // }

            const layerType = getLayerType(layerId);
            const combinedFilter = buildCombinedFilter(layerType);

            // Debug logging for ward filter
            if (filterKey === 'ward-filter-dropdown' && layerId === 'Lakes_lost') {
                console.log('🔍 Ward filter for Lakes_lost:', JSON.stringify(combinedFilter, null, 2));
            }

            map.setFilter(layerId, combinedFilter);
        });

        if (shouldRefreshOthers) {
            map.once('idle', () => {
                refreshOtherFilters();
                updateFilterCounter();
            });
        } else {
            map.once('idle', () => {
                updateFilterCounter();
            });
        }

        if (onFilterChange) {
            onFilterChange(state.selectedValues, state.allValues);
        }
    }
    // Populate dropdown with options, counts, and proper states
    function populateDropdown(considerOtherFilters = false, maintainSelection = true, forceNoFilters = false) {
        //console.log(`\n🔄 populateDropdown called for ${dropdownId}`);
        //console.log(`  - considerOtherFilters: ${considerOtherFilters}`);
        //console.log(`  - maintainSelection: ${maintainSelection}`);
        //console.log(`  - forceNoFilters: ${forceNoFilters}`);

        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) {
            console.warn(`⚠️ Dropdown ${dropdownId} not found`);
            return;
        }

        // Store previous selections
        const previousSelections = new Set(state.selectedValues);

        // ✅ NEW: If forceNoFilters is true, temporarily clear map filters to get true counts
        let tempFiltersCleared = false;
        if (forceNoFilters) {
            console.log(`  🔓 Temporarily clearing map filters to get unfiltered counts...`);
            state.layerIds.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.setFilter(layerId, null);
                }
            });
            tempFiltersCleared = true;
        }

        // Get value counts (considering other filters if requested)
        const valueCounts = getUniqueValuesWithCounts(considerOtherFilters && !forceNoFilters);
        const availableValues = Object.keys(valueCounts).sort();

        if (availableValues.length === 0 && state.originalAllValues.length === 0) {
            console.warn(`⚠️ No values found for attribute "${attributeName}" in layer "${sampleLayerId}"`);
            return;
        }

        // If this is the first time, get all possible values and select all
        const isFirstTime = state.originalAllValues.length === 0;

        if (isFirstTime) {
            // Get all original values without any filters
            const allValueCounts = getUniqueValuesWithCounts(false);
            state.originalAllValues = Object.keys(allValueCounts).sort();
            state.allValues = [...state.originalAllValues];
            state.selectedValues = new Set(state.originalAllValues);
        } else {
            // Update available values
            state.allValues = availableValues;

            if (maintainSelection) {
                // Keep selections that are still valid
                const maintainedSelections = Array.from(previousSelections).filter(val =>
                    state.originalAllValues.includes(val)
                );
                state.selectedValues = new Set(maintainedSelections);
            }
        }

        // Clear existing dropdown items (except trigger and search if it exists)
        const existingItems = dropdown.querySelectorAll('wa-dropdown-item, wa-divider, .selection-indicator');
        existingItems.forEach(item => item.remove());

        // 🔍 Add search box ONLY for ward filter

        // 🔍 Add search box ONLY for ward filter and drain number filters

        if (
            dropdownId === 'ward-filter-dropdown' ||
            dropdownId === 'drain-ward-filter-dropdown' ||
            dropdownId === 'primary-number-filter-dropdown' || // ✅ ADD THIS
            dropdownId === 'secondary-number-filter-dropdown' ||
            dropdownId === 'typology-primary-drain-filter' // 🔥 ADD THIS LINE
        ) {
            // ✅ ADD THIS
            let searchInput = dropdown.querySelector('sl-input[type="search"]');

            if (!searchInput) {
                searchInput = document.createElement('sl-input');
                searchInput.setAttribute('type', 'search');

                // Set placeholder based on dropdown type
                let placeholder = 'Search...';
                if (dropdownId === 'ward-filter-dropdown' || dropdownId === 'drain-ward-filter-dropdown') {
                    placeholder = 'Search wards...';
                } else if (dropdownId === 'primary-number-filter-dropdown') {
                    placeholder = 'Search primary drain numbers...';
                } else if (dropdownId === 'secondary-number-filter-dropdown') {
                    placeholder = 'Search secondary drain numbers...';
                }

                searchInput.setAttribute('placeholder', placeholder);
                searchInput.setAttribute('clearable', '');
                searchInput.setAttribute('size', 'small');
                searchInput.style.cssText = `
            width: calc(100% - 20px);
            margin: 10px 10px 5px 10px;
            --sl-input-border-radius-medium: 0px;
        `;
                dropdown.insertBefore(searchInput, dropdown.firstChild);

                // Search functionality
                searchInput.addEventListener('sl-input', e => {
                    const searchTerm = e.target.value.toLowerCase();
                    const items = dropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]');
                    items.forEach(item => {
                        const text = item.textContent.toLowerCase();
                        if (text.includes(searchTerm)) {
                            item.style.display = '';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });

                // Prevent dropdown from closing
                searchInput.addEventListener('click', e => e.stopPropagation());
                searchInput.addEventListener('mousedown', e => e.stopPropagation());
            }
        }

        // Add selection indicator
        const indicator = document.createElement('div');

        // Add "Select All" and "Clear Selection" buttons
        const selectAllBtn = document.createElement('wa-dropdown-item');
        selectAllBtn.setAttribute('value', 'select-all');
        selectAllBtn.className = 'filter-control-btn';
        selectAllBtn.textContent = 'Select All';

        const clearBtn = document.createElement('wa-dropdown-item');
        clearBtn.setAttribute('value', 'clear-all');
        clearBtn.className = 'filter-control-btn';
        clearBtn.textContent = 'Clear';

        dropdown.appendChild(selectAllBtn);
        dropdown.appendChild(clearBtn);

        // Add divider
        const divider = document.createElement('wa-divider');
        dropdown.appendChild(divider);

        // ✅ Get current counts - use unfiltered counts if forceNoFilters is true
        const currentCounts = forceNoFilters ? valueCounts : getUniqueValuesWithCounts(true);

        // Add checkbox items for ALL ORIGINAL values
        state.originalAllValues.forEach(value => {
            const item = document.createElement('wa-dropdown-item');
            item.setAttribute('type', 'checkbox');
            item.setAttribute('value', value);

            // Check if this value has features
            const count = currentCounts[value] || 0;
            const isAvailable = forceNoFilters ? count > 0 : count > 0; // When forcing no filters, all should be available

            // Set checked state
            item.checked = state.selectedValues.has(value);

            // ✅ During reset, don't disable anything
            if (!forceNoFilters && !isAvailable) {
                item.disabled = true;
                item.classList.add('filter-unavailable');
            } else {
                item.disabled = false;
                item.classList.remove('filter-unavailable');
            }

            // Add custom class for styling
            if (item.checked) {
                item.classList.add('filter-checked');
            } else {
                item.classList.add('filter-unchecked');
            }

            // Display with count
            item.textContent = `${value} (${count})`;
            dropdown.appendChild(item);
        });

        //console.log(`✅ Populated ${dropdownId} | Selected: ${state.selectedValues.size}/${state.originalAllValues.length}`);
    }

    // Refresh other filters based on current selections
    function refreshOtherFilters() {
        //console.log(`\n🔃 refreshOtherFilters called from ${filterKey}`);

        Object.keys(filterStates).forEach(key => {
            if (key !== filterKey && filterStates[key].sampleLayerId === sampleLayerId) {
                //console.log(`  - Refreshing ${key}...`);
                const otherControl = filterControls[key];
                if (otherControl) {
                    otherControl.refreshWithFilters(false);
                }
            }
        });

        //console.log(`✅ refreshOtherFilters complete\n`);
    }

    // Setup event listeners
    function setupListeners() {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        dropdown.addEventListener('wa-select', event => {
            event.preventDefault();

            const item = event.detail.item;
            const value = item.value;

            if (item.type === 'checkbox') {
                // Toggle value selection
                if (item.checked) {
                    state.selectedValues.add(value);
                } else {
                    state.selectedValues.delete(value);
                }
                applyFilter(true);
            } else {
                // Handle "Select All" or "Clear All"
                if (value === 'select-all') {
                    // Select all AVAILABLE values
                    dropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]:not([disabled])').forEach(checkbox => {
                        state.selectedValues.add(checkbox.value);
                        checkbox.checked = true;
                    });
                    applyFilter(true);
                } else if (value === 'clear-all') {
                    // Clear all selections in this filter only
                    state.selectedValues.clear();
                    dropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    applyFilter(true);
                }
            }
        });
    }

    // Initialize the filter
    populateDropdown();
    setupListeners();

    // Create control object
    const control = {
        refresh: () => populateDropdown(false, false),
        refreshWithFilters: (shouldRefreshOthers = true) => {
            populateDropdown(true, true);
            if (shouldRefreshOthers) {
                applyFilter(false);
            }
        },
        // Replace the entire reset method with this improved version:
        reset: () => {
            //console.log(`🔄 Resetting filter: ${dropdownId}`);
            //console.log(`  Before reset: ${state.selectedValues.size}/${state.originalAllValues.length}`);

            // Reset the state
            state.selectedValues = new Set(state.originalAllValues);
            state.allValues = [...state.originalAllValues];

            //console.log(`  After reset: ${state.selectedValues.size}/${state.originalAllValues.length}`);

            // ✅ Use forceNoFilters=true to get unfiltered counts
            populateDropdown(false, false, true);

            //console.log(`  ✅ Filter UI reset complete for ${dropdownId}`);
        },
        applyFilter: applyFilter,
        getSelectedValues: () => Array.from(state.selectedValues),
        setSelectedValues: values => {
            state.selectedValues = new Set(values);
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = values.includes(checkbox.value);
                });
            }
            applyFilter(true);
        }
    };

    filterControls[filterKey] = control;
    return control;
}

//#endregion

//#endregion

//#region services

//#region layer services

// Store original paint properties for all layers
const originalLayerProperties = {};

// Save all paint properties for all layers in the map
function storeOriginalLayerProperties() {
    allLayerIds.forEach(layerId => {
        const layer = map.getLayer(layerId);
        if (!layer) return;

        // Only store once — never overwrite after fade-out
        if (!originalLayerProperties[layerId]) {
            const style = map.getStyle();
            const styleLayer = style.layers.find(l => l.id === layerId);

            // Store deep copy of paint properties
            if (styleLayer?.paint) {
                originalLayerProperties[layerId] = JSON.parse(JSON.stringify(styleLayer.paint));
                //console.log(`🎨 Stored original paints for ${layerId}`);
            }
        }
    });
}

function toggleLayer(layerId, show = true, customOpacity = null) {
    // Get the layer object from the map
    const layer = map.getLayer(layerId);
    // Exit early if layer doesn't exist
    if (!layer) return;

    // Get the opacity property for this layer type using helper function
    const opacityProp = getOpacityProperty(layerId);
    // Exit if no opacity property found
    if (!opacityProp) return;

    // Determine target opacity - use custom value or default to 1 (fully opaque)
    const targetOpacity = customOpacity !== null ? customOpacity : 1;

    // Set transition duration for smooth fading (500ms)
    map.setPaintProperty(layerId, `${opacityProp}-transition`, {
        duration: 500
    });

    // Apply the opacity value - show with target opacity, hide with 0
    map.setPaintProperty(layerId, opacityProp, show ? targetOpacity : 0);

    // Handle visibility - hide layer if show is false, show if true
    if (!show) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
    } else {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
    }
}

// Toggle all layers in a group
function toggleGroup(groupKey, show = true, customOpacity = null) {
    // Get the layers array for this group from config
    const layers = layerConfig[groupKey]?.layers;

    // Exit if group doesn't exist
    if (!layers) {
        console.warn(`Group ${groupKey} not found in layerConfig`);
        return;
    }

    // Loop through all layers in the group
    layers.forEach(layerId => {
        // Check if layer exists in map
        if (map.getLayer(layerId) && !layerId.includes('-interaction')) {
            // Toggle the layer with the same parameters
            toggleLayer(layerId, show, customOpacity);
        }
    });

    // Update the checkbox to reflect the new state
    //syncLegendToMap(groupKey);
}

function toggleLayerOff(layerId) {
    // skip base imagery
    if (['satellite', 'background'].includes(layerId)) return;

    const layer = map.getLayer(layerId);
    if (!layer) return;

    const layoutVis = map.getLayoutProperty(layerId, 'visibility');
    if (layoutVis === 'none') return; // already hidden

    //console.log(`🕳️ Fading and hiding ${layerId}`);

    const opacityProp = getOpacityProperty(layerId);
    if (!opacityProp) {
        console.warn(`No opacity property for ${layerId}`);
        map.setLayoutProperty(layerId, 'visibility', 'none');
        return;
    }

    // clear any pending timeouts by storing them in a map if needed
    map.setPaintProperty(layerId, `${opacityProp}-transition`, { duration: 500 });
    map.setPaintProperty(layerId, opacityProp, 0);

    // ✅ Ensure nothing else resets visibility before fade completes
    setTimeout(() => {
        if (!map.getLayer(layerId)) return;

        // Lock the layer off
        map.setLayoutProperty(layerId, 'visibility', 'none');

        // reset opacity to default 1 so next toggle-on is correct
        map.setPaintProperty(layerId, opacityProp, 1);

        //console.log(`🚫 ${layerId} visibility now set to 'none'`);

        // ✅ Re-sync legend *after* turning off
        syncLegendToMap(layerId);
    }, 550); // slightly > fade duration
}

function setOpa(groupKey, opacityValue) {
    // Fade the layer to the desired opacity
    toggleGroup(groupKey, true, opacityValue);

    // Update the slider if it exists
    const slider = document.getElementById(`slider-${groupKey}`);
    if (slider) {
        slider.value = opacityValue * 100;
    }
}

//#endregion

//#region viewService

function smoothFlyTo(view, useBounds = true) {
    const options = {
        duration: 3000,
        essential: true,
        easing: t => 1 - Math.pow(1 - t, 3)
    };

    // Check if we should use bounds-based responsive view
    if (useBounds && view.bounds) {
        // Use fitBounds for responsive zoom
        map.fitBounds(view.bounds, {
            ...options,
            padding: view.padding || { top: 50, bottom: 50, left: 50, right: 50 },
            pitch: view.pitch || 0,
            bearing: view.bearing || 0
        });
    } else {
        // Fallback to traditional flyTo with center/zoom
        map.flyTo({ ...view, ...options });
    }
}

function toggleValleyView(showRegional) {
    if (showRegional) {
        // Regional view - zoom out to 9
        map.flyTo({
            center: [78.119, 12.739],
            zoom: 7,
            pitch: 0,
            bearing: 0,
            duration: 2000,
            essential: true,
            easing: t => 1 - Math.pow(1 - t, 3)
        });
    } else {
        // Local view - return to valley view
        smoothFlyTo(valleyViewBounds);
    }
}

/**
 * Zooms the map to fit the bounds of all features in a given layer
 * @param {string} layerId - The ID of the layer to zoom to
 * @param {object} options - Optional settings for the zoom
 * @param {number} options.padding - Padding around the bounds (default: 50)
 * @param {number} options.pitch - Camera pitch angle (default: 0)
 * @param {number} options.bearing - Camera bearing angle (default: 0)
 * @param {number} options.duration - Animation duration in ms (default: 2000)
 * @param {number} options.maxZoom - Maximum zoom level (default: 13)
 */
function zoomToLayerBounds(layerId, options = {}) {
    const { padding = 0, pitch = 0, bearing = 0, duration = 2000, maxZoom = 25 } = options;

    // Check if layer exists
    const layer = map.getLayer(layerId);
    if (!layer) {
        console.warn(`Layer "${layerId}" not found`);
        return;
    }

    // Function to perform the zoom
    const performZoom = () => {
        // Get layer configuration
        const sourceId = layer.source;
        const sourceLayer = layer['source-layer'];

        console.log(`Querying features from source: ${sourceId}, sourceLayer: ${sourceLayer}`);

        // Query all rendered features from the layer (visible on screen)
        const renderedFeatures = map.queryRenderedFeatures({ layers: [layerId] });

        // Also query source features to get all features regardless of viewport
        const sourceFeatures = map.querySourceFeatures(sourceId, {
            sourceLayer: sourceLayer
        });

        console.log(`Rendered features: ${renderedFeatures.length}, Source features: ${sourceFeatures.length}`);

        // Use whichever has more features
        const features = sourceFeatures.length > 0 ? sourceFeatures : renderedFeatures;

        if (!features || features.length === 0) {
            console.warn(`No features found in layer "${layerId}", will retry after sourcedata loads...`);
            return false;
        }

        // Create a FeatureCollection and calculate bounds using Turf
        const featureCollection = turf.featureCollection(features);
        const bbox = turf.bbox(featureCollection);

        console.log(`Calculated bbox:`, bbox);

        // Convert bbox to LngLatBounds format: [[west, south], [east, north]]
        const bounds = [
            [bbox[0], bbox[1]], // Southwest
            [bbox[2], bbox[3]] // Northeast
        ];

        // Fit the map to the calculated bounds with maxZoom constraint
        map.fitBounds(bounds, {
            padding: padding,
            pitch: pitch,
            bearing: bearing,
            duration: duration,
            maxZoom: maxZoom, // Prevent zooming out too much
            essential: true,
            easing: t => 1 - Math.pow(1 - t, 3)
        });

        return true;
    };

    // Try immediately first
    const success = performZoom();

    // If no features found, wait for source data to load
    if (!success) {
        const sourceId = layer.source;
        const onSourceData = e => {
            if (e.sourceId === sourceId && e.isSourceLoaded) {
                console.log(`Source ${sourceId} loaded, retrying zoom...`);
                const retrySuccess = performZoom();
                if (retrySuccess) {
                    map.off('sourcedata', onSourceData);
                }
            }
        };
        map.on('sourcedata', onSourceData);
    }
}

//#endregion

//#region legendServices

// Setup checkbox event listener
function setupCheckboxEvents(checkbox, slider, groupKey) {
    checkbox.addEventListener('sl-change', () => {
        const sliderOpacity = slider.value / 100;

        if (checkbox.checked && sliderOpacity === 0) {
            slider.value = 100;
        }

        // Use toggleGroup for both show and hide
        const targetOpacity = checkbox.checked ? slider.value / 100 : 0;
        toggleGroup(groupKey, checkbox.checked, targetOpacity);

        slider.style.display = checkbox.checked ? 'block' : 'none';
    });
}

// Setup slider event listener
function setupSliderEvents(slider, groupKey) {
    // Listen for when user moves the slider
    slider.addEventListener('sl-input', () => {
        // Convert slider value (0-100) to opacity (0-1)
        const opacity = slider.value / 100;

        // Update opacity for the entire group
        toggleGroup(groupKey, true, opacity);
    });
}

// Update checkbox and slider to match current layer state
function syncLegendToMapGroup(groupKey) {
    // Get the layers array for this group from config
    const layers = layerConfig[groupKey]?.layers;

    // Exit if group doesn't exist
    if (!layers) {
        console.warn(`Group ${groupKey} not found in layerConfig`);
        return;
    }

    // Get the checkbox for this group
    const checkbox = document.getElementById(`checkbox-${groupKey}`);
    // Get the slider for this group
    const slider = document.getElementById(`slider-${groupKey}`);

    // Exit if elements don't exist
    if (!checkbox || !slider) return;

    // Find the first layer that exists
    const firstLayer = layers.find(id => map.getLayer(id));
    // Exit if no layers exist
    if (!firstLayer) return;

    // Check if layer is visible
    const isVisible = map.getLayoutProperty(firstLayer, 'visibility') !== 'none';
    // Update checkbox to match layer visibility
    checkbox.checked = isVisible;

    // Get the opacity property for this layer type
    const opacityProp = getOpacityProperty(firstLayer);
    // Get current opacity value (0-1)
    const currentOpacity = map.getPaintProperty(firstLayer, opacityProp) ?? 1;
    // Update slider to match layer opacity (convert 0-1 to 0-100)
    slider.value = currentOpacity * 100;

    // Show/hide slider based on visibility
    slider.style.display = isVisible ? 'block' : 'none';
}

function syncLegendToMap(layerId) {
    // --- 1️⃣ Find which group this layer belongs to ---
    const groupKey = Object.keys(layerConfig).find(key => layerConfig[key].layers.includes(layerId));

    if (!groupKey) {
        console.warn(`Layer ${layerId} not found in any group`);
        return;
    }

    const layers = layerConfig[groupKey].layers;
    const checkbox = document.getElementById(`checkbox-${groupKey}`);
    const slider = document.getElementById(`slider-${groupKey}`);

    if (!checkbox || !slider) return;

    // --- 2️⃣ Gather all existing layers in this group ---
    const existingLayers = layers.filter(id => map.getLayer(id));
    if (!existingLayers.length) return;

    // --- 3️⃣ Determine visibility state across group ---
    const anyVisible = existingLayers.some(id => {
        const vis = map.getLayoutProperty(id, 'visibility');
        return vis === 'visible' || vis === undefined;
    });

    // --- 4️⃣ Compute average opacity across visible layers (with safety checks) ---
    const validOpacities = [];

    existingLayers.forEach(id => {
        const prop = getOpacityProperty(id);

        // Skip if no opacity property found
        if (!prop) {
            return;
        }

        try {
            const paintValue = map.getPaintProperty(id, prop);
            if (paintValue !== undefined && paintValue !== null) {
                validOpacities.push(paintValue);
            } else {
                validOpacities.push(1);
            }
        } catch (e) {
            // Skip this layer if we can't get its opacity
            console.warn(`⚠️ Skipping opacity for ${id}:`, e.message);
        }
    });

    // If no valid opacities found, default to 1
    const avgOpacity =
        validOpacities.length > 0 ? validOpacities.reduce((a, b) => a + b, 0) / validOpacities.length : 1;

    // --- 5️⃣ Sync the group's legend UI ---
    checkbox.checked = anyVisible;
    slider.value = avgOpacity * 100;
    slider.style.display = anyVisible ? 'block' : 'none';
}

//#endregion

//#region interaction Services
// Create a duplicate interaction layer

// Update setupInteraction to check if typology is active
function setupInteraction() {
    // 1️⃣ Create thick invisible interaction layers for lines

    lineLayers.forEach(layerId => {
        if (!map.getLayer(layerId)) return;

        map.addLayer({
            id: `${layerId}-interaction`,
            type: 'line',
            source: map.getLayer(layerId).source,
            'source-layer': map.getLayer(layerId)['source-layer'],
            paint: {
                'line-color': 'rgba(0,0,0,0)',
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 10, 13, 20, 16, 30],
                'line-opacity': 1
            }
        });
    });

    map.on('click', e => {
        //console.log('📍 Map clicked');

        // Check if typology PANEL is open
        const typologyDetail = document.getElementById('typology-detail');
        const typologyPanelOpen = typologyDetail && typologyDetail.open;

        console.log('Typology panel open:', typologyPanelOpen);

        if (typologyPanelOpen) {
            console.log('🗺️ Typology panel is active, checking for features in buffer...');

            const clickPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);
            window.lastTypologyClickLngLat = e.lngLat;

            // Query all features in typ_source
            const allFeatures = map.querySourceFeatures('typ_source', {
                sourceLayer: 'typ_analysis-2cq5z2'
            });

            console.log('Total typology features:', allFeatures.length);

            // Check if ANY features are within 0.05km buffer
            let hasFeatureInBuffer = false;

            allFeatures.forEach(f => {
                try {
                    const line = turf.lineString(f.geometry.coordinates);
                    const distance = turf.pointToLineDistance(clickPoint, line, { units: 'kilometers' });

                    if (distance <= 0.05) {
                        hasFeatureInBuffer = true;
                    }
                } catch (e) {
                    console.warn('Error calculating distance:', e);
                }
            });

            console.log('Features in buffer:', hasFeatureInBuffer);

            // If features ARE in buffer, process typology
            if (hasFeatureInBuffer) {
                // Now run the full typology click logic
                const byDrainId = {};
                allFeatures.forEach(f => {
                    const drainId = f.properties['Drain num'];
                    if (!byDrainId[drainId]) {
                        byDrainId[drainId] = { lhs: null, rhs: null };
                    }

                    try {
                        const line = turf.lineString(f.geometry.coordinates);
                        const distance = turf.pointToLineDistance(clickPoint, line, { units: 'kilometers' });
                        const side = f.properties.side;

                        if (distance <= 0.05) {
                            if (!byDrainId[drainId][side] || distance < byDrainId[drainId][side].distance) {
                                byDrainId[drainId][side] = {
                                    feature: f,
                                    distance: distance
                                };
                            }
                        }
                    } catch (e) {
                        console.warn('Error calculating distance:', e);
                    }
                });

                // Find best match
                let bestMatch = null;
                let bestTotalDistance = Infinity;

                Object.keys(byDrainId).forEach(drainId => {
                    const pair = byDrainId[drainId];
                    if (pair.lhs && pair.rhs) {
                        const totalDistance = pair.lhs.distance + pair.rhs.distance;
                        if (totalDistance < bestTotalDistance) {
                            bestTotalDistance = totalDistance;
                            bestMatch = {
                                lhsFeature: pair.lhs.feature,
                                rhsFeature: pair.rhs.feature,
                                drainId: drainId
                            };
                        }
                    }
                });

                if (bestMatch) {
                    console.log('✅ Typology match found');
                    displayTypologyPair(bestMatch.lhsFeature, bestMatch.rhsFeature);
                } else {
                    console.log('❌ No typology match within buffer');
                    resetTypologyPanel();
                }
                return;
            }

            // NO FEATURES IN BUFFER - Fall through to regular layer clicks (except primary drains)
            console.log('❌ No typology features in buffer, checking other layers...');
        }

        // Handle normal layer interactions (or typology panel open but outside buffer)
        //console.log('🔍 Querying features for other layers...');

        const features = map.queryRenderedFeatures(e.point, {
            layers: interactiveLayers.filter(l => map.getLayer(l))
        });

        //console.log('Features found:', features.length);

        if (!features.length) {
            console.log('❌ No features found');
            return;
        }

        // Check if the clicked layer is visible
        const visibleFeatures = features.filter(f => {
            const baseLayerId = f.layer.id.replace('-interaction', '');
            const visibility = map.getLayoutProperty(baseLayerId, 'visibility');

            // If typology panel is open, exclude primary drains
            if (
                typologyPanelOpen &&
                (baseLayerId.includes('primary-drains') || f.layer.id.includes('primary-drains'))
            ) {
                return false;
            }

            return visibility === 'visible' || visibility === undefined;
        });

        //console.log('Visible features:', visibleFeatures.length);

        if (!visibleFeatures.length) {
            console.log('❌ No visible features');
            return;
        }

        //console.log('✅ Showing popup for feature:', visibleFeatures[0].layer.id);

        // Proceed only with visible layer features
        visibleFeatures.length === 1
            ? showPopup(visibleFeatures[0], e.lngLat)
            : showSelector(visibleFeatures, e.lngLat);
    });
    // 3️⃣ Cursor change on hover for regular layers
    interactiveLayers.forEach(layerId => {
        if (!map.getLayer(layerId)) return;

        map.on('mouseenter', layerId, () => {
            // Check if typology is active
            const typLayer = map.getLayer('typ_analysis');
            const typVisible = typLayer && map.getLayoutProperty('typ_analysis', 'visibility') === 'visible';

            // Disable pointer for primary/secondary drains only when typology is active
            const isDrainLayer = layerId.includes('primary-drains') || layerId.includes('secondary-drains');

            if (typVisible && isDrainLayer) {
                map.getCanvas().style.cursor = '';
            } else {
                map.getCanvas().style.cursor = 'pointer';
            }
        });

        map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
        });
    });

    // 4️⃣ Cursor for typology layer
    if (map.getLayer('typ_analysis')) {
        map.on('mouseenter', 'typ_analysis', () => {
            const typVisible = map.getLayoutProperty('typ_analysis', 'visibility') === 'visible';
            if (typVisible) {
                map.getCanvas().style.cursor = 'pointer';
            }
        });

        map.on('mouseleave', 'typ_analysis', () => {
            map.getCanvas().style.cursor = '';
        });
    }

    // Store current highlight
    let currentHighlight = null;
}
//#endregion

//#region Lake Filters - All in One

let valleyFilterControl = null;
let categoryFilterControl = null;
let wardFilterControl = null;
let custodianFilterControl = null;
let subvalleyFilterControl = null;
let lostTankIdentifierFilterControl = null;

let pridrainNumberFilterControl = null;
let secdrainNumberFilterControl = null;

// Initialize Condition filter (layer visibility toggle)
function initializeConditionFilter() {
    const dropdown = document.getElementById('year-filter-dropdown');
    if (!dropdown) return;

    // Clear any existing items to prevent duplicates
    dropdown.querySelectorAll('wa-dropdown-item').forEach(item => item.remove());

    // State to track which layers are visible
    const layerState = {
        Lakes: true,
        Lakes_lost: true
    };

    // Create checkbox items
    const existingTanksItem = document.createElement('wa-dropdown-item');
    existingTanksItem.setAttribute('value', 'existing');
    existingTanksItem.textContent = '✓ Existing Tanks';
    existingTanksItem.dataset.checked = 'true';

    const lostTanksItem = document.createElement('wa-dropdown-item');
    lostTanksItem.setAttribute('value', 'lost');
    lostTanksItem.textContent = '✓ Lost Tanks';
    lostTanksItem.dataset.checked = 'true';

    // Add items to dropdown
    dropdown.appendChild(existingTanksItem);
    dropdown.appendChild(lostTanksItem);

    // Toggle function
    function toggleLayer(layerId, isVisible) {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
            layerState[layerId] = isVisible;
        }
    }

    // Handle clicks
    existingTanksItem.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        const isChecked = existingTanksItem.dataset.checked === 'true';
        const newState = !isChecked;
        existingTanksItem.dataset.checked = newState.toString();
        existingTanksItem.textContent = newState ? '✓ Existing Tanks' : 'Existing Tanks';
        toggleLayer('Lakes', newState);
    });

    lostTanksItem.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        const isChecked = lostTanksItem.dataset.checked === 'true';
        const newState = !isChecked;
        lostTanksItem.dataset.checked = newState.toString();
        lostTanksItem.textContent = newState ? '✓ Lost Tanks' : 'Lost Tanks';
        toggleLayer('Lakes_lost', newState);
    });

    // Prevent dropdown from closing on item mousedown
    existingTanksItem.addEventListener('mousedown', e => e.stopPropagation());
    lostTanksItem.addEventListener('mousedown', e => e.stopPropagation());

    //console.log('✅ Condition filter initialized');

    // Return reset function
    return {
        reset: () => {
            // Reset both items to checked state
            existingTanksItem.dataset.checked = 'true';
            existingTanksItem.textContent = '✓ Existing Tanks';
            lostTanksItem.dataset.checked = 'true';
            lostTanksItem.textContent = '✓ Lost Tanks';

            // Make both layers visible
            toggleLayer('Lakes', true);
            toggleLayer('Lakes_lost', true);
        }
    };
}

// Replace the initializeDrainFilter function with this:

function initializeDrainFilters() {
    // Filter 3: Drain number filter
    pridrainNumberFilterControl = createLayerFilter({
        dropdownId: 'primary-number-filter-dropdown',
        sampleLayerId: 'primary-drains',
        attributeName: 'Drain num',
        layerIds: ['primary-drains', 'primary-drains-interaction', 'Halo']
    });

    // Filter 3: Drain number filter
    secdrainNumberFilterControl = createLayerFilter({
        dropdownId: 'secondary-number-filter-dropdown',
        sampleLayerId: 'secondary-drains',
        attributeName: 'Drain num',
        layerIds: ['secondary-drains', 'secondary-drains-interaction', 'Secondary Drains Halo']
    });

    console.log('✅ All drain filters initialized!');
}

// Initialize all lake filters
function initializeLakeFilters() {
    // Filter 1: Valley filter
    valleyFilterControl = createLayerFilter({
        dropdownId: 'valley-filter-dropdown',
        sampleLayerId: 'Lakes',
        attributeName: 'valley',
        layerIds: [
            'Lakes',
            'Lakes_lost',
            'Lakes_existing_overlap',
            'primary-drains',
            'Halo',
            'primary-drains-interaction',
            'secondary-drains',
            'secondary-drains-interaction',
            'Secondary Drains Halo',
            'gba-wards',
            'parks',
            'wetlands'
        ],
        onFilterChange: (selectedValues, allValues) => {
            updateLakesCounterFromFilters();
        }
    });

    // Filter 2: Category filter (if you have this attribute)
    categoryFilterControl = createLayerFilter({
        dropdownId: 'category-filter-dropdown',
        sampleLayerId: 'Lakes',
        attributeName: 'Category',
        layerIds: ['Lakes'],
        onFilterChange: (selectedValues, allValues) => {
            updateLakesCounterFromFilters();
        }
    });

    // Filter 3: Ward filter (if you have this attribute)
    wardFilterControl = createLayerFilter({
        dropdownId: 'ward-filter-dropdown',
        sampleLayerId: 'gba-wards',
        attributeName: 'ward_name',
        layerIds: [
            'Lakes',
            'Lakes_lost',
            'Lakes_existing_overlap',
            'primary-drains',
            'Halo',
            'primary-drains-interaction',
            'secondary-drains',
            'secondary-drains-interaction',
            'Secondary Drains Halo',
            'gba-wards',
            'parks',
            'wetlands'
        ],
        onFilterChange: (selectedValues, allValues) => {
            updateLakesCounterFromFilters();
        }
    });

    // Filter 4: Custodian filter for lost lakes
    custodianFilterControl = createLayerFilter({
        dropdownId: 'custodian-filter-dropdown',
        sampleLayerId: 'Lakes',
        attributeName: 'custodian',
        layerIds: ['Lakes'],
        onFilterChange: (selectedValues, allValues) => {
            updateLakesCounterFromFilters();
        }
    });

    // Filter 5: Condition filter (layer visibility toggle)
    conditionFilterControl = initializeConditionFilter();

    // Filter 6: Sub valley filter
    subvalleyFilterControl = createLayerFilter({
        dropdownId: 'subvalley-filter-dropdown',
        sampleLayerId: 'sub-valleys',
        attributeName: 'subvalley',
        layerIds: [
            'Lakes',
            'Lakes_lost',
            'Lakes_existing_overlap',
            'primary-drains',
            'Halo',
            'primary-drains-interaction',
            'secondary-drains',
            'secondary-drains-interaction',
            'Secondary Drains Halo',
            'gba-wards',
            'sub-valleys',
            'parks',
            'wetlands'
        ],
        onFilterChange: (selectedValues, allValues) => {
            updateLakesCounterFromFilters();
        }
    });

    //console.log('✅ All lake filters initialized!');
}

// Helper function to populate lost tanks table
function populateLostTanksTable(filterType) {
    const tableContainer = document.getElementById('lost_tanks_table_container');
    const tableBody = document.getElementById('lost_tanks_table_body');
    const sourceDiv = document.getElementById('lost_tanks_source');

    if (!tableContainer || !tableBody || !sourceDiv) return;

    // Clear existing table
    tableBody.innerHTML = '';

    // Set source based on filter type
    const sourceUrl =
        filterType === 'bbmp'
            ? 'https://data.opencity.in/dataset/bengaluru-lakes-and-their-maintainers/resource/bbmp-maintained-lakes-2024'
            : 'https://bpac.in/wp-content/uploads/2016/06/Death_of_lakes_and_the_future_of_bangalore.pdf';

    sourceDiv.innerHTML = `<a href="${sourceUrl}" target="_blank" style="color: var(--highlight-yellow); text-decoration: underline;">Click here for the source</a>`;

    // Get the layer
    const layer = map.getLayer('Lakes_lost');
    if (!layer) return;

    // Query features based on filter type
    const filterExpression =
        filterType === 'bbmp'
            ? ['==', ['get', 'bbmp'], 'Recognised by BBMP']
            : ['==', ['get', 'bpac'], 'Recognised by BPAC'];

    const features = map.querySourceFeatures(layer.source, {
        sourceLayer: layer['source-layer'],
        filter: filterExpression
    });

    // Deduplicate by fid and collect unique features
    const uniqueFeatures = new Map();
    features.forEach(feature => {
        const fid = feature.properties.fid;
        if (fid && !uniqueFeatures.has(fid)) {
            uniqueFeatures.set(fid, feature);
        }
    });

    // Populate table rows with serial numbers
    let serialNumber = 1;
    uniqueFeatures.forEach(feature => {
        const name = feature.properties.name || 'Unnamed';
        const status = feature.properties.Status || 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${serialNumber}</td>
            <td>${name}</td>
            <td>${status}</td>
        `;

        // Add click handler to highlight feature on map
        row.addEventListener('click', () => {
            // Remove highlight from all rows
            tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('highlighted'));

            // Highlight clicked row
            row.classList.add('highlighted');

            // Highlight feature on map - create a layer-like object for highlightFeature
            const featureWithLayer = {
                ...feature,
                layer: {
                    id: 'Lakes_lost',
                    type: 'fill',
                    source: layer.source,
                    'source-layer': layer['source-layer']
                }
            };
            highlightFeature(featureWithLayer);
        });

        tableBody.appendChild(row);
        serialNumber++;
    });

    // Show the table
    tableContainer.style.display = 'block';
}

// Helper function to hide lost tanks table
function hideLostTanksTable() {
    const tableContainer = document.getElementById('lost_tanks_table_container');
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }
}

// Initialize BBMP/BPAC filter buttons for Lost Tanks
function initializeLostTankIdentifierFilters() {
    const bbmpButton = document.getElementById('bbmp_tank_filter');
    const bpacButton = document.getElementById('bpac_tank_filter');

    if (!bbmpButton || !bpacButton) return;

    let activeLostTankFilter = null; // Track which filter is active

    // BBMP button click handler
    bbmpButton.addEventListener('click', () => {
        if (activeLostTankFilter === 'bbmp') {
            // Clicking again - remove filter
            if (map.getLayer('Lakes_lost')) {
                map.setFilter('Lakes_lost', null);
            }
            bbmpButton.classList.remove('active');
            activeLostTankFilter = null;
            hideLostTanksTable();
        } else {
            // Apply BBMP filter - show only features recognized by BBMP
            if (map.getLayer('Lakes_lost')) {
                map.setFilter('Lakes_lost', ['==', ['get', 'bbmp'], 'Recognised by BBMP']);
            }
            bbmpButton.classList.add('active');
            bpacButton.classList.remove('active');
            activeLostTankFilter = 'bbmp';
            populateLostTanksTable('bbmp');
        }
        updateLakesCounterFromFilters();
    });

    // BPAC button click handler
    bpacButton.addEventListener('click', () => {
        if (activeLostTankFilter === 'bpac') {
            // Clicking again - remove filter
            if (map.getLayer('Lakes_lost')) {
                map.setFilter('Lakes_lost', null);
            }
            bpacButton.classList.remove('active');
            activeLostTankFilter = null;
            hideLostTanksTable();
        } else {
            // Apply BPAC filter - show only features recognized by BPAC
            if (map.getLayer('Lakes_lost')) {
                map.setFilter('Lakes_lost', ['==', ['get', 'bpac'], 'Recognised by BPAC']);
            }
            bpacButton.classList.add('active');
            bbmpButton.classList.remove('active');
            activeLostTankFilter = 'bpac';
            populateLostTanksTable('bpac');
        }
        updateLakesCounterFromFilters();
    });

    // Return reset function
    return {
        reset: () => {
            if (map.getLayer('Lakes_lost')) {
                map.setFilter('Lakes_lost', null);
            }
            bbmpButton.classList.remove('active');
            bpacButton.classList.remove('active');
            activeLostTankFilter = null;
            hideLostTanksTable();
        }
    };
}

// Update counter based on all active filters

function updateLakesCounterFromFilters() {
    //console.log(`\n⏰ updateLakesCounterFromFilters called`);

    // ✅ Wait for map to be fully idle (all tiles loaded)
    const doCount = () => {
        //console.log(`\n🔄 Map is idle, now counting...`);
        //console.log(`Current map state:`);
        //console.log(`  - Zoom: ${map.getZoom()}`);
        //console.log(`  - Lakes filter:`, map.getFilter('Lakes'));
        //console.log(`  - Lakes_lost filter:`, map.getFilter('Lakes_lost'));

        const existingCount = countFeaturesInLayer('Lakes');
        const lostCount = countFeaturesInLayer('Lakes_lost');
        updateLakesCounter(existingCount, lostCount, true);
    };

    // If map is already idle, count immediately
    if (map.isMoving() || map.isZooming() || map.isRotating()) {
        console.log('  ⏳ Map is moving/zooming, waiting for idle...');
        map.once('idle', doCount);
    } else {
        console.log('  ✅ Map already idle, counting now');
        doCount();
    }
}

// Reset all lake filters - SELECT ALL (show everything)

function resetAllFilters() {
    smoothFlyTo(defaultViewBounds);

    //console.log('🔄 === RESETTING ALL FILTERS (Lakes + Drains + Typology) ===');

    // Reset ALL lake filter controls
    [
        subvalleyFilterControl,
        valleyFilterControl,
        categoryFilterControl,
        wardFilterControl,
        custodianFilterControl
    ].forEach(control => {
        if (control && control.reset) {
            control.reset();
        }
    });

    // Reset condition filter separately
    if (conditionFilterControl && conditionFilterControl.reset) {
        conditionFilterControl.reset();
    }

    // Reset lost tank identifier filter
    if (lostTankIdentifierFilterControl && lostTankIdentifierFilterControl.reset) {
        lostTankIdentifierFilterControl.reset();
    }

    // Reset BOTH drain filter controls
    [pridrainNumberFilterControl, secdrainNumberFilterControl].forEach(control => {
        if (control && control.reset) {
            control.reset();
        }
    });

    // 🔥 Reset BOTH typology filters
    if (typologyTypeFilterControl && typologyTypeFilterControl.reset) {
        typologyTypeFilterControl.reset();
    }
    if (typologyPrimaryDrainFilterControl && typologyPrimaryDrainFilterControl.reset) {
        typologyPrimaryDrainFilterControl.reset();
    }

    // 🔥 Clear active state from filter button
    const filterSecByPriBtn = document.getElementById('filter-secondary-by-primary');
    if (filterSecByPriBtn) {
        filterSecByPriBtn.classList.remove('active');
    }

    // Clear map filters for all lake layers
    if (map.getLayer('Lakes')) {
        map.setFilter('Lakes', null);
        map.setLayoutProperty('Lakes', 'visibility', 'visible');
    }
    if (map.getLayer('Lakes_lost')) {
        map.setFilter('Lakes_lost', null);
        map.setLayoutProperty('Lakes_lost', 'visibility', 'visible');
    }
    if (map.getLayer('Lakes_existing_overlap')) {
        map.setFilter('Lakes_existing_overlap', null);
    }

    // Clear map filters for all drain layers
    if (map.getLayer('primary-drains')) {
        map.setFilter('primary-drains', null);
    }
    if (map.getLayer('primary-drains-interaction')) {
        map.setFilter('primary-drains-interaction', null);
    }
    if (map.getLayer('Halo')) {
        map.setFilter('Halo', null);
    }
    if (map.getLayer('secondary-drains')) {
        map.setFilter('secondary-drains', null);
    }
    if (map.getLayer('secondary-drains-interaction')) {
        map.setFilter('secondary-drains-interaction', null);
    }
    if (map.getLayer('Secondary Drains Halo')) {
        map.setFilter('Secondary Drains Halo', null);
    }

    // Clear typology layer filter
    if (map.getLayer('typ_analysis')) {
        map.setFilter('typ_analysis', null);
    }

    console.log('✅ All filters reset (including both typology filters)');

    // Update lakes counter with totals
    updateLakesCounter(TOTAL_EXISTING_LAKES, TOTAL_LOST_LAKES, true);

    // Update filter counter
    map.once('idle', () => {
        updateFilterCounter();
    });
}

// Update the event listener in map.on('load')
setTimeout(() => {
    initializeLakeFilters();
    initializeDrainFilters();

    // 🔥 NEW: Single combined reset button handler
    const resetAllFiltersBtn = document.getElementById('reset-all-filters');
    if (resetAllFiltersBtn) {
        resetAllFiltersBtn.addEventListener('click', () => {
            console.log('Reset all filters clicked!');
            resetAllFilters();
        });
    }
}, 1000);

// Add this function in your //#region Lake Filters section

// Add this function in your //#region Lake Filters section

function filterSecondaryByPrimaryDrains() {
    //console.log('🔍 === Filtering Secondary Drains by Primary ===');

    // Get selected primary drain IDs
    const selectedPrimaryDrains = pridrainNumberFilterControl.getSelectedValues();

    //console.log('📊 Selected Primary Drains:', selectedPrimaryDrains);
    //console.log('📊 Number of selected primaries:', selectedPrimaryDrains.length);

    if (selectedPrimaryDrains.length === 0) {
        alert('Please select at least one Primary Drain first.');
        return;
    }

    // Step 1: Get all secondary drains that match the pri_Drain num
    const secondaryLayer = map.getLayer('secondary-drains');
    if (!secondaryLayer) {
        console.warn('⚠️ Secondary drains layer not found');
        return;
    }

    //console.log('✅ Secondary layer found:', secondaryLayer);

    const allSecondaryFeatures = map.querySourceFeatures(secondaryLayer.source, {
        sourceLayer: secondaryLayer['source-layer']
    });

    //console.log('📊 Total secondary features queried:', allSecondaryFeatures.length);

    // Find secondary drains with matching pri_Drain num
    const matchingSecondaryDrainIds = new Set();
    const matchingWards = new Set();

    allSecondaryFeatures.forEach(feature => {
        const priDrainNum = feature.properties['pri_Drain num'];
        const drainNum = feature.properties['Drain num'];
        const wardName = feature.properties.ward_name;

        if (priDrainNum && selectedPrimaryDrains.includes(priDrainNum)) {
            //console.log('✅ Match found! Secondary Drain:', drainNum, 'matches Primary:', priDrainNum);

            if (drainNum) matchingSecondaryDrainIds.add(drainNum);

            // Handle comma-separated wards
            if (wardName) {
                if (wardName.includes(',')) {
                    wardName.split(',').forEach(w => matchingWards.add(w.trim()));
                } else {
                    matchingWards.add(wardName.trim());
                }
            }
        }
    });

    //console.log('📊 Matching Secondary Drains:', Array.from(matchingSecondaryDrainIds));
    //console.log('📊 Number of matching secondaries:', matchingSecondaryDrainIds.size);
    //console.log('📊 Matching Wards from Secondary:', Array.from(matchingWards));

    // Step 2: Also get wards from the selected primary drains
    const primaryLayer = map.getLayer('primary-drains');
    if (primaryLayer) {
        const primaryFeatures = map.querySourceFeatures(primaryLayer.source, {
            sourceLayer: primaryLayer['source-layer']
        });

        //console.log('📊 Total primary features queried:', primaryFeatures.length);

        primaryFeatures.forEach(feature => {
            const drainNum = feature.properties['Drain num'];
            const wardName = feature.properties.ward_name;

            if (drainNum && selectedPrimaryDrains.includes(drainNum)) {
                //console.log('✅ Primary Drain:', drainNum, 'Ward:', wardName);

                if (wardName) {
                    if (wardName.includes(',')) {
                        wardName.split(',').forEach(w => matchingWards.add(w.trim()));
                    } else {
                        matchingWards.add(wardName.trim());
                    }
                }
            }
        });
    }

    //console.log('📊 All Matching Wards (Primary + Secondary):', Array.from(matchingWards));
    //console.log('📊 Total matching wards:', matchingWards.size);

    // Check if we found any matches
    if (matchingSecondaryDrainIds.size === 0) {
        console.warn('⚠️ No matching secondary drains found');
        alert('No secondary drains found matching the selected primary drains.');
        return;
    }

    if (matchingWards.size === 0) {
        console.warn('⚠️ No matching wards found');
        alert('No wards found for the selected drains.');
        return;
    }

    // Step 3: Build filters manually
    console.log('🔧 Building filters...');

    // Filter secondary drains
    const secondaryDrainIds = Array.from(matchingSecondaryDrainIds);
    const secondaryFilter =
        secondaryDrainIds.length === 1
            ? ['==', ['get', 'Drain num'], secondaryDrainIds[0]]
            : ['in', ['get', 'Drain num'], ['literal', secondaryDrainIds]];

    console.log('🔧 Secondary filter:', JSON.stringify(secondaryFilter));

    // Apply filter to all secondary drain layers
    ['secondary-drains', 'secondary-drains-interaction', 'Secondary Drains Halo'].forEach(layerId => {
        if (map.getLayer(layerId)) {
            console.log(`✅ Applying filter to ${layerId}`);
            map.setFilter(layerId, secondaryFilter);

            // Ensure visible
            const vis = map.getLayoutProperty(layerId, 'visibility');
            if (vis !== 'visible') {
                map.setLayoutProperty(layerId, 'visibility', 'visible');
            }
        }
    });

    // Keep primary drains visible
    const primaryFilter =
        selectedPrimaryDrains.length === 1
            ? ['==', ['get', 'Drain num'], selectedPrimaryDrains[0]]
            : ['in', ['get', 'Drain num'], ['literal', selectedPrimaryDrains]];

    console.log('🔧 Primary filter:', JSON.stringify(primaryFilter));

    // Apply filter to all primary drain layers
    ['primary-drains', 'primary-drains-interaction', 'Halo'].forEach(layerId => {
        if (map.getLayer(layerId)) {
            console.log(`✅ Applying filter to ${layerId}`);
            map.setFilter(layerId, primaryFilter);

            // Ensure visible
            const vis = map.getLayoutProperty(layerId, 'visibility');
            if (vis !== 'visible') {
                map.setLayoutProperty(layerId, 'visibility', 'visible');
            }
        }
    });

    // Filter wards
    const wardsArray = Array.from(matchingWards);
    const wardFilter =
        wardsArray.length === 1
            ? ['in', wardsArray[0], ['get', 'ward_name']]
            : ['any', ...wardsArray.map(ward => ['in', ward, ['get', 'ward_name']])];

    console.log('🔧 Ward filter:', JSON.stringify(wardFilter));

    // Apply ward filter to ward layer
    if (map.getLayer('gba-wards')) {
        console.log('✅ Applying filter to gba-wards');
        map.setFilter('gba-wards', wardFilter);

        const vis = map.getLayoutProperty('gba-wards', 'visibility');
        if (vis !== 'visible') {
            map.setLayoutProperty('gba-wards', 'visibility', 'visible');
        }
    }

    // Filter lakes by wards
    ['Lakes', 'Lakes_lost', 'Lakes_existing_overlap', 'parks', 'wetlands'].forEach(layerId => {
        if (map.getLayer(layerId)) {
            console.log(`✅ Applying ward filter to ${layerId}`);
            map.setFilter(layerId, wardFilter);
        }
    });

    console.log('🔧 Updating UI controls WITHOUT triggering filters...');

    // 🔥 DON'T call setSelectedValues - it triggers applyFilter()
    // Instead, directly update the internal state
    filterStates['secondary-number-filter-dropdown'].selectedValues = new Set(secondaryDrainIds);
    filterStates['primary-number-filter-dropdown'].selectedValues = new Set(selectedPrimaryDrains);
    filterStates['ward-filter-dropdown'].selectedValues = new Set(wardsArray);

    // Update the UI checkboxes manually
    const secDropdown = document.getElementById('secondary-number-filter-dropdown');
    if (secDropdown) {
        secDropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(item => {
            item.checked = secondaryDrainIds.includes(item.value);
        });
    }

    const priDropdown = document.getElementById('primary-number-filter-dropdown');
    if (priDropdown) {
        priDropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(item => {
            item.checked = selectedPrimaryDrains.includes(item.value);
        });
    }

    const wardDropdown = document.getElementById('ward-filter-dropdown');
    if (wardDropdown) {
        wardDropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(item => {
            item.checked = wardsArray.includes(item.value);
        });
    }

    console.log('✅ UI controls updated WITHOUT triggering filters');

    // Mark button as active
    const button = document.getElementById('filter-secondary-by-primary');
    if (button) {
        button.classList.add('active');
        console.log('✅ Button marked as active');
    }

    console.log('✅ === Filter Application Complete ===');
    console.log('Summary:', {
        selectedPrimary: selectedPrimaryDrains,
        matchingSecondary: secondaryDrainIds,
        matchingWards: wardsArray
    });

    // Update counter AFTER everything is done
    setTimeout(() => {
        //console.log('🔄 Updating counter...');
        updateFilterCounter();
    }, 500);
}

//#endregion

//#region Watershed Filter funcitons

function showStreamOrderByLevels(levels) {
    // levels can be a single number or an array: showStreamOrderByLevels(13) or showStreamOrderByLevels([12, 13, 14])

    if (!map.getLayer('streamorder')) {
        console.warn('streamorder layer not found');
        return;
    }

    // Convert single number to array for consistency
    const levelArray = Array.isArray(levels) ? levels : [levels];

    // Apply filter to show only specified levels
    map.setFilter('streamorder', ['in', ['get', 'LEVEL'], ['literal', levelArray]]);
    map.setFilter('all-basins', ['in', ['get', 'LEVEL'], ['literal', levelArray]]);
    map.setFilter('streamorder-arrows', ['in', ['get', 'LEVEL'], ['literal', levelArray]]);

    // Then use toggleGroup for smooth transition
    setTimeout(() => {
        toggleGroup('streamorder', true);
        toggleGroup('allbasins', true);
    }, 1000);

    // Sync the legend to show streamorder is now on

    console.log(`✅ Showing stream order levels: ${levelArray.join(', ')}`);
}

function showAllStreamOrderLevels() {
    if (!map.getLayer('streamorder')) return;

    // Remove filters to show all levels
    map.setFilter('streamorder', null);

    if (map.getLayer('streamorder-arrows')) {
        map.setFilter('streamorder-arrows', null);
    }

    map.setFilter('all-basins', null);

    // Smooth toggle on
    toggleGroup('streamorder', true);

    console.log('✅ Showing all stream order levels');
}

//#endregion

//#region Typology Filters

let typologyTypeFilterControl = null;
let typologyPrimaryDrainFilterControl = null; // 🔥 NEW

function initializeTypologyFilters() {
    console.log('🎨 Initializing typology filters...');

    const dropdownId = 'typology-filter-dropdown';
    const sampleLayerId = 'typ_analysis';
    const attributeName = 'typ';
    const layerIds = ['typ_analysis', 'typ_analysis-glow'];

    // Initialize filter state
    const filterKey = dropdownId;
    filterStates[filterKey] = {
        selectedValues: new Set(),
        allValues: [],
        originalAllValues: [],
        layerIds: layerIds,
        attributeName: attributeName,
        sampleLayerId: sampleLayerId
    };

    const state = filterStates[filterKey];

    // Get unique typology values
    function getTypologyValues() {
        const layer = map.getLayer(sampleLayerId);
        if (!layer) return {};

        const features = map.querySourceFeatures(layer.source, {
            sourceLayer: layer['source-layer']
        });

        const valueCounts = {};
        const uniqueFeatures = new Map();

        features.forEach(feature => {
            const id = feature.id;
            if (!uniqueFeatures.has(id)) {
                uniqueFeatures.set(id, feature);
            }
        });

        uniqueFeatures.forEach(feature => {
            const value = feature.properties[attributeName];
            if (value) {
                valueCounts[value] = (valueCounts[value] || 0) + 1;
            }
        });

        return valueCounts;
    }

    // Populate dropdown with labels
    function populateTypologyDropdown() {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) {
            console.warn(`⚠️ Dropdown ${dropdownId} not found`);
            return false;
        }

        // Get counts
        const valueCounts = getTypologyValues();
        const values = Object.keys(valueCounts).sort();

        if (values.length === 0) {
            console.warn('⚠️ No typology values found, will retry...');
            return false;
        }

        // First time setup
        if (state.originalAllValues.length === 0) {
            state.originalAllValues = [...values];
            state.allValues = [...values];
            state.selectedValues = new Set(values);
        }

        // Clear existing items
        const existingItems = dropdown.querySelectorAll('wa-dropdown-item, wa-divider');
        existingItems.forEach(item => item.remove());

        // Add "Select All" and "Clear" buttons
        const selectAllBtn = document.createElement('wa-dropdown-item');
        selectAllBtn.setAttribute('value', 'select-all');
        selectAllBtn.className = 'filter-control-btn';
        selectAllBtn.textContent = 'Select All';

        const clearBtn = document.createElement('wa-dropdown-item');
        clearBtn.setAttribute('value', 'clear-all');
        clearBtn.className = 'filter-control-btn';
        clearBtn.textContent = 'Clear';

        dropdown.appendChild(selectAllBtn);
        dropdown.appendChild(clearBtn);

        // Add divider
        const divider = document.createElement('wa-divider');
        dropdown.appendChild(divider);

        // Add checkbox items with labels
        state.originalAllValues.forEach(value => {
            const item = document.createElement('wa-dropdown-item');
            item.setAttribute('type', 'checkbox');
            item.setAttribute('value', value);
            item.checked = state.selectedValues.has(value);

            const count = valueCounts[value] || 0;
            const label = getTypologyLabel(value);
            const color = getTypologyColor(value);

            // Format: "t1 - Road Adjacent with Footpath (25)"
            item.textContent = `${value} - ${label} (${count})`;

            // Add colored background behind checkbox
            item.style.cssText = `
                --checkbox-background: ${color};
                position: relative;
            `;

            // Add a pseudo-element style for the checkbox background
            const style = document.createElement('style');
            style.textContent = `
                wa-dropdown-item[value="${value}"]::part(base) {
                    padding-left: 40px;
                }
                wa-dropdown-item[value="${value}"]::part(base)::before {
                    content: '';
                    position: absolute;
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 20px;
                    height: 20px;
                    background-color: ${color};
                    border-radius: 3px;
                    z-index: -1;
                }
            `;
            document.head.appendChild(style);

            dropdown.appendChild(item);
        });

        return true;
    }

    // Apply filter
    function applyTypologyFilter() {
        if (state.selectedValues.size === 0 || state.selectedValues.size === state.originalAllValues.length) {
            // All selected or none - clear filter
            layerIds.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.setFilter(layerId, null);
                }
            });
        } else {
            // Build filter
            const valueArray = Array.from(state.selectedValues);
            const filter =
                valueArray.length === 1
                    ? ['==', ['get', attributeName], valueArray[0]]
                    : ['in', ['get', attributeName], ['literal', valueArray]];

            layerIds.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.setFilter(layerId, filter);
                }
            });
        }
    }

    // Setup event listeners
    function setupTypologyListeners() {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        dropdown.addEventListener('wa-select', event => {
            event.preventDefault();

            const item = event.detail.item;
            const value = item.value;

            if (item.type === 'checkbox') {
                if (item.checked) {
                    state.selectedValues.add(value);
                } else {
                    state.selectedValues.delete(value);
                }

                applyTypologyFilter();
                resetTypologyPanel();

                // 🔥 If exactly ONE typology is selected → update the central image
                if (state.selectedValues.size === 1) {
                    const typ = Array.from(state.selectedValues)[0];
                    const imgPath = `typology_axos/${typ}-${typ}.png`;

                    const imgEl = document.getElementById('typology-image');
                    imgEl.src = imgPath;
                    imgEl.style.display = 'block';
                }
            } else {
                // Handle "Select All" or "Clear All"
                if (value === 'select-all') {
                    dropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(checkbox => {
                        state.selectedValues.add(checkbox.value);
                        checkbox.checked = true;
                    });
                    applyTypologyFilter();
                } else if (value === 'clear-all') {
                    state.selectedValues.clear();
                    dropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    applyTypologyFilter();
                }
            }
        });
    }

    // Initialize
    const success = populateTypologyDropdown();
    setupTypologyListeners();

    // If no features found, wait for source data to load
    if (!success) {
        const layer = map.getLayer(sampleLayerId);
        if (layer) {
            const sourceId = layer.source;
            const onSourceData = e => {
                if (e.sourceId === sourceId && e.isSourceLoaded) {
                    console.log(`Source ${sourceId} loaded, retrying typology dropdown...`);
                    const retrySuccess = populateTypologyDropdown();
                    if (retrySuccess) {
                        map.off('sourcedata', onSourceData);
                    }
                }
            };
            map.on('sourcedata', onSourceData);
        }
    }

    // Create control object
    typologyTypeFilterControl = {
        reset: () => {
            state.selectedValues = new Set(state.originalAllValues);
            state.allValues = [...state.originalAllValues];
            populateTypologyDropdown();
            applyTypologyFilter();
            resetTypologyPanel();
        },
        applyFilter: applyTypologyFilter
    };

    filterControls[filterKey] = typologyTypeFilterControl;

    // Populate typology legend
    function populateTypologyLegend() {
        const legendContainer = document.getElementById('typology-legend-items');
        if (!legendContainer) return;

        legendContainer.innerHTML = '';

        // Get all typology values (12 values for two columns of 6 each)
        const typologyValues = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];

        typologyValues.forEach(value => {
            const label = getTypologyLabel(value);
            const color = getTypologyColor(value);

            const legendItem = document.createElement('div');
            legendItem.className = 'typology-legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'typology-legend-color';
            colorBox.style.backgroundColor = color;

            const labelText = document.createElement('span');
            labelText.className = 'typology-legend-label';
            labelText.textContent = `${value} - ${label}`;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(labelText);
            legendContainer.appendChild(legendItem);
        });
    }

    // Populate legend after filter initialization
    populateTypologyLegend();

    console.log('✅ Typology type filter initialized with labels!');

    // ========================================
    // 🔥 FILTER 2: Primary Drain ID Filter (for typology panel)
    // ========================================
    // COMMENTED OUT - Primary ID filter disabled
    /*
    typologyPrimaryDrainFilterControl = createLayerFilter({
        dropdownId: 'typology-primary-drain-filter',
        sampleLayerId: 'primary-drains',
        attributeName: 'Drain num',
        layerIds: ['primary-drains', 'primary-drains-interaction', 'Halo', 'typ_analysis'],
        onFilterChange: (selectedValues, allValues) => {
            // 🔥 Sync the primary drain filter state with the main filter
            if (pridrainNumberFilterControl) {
                // Update the main primary drain filter state WITHOUT triggering its events
                filterStates['primary-number-filter-dropdown'].selectedValues = new Set(selectedValues);

                // Update UI checkboxes in the main filter dropdown
                const priDropdown = document.getElementById('primary-number-filter-dropdown');
                if (priDropdown) {
                    priDropdown.querySelectorAll('wa-dropdown-item[type="checkbox"]').forEach(item => {
                        item.checked = selectedValues.has(item.value);
                    });
                }

                // 🔥 Now call the existing filter function to cascade to secondary/lakes/wards
                console.log('🔗 Calling filterSecondaryByPrimaryDrains from typology filter...');
                filterSecondaryByPrimaryDrains();
            }
        }
    });

    console.log('✅ Typology primary drain filter initialized!');
    */
}

//#endregion

//#region basin play

// Replace your playBasinTimeline and stopBasinTimeline functions with these updated versions:

function playBasinTimeline() {
    if (isBasinPlaying) {
        // Stop playing
        stopBasinTimeline();
        return;
    }

    // Start playing
    isBasinPlaying = true;
    const playButton = document.getElementById('basin-play-button');
    if (playButton) {
        playButton.name = 'pause-circle'; // Change icon to pause
        playButton.label = 'Pause timeline';
    }

    // Start with basin 1
    let currentBasin = 1;
    basin1();

    // Set interval to move through basins
    basinPlayInterval = setInterval(() => {
        currentBasin++;

        if (currentBasin > 5) {
            // Reached the end, stop
            handleValleysDetail();
            stopBasinTimeline();
            return;
        }

        // Call the corresponding basin function
        switch (currentBasin) {
            case 2:
                basin2();
                break;
            case 3:
                basin3();
                break;
            case 4:
                basin4();
                break;
            case 5:
                basin5();
                break;
        }
    }, 4000); // 5 seconds per basin
}

function stopBasinTimeline() {
    if (basinPlayInterval) {
        clearInterval(basinPlayInterval);
        basinPlayInterval = null;
    }

    isBasinPlaying = false;
    const playButton = document.getElementById('basin-play-button');
    if (playButton) {
        playButton.name = 'play-circle';
        playButton.label = 'Play timeline';
        playButton.style.color = 'white';
    }

    // Remove active class from all basin buttons
    document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Reset active button tracker
    activeBasinButton = null;

    // Reset streamorder filter to show all
    showAllStreamOrderLevels();

    console.log('✅ Basin timeline stopped');
}
//#endregion

//#region lakes play

function playLakesTimeline() {
    if (isLakesPlaying) {
        // Stop playing
        stopLakesTimeline();
        return;
    }

    // Start playing
    isLakesPlaying = true;
    const playButton = document.getElementById('lakes-play-button');
    if (playButton) {
        playButton.name = 'pause-circle'; // Change icon to pause
        playButton.label = 'Pause timeline';
    }

    // Start with 1790
    let currentLake = 1;
    lakes1700();

    // Set interval to move through lakes timeline
    lakesPlayInterval = setInterval(() => {
        currentLake++;

        if (currentLake > 4) {
            // Reached the end, stop
            handlelakesDetail();
            stopLakesTimeline();
            return;
        }

        // Call the corresponding lakes function
        switch (currentLake) {
            case 2:
                lakes1800();
                break;
            case 3:
                lakes1900();
                break;
            case 4:
                lakes2000();
                break;
        }
    }, 4000); // 4 seconds per timeline point
}

function stopLakesTimeline() {
    if (lakesPlayInterval) {
        clearInterval(lakesPlayInterval);
        lakesPlayInterval = null;
    }

    isLakesPlaying = false;
    const playButton = document.getElementById('lakes-play-button');
    if (playButton) {
        playButton.name = 'play-circle';
        playButton.label = 'Play timeline';
        playButton.style.color = 'white';
    }

    // Remove active class from all lakes timeline buttons
    document.querySelectorAll('#lakes_trace_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Hide all timeline descriptions
    hideTimelineDescription();

    // Reset active button tracker
    activeButton = null;

    console.log('✅ Lakes timeline stopped');
}
//#endregion

//#region Download Functions

// Function to gather all filtered data
function gatherFilteredData() {
    const data = {
        lakes: [],
        primaryDrains: [],
        secondaryDrains: [],
        summary: {}
    };

    // Gather Lakes data
    const lakesLayer = map.getLayer('Lakes');
    if (lakesLayer) {
        const lakesFilter = map.getFilter('Lakes');
        const lakesFeatures = map.querySourceFeatures(lakesLayer.source, {
            sourceLayer: lakesLayer['source-layer'],
            filter: lakesFilter
        });

        // Deduplicate by fid
        const uniqueLakes = new Map();
        lakesFeatures.forEach(feature => {
            const fid = feature.properties.fid;
            if (fid && !uniqueLakes.has(fid)) {
                uniqueLakes.set(fid, {
                    type: 'Existing',
                    name: feature.properties.name || '',
                    category: feature.properties.Category || '',
                    area_acres: feature.properties.area_acres || '',
                    ward_name: feature.properties.ward_name || '',
                    valley: feature.properties.valley || '',
                    custodian: feature.properties.custodian || '',
                    status: feature.properties.Status || ''
                });
            }
        });
        data.lakes.push(...uniqueLakes.values());
    }

    // Gather Lost Lakes data
    const lostLayer = map.getLayer('Lakes_lost');
    if (lostLayer) {
        const lostFilter = map.getFilter('Lakes_lost');
        const lostFeatures = map.querySourceFeatures(lostLayer.source, {
            sourceLayer: lostLayer['source-layer'],
            filter: lostFilter
        });

        const uniqueLost = new Map();
        lostFeatures.forEach(feature => {
            const fid = feature.properties.fid;
            if (fid && !uniqueLost.has(fid)) {
                uniqueLost.set(fid, {
                    type: 'Lost',
                    name: feature.properties.name || '',
                    category: feature.properties.Category || '',
                    area_acres: feature.properties.area_acres || '',
                    ward_name: feature.properties.ward_name || '',
                    valley: feature.properties.valley || '',
                    custodian: feature.properties.custodian || '',
                    status: feature.properties.Status || ''
                });
            }
        });
        data.lakes.push(...uniqueLost.values());
    }

    // Gather Primary Drains data
    const primaryLayer = map.getLayer('primary-drains');
    if (primaryLayer) {
        const primaryFilter = map.getFilter('primary-drains');
        const primaryFeatures = map.querySourceFeatures(primaryLayer.source, {
            sourceLayer: primaryLayer['source-layer'],
            filter: primaryFilter
        });

        const uniquePrimary = new Map();
        primaryFeatures.forEach(feature => {
            const drainNum = feature.properties['Drain num'];
            if (drainNum && !uniquePrimary.has(drainNum)) {
                uniquePrimary.set(drainNum, {
                    drain_id: drainNum,
                    length_m: feature.properties.length_m || '',
                    valley: feature.properties.valley || '',
                    ward_name: feature.properties.ward_name || ''
                });
            }
        });
        data.primaryDrains.push(...uniquePrimary.values());
    }

    // Gather Secondary Drains data
    const secondaryLayer = map.getLayer('secondary-drains');
    if (secondaryLayer) {
        const secondaryFilter = map.getFilter('secondary-drains');
        const secondaryFeatures = map.querySourceFeatures(secondaryLayer.source, {
            sourceLayer: secondaryLayer['source-layer'],
            filter: secondaryFilter
        });

        const uniqueSecondary = new Map();
        secondaryFeatures.forEach(feature => {
            const drainNum = feature.properties['Drain num'];
            if (drainNum && !uniqueSecondary.has(drainNum)) {
                uniqueSecondary.set(drainNum, {
                    drain_id: drainNum,
                    length_m: feature.properties.length_m || '',
                    valley: feature.properties.valley || '',
                    ward_name: feature.properties.ward_name || ''
                });
            }
        });
        data.secondaryDrains.push(...uniqueSecondary.values());
    }

    // Calculate summary
    const existingLakes = data.lakes.filter(l => l.type === 'Existing').length;
    const lostLakes = data.lakes.filter(l => l.type === 'Lost').length;
    const primaryLength = data.primaryDrains.reduce((sum, d) => sum + (parseFloat(d.length_m) || 0), 0);
    const secondaryLength = data.secondaryDrains.reduce((sum, d) => sum + (parseFloat(d.length_m) || 0), 0);

    data.summary = {
        existing_lakes: existingLakes,
        lost_lakes: lostLakes,
        total_lakes: existingLakes + lostLakes,
        primary_drains_count: data.primaryDrains.length,
        primary_drains_length_km: (primaryLength / 1000).toFixed(2),
        secondary_drains_count: data.secondaryDrains.length,
        secondary_drains_length_km: (secondaryLength / 1000).toFixed(2),
        export_date: new Date().toISOString()
    };

    return data;
}

// Function to download as CSV
function downloadAsCSV() {
    console.log('📥 Downloading as CSV...');

    const data = gatherFilteredData();

    // Create CSV content
    let csv = 'Bangalore Watershed Filter Results\n';
    csv += `Export Date: ${new Date().toLocaleString()}\n\n`;

    // Summary
    csv += 'SUMMARY\n';
    csv += `Existing Lakes,${data.summary.existing_lakes}\n`;
    csv += `Lost Lakes,${data.summary.lost_lakes}\n`;
    csv += `Total Lakes,${data.summary.total_lakes}\n`;
    csv += `Primary Drains Count,${data.summary.primary_drains_count}\n`;
    csv += `Primary Drains Total Length (km),${data.summary.primary_drains_length_km}\n`;
    csv += `Secondary Drains Count,${data.summary.secondary_drains_count}\n`;
    csv += `Secondary Drains Total Length (km),${data.summary.secondary_drains_length_km}\n\n`;

    // Lakes data
    if (data.lakes.length > 0) {
        csv += 'LAKES\n';
        csv += 'Type,Name,Category,Area (acres),Ward,Valley,Custodian,Status\n';
        data.lakes.forEach(lake => {
            csv += `${lake.type},"${lake.name}","${lake.category}",${lake.area_acres},"${lake.ward_name}","${lake.valley}","${lake.custodian}","${lake.status}"\n`;
        });
        csv += '\n';
    }

    // Primary Drains data
    if (data.primaryDrains.length > 0) {
        csv += 'PRIMARY DRAINS\n';
        csv += 'Drain ID,Length (m),Valley,Ward\n';
        data.primaryDrains.forEach(drain => {
            csv += `${drain.drain_id},${drain.length_m},"${drain.valley}","${drain.ward_name}"\n`;
        });
        csv += '\n';
    }

    // Secondary Drains data
    if (data.secondaryDrains.length > 0) {
        csv += 'SECONDARY DRAINS\n';
        csv += 'Drain ID,Length (m),Valley,Ward\n';
        data.secondaryDrains.forEach(drain => {
            csv += `${drain.drain_id},${drain.length_m},"${drain.valley}","${drain.ward_name}"\n`;
        });
    }

    // Download the CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bangalore_watershed_results_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ CSV download complete');
}

// Function to download as Excel
function downloadAsExcel() {
    console.log('📥 Downloading as Excel...');

    if (typeof XLSX === 'undefined') {
        alert('Excel export library not loaded. Please refresh the page and try again.');
        return;
    }

    const data = gatherFilteredData();

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Bangalore Watershed Filter Results'],
        ['Export Date', new Date().toLocaleString()],
        [],
        ['SUMMARY'],
        ['Existing Lakes', data.summary.existing_lakes],
        ['Lost Lakes', data.summary.lost_lakes],
        ['Total Lakes', data.summary.total_lakes],
        ['Primary Drains Count', data.summary.primary_drains_count],
        ['Primary Drains Total Length (km)', data.summary.primary_drains_length_km],
        ['Secondary Drains Count', data.summary.secondary_drains_count],
        ['Secondary Drains Total Length (km)', data.summary.secondary_drains_length_km]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Lakes sheet
    if (data.lakes.length > 0) {
        const wsLakes = XLSX.utils.json_to_sheet(
            data.lakes.map(lake => ({
                Type: lake.type,
                Name: lake.name,
                Category: lake.category,
                'Area (acres)': lake.area_acres,
                Ward: lake.ward_name,
                Valley: lake.valley,
                Custodian: lake.custodian,
                Status: lake.status
            }))
        );
        XLSX.utils.book_append_sheet(wb, wsLakes, 'Lakes');
    }

    // Primary Drains sheet
    if (data.primaryDrains.length > 0) {
        const wsPrimary = XLSX.utils.json_to_sheet(
            data.primaryDrains.map(drain => ({
                'Drain ID': drain.drain_id,
                'Length (m)': drain.length_m,
                Valley: drain.valley,
                Ward: drain.ward_name
            }))
        );
        XLSX.utils.book_append_sheet(wb, wsPrimary, 'Primary Drains');
    }

    // Secondary Drains sheet
    if (data.secondaryDrains.length > 0) {
        const wsSecondary = XLSX.utils.json_to_sheet(
            data.secondaryDrains.map(drain => ({
                'Drain ID': drain.drain_id,
                'Length (m)': drain.length_m,
                Valley: drain.valley,
                Ward: drain.ward_name
            }))
        );
        XLSX.utils.book_append_sheet(wb, wsSecondary, 'Secondary Drains');
    }

    // Download the Excel file
    XLSX.writeFile(wb, `bangalore_watershed_results_${Date.now()}.xlsx`);

    console.log('✅ Excel download complete');
}

// ============================================
// FAST SNAPSHOT - INSTANT DOWNLOAD
// ============================================
function downloadMapSnapshot() {
    console.log('📸 Capturing snapshot...');

    // Wait for map to finish any ongoing rendering
    map.once('idle', () => {
        try {
            // Get canvas directly - no pixel ratio tricks
            const canvas = map.getCanvas();

            if (!canvas) {
                throw new Error('Map canvas not found');
            }

            console.log('✅ Canvas captured, generating image...');

            // Convert to blob for better performance with large images
            canvas.toBlob(
                blob => {
                    if (!blob) {
                        throw new Error('Failed to create image');
                    }

                    // Create download URL
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');

                    // Generate filename with timestamp
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                    link.download = `bangalore-watersheds-${timestamp}.png`;
                    link.href = url;

                    // Trigger download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Clean up
                    setTimeout(() => URL.revokeObjectURL(url), 100);

                    console.log('✅ Snapshot downloaded');
                },
                'image/png',
                1.0
            );
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Failed to capture snapshot: ' + error.message);
        }
    });

    // Trigger render to ensure idle event fires
    map.setBearing(map.getBearing());
}

//#endregion
//#endregion

//#region data

//#region layerData

function addLayers() {
    // Add existing lakes layer
    map.addSource('lakes-existing-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.22yuea8f'
    });

    map.addLayer({
        id: 'Lakes',
        type: 'fill',
        source: 'lakes-existing-source',
        'source-layer': 'lakes_existing-43lypw',
        paint: {
            'fill-color': '#4e4cf0',
            'fill-opacity': 0.7
        }
    });

    // Add Lakes_lost GeoJSON source and layer
    map.addSource('lakes-lost-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.79zcc7ms'
    });

    //Lost lakes no overlap
    map.addLayer({
        id: 'Lakes_lost',
        type: 'fill',
        source: 'lakes-lost-source',
        'source-layer': 'lakes_lost-6fymrh',
        paint: {
            'fill-color': '#8e3838', // Red for 1870/1897
            'fill-opacity': 0.7
        }
    });

    // Add all lost lakes GeoJSON source and layer
    map.addSource('all-lakes-lost-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.2m2zxv5l'
    });

    /*1870 and 1897 Lakes
    map.addLayer({
        id: 'Lakes_lost_1800',
        type: 'fill',
        source: 'all-lakes-lost-source',
        'source-layer': 'all_lost_lakes-3r51nl',
        filter: ['in', ['get', 'year'], ['literal', ['1854','1870', '1897']]], // Only show 1870 and 1897
        paint: {
            'fill-color': '#8e3838',  // Red for 1870/1897
            'fill-opacity': 0.7
        }
    });
 
    // Layer 2: 1969 lakes (top layer - orange)
    map.addLayer({
        id: 'Lakes_lost_1900',
        type: 'fill',
        source: 'all-lakes-lost-source',
        'source-layer': 'all_lost_lakes-3r51nl',
        slot: 'top',
        filter: ['==', ['get', 'year'], '1969'], // Only show 1969
        paint: {
            'fill-color': '#ae2e2e',  // Orange/red for 1969
            'fill-opacity': 0.7
        }
        });*/

    // Add Lakes outline GeoJSON source and layer
    map.addSource('lakes-existing-overlap', {
        type: 'vector',
        url: 'mapbox://mod-foundation.dwyleacq'
    });

    map.addLayer({
        id: 'Lakes_existing_overlap',
        type: 'line',
        source: 'lakes-existing-overlap',
        'source-layer': 'Lakes_existing_overlap-0n1e1w',
        paint: {
            'line-color': [
                'match',
                ['get', 'year'], // Get the Year property from each feature
                '1969',
                '#cb5151', // Orange for 1969
                '1870',
                '#ae2e2e', // Red for 1870
                '1897',
                '#ae2e2e', // Red for 1897
                '#999999' // Default gray for other years
            ], // Red color for lost lakes
            'line-opacity': 1,
            'line-width': [
                'interpolate',
                ['linear'], // You can also use 'exponential' with a base
                ['zoom'],
                // Define line-width at different zoom levels
                // [zoom_level, line_width_in_pixels]
                5,
                1, // At zoom 5, line-width is 1 pixel
                10,
                1, // At zoom 10, line-width is 3 pixels
                15,
                3, // At zoom 15, line-width is 6 pixels
                20,
                3 // At zoom 20, line-width is 10 pixels
            ],
            'line-dasharray': [2, 1]
        }
    });

    //for Lake Buttons

    map.addLayer({
        id: 'lakes_1700',
        type: 'fill',
        source: 'all-lakes-lost-source',
        'source-layer': 'all_lost_lakes-3r51nl',
        filter: ['in', ['get', 'year'], ['literal', ['1791']]],
        paint: {
            'fill-color': '#0085eb', // Red for 1870/1897
            'fill-opacity': 0.5
        }
    });

    map.addLayer({
        id: 'lakes_existing_1800',
        type: 'fill',
        source: 'lakes-existing-overlap',
        'source-layer': 'Lakes_existing_overlap-0n1e1w',
        filter: ['in', ['get', 'year'], ['literal', ['1870', '1897']]],
        paint: {
            'fill-color': '#0085eb', // Red for 1870/1897
            'fill-opacity': 0.5
        }
    });

    map.addLayer({
        id: 'lakes_existing_1900',
        type: 'fill',
        source: 'lakes-existing-overlap',
        'source-layer': 'Lakes_existing_overlap-0n1e1w',
        filter: ['in', ['get', 'year'], '1969'],
        paint: {
            'fill-color': '#0056eb', // Red for 1870/1897
            'fill-opacity': 0.5
        }
    });

    map.addLayer({
        id: 'lakes_lost_1800',
        type: 'fill',
        source: 'all-lakes-lost-source',
        'source-layer': 'all_lost_lakes-3r51nl',
        filter: ['in', ['get', 'year'], ['literal', ['1854', '1870', '1897']]], // Only show 1870 and 1897
        paint: {
            'fill-color': '#0085eb', // Red for 1870/1897
            'fill-opacity': 0.5
        }
    });

    map.addLayer({
        id: 'lakes_lost_1900',
        type: 'fill',
        source: 'all-lakes-lost-source',
        'source-layer': 'all_lost_lakes-3r51nl',
        slot: 'top',
        filter: ['==', ['get', 'year'], '1969'], // Only show 1969
        paint: {
            'fill-color': '#0056eb', // Orange/red for 1969
            'fill-opacity': 0.5
        }
    });

    //existing lakes duplicate

    map.addLayer({
        id: 'tanks_existing',
        type: 'fill',
        source: 'lakes-existing-source',
        'source-layer': 'lakes_existing-43lypw',
        paint: {
            'fill-color': '#4e4cf0',
            'fill-opacity': 0.7
        }
    });

    //for count
    map.addLayer({
        id: 'Lakes_lost_1800_1900',
        type: 'fill',
        source: 'all-lakes-lost-source',
        'source-layer': 'all_lost_lakes-3r51nl',
        filter: [
            'all',
            ['in', 'year', '1870', '1897'], // Only 1870 & 1897
            ['!=', 'Overlap', 1] // Exclude overlap = 1
        ],
        paint: {
            'fill-color': '#d54231',
            'fill-opacity': 0.5
        }
    });

    map.addLayer({
        id: 'Lakes_lost_1900_2000',
        type: 'fill',
        source: 'all-lakes-lost-source',
        'source-layer': 'all_lost_lakes-3r51nl',
        filter: [
            'all',
            ['!=', 'Overlap', 1] // Exclude overlap = 1
        ],
        paint: {
            'fill-color': '#d54231',
            'fill-opacity': 0.5
        }
    });

    //streamorder
    // Add Lakes outline GeoJSON source and layer
    map.addSource('streamorder-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.3alu3pwv'
    });

    /*map.addLayer({
        id: 'streamorder-edited',
        type: 'line',
        source: 'streamorder-source',
        'source-layer': 'streamorder-2ubj22',
        paint: {
            'line-color': '#ffffff', 
            'line-opacity': 1
        }
    });*/

    //subbasins

    map.addSource('sub-basin-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.47rc6fbu'
    });

    map.addLayer({
        id: 'sub-valleys',
        type: 'fill',
        source: 'sub-basin-source',
        'source-layer': 'valley_subbasins-00mv95',
        paint: {
            'fill-color': 'rgba(255,255,255,0)',
            'fill-outline-color': '#840606',
            'fill-opacity': 0.5
        }
    });
}

function addTypLayers() {
    // Add typology GeoJSON source and layer
    map.addSource('typ_source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.8o8116ot'
    });

    //styling
    // Add white drop shadow layer first (underneath)
    map.addLayer({
        id: 'typ_analysis-glow',
        type: 'line',
        source: 'typ_source',
        'source-layer': 'typ_analysis-2cq5z2',
        paint: {
            'line-color': '#ffffff', // White drop shadow
            'line-opacity': 0.8, // Semi-transparent
            'line-width': 8, // Wider than main line
            'line-blur': 4 // Blur for glow effect
        }
    });

    // Add main line layer on top
    map.addLayer({
        id: 'typ_analysis',
        type: 'line',
        source: 'typ_source',
        'source-layer': 'typ_analysis-2cq5z2',
        paint: {
            'line-color': [
                'match',
                ['get', 'typ'], // Get the Year property from each feature
                't1',
                '#FF0000', // REd
                't2',
                '#ff7900', // Orange
                //'t3', '#3B8C1A',  // Orange for 1969
                't4',
                '#db3ee9', // Purple
                't5',
                '#4ed84e', // green
                't6',
                '#F1C40F', // Orange for 1969
                't7',
                '#7D3C98', // Orange for 1969
                't8',
                '#27AE60', // Orange for 1969
                't9',
                '#BA4A00', // Orange for 1969
                't10',
                '#10611e', // Orange for 1969
                't11',
                '#2C3E50',
                't12',
                '#efc700',
                '#999999'
            ],
            'line-opacity': 1,
            'line-width': 6
        }
    });
}

function addBoundaryLayers() {
    // Add Lakes_lost GeoJSON source and layer
    map.addSource('year-boundaries-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.21szwwtj'
    });

    map.addSource('1790-boundary-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.aume0lcw'
    });

    map.addLayer({
        id: '1790-boundary',
        type: 'line',
        source: '1790-boundary-source',
        'source-layer': '1790-5tli9z',
        minzoom: 0,
        maxzoom: 24,
        paint: {
            'line-color': '#000000', // Orange for 1969
            'line-dasharray': [2, 1],
            'line-width': 3
        }
    });

    //1870 and 1897 Lakes
    map.addLayer({
        id: '1870-boundary',
        type: 'line',
        source: 'year-boundaries-source',
        'source-layer': 'boundaries-3hk1x7',
        filter: ['in', ['get', 'Name'], ['literal', ['1870']]], // Only show 1870 and 1897
        paint: {
            'line-color': '#000000', // Orange for 1969
            'line-dasharray': [2, 1],
            'line-width': 3
        }
    });

    map.addLayer({
        id: '1968-boundary',
        type: 'line',
        source: 'year-boundaries-source',
        'source-layer': 'boundaries-3hk1x7',
        filter: ['in', ['get', 'Name'], ['literal', ['1968']]], // Only show 1870 and 1897
        paint: {
            'line-color': '#000000', // Orange for 1969
            'line-dasharray': [2, 1],
            'line-width': 2
        }
    });

    /* Add gba wards
    map.addSource('wards-boundary-source', {
        type: 'vector',
        url: 'mod-foundation.5rtniquc'
    });

    //wards line
    map.addLayer({
        id: 'gba-wards',
        type: 'line',
        source: 'wards-boundary-source',
        'source-layer': 'GBA_Wards-b7csqh',
        paint: {
            'line-color': '#000000', // Orange for 1969
            'line-width': 0.5,
            'line-opacity': 0.3
        }
    });

   wards fill
    map.addLayer({
        id: 'bbmp-wards',
        type: 'fill',
        source: 'wards-boundary-source',
        'source-layer': 'bbmp_wards_edited-d7kxzg',
        paint: {
            'fill-color': '#ffffff',  // Red for 1870/1897
            'fill-opacity': 0
        } });*/
}

function addGreens() {
    // Add parks layer
    map.addSource('parks-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.53dfw0a4'
    });

    map.addLayer({
        id: 'parks',
        type: 'fill',
        source: 'parks-source',
        'source-layer': 'parks-0h64ty',
        paint: {
            'fill-color': '#2f6833',
            'fill-opacity': 0.5
        }
    });

    // Add wetlands layer
    map.addSource('wetlands-source', {
        type: 'vector',
        url: 'mapbox://mod-foundation.cu0u4yom'
    });

    map.addLayer({
        id: 'wetlands',
        type: 'fill',
        source: 'wetlands-source',
        'source-layer': 'wetlands-1xglyr',
        paint: {
            'fill-color': '#2f6833',
            'fill-opacity': 0.3
        }
    });
}

//#endregion

//#endregion

//#region ui

//#region mapcontrols

window.addEventListener('load', () => {
    const searchBox = new MapboxSearchBox();
    searchBox.accessToken = mapboxgl.accessToken;
    searchBox.options = {
        types: 'address,poi',
        proximity: [12.9629, 77.5775]
    };
    searchBox.marker = true;
    searchBox.mapboxgl = mapboxgl;
    searchBox.componentOptions = { allowReverse: true, flipCoordinates: true };
    map.addControl(searchBox, 'top-right');
});

// Add zoom controls
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// Add fullscreen control
map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');

// Add geolocate control
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    }),
    'bottom-right'
);

function addScreenshotButtonToMap() {
    // Create control container
    const controlContainer = document.createElement('div');
    controlContainer.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    // Create button
    const screenshotBtn = document.createElement('button');
    screenshotBtn.className = 'mapboxgl-ctrl-icon';
    screenshotBtn.type = 'button';
    screenshotBtn.title = 'Download map snapshot';
    screenshotBtn.setAttribute('aria-label', 'Download map snapshot');
    screenshotBtn.id = 'map-screenshot-btn';

    // Add camera icon SVG
    screenshotBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 4L8 2H12L13 4H17C17.5304 4 18.0391 4.21071 18.4142 4.58579C18.7893 4.96086 19 5.46957 19 6V16C19 16.5304 18.7893 17.0391 18.4142 17.4142C18.0391 17.7893 17.5304 18 17 18H3C2.46957 18 1.96086 17.7893 1.58579 17.4142C1.21071 17.0391 1 16.5304 1 16V6C1 5.46957 1.21071 4.21071 1.58579 4.58579C1.96086 4.21071 2.46957 4 3 4H7Z" stroke="#3B3B3B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="10" cy="11" r="3" stroke="#3B3B3B" stroke-width="3"/>
                    </svg>
                `;
    // Add centering styles to button
    screenshotBtn.style.display = 'flex';
    screenshotBtn.style.alignItems = 'center';
    screenshotBtn.style.justifyContent = 'center';
    screenshotBtn.style.padding = '0';

    // Add click handler
    screenshotBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        // Add loading visual feedback
        screenshotBtn.style.opacity = '0.6';

        // Call download function
        downloadMapSnapshot();

        // Remove loading state
        setTimeout(() => {
            screenshotBtn.style.opacity = '1';
        }, 2000);
    });

    // Append button to container
    controlContainer.appendChild(screenshotBtn);

    // Add to map at bottom-right position
    const bottomRightContainer = document.querySelector('.mapboxgl-ctrl-bottom-right');
    if (bottomRightContainer) {
        // Insert at the beginning (above location button)
        bottomRightContainer.insertBefore(controlContainer, bottomRightContainer.firstChild);
        console.log('✅ Screenshot button added to map');
    } else {
        console.warn('⚠️ Could not find bottom-right control container');
    }
}

// Add scale control
map.addControl(
    new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
    }),
    'bottom-right'
);

//#endregion

//#region interactive pop ups and selectors
// Show selector for multiple features
function showSelector(features, lngLat) {
    // Close any existing popup before opening a new one
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }

    const items = features
        .map((f, i) => {
            window[`selectFeature${i}`] = () => {
                showPopup(f, lngLat);
                highlightFeature(f);
            };

            // Determine label based on feature type
            const isTank = [
                'Lakes',
                'Lakes_lost',
                'tanks_existing',
                'lakes_lost_1900',
                'lakes_existing_1900',
                'lakes_1700',
                'lakes_lost_1800',
                'lakes_existing_1800',
                'Lakes_existing_overlap-interaction'
            ].includes(f.layer.id);

            const isDrain =
                f.layer.id === 'primary-drains-interaction' || f.layer.id === 'secondary-drains-interaction';
            const isWard = f.layer.id === 'gba-wards';

            let label;
            if (isTank) {
                label = f.properties.name || f.properties.NAME || 'Unnamed';
            } else if (isDrain) {
                label = f.properties['Drain num'] || 'Unnamed Drain';
            } else if (isWard) {
                label = f.properties.ward_name || 'Unnamed Ward';
            } else {
                label = f.properties.name || f.properties.NAME || f.properties.Name || 'Unnamed';
            }

            return `<div class="feature-option" style="border-left:6px solid ${getColor(f.layer.id)}"
                            onclick="selectFeature${i}()">
                            <strong style="color:${getColor(f.layer.id)}">${getType(f.layer.id)}</strong><br>
                            ${label}
                        </div>`;
        })
        .join('');

    // Create new popup and assign it to the global variable
    activePopup = new mapboxgl.Popup({ closeButton: true })
        .setLngLat(lngLat)
        .setHTML(
            `
                    <div class="feature-option-container">
                        <p class="feature-option-heading">Select feature:</p>
                        ${items}
                    </div>
                `
        )
        .addTo(map)
        .on('close', () => {
            activePopup = null;
        });
}

// Show popup for single feature
function showPopup(feature, lngLat) {
    // Don't show other popups if typology popups are active
    if (window.typologyPopupsActive) {
        return;
    }

    const p = feature.properties;
    const isTank = [
        'Lakes',
        'Lakes_lost',
        'tanks_existing',
        'lakes_lost_1900',
        'lakes_existing_1900',
        'lakes_1700',
        'lakes_lost_1800',
        'lakes_existing_1800',
        'Lakes_existing_overlap-interaction'
    ].includes(feature.layer.id);

    let color = getColor(feature.layer.id);
    const type = getType(feature.layer.id);

    // Special handling for layers
    let contentHtml = '';

    if (isTank) {
        contentHtml = [
            p.name && `<strong>Name:</strong> ${p.name}`,
            p.year && `<strong>Traced from:</strong> ${p.year}`,
            p.Category && `<strong>Category:</strong> ${p.Category}`,
            p.area_acres && `<strong>Area (acres):</strong> ${p.area_acres}`,
            p.ward_name && `<strong>Ward:</strong> ${p.ward_name}`,
            p.ward_name_ka && `<strong>Ward:</strong> ${p.ward_name_ka}`,
            p.Status && `<strong>Status:</strong> ${p.Status}`
        ]
            .filter(Boolean)
            .join('<br>');
    } else if (
        feature.layer.id === 'primary-drains-interaction' ||
        feature.layer.id === 'secondary-drains-interaction'
    ) {
        contentHtml = [
            p['Drain num'] && `<strong>Drain ID:</strong> ${p['Drain num']}`,
            p.length_m && `<strong>Length:</strong> ${p.length_m}`
        ]
            .filter(Boolean)
            .join('<br>');
    } else if (feature.layer.id === 'gba-wards') {
        contentHtml = [p.ward_name && `<strong>Name:</strong> ${p.ward_name}`].filter(Boolean).join('<br>');
        console.log('filledward data');
    } else if (feature.layer.id === 'parks') {
        contentHtml = [p.Name && `<strong>Name:</strong> ${p.Name}`].filter(Boolean).join('<br>');
        console.log('filledward data');
    } else {
        contentHtml = Object.entries(p)
            .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
            .join('<br>');
    }

    const html = `<div class="feature-detail-container" style="border-left:4px solid ${color};">
                <strong id="heading" style="color:${color}">${type}</strong><br>
                ${contentHtml}
            </div>`;

    // Close any existing popup before opening a new one
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }

    // Clear typology popups flag when opening other popups
    window.typologyPopupsActive = false;

    // Create new popup and assign it to the global variable
    activePopup = new mapboxgl.Popup({ closeButton: true })
        .setLngLat(lngLat)
        .setHTML(html || '<em>No data available</em>')
        .addTo(map)
        .on('close', () => {
            clearHighlight();
            activePopup = null;
        });

    highlightFeature(feature);
}
function createLineCallout(id, coordinates, title, subtitle) {
    // Remove existing callout with same id (if any)
    if (activeCallouts[id]) {
        activeCallouts[id].remove();
        delete activeCallouts[id];
    }

    // Create callout HTML element
    const calloutEl = document.createElement('div');
    calloutEl.className = 'line-callout';
    calloutEl.innerHTML = `
            <div class="callout-text">
              <span class="callout-title">${title}</span>
              <span class="callout-subtitle">${subtitle}</span>
            </div><div class="callout-line"></div>
        
            `;

    // Add to map
    const marker = new mapboxgl.Marker({
        element: calloutEl,
        anchor: 'bottom-right'
    })
        .setLngLat(coordinates)
        .addTo(map);

    activeCallouts[id] = marker;
}

//#endregion

//#region paneldetails

function panelHandle(keepGroups) {
    console.log('\n🔧 === panelHandle CALLED ===');
    console.log('Input keepGroups:', keepGroups);

    const keepVisible = new Set();

    // ✅ Ensure input is an array of group keys
    const groupKeys = Array.isArray(keepGroups?.groups)
        ? keepGroups.groups
        : Array.isArray(keepGroups)
        ? keepGroups
        : [];

    console.log('Processed groupKeys:', groupKeys);

    // ✅ Turn ON all layers in groups to keep
    console.log('\n✅ TURNING ON these groups:');
    groupKeys.forEach(groupKey => {
        const group = layerConfig[groupKey];
        if (!group) {
            console.warn(`  ⚠️ Group not found: ${groupKey}`);
            return;
        }

        keepVisible.add(groupKey);
        console.log(`\n  ${groupKey} (${group.label}):`);

        group.layers.forEach(layerId => {
            if (map.getLayer(layerId)) {
                const visibility = map.getLayoutProperty(layerId, 'visibility');
                if (visibility !== 'visible') {
                    console.log(`    🟢 Turning ON: ${layerId} (was ${visibility || 'default'})`);
                    toggleLayer(layerId, true);
                    syncLegendToMap(layerId);
                } else {
                    console.log(`    ✓ Already ON: ${layerId}`);
                }
            } else {
                console.log(`    ❌ Layer not found: ${layerId}`);
            }
        });
    });

    // 🚫 Turn OFF all other groups not in keepVisible
    console.log('\n🚫 TURNING OFF these groups:');
    Object.keys(layerConfig).forEach(groupKey => {
        if (keepVisible.has(groupKey)) return;

        const group = layerConfig[groupKey];
        if (!group) return;

        console.log(`\n  ${groupKey} (${group.label}):`);

        group.layers.forEach(layerId => {
            if (map.getLayer(layerId) && !['background', 'satellite'].includes(layerId)) {
                const visibility = map.getLayoutProperty(layerId, 'visibility');
                if (visibility !== 'none') {
                    console.log(`    🔴 Turning OFF: ${layerId} (was ${visibility || 'visible'})`);
                    toggleLayerOff(layerId);
                    syncLegendToMap(layerId);
                } else {
                    console.log(`    ✓ Already OFF: ${layerId}`);
                }
            }
        });
    });

    console.log('✅ === panelHandle COMPLETE ===\n');
}

// Helper function to clear all pending panel timeouts
function clearAllPanelTimeouts() {
    // Clear valleys category timeout
    if (valleysCategoryTimeout) {
        clearTimeout(valleysCategoryTimeout);
        valleysCategoryTimeout = null;
    }

    // Clear all DEM timeouts
    demTimeouts.forEach(timeout => clearTimeout(timeout));
    demTimeouts = [];
}

function handleDEMDetail() {
    console.log('🏔 Handling DEM Detail');

    // Clear any pending timeouts from other panels
    clearAllPanelTimeouts();

    // Fly to DEM view
    smoothFlyTo(dem3DViewBounds);

    // Define groups/layers to stay visible or turn on
    const keepGroups = { groups: ['dem', 'hillshade', 'ridge', ...alwaysVisible] };

    panelHandle(keepGroups.groups);

    // 🎯 Fade DEM layers to full opacity
    setOpa('dem', 1);

    setOpa('hillshade', 1);

    // 🗺️ Sequential activation of DEM contextual layers
    demTimeouts.push(
        setTimeout(() => {
            toggleGroup('valleys', true);
            syncLegendToMapGroup('valleys');
            createLineCallout('ridge', [77.5835, 12.93], 'RIDGE LINE', 'Highest elevation area');
            createLineCallout(
                'highestpoint',
                [77.582468, 13.01239],
                'HIGHEST POINT',
                'North kempegowda Tower<br> 952m'
            );
        }, 1000)
    );

    demTimeouts.push(
        setTimeout(() => {
            toggleGroup('streamorder', true);
            syncLegendToMapGroup('streamorder');
        }, 3000)
    );
}

function handleValleysDetail() {
    // Clear any pending timeouts from other panels
    clearAllPanelTimeouts();

    removeAllCallouts();
    // 1️⃣ Fly to the valley view
    smoothFlyTo(valleyViewBounds);

    // 2️⃣ Make DEM fully visible
    setOpa('dem', 0.5);
    setOpa('hillshade', 0);

    // 3️⃣ Define groups that must stay visible
    const keepGroups = { groups: ['dem', 'hillshade', 'valleys', 'valleylabels', 'streamorder', ...alwaysVisible] };

    panelHandle(keepGroups.groups);

    if (map.getLayer('valleys-label')) {
        map.moveLayer('valleys-label');
    }
    if (map.getLayer('valleys')) {
        map.moveLayer('valleys');
    }
    // 7️⃣ (Optional) Turn on "valleys category" after short delay
    valleysCategoryTimeout = setTimeout(() => {
        toggleGroup('valleyscategory', true, 0.7);
        syncLegendToMapGroup('valleyscategory');
    }, 1000);
}

// Add these constants at the top of your code with other constants
const TOTAL_EXISTING_LAKES = 203;
const TOTAL_LOST_LAKES = 108;

function handlelakesDetail() {
    console.log('\n🏔 === HANDLING LAKES DETAIL - START ===');
    console.log('Timestamp:', new Date().toISOString());

    // Clear any pending timeouts from other panels
    clearAllPanelTimeouts();

    // Hide timeline description
    hideTimelineDescription();

    // 1️⃣ Fly to the valley view
    console.log('📍 Flying to default view:', defaultView);
    smoothFlyTo(defaultViewBounds);

    // 2️⃣ Set DEM to 40% opacity
    console.log('🎨 Setting DEM opacity to 0.4');
    setOpa('dem', 0.4);

    console.log('🔇 Turning off hillshade');
    toggleLayerOff('hillshade');

    // Define groups/layers to stay visible or turn on
    const keepGroups = {
        groups: ['dem', 'valleys', 'tanks', 'losttanks', 'wards', ...alwaysVisible]
    };

    //console.log('📋 Groups to keep visible:', keepGroups.groups);
    //console.log('📋 Expanded layer IDs for these groups:');
    keepGroups.groups.forEach(groupKey => {
        const layers = layerConfig[groupKey]?.layers || [];
        //console.log(`  ${groupKey}:`, layers);
    });

    //console.log('\n🔧 Calling panelHandle with keepGroups...');
    panelHandle(keepGroups.groups);

    //console.log('\n🎨 Setting additional opacities:');
    //console.log('  - tanks: 0.9');
    setOpa('tanks', 0.9);
    //console.log('  - wards: 0.3');
    setOpa('wards', 0.3);

    // Log current layer visibility states AFTER panelHandle
    //console.log('\n📊 === LAYER VISIBILITY STATES AFTER panelHandle ===');
    Object.keys(layerConfig).forEach(groupKey => {
        const group = layerConfig[groupKey];
        //console.log(`\n${groupKey} (${group.label}):`);
        group.layers.forEach(layerId => {
            if (map.getLayer(layerId)) {
                const visibility = map.getLayoutProperty(layerId, 'visibility');
                const opacityProp = getOpacityProperty(layerId);
                const opacity = opacityProp ? map.getPaintProperty(layerId, opacityProp) : 'N/A';
                //console.log(`  ${layerId}:`, {
                //    visibility: visibility || 'visible (default)',
                //    opacity: opacity
                //});
            } else {
                //console.log(`  ${layerId}: ❌ LAYER NOT FOUND`);
            }
        });
    });

    // ✅ Use hardcoded totals immediately (no waiting for map)
    //console.log('\n📊 Updating lakes counter with totals:', {
    //    existing: TOTAL_EXISTING_LAKES,
    //    lost: TOTAL_LOST_LAKES
    //});
    updateLakesCounter(TOTAL_EXISTING_LAKES, TOTAL_LOST_LAKES, true);

    // ✅ Reset ALL lake filters
    //console.log('\n🔄 Resetting all filters...');
    resetAllFilters();

    console.log('✅ === HANDLING LAKES DETAIL - COMPLETE ===\n');
}

function handlePrimaryDetail() {
    console.log('🏔 Handling Primary Detail');

    // Clear any pending timeouts from other panels
    clearAllPanelTimeouts();

    // 1️⃣ Fly to the valley view
    smoothFlyTo(defaultViewBounds);

    // 2️⃣ Make DEM fully visible
    setOpa('dem', 0.4);
    toggleLayerOff('hillshade');

    // Define groups/layers to stay visible or turn on
    const keepGroups = { groups: ['dem', 'valleys', 'tanks', 'primarydrains', 'wards', 'losttanks', ...alwaysVisible] };

    setOpa('wards', 0.4);

    panelHandle(keepGroups.groups);
}

function handleSecondaryDetail() {
    console.log('🏔 Handling Secondary Detail');

    // Clear any pending timeouts from other panels
    clearAllPanelTimeouts();

    // 1️⃣ Fly to the valley view
    smoothFlyTo(defaultViewBounds);

    // 2️⃣ Make DEM fully visible
    setOpa('dem', 0.4);
    setOpa('wards', 0.4);
    toggleLayerOff('hillshade');

    // Define groups/layers to stay visible or turn on
    const keepGroups = {
        groups: [
            'dem',
            'valleys',
            'tanks',
            'primarydrains',
            'secondarydrains',
            'subvalleys',
            'wards',
            'losttanks',
            'valleylabels',
            ...alwaysVisible
        ]
    };
    setOpa('greens', 0.4);
    panelHandle(keepGroups.groups);
}

function handleTypologyDetail() {
    console.log('🏔 Handling Typology Detail');

    // Clear any pending timeouts from other panels
    clearAllPanelTimeouts();

    // Mark typology as active
    window.typologyPanelActive = true;
    window.typologyPopupsActive = false;

    // 1️⃣ Zoom to typology analysis layer extents
    zoomToLayerBounds('typ_analysis', { padding: 50, duration: 2000, maxZoom: 25 });

    // 2️⃣ Set DEM to 40% opacity
    setOpa('dem', 0.4);
    setOpa('roads', 0.4);
    toggleLayerOff('hillshade');

    // Define groups/layers to stay visible or turn on
    const keepGroups = {
        groups: [
            'dem',
            'valleys',
            'tanks',
            'losttanks',
            'primarydrains',
            'secondarydrains',
            'roads',
            'placelabels',
            'typologyanalysis',
            'wards',
            'greens',
            ...alwaysVisible
        ]
    };
    setOpa('greens', 0.4);
    panelHandle(keepGroups.groups);

    // 4️⃣ Make sure the detail is open so content shows
    const detail = document.getElementById('typology-detail');
    if (detail && !detail.open) {
        detail.open = true;
    }
}

function handlefilterDetail() {
    console.log('🏔 Handling Filter Detail');

    // Clear any pending timeouts from other panels
    clearAllPanelTimeouts();

    // 2️⃣ Make DEM fully visible
    setOpa('dem', 0.4);
    setOpa('wards', 0.4);

    // Define groups/layers to stay visible or turn on
    const keepGroups = {
        groups: [
            'dem',
            'valleys',
            'tanks',
            'primarydrains',
            'secondarydrains',
            'subvalleys',
            'wards',
            'losttanks',
            'valleylabels',
            'greens',
            ...alwaysVisible
        ]
    };

    setOpa('greens', 0.4);

    panelHandle(keepGroups.groups);

    // Fly to the valley view
    smoothFlyTo(defaultViewBounds);

    // Make DEM fully visible
    setOpa('roads', 0.2);

    // 🔥 NEW: Initialize counter when panel opens
    map.once('idle', () => {
        updateFilterCounter();
    });
}

function resetMap() {
    console.log('🏔 Reset Map');

    //remove callouts
    removeAllCallouts();

    // Clear typology flags when resetting
    window.typologyPanelActive = false;
    window.typologyPopupsActive = false;
    clearTypologyMarkers();

    //reset filters
    resetAllFilters();

    // Close typology panel and open default panel (e.g., primary-detail)
    const typologyDetail = document.getElementById('typology-detail');
    if (typologyDetail && typologyDetail.open) {
        typologyDetail.open = false;
    }

    // Open the default panel (primary drains)
    const primaryDetail = document.getElementById('primary-detail');
    if (primaryDetail && !primaryDetail.open) {
        primaryDetail.open = true;
    }

    // 1️⃣ Fly to the default view
    smoothFlyTo(defaultViewBounds);

    // 2️⃣ Make DEM fully visible
    setOpa('dem', 0.4);
    toggleLayerOff('hillshade');

    // Define groups/layers to stay visible or turn on
    const keepGroups = {
        groups: [
            'dem',
            'valleys',
            'valleylabels',
            'losttanks',
            'wards',
            'tanks',
            'primarydrains',
            'secondarydrains',
            'roads',
            'placelabels',
            'greens',
            ...alwaysVisible
        ]
    };

    panelHandle(keepGroups.groups);

    setOpa('roads', 0.5);
    setOpa('wards', 0.5);
    setOpa('greens', 0.4);
}

//#endregion

//#region lakesbuttons

// Helper function to show timeline description
function showTimelineDescription(year) {
    // Hide all descriptions first
    document.querySelectorAll('.timeline-description').forEach(desc => {
        desc.style.display = 'none';
    });

    // Show the specific description for this year
    const descDiv = document.getElementById('desc_' + year);
    if (descDiv) {
        descDiv.style.display = 'block';
    }
}

// Helper function to hide all timeline descriptions
function hideTimelineDescription() {
    document.querySelectorAll('.timeline-description').forEach(desc => {
        desc.style.display = 'none';
    });
}

// 1800s lakes view
function lakes1700() {
    console.log('🏛️ lakes1700 function called');
    showTimelineDescription('1790');

    // Update active state
    const lakes1700Btn = document.getElementById('lakes_trace_1700');
    document.querySelectorAll('#lakes_trace_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (lakes1700Btn) {
        lakes1700Btn.classList.add('active');
    }

    // Define groups/layers to stay visible or turn on
    const keepGroups = { groups: ['dem', 'tanks1700'] };
    panelHandle(keepGroups.groups);

    setOpa('tanks1700', 0.6);

    // Check if layer exists
    const layer = map.getLayer('lakes_1700');
    if (layer) {
        console.log('✅ lakes_1700 layer exists');

        const View_1700 = {
            center: [77.578, 12.965],
            zoom: 14.46,
            pitch: 0,
            bearing: 0
        };
        smoothFlyTo(View_1700);

        // Wait for layers to load before counting
        setTimeout(() => {
            const existingCount = countFeaturesInLayer('lakes_1700');
            console.log('Count result:', existingCount);
            updateLakesCounter(existingCount, null, false);
        }, 500);
    }
}

function lakes1800() {
    showTimelineDescription('1870');

    // Update active state
    const lakes1800Btn = document.getElementById('lakes_trace_1800');
    document.querySelectorAll('#lakes_trace_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (lakes1800Btn) {
        lakes1800Btn.classList.add('active');
    }

    // Define groups/layers to stay visible or turn on
    const keepGroups = { groups: ['dem', 'tanks1800'] };
    panelHandle(keepGroups.groups);

    setOpa('tanks1800', 0.6);

    const View_1800 = {
        center: [77.61, 12.98],
        zoom: 12.15,
        pitch: 0,
        bearing: 0
    };

    smoothFlyTo(View_1800);

    // Wait for layers to load before counting
    setTimeout(() => {
        const existingCount = countFeaturesInLayer('lakes_existing_1800') + countFeaturesInLayer('lakes_lost_1800');
        updateLakesCounter(existingCount, null, false);
    }, 500);
}

// 1900s lakes view
function lakes1900() {
    showTimelineDescription('1969');
    //console.log("📅 Showing 1900s lakes");

    // Update active state
    const lakes1900Btn = document.getElementById('lakes_trace_1900');
    document.querySelectorAll('#lakes_trace_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (lakes1900Btn) {
        lakes1900Btn.classList.add('active');
    }

    // Define groups/layers to stay visible or turn on
    const keepGroups = { groups: ['dem', 'tanks1900'] };
    panelHandle(keepGroups.groups);

    setOpa('tanks1900', 0.8);

    const View_1900 = {
        center: [77.594, 12.988],
        zoom: 11.8,

        pitch: 0,
        bearing: 0
    };

    smoothFlyTo(View_1900);

    // Wait for layers to load before counting
    setTimeout(() => {
        const existingCount = countFeaturesInLayer('lakes_existing_1900') + countFeaturesInLayer('lakes_lost_1900');
        const lostCount = countFeaturesInLayer('Lakes_lost_1800_1900');
        //console.log(lostCount);
        updateLakesCounter(existingCount, lostCount, true);
    }, 500);
}

// 2000s lakes view
function lakes2000() {
    showTimelineDescription('Present');
    //console.log("📅 Showing 2000s lakes");

    // Update active state
    const lakes2000Btn = document.getElementById('lakes_trace_2000');
    document.querySelectorAll('#lakes_trace_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (lakes2000Btn) {
        lakes2000Btn.classList.add('active');
    }

    // Define groups/layers to stay visible or turn on
    const keepGroups = { groups: ['dem', 'valleys', 'existingtanks', ...alwaysVisible] };
    panelHandle(keepGroups.groups);
    smoothFlyTo(defaultViewBounds);

    // Wait for layers to load before counting
    setTimeout(() => {
        const existingCount = countFeaturesInLayer('Lakes');
        const lostCount = countFeaturesInLayer('Lakes_lost_1900_2000');
        updateLakesCounter(existingCount, lostCount, true);
    }, 500);
}

//#endregion

//#region watershed

// Add this variable at the top with your other state variables

let activeBasinButton = null;

function basin1() {
    //console.log('📊 === BASIN 1 FUNCTION CALLED ===');
    removeAllCallouts();

    const basin1Btn = document.getElementById('basin_1');

    // Check if clicking the same button
    if (activeBasinButton === 'basin_1') {
        // Reset: remove all active classes and call handleValleysDetail
        document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBasinButton = null;

        // Reset streamorder filter to show all
        showAllStreamOrderLevels();

        handleValleysDetail();
        return; // Exit early
    }

    // Remove active class from all basin buttons
    document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to basin 1 button
    if (basin1Btn) {
        basin1Btn.classList.add('active');
        activeBasinButton = 'basin_1';
    }

    const streamorderLayer = map.getLayer('streamorder');
    console.log('Streamorder layer exists:', !!streamorderLayer);

    const keepGroups = {
        groups: ['gba', 'streamorder', 'allbasins', 'basinbg']
    };

    setOpa('basinbg', 0.6);
    smoothFlyTo(valleyViewBounds);

    panelHandle(keepGroups.groups);

    showStreamOrderByLevels([13]);

    syncLegendToMapGroup('streamorder');

    console.log('✅ Basin 1 complete');
}

function basin2() {
    const basin2Btn = document.getElementById('basin_2');
    removeAllCallouts();

    // Check if clicking the same button
    if (activeBasinButton === 'basin_2') {
        document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBasinButton = null;

        // Reset streamorder filter to show all
        showAllStreamOrderLevels();

        handleValleysDetail();
        return;
    }

    document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });

    if (basin2Btn) {
        basin2Btn.classList.add('active');
        activeBasinButton = 'basin_2';
    }

    const keepGroups = {
        groups: ['gba', 'streamorder', 'allbasins', 'basinbg', 'valleyscategory']
    };

    setOpa('basinbg', 0.6);
    setOpa('valleyscategory', 0.3);

    const basin2View = {
        center: [77.616, 12.93],
        zoom: 10.1,
        pitch: 0,
        bearing: 0,
        minZoom: 10.5
    };

    smoothFlyTo(basin2View);

    panelHandle(keepGroups.groups);

    showStreamOrderByLevels([13, 12, 9]);

    syncLegendToMapGroup('streamorder');
    toggleLayer('valleys-label');

    console.log('✅ Basin 2 complete');
}

function basin3() {
    const basin3Btn = document.getElementById('basin_3');
    removeAllCallouts();

    // Check if clicking the same button
    if (activeBasinButton === 'basin_3') {
        document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBasinButton = null;

        // Reset streamorder filter to show all
        showAllStreamOrderLevels();

        handleValleysDetail();
        return;
    }

    document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });

    if (basin3Btn) {
        basin3Btn.classList.add('active');
        activeBasinButton = 'basin_3';
    }

    const keepGroups = {
        groups: ['gba', 'streamorder', 'allbasins', 'basinbg', 'valleyscategory']
    };

    setOpa('basinbg', 0.6);
    setOpa('valleyscategory', 0.3);

    const basin2View = {
        center: [77.616, 12.886],
        zoom: 9,
        pitch: 0,
        bearing: 0
    };

    smoothFlyTo(basin2View);

    panelHandle(keepGroups.groups);

    showStreamOrderByLevels([13, 12, 9, 7]);

    syncLegendToMapGroup('streamorder');
    toggleLayer('river-label');

    console.log('✅ Basin 3 complete');
}

function basin4() {
    const basin4Btn = document.getElementById('basin_4');
    removeAllCallouts();

    // Check if clicking the same button
    if (activeBasinButton === 'basin_4') {
        document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBasinButton = null;

        // Reset streamorder filter to show all
        showAllStreamOrderLevels();

        handleValleysDetail();
        return;
    }

    document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });

    if (basin4Btn) {
        basin4Btn.classList.add('active');
        activeBasinButton = 'basin_4';
    }

    const keepGroups = {
        groups: ['gba', 'streamorder', 'allbasins', 'basinbg', 'valleyscategory']
    };

    setOpa('basinbg', 0.6);
    setOpa('valleyscategory', 0.3);
    const basin2View = {
        center: [78.416, 12.616],
        zoom: 8,
        pitch: 0,
        bearing: 0
    };

    smoothFlyTo(basin2View);

    panelHandle(keepGroups.groups);

    showStreamOrderByLevels([13, 12, 9, 7, 6]);

    syncLegendToMapGroup('streamorder');
    toggleLayer('largerriver-label');

    createLineCallout(
        'river_marker_1',
        [79.794748, 11.774276],
        'Thazhangudha, Tamil Nadu',
        'Confluence point of Thenna Pennai'
    );

    console.log('✅ Basin 4 complete');
}

function basin5() {
    const basin5Btn = document.getElementById('basin_5');

    // Check if clicking the same button
    if (activeBasinButton === 'basin_5') {
        document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBasinButton = null;

        // Reset streamorder filter to show all
        showAllStreamOrderLevels();

        handleValleysDetail();
        return;
    }

    document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
        btn.classList.remove('active');
    });

    if (basin5Btn) {
        basin5Btn.classList.add('active');
        activeBasinButton = 'basin_5';
    }

    const keepGroups = {
        groups: ['gba', 'streamorder', 'allbasins', 'basinbg', 'valleyscategory']
    };

    setOpa('basinbg', 0.6);
    setOpa('valleyscategory', 0.3);
    const basin2View = {
        center: [78.416, 12.616],
        zoom: 6.3,
        pitch: 0,
        bearing: 0
    };

    smoothFlyTo(basin2View);

    panelHandle(keepGroups.groups);

    showStreamOrderByLevels([13, 12, 9, 7, 6, 4]);

    syncLegendToMapGroup('streamorder');
    createLineCallout(
        'river_marker_1',
        [79.794748, 11.774276],
        'Thazhangudha, Tamil Nadu',
        'Confluence point of Thenna Pennai'
    );
    createLineCallout(
        'river_marker_2',
        [79.828159, 11.364984],
        'Kodiyampalayam, Tamil Nadu',
        'Confluence point of Kaveri-Kollidam River'
    );

    console.log('✅ Basin 5 complete');
}

//#endregion

//#endregion

//#region Valley buttons
//#region Valley buttons
function highlightBasin(basinName, buttonId) {
    const clickedButton = document.getElementById(buttonId);
    const infoDiv = document.getElementById('info');

    if (!clickedButton) {
        console.warn(`Button with ID "${buttonId}" not found`);
        return;
    }

    // If same button clicked again → reset everything
    if (basinHighlight === basinName) {
        // Reset streamorder filter
        map.setFilter('streamorder', null);
        map.setFilter('streamorder-arrows', null);
        // Reset valley filter
        map.setFilter('valleys category', null);

        // Clear highlight state
        basinHighlight = null;

        // Remove active class from all buttons
        document.querySelectorAll('#panel sl-button').forEach(btn => btn.classList.remove('active'));

        // Reset info panel
        infoDiv.innerHTML = '<p>Select a basin to view its details.</p>';

        return;
    }

    // New basin selected
    basinHighlight = basinName;

    // Filter streamorder by basin
    map.setFilter('streamorder', ['==', ['get', 'name'], basinName]);
    map.setFilter('streamorder-arrows', ['==', ['get', 'name'], basinName]);

    // Filter valleys based on basin
    let valleyFilter;
    let basinText = '';

    if (basinName === 'Ponnaiyar Basin') {
        // Show Hebbal Nagawara and Koramangala Challaghatta valleys
        valleyFilter = [
            'in',
            ['get', 'valley'],
            ['literal', ['Hebbal Nagawara Valley', 'Koramangala Challaghatta Valley']]
        ];
        basinText = `On the east are the Hebbal Nagawara Valley and Koramangala Challaghatta Valley.
        <br><br> They drain into the Dakshina Pinakini River, in the <span style="color: #39d4f3;">Ponnaiyar Basin</span>.`;
    } else if (basinName === 'Cauvery Basin') {
        // Show Arkavathi, Vrishabhavati and Suvarnamukhi valleys
        valleyFilter = [
            'in',
            ['get', 'valley'],
            ['literal', ['Arkavathi Valley', 'Vrishabhavati Valley', 'Suvarnamukhi Valley']]
        ];
        basinText = `On the west are the Arkavathi, Vrishabhavati and Suvarnamukhi Valleys.
        <br><br> They drain into the <span style="color: #c2f476;">Cauvery Basin</span>. 
        <br><br>The Arkavathi Valley drains into the Arkavathi River and the Vrishabhavati and Suvarnamukhi Valleys drain into the Vrishabhavati River.`;
    }

    // Apply valley filter
    if (valleyFilter) {
        map.setFilter('valleys category', valleyFilter);
    }

    // Update button states - remove active from all, then add to clicked
    document.querySelectorAll('#panel sl-button').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');

    // Get the source data of the filtered basin
    const features = map.querySourceFeatures('composite', {
        sourceLayer: 'streamorder_singlepart-1s5w0x',

        filter: ['==', ['get', 'name'], basinName]
    });

    if (!features.length) {
        infoDiv.innerHTML = `<p>No data found for <b>${basinName}</b>.</p>`;
        return;
    }

    // Compute area using Turf.js
    const feature = features[0];
    const areaSqMeters = turf.area(feature);
    const areaSqKm = (areaSqMeters / 1_000_000).toFixed(2);

    // Update the info panel with custom text
    infoDiv.innerHTML = `
        <p>${basinText}</p>
    `;
}

//#endregion

//#endregion

//#region main

map.on('load', () => {
    smoothFlyTo(defaultViewBounds);
    setOpa('wards', 0.5);
    console.log('✅ Map loaded!');

    //add layers not in the style
    addLayers();
    addTypLayers();
    addBoundaryLayers();
    addGreens();
    console.log('✅ Layers added!');

    storeOriginalLayerProperties();
    console.log('✅ Properties stored!');

    // Hide them safely (only if they exist)
    hideLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
        } else {
            console.log(`⚠️ Layer not found on load: ${layerId}`);
        }
    });
    console.log('✅ Layers hidden!');

    //Force zoom levels for layers
    if (map.getLayer('primary-drains')) {
        map.setLayerZoomRange('primary-drains', 0, 24);
    }
    if (map.getLayer('Lakes')) {
        map.setLayerZoomRange('Lakes', 0, 24);
    }
    if (map.getLayer('Lakes_lost')) {
        map.setLayerZoomRange('Lakes_lost', 0, 24);
    }
    if (map.getLayer('streamorder')) {
        map.setLayerZoomRange('streamorder', 0, 24);
    }

    if (map.getLayer('1790-boundary')) {
        map.setLayerZoomRange('1790-boundary', 0, 24);
    }
    if (map.getLayer('typ_analysis')) {
        map.setLayerZoomRange('typ_analysis', 0, 24);
    }
    console.log('✅ Zoom range set!');

    if (map.getLayer('road-secondary-tertiary')) {
        map.setLayerZoomRange('road-secondary-tertiary', 12, 18);
        console.log('✅ Set zoom range for road-primary-secondary (10–18)');
    }

    generateLegend();
    console.log('✅ Legend generated!');

    setupInteraction();
    console.log('✅ setupInteraction completed!');

    // Add this debug temporarily
    map.once('idle', () => {
        const lostLayer = map.getLayer('Lakes_lost');
        const lostFeatures = map.querySourceFeatures(lostLayer.source, {
            sourceLayer: lostLayer['source-layer']
        });
    });

    // Add this after your filter initialization in map.on('load')
    setTimeout(() => {
        initializeLakeFilters();
        initializeDrainFilters();
        initializeTypologyFilters();
        lostTankIdentifierFilterControl = initializeLostTankIdentifierFilters();

        // 🔥 Handle ALL reset buttons with class 'reset_button'
        const filterresetButton = document.getElementById('filterandfind_reset');

        if (filterresetButton) {
            filterresetButton.addEventListener('click', () => {
                resetAllFilters();
            });
        }

        // Typology reset button
        const typologyResetButton = document.getElementById('typology_reset');
        if (typologyResetButton) {
            typologyResetButton.addEventListener('click', () => {
                console.log('🔄 Typology reset clicked');
                if (typologyTypeFilterControl) {
                    typologyTypeFilterControl.reset();
                }
            });
        }

        // Download button handlers
        const downloadCsvBtn = document.getElementById('download-csv');
        if (downloadCsvBtn) {
            downloadCsvBtn.addEventListener('click', e => {
                e.preventDefault(); // Prevent page refresh
                downloadAsCSV();
            });
        }
    }, 1000);

    watershedListener();

    addScreenshotButtonToMap();
});

//#endregion

//#region eventListeners

//#region Valley Buttons

// Add event listener for valley view toggle
const valleyToggle = document.getElementById('valley-view-toggle');
if (valleyToggle) {
    valleyToggle.addEventListener('change', e => {
        const isRegional = e.target.checked;
        toggleValleyView(isRegional);
    });
}

document.getElementById('p_basin').addEventListener('click', () => highlightBasin('Ponnaiyar Basin', 'p_basin'));
document.getElementById('c_basin').addEventListener('click', () => highlightBasin('Cauvery Basin', 'c_basin'));
//document.getElementById('a_valley').addEventListener('click', () => highlightValleyByName('Arkavathi Valley', 'a_valley'));
//document.getElementById('v_valley').addEventListener('click', () => highlightValleyByName('Vrishabhavati Valley', 'v_valley'));
//document.getElementById('s_valley').addEventListener('click', () => highlightValleyByName('Suvarnamukhi Valley', 's_valley'));
//#endregion

//#region Lakes timeline buttons
// Replace your Lakes timeline buttons event listeners section with this:
// Replace your Lakes timeline buttons event listeners section with this:
let activeButton = null;

const lakes1700Btn = document.getElementById('lakes_trace_1700');
const lakes1800Btn = document.getElementById('lakes_trace_1800');
const lakes1900Btn = document.getElementById('lakes_trace_1900');
const lakes2000Btn = document.getElementById('lakes_trace_2000');
const lakesTraceContainer = document.getElementById('lakes_trace_container');

// Helper function to clear all active states
function clearActiveButtons() {
    if (lakes1700Btn) lakes1700Btn.classList.remove('active');
    if (lakes1800Btn) lakes1800Btn.classList.remove('active');
    if (lakes1900Btn) lakes1900Btn.classList.remove('active');
    if (lakes2000Btn) lakes2000Btn.classList.remove('active');
    activeButton = null;
}

// 1700s button handler
if (lakes1700Btn) {
    lakes1700Btn.addEventListener('click', e => {
        e.stopPropagation(); // Prevent click from bubbling
        if (activeButton === 'lakes1700') {
            clearActiveButtons();
            handlelakesDetail();
        } else {
            clearActiveButtons();
            lakes1700Btn.classList.add('active');
            activeButton = 'lakes1700';
            lakes1700();
        }
    });
}

// 1800s button handler
if (lakes1800Btn) {
    lakes1800Btn.addEventListener('click', e => {
        e.stopPropagation(); // Prevent click from bubbling
        if (activeButton === 'lakes1800') {
            clearActiveButtons();
            handlelakesDetail();
        } else {
            clearActiveButtons();
            lakes1800Btn.classList.add('active');
            activeButton = 'lakes1800';
            lakes1800();
        }
    });
}

// 1900s button handlerk
if (lakes1900Btn) {
    lakes1900Btn.addEventListener('click', e => {
        e.stopPropagation(); // Prevent click from bubbling
        if (activeButton === 'lakes1900') {
            clearActiveButtons();
            handlelakesDetail();
        } else {
            clearActiveButtons();
            lakes1900Btn.classList.add('active');
            activeButton = 'lakes1900';
            lakes1900();
        }
    });
}

// 2000s button handler
if (lakes2000Btn) {
    lakes2000Btn.addEventListener('click', e => {
        e.stopPropagation(); // Prevent click from bubbling
        if (activeButton === 'lakes2000') {
            clearActiveButtons();
            handlelakesDetail();
        } else {
            clearActiveButtons();
            lakes2000Btn.classList.add('active');
            activeButton = 'lakes2000';
            lakes2000();
        }
    });
}

// Click outside timeline to reset
//#endregion

//#region Panel Listener

// Store reference to other panel details
const allPanelDetails = document.querySelectorAll('#panel sl-details');
const typologyDetail = document.getElementById('typology-detail');
const resetButton = document.getElementById('reset');

// Track visibility state of all panels
const panelVisibilityState = {};

// Update the panel listener to handle typology fullscreen
document.querySelectorAll('#panel sl-details').forEach(detail => {
    detail.addEventListener('sl-show', () => {
        const selectedId = detail.id;

        // Close all other details
        document.querySelectorAll('#panel sl-details').forEach(d => {
            if (d !== detail) d.open = false;
        });

        removeAllCallouts();

        // Stop timelines when switching panels
        if (isBasinPlaying) {
            stopBasinTimeline();
        }
        if (isLakesPlaying) {
            stopLakesTimeline();
        }

        // If typology panel is opened
        if (selectedId === 'typology-detail') {
            // Hide all other panels
            allPanelDetails.forEach(d => {
                if (d !== typologyDetail) {
                    d.style.display = 'none';
                }
            });
            // Keep reset button visible
            if (resetButton) {
                resetButton.style.display = 'block';
            }
            handleTypologyDetail();
            return;
        }

        // For all other panels, make sure they're visible
        allPanelDetails.forEach(d => {
            d.style.display = 'block';
        });
        if (resetButton) {
            resetButton.style.display = 'block';
        }

        // === Custom setups for other panels ===
        if (selectedId === 'dem-detail') {
            handleDEMDetail();
            return;
        }

        if (selectedId === 'valleys-detail') {
            handleValleysDetail();
            return;
        }

        if (selectedId === 'lakes-detail') {
            handlelakesDetail();
            return;
        }

        if (selectedId === 'drains-detail') {
            handlePrimaryDetail();
            return;
        }

        if (selectedId === 'secondary-drains-detail') {
            handleSecondaryDetail();
            return;
        }

        if (selectedId === 'filterandfind-detail') {
            handlefilterDetail();
            return;
        }
    });
});

// Listen for typology panel close
if (typologyDetail) {
    typologyDetail.addEventListener('sl-hide', () => {
        // Show all other panels again
        allPanelDetails.forEach(d => {
            if (d !== typologyDetail) {
                d.style.display = 'block';
            }
        });
        // Clear typology data
        window.typologyPanelActive = false;
        window.typologyPopupsActive = false;
        clearTypologyMarkers();
    });
}

// 🔥 NEW: Listen for valleys panel HIDE to reset basin state
const valleysDetail = document.getElementById('valleys-detail');
if (valleysDetail) {
    valleysDetail.addEventListener('sl-hide', () => {
        // Only reset if basin timeline was playing
        stopBasinTimeline();
    });
}

const resetMapbutton = document.getElementById('panel_reset');
resetMapbutton.addEventListener('click', () => {
    resetMap();
});

//#endregion

//#region Watershed Listener

function watershedListener() {
    const basin1Btn = document.getElementById('basin_1');
    const basin2Btn = document.getElementById('basin_2');
    const basin3Btn = document.getElementById('basin_3');
    const basin4Btn = document.getElementById('basin_4');
    const basin5Btn = document.getElementById('basin_5');

    if (basin1Btn) {
        basin1Btn.addEventListener('click', e => {
            e.stopPropagation();
            basin1();
        });
    }
    if (basin2Btn) {
        basin2Btn.addEventListener('click', e => {
            e.stopPropagation();
            basin2();
        });
    }
    if (basin3Btn) {
        basin3Btn.addEventListener('click', e => {
            e.stopPropagation();
            basin3();
        });
    }
    if (basin4Btn) {
        basin4Btn.addEventListener('click', e => {
            e.stopPropagation();
            basin4();
        });
    }
    if (basin5Btn) {
        basin5Btn.addEventListener('click', e => {
            e.stopPropagation();
            basin5();
        });
    } else {
        console.warn('⚠️ Basin 1 button NOT found');
    }
}

document.addEventListener('click', e => {
    // Check if valleys-detail panel is open
    const valleysDetail = document.getElementById('valleys-detail');
    if (!valleysDetail || !valleysDetail.open) {
        return; // Don't reset if panel is closed
    }

    const basinContainer = document.getElementById('basin_container');

    // Check if click is outside the basin container
    if (basinContainer && !basinContainer.contains(e.target)) {
        // Only reset if there's an active button
        if (activeBasinButton) {
            // Remove active class from all basin buttons
            document.querySelectorAll('#basin_container .timeline-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Reset active button tracker
            activeBasinButton = null;

            // Reset streamorder filter to show all
            showAllStreamOrderLevels();

            // Call handleValleysDetail to reset
            handleValleysDetail();

            console.log('✅ Basin timeline reset by clicking outside');
        }
    }
});

// Basin timeline play button
const basinPlayButton = document.getElementById('basin-play-button');
if (basinPlayButton) {
    basinPlayButton.addEventListener('click', e => {
        e.stopPropagation();
        playBasinTimeline();
    });
}

// Lakes timeline play button
const lakesPlayButton = document.getElementById('lakes-play-button');
if (lakesPlayButton) {
    lakesPlayButton.addEventListener('click', e => {
        e.stopPropagation();
        playLakesTimeline();
    });
}

//#endregion

// Filter secondary by primary button
const filterSecByPriBtn = document.getElementById('filter-secondary-by-primary');
if (filterSecByPriBtn) {
    filterSecByPriBtn.addEventListener('click', () => {
        console.log('Filter Secondary by Primary clicked!');
        filterSecondaryByPrimaryDrains();
    });
}

const typologyresetBtn = document.querySelector('.typology-reset');

if (typologyresetBtn) {
    typologyresetBtn.addEventListener('click', () => {
        resetAllFilters();
        resetTypologyPanel();
    });
}

//#region Download Table
async function populateDownloadTable() {
    const tableBody = document.getElementById('download-table-body');
    if (!tableBody) return;

    try {
        // Fetch the Excel file
        const response = await fetch('downloadcentre.xlsx');
        const arrayBuffer = await response.arrayBuffer();

        // Parse the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log('📊 Download Centre Data:', data);

        tableBody.innerHTML = '';

        // Populate table with data from Excel
        data.forEach(row => {
            const tr = document.createElement('tr');

            // Layer Name
            const nameCell = document.createElement('td');
            nameCell.textContent = row.Layer || row.layer || row.Name || row.name || '';
            tr.appendChild(nameCell);

            // Source
            const sourceCell = document.createElement('td');
            sourceCell.textContent = row.Source || row.source || '';
            tr.appendChild(sourceCell);

            // Download Link
            const linkCell = document.createElement('td');
            const downloadLink = document.createElement('a');
            const url = row.Link || row.link || row.URL || row.url || row['Download Link'] || row['download link'] || '';
            const layerName = nameCell.textContent;
            const sourceName = sourceCell.textContent;

            // Create filename: layername_source.geojson
            const fileName = `${layerName.replace(/\s+/g, '_')}_${sourceName.replace(/\s+/g, '_')}.geojson`;

            downloadLink.href = url;
            downloadLink.download = fileName;
            downloadLink.className = 'download-icon';
            downloadLink.innerHTML = '⬇';
            downloadLink.title = `Download ${layerName}`;
            linkCell.appendChild(downloadLink);
            tr.appendChild(linkCell);

            tableBody.appendChild(tr);
        });

        console.log('✅ Download table populated successfully');

    } catch (error) {
        console.error('❌ Error loading download centre data:', error);
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error loading download data</td></tr>';
    }
}

// Populate download table on load
map.on('load', () => {
    populateDownloadTable();
});
//#endregion

//#endregion
