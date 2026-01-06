// Map Configuration and Data Sources
// All map data, sources, and layer configurations in one place

const mapConfig = {
  // Initial map settings
  initialView: {
    center: [77.6199, 12.96783],
    zoom: 12.7,
  },

  // Base map style - using a simple blank style since we're adding all our own layers
  baseStyle: {
    version: 8,
    glyphs: "./fonts/{fontstack}/{range}.pbf",
    sources: {},
    layers: [],
  },

  // All data sources
  sources: {
    // Satellite imagery
    satellite: {
      type: "raster",
      tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
      tileSize: 256,
      attribution: "© Google",
    },

   placelabels: {
  type: 'vector',
  url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=cAJaZlDdlxWFr7dh91XQ'
},
    // DEM (Digital Elevation Model) - Colored Raster
    demColored: {
      type: "raster",
      url: "cog://./datasets/geotiff/dem_3857_cog.tif",
      tileSize: 256,
    },

                // 1897 city
    cityMap1897: {
      type: "raster",
      url: "cog://./datasets/geotiff/1897_city_cog.tif",
      tileSize: 256,
    },

            // 1897 cantonment
    cantonmentMap1897: {
      type: "raster",
      url: "cog://./datasets/geotiff/1897_cantonment_cog.tif",
      tileSize: 256,
    },

    // Historical Map 1854
    historicalMap1854: {
      type: "raster",
      url: "cog://./datasets/geotiff/cantonment_cog.tif",
      tileSize: 256,
    },

        // Historical Map 1870
    historicalMap1870: {
      type: "raster",
      url: "cog://./datasets/geotiff/1870_cog.tif",
      tileSize: 256,
    },

    // Historical Map 1854
    ulsoorMap1884: {
      type: "raster",
      url: "cog://./datasets/geotiff/1884-ulsoor_cog.tif",
      tileSize: 256,
    },

    barracksMap1884: {
      type: "raster",
      url: "cog://./datasets/geotiff/1884-barracks_cog.tif",
      tileSize: 256,
    },
    // Fort
    fortMap1854: {
      type: "raster",
      url: "cog://./datasets/geotiff/fort_cog.tif",
      tileSize: 256,
    },

        // Ulsoor Village
    ulsoorMap1854: {
      type: "raster",
      url: "cog://./datasets/geotiff/1854-ulsoor-village_cog.tif",
      tileSize: 256,
    },


    // 1854 Boundary GeoJSON
    boundary1854: {
      type: "geojson",
      data: "./datasets/json/1854-boundary.geojson",
    },

    // Drainage Boundary GeoJSON
    drainageareas1870: {
      type: "geojson",
      data: "./datasets/json/1870-drainage-areas.geojson",
    },

        // Ulsoor Village Boundary GeoJSON
    ulsoorvillageboundary: {
      type: "geojson",
      data: "./datasets/json/ulsoor-village-boundary.geojson",
    },

    // Drain lines GeoJSON
    drainlines: {
      type: "geojson",
      data: "./datasets/json/drain-lines.geojson",
    },

    //Traced lakes GeoJSON
    tanks1854: {
      type: "geojson",
      data: "./datasets/json/1854-tanks.geojson",
    },

        //Traced lakes GeoJSON
    tanks1870: {
      type: "geojson",
      data: "./datasets/json/1870-tanks.geojson",
    },

            //Ulsoor Water Works
    ulsoorwaterworks: {
      type: "geojson",
      data: "./datasets/json/ulsoor-water-works.geojson",
    },

            // 1897 boundary
    boundary1897: {
      type: "geojson",
      data: "./datasets/json/1897-boundary.geojson",
    },

        //Labels
    labels: {
      type: "geojson",
      data: "./datasets/json/labels.geojson",
    },

  },

  // Layer configurations
  layers: [

    //raster

    {
      id: "satellite-layer",
      type: "raster",
      source: "satellite",
      paint: {
        "raster-opacity": 1,
      },
    },
  {

  id: 'osm-place-labels',
  type: 'symbol',
  source: 'placelabels',
  'source-layer': 'place',
  minzoom: 10,
  layout: {
    'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
    'text-font': ['Open Sans Regular'],
    'text-size': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 9,
      14, 11
    ],
    'text-anchor': 'center',
    'text-allow-overlap': false,
    'text-optional': true,
    'visibility': 'visible'
  },
  paint: {
    'text-color': '#555555',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1,
    'text-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 0,
      13, 1
    ]
  
}

},


    {
      id: "dem-colored-layer",
      type: "raster",
      source: "demColored",
      paint: {
        "raster-opacity": 0.5,
      },
    },
                {
      id: "1897-city-map",
      type: "raster",
      source: "cityMap1897",
      paint: {
        "raster-opacity": 1,
      },
    },

                {
      id: "1897-cantonment-map",
      type: "raster",
      source: "cantonmentMap1897",
      paint: {
        "raster-opacity": 1,
      },
    },
    {
      id: "1854-map",
      type: "raster",
      source: "historicalMap1854",
      paint: {
        "raster-opacity": 1,
      },
    },

        {
      id: "1870-map",
      type: "raster",
      source: "historicalMap1870",
      paint: {
        "raster-opacity": 1,
      },
    },
    {
      id: "fort-1854",
      type: "raster",
      source: "fortMap1854",
      minzoom: 0,
      maxzoom: 24,
      paint: {
        "raster-opacity": 1,
        "raster-fade-duration": 0,
      },
    },
        {
      id: "ulsoor-village",
      type: "raster",
      source: "ulsoorMap1854",
      paint: {
        "raster-opacity": 1,
      },
    },

        {
      id: "1884-ulsoor-map",
      type: "raster",
      source: "ulsoorMap1884",
      paint: {
        "raster-opacity": 1,
      },
    },

            {
      id: "1884-barracks-map",
      type: "raster",
      source: "barracksMap1884",
      paint: {
        "raster-opacity": 1,
      },
    },



    //boundaries

                {
      id: "ulsoor-village-boundary",
      type: "line",
      source: "ulsoorvillageboundary",
      paint: {
        "line-color": "#ff0d0d",
        "line-width": 2,
      },
    },

            {
      id: "fort-boundary",
      type: "line",
      source: "boundary1854",
      filter: ["==", ["get", "chapter"], 1],
      paint: {
        "line-color": "#0d6aff",
        "line-width": 4,
      },
    },

    {
      id: "cantonment-boundary",
      type: "line",
      source: "boundary1854",
      filter: ["==", ["get", "chapter"], 2],
      paint: {
        "line-color": "#0d6aff",
        "line-width": 3,
      },
    },

        {
      id: "1897-boundary",
      type: "line",
      source: "boundary1897",
      paint: {
        "line-color": "#0d6aff",
        "line-width": 3,
      },
    },


    {
      id: "oviform",
      type: "line",
      source: "drainlines",
      filter: ["all", ["has", "name"], ["in", "Oviform", ["get", "name"]]],
      paint: {
        "line-color": "rgba(255, 0, 0, 1)",
        "line-width": 5,
      },
    },
    {
      id: "ulsoor-water-line",
      type: "line",
      source: "drainlines",
      filter: ["all", ["has", "name"], ["in", "Works", ["get", "name"]]],
      paint: {
        "line-color": "rgba(255, 0, 0, 1)",
        "line-width": 2,
      },
    },

        {
      id: "ulsoor-water-works",
      type: "line",
      source: "ulsoorwaterworks",
      paint: {
        "line-color": "rgba(255, 0, 0, 1)",
        "line-width": 3,
      },
    },

    {
      id: "ulsoor-stormwater",
      type: "line",
      source: "drainlines",
      filter: ["==", ["get", "chapter"], 9],
      paint: {
        "line-color": "#6fe6fd",
        "line-width": 6,
      },
    },


    //fill
    {
      id: "tanks-1854",
      type: "fill",
      source: "tanks1854",
      filter: ["==", ["get", "chapter"], 5],
      paint: {
        "fill-color": "#0d6aff80",
      }
    },

        {
      id: "tanks-1870",
      type: "fill",
      source: "tanks1870",
                  filter: ["==", ["get", "chapter"], 10],

      paint: {
        "fill-color": "#0d6aff80",
      }
    },
            {
      id: "tanks-1870-added",
      type: "fill",
      source: "tanks1870",
                  filter: ["==", ["get", "chapter"], 11],
      paint: {
        "fill-color": "#0d6aff80",
      }
    },


          {
      id: "tanks-1854-outline",
      type: "line",
      source: "tanks1854",
      filter: ["==", ["get", "chapter"], 5],
      paint: {
                "line-color": "rgba(0, 238, 255, 1)",
        "line-width": 2,
      }
    },
          {
      id: "tanks-1870-outline",
      type: "line",
      source: "tanks1870",
            filter: ["==", ["get", "chapter"], 10],
      paint: {
                "line-color": "rgba(0, 238, 255, 1)",
        "line-width": 2,
      }
    },

              {
      id: "tanks-1870-added-outline",
      type: "line",
      source: "tanks1870",
            filter: ["==", ["get", "chapter"], 11],
      paint: {
                "line-color": "rgba(0, 238, 255, 1)",
        "line-width": 2,
      }
    },

          {
      id: "soldiers-gardens-outline",
      type: "line",
      source: "tanks1854",
      filter: ["==", ["get", "chapter"], 6],
      paint: {
                "line-color": "rgba(67, 137, 77, 1)",
        "line-width": 4,
      }
    },

    {
      id: "soldiers-gardens",
      type: "fill",
      source: "tanks1854",
            filter: ["==", ["get", "chapter"], 6],

      paint: {
        "fill-color": "rgba(67, 137, 77, 0.3)",
      },
    },

              {
      id: "1870-drainage-areas",
      type: "line",
      source: "drainageareas1870",
      paint: {
                "line-color": "rgba(221, 5, 5, 1)",
        "line-width": 2,
      }
    },

                  {
      id: "1870-bazaar",
      type: "line",
      source: "drainageareas1870",
            filter: ["==", ["get", "fid"], 5],
      paint: {
                "line-color": "rgba(221, 5, 5, 1)",
        "line-width": 2,
      }
    },

    //Labels
        {
      id: "1-label",
      type: "symbol",
      source: "labels",
      filter: ["==", ["get", "chapter"], 1],
      layout: {
        "text-field": ["get", "name"],
"text-font": ["Open Sans Condensed Bold"],
        "text-size": 17,
        "text-anchor": "left",
        "text-allow-overlap": true,
        "text-optional": true,
        "text-padding": 8,
        "text-justify": "left",
        "text-transform": "uppercase"
      },
      paint: {
        "text-color": "#0d6aff",
        "text-halo-color": "#f9ea46",
        "text-halo-width": 8,
        "text-halo-blur": 5
      }
    },
        {
      id: "4-label",
      type: "symbol",
      source: "labels",
      filter: ["==", ["get", "chapter"], 3],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Condensed Bold"],
        "text-size": 15,
        "text-anchor": "left",
        "text-allow-overlap": true,
        "text-optional": true,
        "text-padding": 4,
        "text-justify": "left",

      },
      paint: {
        "text-color": "#0d6aff",
        "text-halo-color": "#f9ea46",
        "text-halo-width": 6,
        "text-halo-blur": 5
      }
    },

  {
      id: "5-label",
      type: "symbol",
      source: "labels",
      filter: ["==", ["get", "chapter"], 5],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Condensed Bold"],
        "text-size": 15,
        "text-anchor": "left",
        "text-allow-overlap": true,
        "text-optional": true,
        "text-padding": 4,
        "text-justify": "left",
        "text-transform": "uppercase"

      },
      paint: {
        "text-color": "#0d6aff",
        "text-halo-color": "#85fbeb",
        "text-halo-width": 6,
        "text-halo-blur": 5
      }
    },

    {
      id: "6-label",
      type: "symbol",
      source: "labels",
      filter: ["==", ["get", "chapter"], 6],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Condensed Bold"],
        "text-size": 15,
        "text-anchor": "left",
        "text-allow-overlap": true,
        "text-optional": true,
        "text-padding": 4,
        "text-justify": "left",
        "text-transform": "uppercase"

      },
      paint: {
        "text-color": "#0d6aff",
        "text-halo-color": "#f9ea46",
        "text-halo-width": 6,
        "text-halo-blur": 5
      }
    },

        {
      id: "7-label",
      type: "symbol",
      source: "labels",
      filter: ["==", ["get", "chapter"], 7],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Condensed Bold"],
            "text-max-width": 5,   // <-- maximum width in em units

        "text-size": 15,
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-optional": true,
        "text-padding": 4,
        "text-justify": "left",
  

      },
      paint: {
        "text-color": "#0d6aff",
        "text-halo-color": "#f9ea46",
        "text-halo-width": 6,
        "text-halo-blur": 5
      }
    },

            {
      id: "9-label",
      type: "symbol",
      source: "labels",
      filter: ["==", ["get", "chapter"], 9],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Condensed Bold"],
            "text-max-width": 5,   // <-- maximum width in em units

        "text-size": 15,
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-optional": true,
        "text-padding": 4,
        "text-justify": "left",
  

      },
      paint: {
        "text-color": "#0d6aff",
        "text-halo-color": "#f9ea46",
        "text-halo-width": 6,
        "text-halo-blur": 5
      }
    },

                {
      id: "11-label",
      type: "symbol",
      source: "labels",
      filter: ["==", ["get", "chapter"],12],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Condensed Bold"],
            "text-max-width": 5,   // <-- maximum width in em units

        "text-size": 15,
        "text-anchor": "left",
        "text-allow-overlap": true,
        "text-optional": true,
        "text-padding": 4,
        "text-justify": "left",
        "text-transform": "uppercase"
  

      },
      paint: {
        "text-color": "#0d6aff",
        "text-halo-color": "#f9ea46",
        "text-halo-width": 6,
        "text-halo-blur": 5
      }
    },

  ],
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = mapConfig;
}
