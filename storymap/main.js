//#region  INITIALIZATION

// Register COG protocol for loading Cloud Optimized GeoTIFFs
maplibregl.addProtocol("cog", MaplibreCOGProtocol.cogProtocol);

//#endregion

//#region  MAP CONFIGURATION

var map = new maplibregl.Map({
  container: "map",
  style: mapConfig.baseStyle,
  center: mapConfig.initialView.center,
  zoom: mapConfig.initialView.zoom,
  scrollZoom: false, // Disable scroll zoom
  boxZoom: false, // Disable box zoom (shift + drag)
  doubleClickZoom: true, // Enable double-click zoom
  touchZoomRotate: false, // Disable touch zoom and rotate
  dragRotate: false, // Disable bearing rotation with right-click drag
  touchPitch: false // Disable pitch with two-finger touch
});

//#endregion

//#region  MAP CONTROLS

// Add navigation controls (zoom, rotation)
map.addControl(new maplibregl.NavigationControl(), "top-right");

//#endregion

//#region  DATA HANDLING

//#region add layers

function addAllLayers() {
  // Add all sources from config
  Object.entries(mapConfig.sources).forEach(([sourceId, sourceConfig]) => {
    map.addSource(sourceId, sourceConfig);
  });

  // Add all layers from config with transition properties
  mapConfig.layers.forEach(layerConfig => {
    const layerWithTransition = { ...layerConfig };

    // Add transition for smooth opacity changes
    if (!layerWithTransition.paint) {
      layerWithTransition.paint = {};
    }

    // Set transition duration for opacity changes (1500ms)
    const layerType = layerWithTransition.type;
    if (layerType === 'raster') {
      layerWithTransition.paint['raster-opacity-transition'] = { duration: 1500 };
    } else if (layerType === 'line') {
      layerWithTransition.paint['line-opacity-transition'] = { duration: 1500 };
    } else if (layerType === 'fill') {
      layerWithTransition.paint['fill-opacity-transition'] = { duration: 1500 };
    } else if (layerType === 'symbol') {
      layerWithTransition.paint['icon-opacity-transition'] = { duration: 1500 };
    }

    map.addLayer(layerWithTransition);
  });
}

//#endregion


// Load all layers when map is ready
map.on("load", function () {
  addAllLayers();

  // Initialize Layer Manager
  const layerManager = new LayerManager({
    layers: [
      { id: "satellite-layer", name: "Satellite", visible: true },
      { id: "dem-colored-layer", name: "Digital Elevation Model", visible: true },
      { id: "1854-map", name: "Historical Map (1854)", visible: true },
      { id: "1884-map", name: "Historical Map (1884)", visible: true },
      { id: "1854-boundary-line", name: "1854 Boundary", visible: true },
      { id: "drainage-boundary", name: "Drainage Boundary", visible: true },
      { id: "drain-lines", name: "Drain Lines", visible: true },
      { id: "tanks-1854", name: "Traced Lakes", visible: true }
    ],
    position: "top-left",
    collapsed: true,
  });



  map.addControl(layerManager, "top-left");

  // Initialize scrollytelling
  initScrollytelling();
});

//#endregion

//#region SCROLLYTELLING

let activeChapterName = '';
let activeChapterIndex = 0;
let previousLayerState = {}; // Track previous layer visibility state

function initScrollytelling() {
  // Create chapter elements from config
  const storyContainer = document.getElementById('story');

  storyConfig.chapters.forEach((chapter, index) => {
    const chapterDiv = document.createElement('div');
    chapterDiv.id = chapter.id;
    const alignment = chapter.alignment || 'center';
    chapterDiv.className = `chapter align-${alignment}`;
    chapterDiv.dataset.chapterIndex = index;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'chapter-content';

    const title = document.createElement('h2');
    title.textContent = chapter.title;
    contentDiv.appendChild(title);

    const description = document.createElement('p');
    description.textContent = chapter.description;
    contentDiv.appendChild(description);

    if (chapter.image) {
      const img = document.createElement('img');
      img.src = chapter.image;
      img.alt = chapter.title;
      contentDiv.appendChild(img);
    }

    chapterDiv.appendChild(contentDiv);
    storyContainer.appendChild(chapterDiv);
  });

  // Set up Intersection Observer for scroll detection
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const chapterElement = entry.target;
          const chapterIndex = parseInt(chapterElement.dataset.chapterIndex);
          const chapter = storyConfig.chapters[chapterIndex];

          // Update active chapter
          if (activeChapterName !== chapter.id) {
            setActiveChapter(chapter, chapterIndex);
            activeChapterName = chapter.id;
            activeChapterIndex = chapterIndex;
            updateArrowVisibility();
          }
        }
      });
    },
    {
      threshold: 0.5, // Trigger when 50% of chapter is visible
      rootMargin: '0px 0px -20% 0px'
    }
  );

  // Observe all chapters
  document.querySelectorAll('.chapter').forEach((chapter) => {
    observer.observe(chapter);
  });

  // Set up next chapter arrow
  setupNextChapterArrow();
}

function setupNextChapterArrow() {
  const arrow = document.getElementById('next-chapter-arrow');

  arrow.addEventListener('click', () => {
    const nextIndex = activeChapterIndex + 1;
    if (nextIndex < storyConfig.chapters.length) {
      const nextChapter = document.getElementById(storyConfig.chapters[nextIndex].id);
      if (nextChapter) {
        nextChapter.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

  // Update arrow visibility
  updateArrowVisibility();
}

function updateArrowVisibility() {
  const arrow = document.getElementById('next-chapter-arrow');
  if (activeChapterIndex >= storyConfig.chapters.length - 1) {
    arrow.classList.add('hidden');
  } else {
    arrow.classList.remove('hidden');
  }
}

function setActiveChapter(chapter) {
  // Remove active class from all chapters
  document.querySelectorAll('.chapter').forEach((ch) => {
    ch.classList.remove('active');
  });

  // Add active class to current chapter
  const activeElement = document.getElementById(chapter.id);
  if (activeElement) {
    activeElement.classList.add('active');
  }

  // Update year timeline
  const yearTimeline = document.getElementById('year-timeline');
  if (chapter.year) {
    yearTimeline.textContent = chapter.year;
  } else {
    yearTimeline.textContent = '';
  }

  // Animate map to chapter location
  map.flyTo({
    center: chapter.center,
    zoom: chapter.zoom,
    pitch: chapter.pitch || 0,
    bearing: chapter.bearing || 0,
    duration: chapter.duration || 2000,
    essential: true
  });

  // Update layer visibility and opacity with smooth transitions
  Object.keys(chapter.layers).forEach((layerId) => {
    const layerConfig = chapter.layers[layerId];

    // Handle both old boolean format and new object format for backwards compatibility
    const shouldBeVisible = typeof layerConfig === 'boolean' ? layerConfig : layerConfig.visible;
    const targetOpacity = typeof layerConfig === 'object' ? (layerConfig.opacity || 1) : 1;
    const wasVisible = previousLayerState[layerId] || false;

    if (map.getLayer(layerId)) {
      const layer = map.getLayer(layerId);
      const layerType = layer.type;

      // Set visibility
      map.setLayoutProperty(layerId, 'visibility', shouldBeVisible ? 'visible' : 'none');

      // Determine the opacity property based on layer type
      let opacityProperty;
      if (layerType === 'raster') {
        opacityProperty = 'raster-opacity';
      } else if (layerType === 'line') {
        opacityProperty = 'line-opacity';
      } else if (layerType === 'fill') {
        opacityProperty = 'fill-opacity';
      } else if (layerType === 'symbol') {
        opacityProperty = 'text-opacity';
      }

      if (opacityProperty) {
        // Apply smooth opacity transitions ONLY for newly visible layers
        if (shouldBeVisible && !wasVisible) {
          // Start at 0 and animate to target opacity
          map.setPaintProperty(layerId, opacityProperty, 0);

          // Animate to target opacity over 1500ms
          setTimeout(() => {
            map.setPaintProperty(layerId, opacityProperty, targetOpacity);
          }, 50);
        } else if (shouldBeVisible && wasVisible) {
          // Layer was already visible, update opacity directly
          map.setPaintProperty(layerId, opacityProperty, targetOpacity);
        }
      }
    }

    // Update previous state
    previousLayerState[layerId] = shouldBeVisible;
  });

  // Execute onChapterEnter callbacks
  if (chapter.onChapterEnter && chapter.onChapterEnter.length > 0) {
    chapter.onChapterEnter.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }
}

//#endregion


