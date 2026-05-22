// Map Configuration — standalone basemap options for Story Creator
const mapConfig = {
  initialView: {
    center: [0, 20],
    zoom: 2,
  },

  defaultBasemap: 'satellite',

  basemaps: {
    'satellite': {
      tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
      attribution: '© Google',
    },
    'carto-positron': {
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],
      attribution: '© Carto, © OpenStreetMap contributors',
    },
    'carto-dark': {
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
      attribution: '© Carto, © OpenStreetMap contributors',
    },
    'osm': {
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      attribution: '© OpenStreetMap contributors',
    },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = mapConfig;
}
