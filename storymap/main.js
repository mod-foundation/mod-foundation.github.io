// Register COG protocol
maplibregl.addProtocol('cog', MaplibreCOGProtocol.cogProtocol);

var map = new maplibregl.Map({
    container: 'map',
    style: './positron.json',
    center: [77.61990, 12.96783],
    zoom: 12.7
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Load satellite background and COG file when map is ready
map.on('load', function() {
    // Add satellite imagery source
    map.addSource('satellite', {
        type: 'raster',
        tiles: [
            'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        ],
        tileSize: 256,
        attribution: '© Google'
    });

    // Get the first layer ID from the style
    const layers = map.getStyle().layers;
    const firstLayerId = layers && layers.length > 0 ? layers[0].id : undefined;

    // Add satellite layer as the very first layer (background)
    map.addLayer({
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        paint: {
            'raster-opacity': 1
        }
    }, firstLayerId);

    // Add COG source
    map.addSource('cog-source', {
        type: 'raster',
        url: 'cog://https://raw.githubusercontent.com/mod-foundation/mod-foundation.github.io/main/storymap/geotiff/1854_clipped_cog.tif',
        tileSize: 256
    });

    // Add COG layer on top of satellite but below style layers
    map.addLayer({
        id: 'cog-layer',
        type: 'raster',
        source: 'cog-source',
        paint: {
            'raster-opacity': 0.8
        }
    }, firstLayerId); // Insert before first style layer, so it's above satellite
});
