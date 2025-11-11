//#region config

    //#region layerConfig

        // 🧱 Single source of truth for all layers and groups
        const layerConfig = {
            'primarydrains': {
                label: 'Primary Drains',
                layers: ['primary-drains', 'primary-drains-interaction', 'Halo']
            },

            'secondarydrains': {
                label: 'Secondary Drains',
                layers: ['secondary-drains', 'secondary-drains-interaction', 'Secondary Drains Halo']
            },

            'tanks': {
                label: 'All Tanks',
                layers: ['Lakes', 'Lakes_lost_1900', 'Lakes_lost_1800', 'Lakes_existing_overlap']
            },

            'tanks1800':{
                label: 'Tanks 1800',
                layers: ['Lakes_lost_1800_button','lakes_existing_1800','1870-boundary']
            },

            'tanks1900':{
                label: 'Tanks 1900',
                layers: ['Lakes_lost_1900_button','lakes_existing_1900','1968-boundary','Lakes_lost_1800_1900']
            },

            'existingtanks':{
                label: 'Existing Tanks',
                layers: ['tanks_existing','Lakes_lost_1900_2000']
            },
            
            'valleys': {
                label: 'Valleys',
                layers: ['valleys', 'valleys-label']
            },

            'valleyscategory': {
                label: 'Valley Categories',
                layers: ['valleys category']
            },

            'ridge': {
            label: 'Ridge Line',
            layers: ['Ridge']
            },

            'streamorder': {
            label: 'Stream Order',
            layers: ['streamorder', 'streamorder-arrows', 'river-label']
            },

            'dem': {
                label: 'DEM',
                layers: ['dem']
            },

            'hillshade': {
                label: 'Hillshade',
                layers: ['hillshade']
            },
            
            'placelabels': {
                label: 'Place Labels',
                layers: ['settlement-minor-label', 'settlement-subdivision-label']
            },

            'bbmp':{
                label: 'BBMP Boundary',
                layers: ['bbmp']
            },

            'roads':{
                label: 'Roads',
                layers: ['road-label','road-motorway-trunk','road-primary','road-secondary-tertiary']
            },

            'bg':{
                label: 'background',
                layers: ['background', 'satellite']
            },

            'typologyanalysis':{
                label: 'typologies',
                layers: ['typ_analysis']
            },

            'previousboundaries':{
                label: 'Old Boundaries',
                layers: ['year-boundaries']
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
        const groupMapping = Object.fromEntries(
        Object.entries(layerConfig).map(([key, value]) => [key, value.layers])
        );


    //#endregion

    //#region viewPresets

        const defaultView = {
            center: [77.616, 12.986],
            zoom: 11,
            pitch: 0,
            bearing: 0
        };
        
        const dem3DView = {
            center: [77.650, 12.950],
            zoom: 11,
            pitch: 45,   // tilt for 3D
            bearing: -45 // rotate if you like
        };

        const valleyView = {
            center: [77.616, 12.986],
            zoom: 10.5,
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
            groups: ['valleyscategory', 'streamorder', 'ridge','tanks1800','tanks1900','typologyanalysis','existingtanks'],
        });

        const alwaysVisible = resolveLayers(
            { groups: ['bg', 'bbmp']}
        );

        let currentHighlight = null;

        let activePopup = null;

        let activeCallouts = {};

        let valleyHighlight = null;

        
        // Typology code to label mapping
        const typologyLabels = {
            't1': 'Road Adjacent with Footpath',
            't2': 'Road Adjacent without Footpath',
            't3': 'Road Adjacent Ring Road/ Highway',
            't4': 'Property Adjacent Abutting Buildings',
            't5': 'Property Adjacent with Setback',
            't6': 'Lake Adjacent with Pathway',
            't7': 'Lake Adjacent without Pathway',
            't8': 'Inside Private Property/ Campus',
            't9': 'Railway Adjacent',
            't10': 'Open Space (Parks, Playgrounds, etc) Adjacent',
            't11': 'Agricultural Land Adjacent',
            't12': 'Vacant Land Adjacent'
        };



        
  
      

        
    
    
    //#endregion

//#endregion

//#region Components

    //#region mapsetup

        //api
        mapboxgl.accessToken = 'pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A';

        //map container
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mod-foundation/cmgt3nndf00h101sd83sj4g7x',
            center: [77.616, 12.986],
            zoom: 11
        });

        //close legend on page load
        const details = document.querySelector('sl-details');
        details.open = false;
        
        
    //#endregion
    
    //#region legend
        
        // Generate legend from layerConfig
        function generateLegend() {
            const layerList = document.getElementById('legend-list');
            
            // Exclude 'bg' group from legend since background layers can't have opacity
            const groupsToShow = allGroups.filter(group => group !== 'bg');
            
            
            groupsToShow.forEach(groupKey => {
                const groupConfig = layerConfig[groupKey];
                const layers = groupConfig.layers;
                
                
                // Find the first actual layer that exists in the map
                const firstLayer = layers.find(id => map.getLayer(id));
                
                if (!firstLayer) {
                    return;
                }
                
                
                // Check if the first layer is currently visible
                const isVisible = map.getLayoutProperty(firstLayer, 'visibility') !== 'none';
                
                // Create layer item container
                const layerItem = document.createElement('div');
                layerItem.className = 'group-control';
                
                // Create checkbox and add to layer item
                const checkbox = createCheckbox(groupKey, groupConfig, layers, isVisible);
                layerItem.appendChild(checkbox);
                
                // Create slider and add to layer item
                const slider = createOpacitySlider(groupKey, firstLayer, layers, isVisible);
                layerItem.appendChild(slider);
                
                // Add entire layer item to the legend container
                layerList.appendChild(layerItem);
                
                // Setup event listeners
                setupCheckboxEvents(checkbox, slider, groupKey);
                setupSliderEvents(slider, groupKey);
            });
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
                currentOpacity = (paintValue !== undefined && paintValue !== null) ? paintValue : 1;
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
            return [
            ...config.groups?.flatMap(groupKey => groupMapping[groupKey] || []) || [],
            ...config.layers || []
            ];
        }

        // Helper function: Get the correct opacity property name based on layer type
        function getOpacityProperty(layerId) {
            // Get the layer object from the map
            const layer = map.getLayer(layerId);
            // Return null if layer not found
            if (!layer) {
            console.warn(`⚠️ Layer not found: ${layerId}`);
            return null;  // ← FIX: Return null instead of console.log
            }

            // Map each layer type to its opacity property name
            const opacityMap = {
            'line': 'line-opacity',
            'fill': 'fill-opacity',
            'circle': 'circle-opacity',
            'raster': 'raster-opacity',
            'fill-extrusion': 'fill-extrusion-opacity',
            'symbol': 'text-opacity'
            };

            // Return the opacity property for this layer type, default to fill-opacity
            return opacityMap[layer.type] || 'fill-opacity';
        }

    //#endregion
    
    //#region Interactive Helpers
        // Highlight selected feature
            // Highlight selected feature - FIXED to highlight entire feature
        function highlightFeature(feature) {
            clearHighlight();
            
            const layerId = feature.layer.id;
            const sourceLayer = feature.layer['source-layer'];
            const featureId = feature.id;
            
            // Create filter for this specific feature by ID
            const filter = ['==', ['id'], featureId];
            
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
                map.addLayer({
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
                }, layerId);
            }
            
            currentHighlight = 'feature-highlight';
        }
        
            // Clear highlight
            function clearHighlight() {
                if (currentHighlight && map.getLayer(currentHighlight)) {
                    map.removeLayer(currentHighlight);
                    currentHighlight = null;
                }
            }
        
            // Helpers
            function getType(id) {
                if (id.includes('primary')) return 'Primary Drain';
                if (id.includes('secondary')) return 'Secondary Drain';
                if (id.includes('overlap')) return 'Lost Tank Outline';
                if (id === 'Lakes') return 'Existing Tank';
                if (id === 'Lakes_lost_1900') return 'Lost Tank (1969)';
                if (id === 'Lakes_lost_1800') return 'Lost Tank (1880s)';
                if (id === 'Lakes_lost_1800_button') return 'Lost Tank';
                if (id === 'Lakes_lost_1900_button') return 'Lost Tank';
                if (id === 'lakes_existing_1800') return 'Existing Tank';
                if (id === 'lakes_existing_1900') return 'Existing Tank';
                if (id === 'tanks_existing') return 'Existing Tank';
                if (id === 'typ_analysis') return 'Typology';
                return 'Feature';
            }
        
            function getColor(id) {
                if (id.includes('primary')) return '#4e4cf0';
                if (id.includes('secondary')) return '#00aaff';
                if (id.includes('overlap')) return '#cb5151';
                if (id === 'Lakes') return '#4e4cf0';
                if (id === 'Lakes_lost_1900') return '#ae2e2e';
                if (id === 'Lakes_lost_1800') return '#8e3838';
                if (id === 'Lakes_lost_1800_button') return '#0085eb';
                if (id === 'Lakes_lost_1900_button') return '#0056eb';
                if (id === 'lakes_existing_1800') return '#0085eb';
                if (id === 'lakes_existing_1900') return '#0056eb';
                if (id === 'tanks_existing') return '#4e4cf0';
                if (id === 'typ_analysis') return '#FF69B4';
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

        // Handle click anywhere on map when typology layer is active
        function handleTypologyMapClick(lngLat) {
            map.on('click', (e) => {
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
                
                console.log(`📍 Click point: ${lngLat.lng}, ${lngLat.lat}`);
                console.log(`📊 Searching through ${allFeatures.length} features`);
                
                // Group features by drain_id
                const byDrainId = {};
                allFeatures.forEach(f => {
                    const drainId = f.properties.drain_id;
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
                        console.log(`Drain ${drainId}: LHS dist=${pair.lhs.distance.toFixed(4)}km, RHS dist=${pair.rhs.distance.toFixed(4)}km, Total=${totalDistance.toFixed(4)}km`);
                        
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
        }

        // Display both LHS and RHS features as custom popups
        function displayTypologyPair(lhsFeature, rhsFeature) {
            const lhsProps = lhsFeature.properties;
            const rhsProps = rhsFeature.properties;
            
            const lhsValue = lhsProps.typ || 'N/A';
            const rhsValue = rhsProps.typ || 'N/A';
            const drainId = lhsProps.drain_id || 'N/A';
            
            const lhsColor = getTypologyColor(lhsValue);
            const rhsColor = getTypologyColor(rhsValue);
            
            const clickPoint = turf.point([window.lastTypologyClickLngLat.lng, window.lastTypologyClickLngLat.lat]);
            
            // Find closest point on LHS line to click
            const lhsLine = turf.lineString(lhsFeature.geometry.coordinates);
            const lhsClosestPoint = turf.nearestPointOnLine(lhsLine, clickPoint);
            
            // Find closest point on RHS line to click
            const rhsLine = turf.lineString(rhsFeature.geometry.coordinates);
            const rhsClosestPoint = turf.nearestPointOnLine(rhsLine, clickPoint);
            
            // Extract image URLs from img attribute
            const lhsImgHtml = lhsProps.img ? extractImageUrl(lhsProps.img) : '';
            const rhsImgHtml = rhsProps.img ? extractImageUrl(rhsProps.img) : '';
            
            // Close existing popups
            if (window.typologyPopups) {
                window.typologyPopups.forEach(popup => popup.remove());
            }
            
            // Mark that typology popups are active
            window.typologyPopupsActive = true;
            
            // Create LHS popup
            const lhsHtml = `<div style="background-color: white; color: ${lhsColor}; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap;">LHS: ${lhsValue}</div>${lhsImgHtml}`;
            
            const lhsPopup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                anchor: 'right'
            })
            .setLngLat(lhsClosestPoint.geometry.coordinates)
            .setHTML(lhsHtml)
            .addTo(map);
            
            // Create RHS popup
            const rhsHtml = `<div style="background-color: white; color: ${rhsColor}; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap;">RHS: ${rhsValue}</div>${rhsImgHtml}`;
            
            const rhsPopup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                anchor: 'left'
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

    function countFeaturesInLayer(layerId) {
        
        const count = map.queryRenderedFeatures({ layers: [layerId] }).length
        return count;
    }

    // Function to update the lakes counter display
    function updateLakesCounter(existingCount, lostCount, showLost = true) {
        const existingElement = document.querySelector('#existing_lakes #count');
        const lostElement = document.querySelector('#lost_lakes #count');
        const totalElement = document.querySelector('#existing_lakes:last-child #count');
        
        if (existingElement) {
            existingElement.textContent = existingCount;
        }
        
        if (lostElement) {
            if (showLost && lostCount !== null) {
                lostElement.textContent = lostCount;
            } else {
                lostElement.textContent = '—';
            }
        }
        
        if (totalElement) {
            const total = showLost && lostCount !== null ? existingCount + lostCount : existingCount;
            totalElement.textContent = total;
        }
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
              
                console.log(`🕳️ Fading and hiding ${layerId}`);
              
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
              
                  console.log(`🚫 ${layerId} visibility now set to 'none'`);
              
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

        function smoothFlyTo(view) {
            map.flyTo({ ...view, duration: 3000, essential: true, easing: t => 1 - Math.pow(1 - t, 3) });
            }
            
        function toggleValleyView(showRegional) {
            if (showRegional) {
              // Regional view - zoom out to 9
              map.flyTo({
                center: [78.5, 12.5],
                zoom: 8.2,
                pitch: 0,
                bearing: 0,
                duration: 2000,
                essential: true,
                easing: t => 1 - Math.pow(1 - t, 3)
              });
            } else {
              // Local view - return to valley view
              smoothFlyTo(valleyView);
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
                const targetOpacity = checkbox.checked ? (slider.value / 100) : 0;
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
                const groupKey = Object.keys(layerConfig).find(key =>
                    layerConfig[key].layers.includes(layerId)
                );
            
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
            
                // --- 4️⃣ Compute average opacity across visible layers ---
                const opacities = existingLayers.map(id => {
                    const prop = getOpacityProperty(id);
                    return map.getPaintProperty(id, prop) ?? 1;
                });
                const avgOpacity =
                    opacities.reduce((a, b) => a + b, 0) / opacities.length;
            
                // --- 5️⃣ Sync the group’s legend UI ---
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
        
            // 2️⃣ Unified click handler for all interactive layers
            const interactiveLayers = [
                'primary-drains-interaction', 
                'secondary-drains-interaction',
                'Lakes', 'tanks_existing', 'Lakes_lost_1900', 'Lakes_lost_1800',  // Changed 'existingtanks' to 'tanks_existing'
                'Lakes_existing_overlap', 'Lakes_existing_overlap-interaction',
                'lakes_existing_1800','lakes_existing_1900','Lakes_lost_1800_button','Lakes_lost_1900_button'
            ];
        
            map.on('click', (e) => {
                console.log('📍 Map clicked');
                
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
                        sourceLayer: 'typ_analysis-6bvc7g'
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
                            const drainId = f.properties.drain_id;
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
                        }
                        return;
                    }
                    
                    // NO FEATURES IN BUFFER - Fall through to regular layer clicks (except primary drains)
                    console.log('❌ No typology features in buffer, checking other layers...');
                }
            
                // Handle normal layer interactions (or typology panel open but outside buffer)
                console.log('🔍 Querying features for other layers...');
                
               
                
                const features = map.queryRenderedFeatures(e.point, { 
                    layers: interactiveLayers.filter(l => map.getLayer(l))
                });
            
                console.log('Features found:', features.length);
                
                if (!features.length) {
                    console.log('❌ No features found');
                    return;
                }
            
                // Check if the clicked layer is visible
                const visibleFeatures = features.filter(f => {
                    const baseLayerId = f.layer.id.replace('-interaction', '');
                    const visibility = map.getLayoutProperty(baseLayerId, 'visibility');
                    
                    // If typology panel is open, exclude primary drains
                    if (typologyPanelOpen && (baseLayerId.includes('primary-drains') || f.layer.id.includes('primary-drains'))) {
                        return false;
                    }
                    
                    return visibility === 'visible' || visibility === undefined;
                });
            
                console.log('Visible features:', visibleFeatures.length);
                
                if (!visibleFeatures.length) {
                    console.log('❌ No visible features');
                    return;
                }
            
                console.log('✅ Showing popup for feature:', visibleFeatures[0].layer.id);
                
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

//#endregion



//#region data

        //#region layerData

            function addLayers() {
                // Add Lakes_lost GeoJSON source and layer
                map.addSource('lakes-lost-source', {
                    type: 'vector',
                    url: 'mapbox://mod-foundation.69i6a0ab'
                    });

                //1870 and 1897 Lakes
                map.addLayer({
                    id: 'Lakes_lost_1800',
                    type: 'fill',
                    source: 'lakes-lost-source',
                    'source-layer': 'Lakes_lost-dyhg67',
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
                    source: 'lakes-lost-source',
                    'source-layer': 'Lakes_lost-dyhg67',
                    slot: 'top',
                    filter: ['==', ['get', 'year'], '1969'], // Only show 1969
                    paint: {
                        'fill-color': '#ae2e2e',  // Orange/red for 1969
                        'fill-opacity': 0.7
                    }
                    });
            
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
                        '1969', '#cb5151',  // Orange for 1969
                        '1870', '#ae2e2e',  // Red for 1870
                        '1897', '#ae2e2e',  // Red for 1897
                        '#999999'         // Default gray for other years
                    ], // Red color for lost lakes
                        'line-opacity': 1,
                        'line-width': [
                        'interpolate',
                        ['linear'], // You can also use 'exponential' with a base
                        ['zoom'],
                        // Define line-width at different zoom levels
                        // [zoom_level, line_width_in_pixels]
                        5, 1,   // At zoom 5, line-width is 1 pixel
                        10, 1,  // At zoom 10, line-width is 3 pixels
                        15, 3,  // At zoom 15, line-width is 6 pixels
                        20, 3  // At zoom 20, line-width is 10 pixels
                    ],
                        'line-dasharray': [2, 1] 
                    }
                });

                //for Lake Buttons
                map.addLayer({
                    id: 'lakes_existing_1800',
                    type: 'fill',
                    source: 'lakes-existing-overlap',
                    'source-layer': 'Lakes_existing_overlap-0n1e1w',
                    filter: ['in', ['get', 'year'], ['literal', ['1870', '1897']]],
                    paint: {
                        'fill-color': '#0085eb',  // Red for 1870/1897
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
                        'fill-color': '#0056eb',  // Red for 1870/1897
                        'fill-opacity': 0.5
                    }
                });

                
                map.addLayer({
                    id: 'Lakes_lost_1800_button',
                    type: 'fill',
                    source: 'lakes-lost-source',
                    'source-layer': 'Lakes_lost-dyhg67',
                    filter: ['in', ['get', 'year'], ['literal', ['1854','1870', '1897']]], // Only show 1870 and 1897
                    paint: {
                        'fill-color': '#0085eb',  // Red for 1870/1897
                        'fill-opacity': 0.5
                    }
                });
            
                map.addLayer({
                    id: 'Lakes_lost_1900_button',
                    type: 'fill',
                    source: 'lakes-lost-source',
                    'source-layer': 'Lakes_lost-dyhg67',
                    slot: 'top',
                    filter: ['==', ['get', 'year'], '1969'], // Only show 1969
                    paint: {
                        'fill-color': '#0056eb',  // Orange/red for 1969
                        'fill-opacity': 0.5
                    }
                    });
                
                //existing lakes duplicate
                map.addSource('lakes-existing-source', {
                    type: 'vector',
                    url: 'mapbox://mod-foundation.a2ggkxvb'
                    });

                map.addLayer({
                    id: 'tanks_existing',
                    type: 'fill',
                    source: 'lakes-existing-source',
                    'source-layer': 'Lakes_existing-4p0f2n',
                    paint: {
                        'fill-color': '#4e4cf0', 
                        'fill-opacity': 0.7
                    }
                });

                //for count

                

                map.addLayer({
                    id: 'Lakes_lost_1800_1900',
                    type: 'fill',
                    source: 'lakes-lost-source',
                    'source-layer': 'Lakes_lost-dyhg67',
                    filter: [
                        'all',
                        ['in', 'year', '1870', '1897'], // Only 1870 & 1897
                        ['!=', 'Overlap', 1]            // Exclude overlap = 1
                    ],
                    paint: {
                        'fill-color': '#d54231',
                        'fill-opacity': 0.5
                    }
                });
                
                map.addLayer({
                    id: 'Lakes_lost_1900_2000',
                    type: 'fill',
                    source: 'lakes-lost-source',
                    'source-layer': 'Lakes_lost-dyhg67',
                    filter: [
                        'all',
                        ['!=', 'Overlap', 1]            // Exclude overlap = 1
                    ],
                    paint: {
                        'fill-color': '#d54231',
                        'fill-opacity': 0.5
                    }
                });

            }

            function addTypLayers(){

                // Add typology GeoJSON source and layer
                map.addSource('typ_source', {
                    type: 'vector',
                    url: 'mapbox://mod-foundation.5kzhy8uc'
                    });

                //styling
                map.addLayer({
                    id: 'typ_analysis',
                    type: 'line',
                    source: 'typ_source',
                    'source-layer': 'typ_analysis-6bvc7g',
                    paint: {
                    'line-color': [
                        'match',
                        ['get', 'typ'], // Get the Year property from each feature
                        't1', '#FF0000',  // REd 
                        't2', '#ff7900',  // Orange 
                        //'t3', '#3B8C1A',  // Orange for 1969
                        't4', '#b533b5',  // Purple
                        't5', '#4ed84e',  // green
                        //'t6', '#F1C40F',  // Orange for 1969
                        //'t7', '#7D3C98',  // Orange for 1969
                        //'t8', '#27AE60',  // Orange for 1969
                        //'t9', '#BA4A00',  // Orange for 1969
                        //'t10', '#A9CCE3',  // Orange for 1969
                        //'t11', '#2C3E50',  
                        't12', '#efc700', 
                        '#999999'
                    ], 
                        'line-opacity': 1,
                        'line-width': 4,
                }});



            }

            function addBoundaryLayers(){

                // Add Lakes_lost GeoJSON source and layer
                map.addSource('year-boundaries-source', {
                    type: 'vector',
                    url: 'mapbox://mod-foundation.21szwwtj'
                    });

                //1870 and 1897 Lakes
                map.addLayer({
                    id: '1870-boundary',
                    type: 'line',
                    source: 'year-boundaries-source',
                    'source-layer': 'boundaries-3hk1x7',
                    filter: ['in', ['get', 'Name'], ['literal', ['1870']]], // Only show 1870 and 1897
                    paint: {
                        'line-color': '#000000',  // Orange for 1969
                        'line-dasharray': [2, 1],
                        'line-width': 2,
                 } });

                 map.addLayer({
                    id: '1968-boundary',
                    type: 'line',
                    source: 'year-boundaries-source',
                    'source-layer': 'boundaries-3hk1x7',
                    filter: ['in', ['get', 'Name'], ['literal', ['1968']]], // Only show 1870 and 1897
                    paint: {
                        'line-color': '#000000',  // Orange for 1969
                        'line-dasharray': [2, 1],
                        'line-width': 2,
                 } });

            }
        //#endregion

//#endregion

//#region ui
        
    //#region mapcontrols

            // Add zoom controls
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
            // Add fullscreen control
            map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
            
            // Add scale control
            map.addControl(new mapboxgl.ScaleControl({
                maxWidth: 80,
                unit: 'metric'
            }), 'bottom-right');
            
            // Add geolocate control
            map.addControl(new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true
            }), 'top-right');
        
        //#endregion
 
    //#region interactive pop ups and selectors
        // Show selector for multiple features
        function showSelector(features, lngLat) {

            // Close any existing popup before opening a new one
            if (activePopup) {
                activePopup.remove();
                activePopup = null;
            }

            const items = features.map((f, i) => {
                window[`selectFeature${i}`] = () => {
                    showPopup(f, lngLat);
                    highlightFeature(f);
                };
                return `<div class="feature-option" style="border-left:6px solid ${getColor(f.layer.id)}" 
                            onclick="selectFeature${i}()">
                            <strong style="color:${getColor(f.layer.id)}">${getType(f.layer.id)}</strong><br>
                            ${f.properties.name || f.properties.NAME || 'Unnamed'}
                        </div>`;
            }).join('');

            // Create new popup and assign it to the global variable
            activePopup = new mapboxgl.Popup()
                .setLngLat(lngLat)
                .setHTML(`
                    <div class="feature-option-container">
                        <p class="feature-option-heading">Select feature:</p>
                        ${items}
                    </div>
                `)
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
            const isTank = ['Lakes', 'tanks_existing', 'Lakes_lost_1900', 'Lakes_lost_1800', 'Lakes_existing_overlap-interaction','Lakes_lost_1900_button', 'Lakes_lost_1800_button','lakes_existing_1800','lakes_existing_1900'].includes(feature.layer.id);
            
            let color = getColor(feature.layer.id);
            const type = getType(feature.layer.id);
            
            // Special handling for layers
            let contentHtml = '';
            
            if (isTank) {
                contentHtml = [
                    p.name && `<strong>Name:</strong> ${p.name}`,
                    p.year && `<strong>Traced from:</strong> ${p.year}`,
                    p.area_sqm && `<strong>Area (sqm):</strong> ${p.area_sqm}`,
                    p.perimeter_m && `<strong>Perimeter (m):</strong> ${p.perimeter_m}`,
                    p.ward_name_en && `<strong>Ward:</strong> ${p.ward_name_en}`
                ].filter(Boolean).join('<br>');
            } else {
                contentHtml = Object.entries(p).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br>');
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
            activePopup = new mapboxgl.Popup()
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
            const keepVisible = new Set();
        
            // ✅ Ensure input is an array of group keys
            const groupKeys = Array.isArray(keepGroups?.groups)
            ? keepGroups.groups
            : Array.isArray(keepGroups)
            ? keepGroups
            : [];
        
            // ✅ Turn ON all layers in groups to keep
            groupKeys.forEach(groupKey => {
            const group = layerConfig[groupKey];
            if (!group) return;
        
            keepVisible.add(groupKey);
        
            group.layers.forEach(layerId => {
                if (map.getLayer(layerId)) {
                const visibility = map.getLayoutProperty(layerId, 'visibility');
                if (visibility !== 'visible') {
                    toggleLayer(layerId, true);
                    syncLegendToMap(layerId);
                    console.log(`✅ Turned ON ${layerId} (group: ${groupKey})`);
                }
                }
            });
            });
        
            // 🚫 Turn OFF all other groups not in keepVisible
            Object.keys(layerConfig).forEach(groupKey => {
            if (keepVisible.has(groupKey)) return;
        
            const group = layerConfig[groupKey];
            if (!group) return;
        
            group.layers.forEach(layerId => {
                if (
                map.getLayer(layerId) &&
                !['background', 'satellite'].includes(layerId)
                ) {
                toggleLayerOff(layerId);
                syncLegendToMap(layerId);
                console.log(`🚫 Turned OFF ${layerId} (group: ${groupKey})`);
                }
            });
            });
        }
        

        function handleDEMDetail() {
            console.log("🏔 Handling DEM Detail");

            // Fly to DEM view
            smoothFlyTo(dem3DView);

            // Define groups/layers to stay visible or turn on
            const keepGroups = (
                { groups: ['dem', 'hillshade','ridge', ...alwaysVisible]}
            ); 
            
            panelHandle(keepGroups.groups);

            // 🎯 Fade DEM layers to full opacity
            setOpa('dem', 1);

            setOpa('hillshade', 1);

            // 🗺️ Sequential activation of DEM contextual layers
            setTimeout(() => {
            toggleGroup('valleys', true);
            syncLegendToMapGroup('valleys');
            createLineCallout('ridge', [77.58519, 12.97963], 'RIDGE LINE', 'Highest elevation area');
            }, 1000);

            setTimeout(() => {
            toggleGroup('streamorder', true);
            syncLegendToMapGroup('streamorder');
            }, 3000);

        }

        function handleValleysDetail() {
            // 1️⃣ Fly to the valley view
            smoothFlyTo(valleyView);

            // 2️⃣ Make DEM fully visible
            setOpa('dem', 1);
            setOpa('hillshade', 1);   

            // 3️⃣ Define groups that must stay visible
            const keepGroups = (
                { groups: ['dem', 'hillshade','ridge', 'valleys', 'streamorder', ...alwaysVisible]}
            );

            panelHandle(keepGroups.groups);

            if (map.getLayer('valleys-label')) {
                map.moveLayer('valleys-label');
            }
            // 7️⃣ (Optional) Turn on "valleys category" after short delay
            setTimeout(() => {
                toggleGroup('valleyscategory', true, 0.7);
                syncLegendToMapGroup('valleyscategory');
            }, 1000);
        }

        function handlelakesDetail() {
            console.log("🏔 Handling lakes Detail");
        
            // 1️⃣ Fly to the valley view
            smoothFlyTo(defaultView);
        
            // 2️⃣ Set DEM to 40% opacity
            
            setOpa('dem', 0.4);
            toggleLayerOff('hillshade');
            
        
            // Define groups/layers to stay visible or turn on
        
            const keepGroups = (
                { groups: ['dem', 'valleys', 'tanks', ...alwaysVisible]}
            ); 
            
            panelHandle(keepGroups.groups);
        
            setOpa('tanks', 0.9);
            
            // Reset counter to default values
            updateLakesCounter(175, 146, true);
        }

        function handlePrimaryDetail() {
            console.log("🏔 Handling Primary Detail");

            // 1️⃣ Fly to the valley view
            smoothFlyTo(defaultView);


            // 2️⃣ Make DEM fully visible
            setOpa('dem', 0.4);
            toggleLayerOff('hillshade');

            // Define groups/layers to stay visible or turn on
            const keepGroups = (
                { groups: ['dem', 'valleys', 'tanks', 'primarydrains', ...alwaysVisible]}
            ); 
            
            panelHandle(keepGroups.groups);

        }

        function handleSecondaryDetail() {
            console.log("🏔 Handling Secondary Detail");

            // 1️⃣ Fly to the valley view
            smoothFlyTo(defaultView);


            // 2️⃣ Make DEM fully visible
            setOpa('dem', 0.4);
            toggleLayerOff('hillshade');

            // Define groups/layers to stay visible or turn on
            const keepGroups = (
                { groups: ['dem', 'valleys', 'tanks', 'primarydrains', 'secondarydrains', ...alwaysVisible]}
            ); 
            
            panelHandle(keepGroups.groups);

        }

        function handleTypologyDetail() {
            console.log("🏔 Handling Typology Detail");
        
            // Mark typology as active
            window.typologyPanelActive = true;
            window.typologyPopupsActive = false;
        
            // 1️⃣ Fly to the default view
            smoothFlyTo(defaultView);
        
            // 2️⃣ Set DEM to 40% opacity
            setOpa('dem', 0.4);
            toggleLayerOff('hillshade');
        
            // Define groups/layers to stay visible or turn on
            const keepGroups = (
                { groups: ['dem', 'valleys', 'tanks', 'primarydrains', 'secondarydrains', 'roads', 'placelabels', 'typologyanalysis', ...alwaysVisible]}
            ); 
            
            panelHandle(keepGroups.groups);
        
            setOpa('roads', 0.5);
            
            // 4️⃣ Make sure the detail is open so content shows
            const detail = document.getElementById('typology-detail');
            if (detail && !detail.open) {
                detail.open = true;
            }
        }

        function resetMap() {
            console.log("🏔 Reset Map");
        
            // Clear typology flags when resetting
            window.typologyPanelActive = false;
            window.typologyPopupsActive = false;
            clearTypologyMarkers();
        
            // 1️⃣ Fly to the default view
            smoothFlyTo(defaultView);
        
            // 2️⃣ Make DEM fully visible
            setOpa('dem', 0.4);
            toggleLayerOff('hillshade');
        
            // Define groups/layers to stay visible or turn on
            const keepGroups = (
                { groups: ['dem', 'valleys', 'tanks', 'primarydrains', 'secondarydrains', 'roads', 'placelabels', ...alwaysVisible]}
            ); 
            
            panelHandle(keepGroups.groups);
        
            setOpa('roads', 0.5);
        }

    
    
    
    //#endregion

    //#region lakesbuttons

    // 1800s lakes view
    function lakes1800() {
        console.log("📅 Showing 1800s lakes");
        
        // Define groups/layers to stay visible or turn on
        const keepGroups = (
            { groups: ['dem', 'tanks1800']}
        ); 
        panelHandle(keepGroups.groups);

        setOpa('tanks1800', 0.6);
        
        // Wait for layers to load before counting
        setTimeout(() => {
            const existingCount = countFeaturesInLayer('lakes_existing_1800') + 
                                countFeaturesInLayer('Lakes_lost_1800_button');
            updateLakesCounter(existingCount, null, false);
        }, 500);
    }

    // 1900s lakes view
    function lakes1900() {
        console.log("📅 Showing 1900s lakes");
        
        // Define groups/layers to stay visible or turn on
        const keepGroups = (
            { groups: ['dem', 'tanks1900']}
        ); 
        panelHandle(keepGroups.groups);

        setOpa('tanks1900', 0.6);
        
        // Wait for layers to load before counting
        setTimeout(() => {
          
            const existingCount = countFeaturesInLayer('lakes_existing_1900') + 
            countFeaturesInLayer('Lakes_lost_1900_button');
            const lostCount = countFeaturesInLayer('Lakes_lost_1800_1900');
            console.log(lostCount);
            updateLakesCounter(existingCount, lostCount, true);
        }, 500);
    }

    // 2000s lakes view
    function lakes2000() {
        console.log("📅 Showing 2000s lakes");
        
        // Define groups/layers to stay visible or turn on
        const keepGroups = (
            { groups: ['dem', 'valleys', 'existingtanks',  ...alwaysVisible]}
        ); 
        panelHandle(keepGroups.groups);
        
        // Wait for layers to load before counting
        setTimeout(() => {
            const existingCount = countFeaturesInLayer('tanks_existing');
            const lostCount =  countFeaturesInLayer('Lakes_lost_1900_2000');
            updateLakesCounter(existingCount, lostCount, true);
        }, 500);
    }

//#endregion

    //#region Valley buttons
    function highlightValleyByName(valleyName, buttonId) {
        const clickedButton = document.getElementById(buttonId);
        const infoDiv = document.getElementById('info');

        if (!clickedButton) {
            console.warn(`Button with ID "${buttonId}" not found`);
            return;
        }

        // If same button clicked again → reset
        if (valleyHighlight === valleyName) {
            map.setFilter('valleys category', null);
            valleyHighlight = null;
            document.querySelectorAll('#panel sl-button').forEach(btn => btn.classList.remove('active'));
            infoDiv.innerHTML = "<p>Select a valley to view its details.</p>";
            return;
        }

        valleyHighlight = valleyName;
        map.setFilter('valleys category', ['==', ['get', 'Name'], valleyName]);
        document.querySelectorAll('#panel sl-button').forEach(btn => btn.classList.remove('active'));
        clickedButton.classList.add('active');

        // 🧩 Get the source data of the filtered valley
        const features = map.querySourceFeatures('composite', {
            sourceLayer: 'valley_edited-204fyo',
            filter: ['==', ['get', 'Name'], valleyName]
        });

        if (!features.length) {
            infoDiv.innerHTML = `<p>No data found for <b>${valleyName}</b>.</p>`;
            return;
        }

        // 🧮 Compute area using Turf.js
        const feature = features[0];
        const areaSqMeters = turf.area(feature);
        const areaSqKm = (areaSqMeters / 1_000_000).toFixed(2);

        // 🧾 Update the info panel
        infoDiv.innerHTML = `
            <p>Area: <b>${areaSqKm}</b> sq. km</p>
        `;
        }

        // Function to toggle between regional and local valley view
        function toggleValleyView(showRegional) {
            if (showRegional) {
            // Regional view - zoom out to 9
            map.flyTo({
                center: [78.5, 12.5],
                zoom: 8.2,
                pitch: 0,
                bearing: 0,
                duration: 2000,
                essential: true,
                easing: t => 1 - Math.pow(1 - t, 3)
            });
            } else {
            // Local view - return to valley view
            smoothFlyTo(valleyView);
            }
        }
    
    
    //#endregion
//#endregion

//#region main


map.on('load', () => {

    console.log('✅ Map loaded!');

    //add layers not in the style
    addLayers(); 
    addTypLayers();
    addBoundaryLayers();
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
    console.log('✅ Zoom range set!');

    if (map.getLayer('road-secondary-tertiary')) {
        map.setLayerZoomRange('road-secondary-tertiary', 12, 18);
        console.log('✅ Set zoom range for road-primary-secondary (10–18)');
      }

    generateLegend();
    console.log('✅ Legend generated!');

    setupInteraction();
    console.log('✅ setupInteraction completed!');

});

//#endregion

//#region features

    //#region eventListeners

        //#region Valley Buttons


        // Add event listener for valley view toggle
        const valleyToggle = document.getElementById('valley-view-toggle');
        if (valleyToggle) {
        valleyToggle.addEventListener('change', (e) => {
            const isRegional = e.target.checked;
            toggleValleyView(isRegional);
        });
        }

        
        document.getElementById('hn_valley').addEventListener('click', () => highlightValleyByName('Hebbal Nagawara Valley', 'hn_valley'));
        document.getElementById('kc_valley').addEventListener('click', () => highlightValleyByName('Koramangala Challaghatta Valley', 'kc_valley'));
        document.getElementById('a_valley').addEventListener('click', () => highlightValleyByName('Arkavathi Valley', 'a_valley'));
        document.getElementById('v_valley').addEventListener('click', () => highlightValleyByName('Vrishabhavati Valley', 'v_valley'));
        document.getElementById('s_valley').addEventListener('click', () => highlightValleyByName('Suvarnamukhi Valley', 's_valley'));
        //#endregion

        //#region Lakes timeline buttons
        let activeButton = null;

        const lakes1800Btn = document.getElementById('lakes_trace_1800');
        const lakes1900Btn = document.getElementById('lakes_trace_1900');
        const lakes2000Btn = document.getElementById('lakes_trace_2000');
        const lakesResetBtn = document.getElementById('lakes_trace_reset');

        // Helper function to clear all active states
        function clearActiveButtons() {
        if (lakes1800Btn) lakes1800Btn.classList.remove('active');
        if (lakes1900Btn) lakes1900Btn.classList.remove('active');
        if (lakes2000Btn) lakes2000Btn.classList.remove('active');
        activeButton = null;
        }

        // 1800s button handler
        if (lakes1800Btn) {
        lakes1800Btn.addEventListener('click', () => {
            if (activeButton === 'lakes1800') {
            // If clicking the same button, reset
            clearActiveButtons();
            handlelakesDetail();
            } else {
            // Show 1800s lakes
            clearActiveButtons();
            lakes1800Btn.classList.add('active');
            activeButton = 'lakes1800';
            lakes1800();
            }
        });
        }

        // 1900s button handler
        if (lakes1900Btn) {
        lakes1900Btn.addEventListener('click', () => {
            if (activeButton === 'lakes1900') {
            // If clicking the same button, reset
            clearActiveButtons();
            handlelakesDetail();
            } else {
            // Show 1900s lakes
            clearActiveButtons();
            lakes1900Btn.classList.add('active');
            activeButton = 'lakes1900';
            lakes1900();
            }
        });
        }

        // 2000s button handler
        if (lakes2000Btn) {
        lakes2000Btn.addEventListener('click', () => {
            if (activeButton === 'lakes2000') {
            // If clicking the same button, reset
            clearActiveButtons();
            handlelakesDetail();
            } else {
            // Show 2000s lakes
            clearActiveButtons();
            lakes2000Btn.classList.add('active');
            activeButton = 'lakes2000';
            lakes2000();
            }
        });
        }

        // Reset button - explicitly resets
if (lakesResetBtn) {
    lakesResetBtn.addEventListener('click', () => {
        clearActiveButtons();
        handlelakesDetail();
    });
}
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
                    
                    if(selectedId=== 'secondary-drains-detail') {
                        handleSecondaryDetail() 
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

            const resetMapbutton = document.getElementById('reset');
            resetMapbutton.addEventListener('click', () => {
                resetMap();
            });
        
        //#endregion

    //#endregion

//#endregion




  
    





