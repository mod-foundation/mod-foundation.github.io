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

// Preload viewpoint icon image using standard Image object
const viewpointImg = new Image();
viewpointImg.crossOrigin = 'anonymous';
viewpointImg.onload = function() {
  console.log('Viewpoint image loaded successfully, dimensions:', viewpointImg.width, 'x', viewpointImg.height);
  // Add to map immediately after loading
  if (map.loaded() && !map.hasImage('viewpoint-icon')) {
    map.addImage('viewpoint-icon', viewpointImg);
    console.log('Viewpoint icon added to map from preloaded image');
  }
};
viewpointImg.onerror = function(e) {
  console.error('Failed to load viewpoint image:', e);
};
viewpointImg.src = './datasets/images/viewpoint.png';

// Handle missing images - load them on demand
map.on('styleimagemissing', function(e) {
  const id = e.id;
  console.log('Missing image requested:', id);

  if (id === 'viewpoint-icon') {
    console.log('Checking if preloaded viewpoint icon is ready...');
    if (viewpointImg.complete && viewpointImg.naturalWidth > 0) {
      if (!map.hasImage(id)) {
        map.addImage(id, viewpointImg);
        console.log('Viewpoint icon added to map from preloaded image');
      }
    } else {
      console.log('Viewpoint icon not ready yet, waiting...');
    }
  }
});

//#endregion

//#region  MAP CONTROLS

// Add navigation controls (zoom, rotation)
map.addControl(new maplibregl.NavigationControl(), "top-right");

// Click-and-hold to temporarily reduce raster layer opacity
let savedOpacities = {}; // Store original opacity values
let isHoldingMap = false;

// Function to handle map hold start (mouse and touch)
function handleMapHoldStart(e) {
  // For mouse events, only trigger on left button
  if (e.type === 'mousedown' && e.button !== 0) return;

  isHoldingMap = true;
  savedOpacities = {};

  // Get all visible raster layers and reduce their opacity (except satellite and OSM labels)
  const layers = map.getStyle().layers;
  layers.forEach(layer => {
    if (layer.type === 'raster' && layer.id !== 'satellite-layer' && layer.id !== 'osm-place-labels') {
      const visibility = map.getLayoutProperty(layer.id, 'visibility');
      if (visibility === 'visible' || visibility === undefined) {
        // Save current opacity
        const currentOpacity = map.getPaintProperty(layer.id, 'raster-opacity') || 1;
        savedOpacities[layer.id] = currentOpacity;

        // Set to low opacity
        map.setPaintProperty(layer.id, 'raster-opacity', 0.1);
      }
    }
  });
}

// Function to handle map hold end (mouse and touch)
function handleMapHoldEnd() {
  if (isHoldingMap) {
    isHoldingMap = false;

    // Restore original opacity values
    Object.keys(savedOpacities).forEach(layerId => {
      map.setPaintProperty(layerId, 'raster-opacity', savedOpacities[layerId]);
    });

    savedOpacities = {};
  }
}

// Add mouse events
map.getCanvas().addEventListener('mousedown', handleMapHoldStart);
map.getCanvas().addEventListener('mouseup', handleMapHoldEnd);

// Add touch events for mobile
map.getCanvas().addEventListener('touchstart', handleMapHoldStart, { passive: true });
map.getCanvas().addEventListener('touchend', handleMapHoldEnd, { passive: true });

// Also handle mouse leaving the map area
map.getCanvas().addEventListener('mouseleave', () => {
  if (isHoldingMap) {
    isHoldingMap = false;

    // Restore original opacity values
    Object.keys(savedOpacities).forEach(layerId => {
      map.setPaintProperty(layerId, 'raster-opacity', savedOpacities[layerId]);
    });

    savedOpacities = {};
  }
});

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


// Global reference to layer manager
let currentLayerManager = null;

// Function to update layer manager based on active chapter
function updateLayerManager(chapter) {
  // Remove existing layer manager if present
  if (currentLayerManager) {
    map.removeControl(currentLayerManager);
    currentLayerManager = null;
  }

  // Build layers array from chapter configuration
  const visibleLayers = [];

  // Layer display names mapping
  const layerNames = {
    "satellite-layer": "Satellite",
    "dem-colored-layer": "Digital Elevation Model",
    "1854-map": "Historical Map (1854)",
    "1870-map": "Historical Map (1870)",
    "1884-map": "Historical Map (1884)",
    "1898-map": "Historical Map (1898)",
    "1937-map": "Historical Map (1937)",
    "1964-map": "Historical Map (1964)",
    "1984-map": "Historical Map (1984)",
    "2004-map": "Historical Map (2004)",
    "1854-boundary-line": "1854 Boundary",
    "drainage-boundary": "Drainage Boundary",
    "drain-lines": "Drain Lines",
    "tanks-1854": "Traced Lakes"
  };

  // Get visible layers from chapter configuration
  if (chapter.layers) {
    Object.keys(chapter.layers).forEach(layerId => {
      const layerConfig = chapter.layers[layerId];
      const isVisible = typeof layerConfig === 'boolean' ? layerConfig : layerConfig.visible;

      if (isVisible && layerNames[layerId]) {
        visibleLayers.push({
          id: layerId,
          name: layerNames[layerId],
          visible: true
        });
      }
    });
  }

  // Only create layer manager if there are visible layers
  if (visibleLayers.length > 0) {
    currentLayerManager = new LayerManager({
      layers: visibleLayers,
      position: "top-left",
      collapsed: true,
    });

    map.addControl(currentLayerManager, "top-left");
  }
}

// Load all layers when map is ready
map.on("load", function () {
  addAllLayers();

  // Initialize scrollytelling
  initScrollytelling();
});

//#endregion

//#region SCROLLYTELLING

let activeChapterName = '';
let activeChapterIndex = 0;
let previousLayerState = {}; // Track previous layer visibility state

// Number animation function for year and population with slide-up effect
function animateNumber(element, fromValue, toValue, duration) {
  if (!toValue || toValue === fromValue) {
    element.textContent = toValue;
    element.removeAttribute('data-animating');
    return;
  }

  // Mark element as animating to prevent :empty hiding
  element.setAttribute('data-animating', 'true');

  // Save original styles
  const originalPosition = element.style.position;
  const originalOverflow = element.style.overflow;

  // Set up the element for animation (don't change position if it's already fixed)
  if (!originalPosition || originalPosition === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'hidden';

  // Create old number element
  const oldNumber = document.createElement('div');
  oldNumber.className = 'number-slide-old';
  oldNumber.textContent = fromValue || '';
  oldNumber.style.position = 'absolute';
  oldNumber.style.top = '0';
  oldNumber.style.left = '0';
  oldNumber.style.right = '0';
  oldNumber.style.textAlign = 'inherit';
  oldNumber.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

  // Create new number element
  const newNumber = document.createElement('div');
  newNumber.className = 'number-slide-new';
  newNumber.textContent = toValue;
  newNumber.style.textAlign = 'inherit';
  newNumber.style.transform = 'translateY(100%)';
  newNumber.style.opacity = '0';
  newNumber.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

  // Clear element and add both numbers
  element.textContent = '';
  element.appendChild(oldNumber);
  element.appendChild(newNumber);

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Slide old number up and fade out
      oldNumber.style.transform = 'translateY(-100%)';
      oldNumber.style.opacity = '0';

      // Slide new number in and fade in
      newNumber.style.transform = 'translateY(0)';
      newNumber.style.opacity = '1';
    });
  });

  // Clean up after animation
  setTimeout(() => {
    element.textContent = toValue;
    element.removeAttribute('data-animating');
    // Restore original styles
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = '';
    }
    element.style.overflow = originalOverflow || '';
  }, duration);
}

// Image popup functionality
function showImagePopup(imageSrc, imageAlt, imageCaption) {
  // Create popup overlay
  const popup = document.createElement('div');
  popup.id = 'image-popup';
  popup.className = 'image-popup';

  // Create popup content
  const popupContent = document.createElement('div');
  popupContent.className = 'image-popup-content';

  // Create enlarged image
  const enlargedImg = document.createElement('img');
  enlargedImg.src = imageSrc;
  enlargedImg.alt = imageAlt;
  enlargedImg.className = 'image-popup-img';

  popupContent.appendChild(enlargedImg);

  // Add caption if exists
  if (imageCaption) {
    const caption = document.createElement('div');
    caption.className = 'image-popup-caption';
    caption.textContent = imageCaption;
    popupContent.appendChild(caption);
  }

  popup.appendChild(popupContent);
  document.body.appendChild(popup);

  // Close on mouse up or touch end anywhere
  const closeOnInteraction = () => {
    closeImagePopup();
    document.removeEventListener('mouseup', closeOnInteraction);
    document.removeEventListener('touchend', closeOnInteraction);
  };

  document.addEventListener('mouseup', closeOnInteraction);
  document.addEventListener('touchend', closeOnInteraction, { passive: true });

  // Close on Escape key
  document.addEventListener('keydown', handleEscapeKey);

  // Fade in
  setTimeout(() => {
    popup.classList.add('active');
  }, 10);
}

function closeImagePopup() {
  const popup = document.getElementById('image-popup');
  if (popup) {
    popup.classList.remove('active');
    setTimeout(() => {
      popup.remove();
      document.removeEventListener('keydown', handleEscapeKey);
    }, 300);
  }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeImagePopup();
  }
}

function initScrollytelling() {
  // Create chapter elements from config
  const storyContainer = document.getElementById('story');

  storyConfig.chapters.forEach((chapter, index) => {
    const chapterDiv = document.createElement('div');
    chapterDiv.id = chapter.id;
    const alignment = chapter.alignment || 'center';
    chapterDiv.className = `chapter align-${alignment}`;
    chapterDiv.dataset.chapterIndex = index;

    // Check if this is a title slide
    if (chapter.isTitleSlide) {
      chapterDiv.classList.add('title-slide');

      // Main wrapper
      const titleSlideWrapper = document.createElement('div');
      titleSlideWrapper.className = 'title-slide-wrapper';

      // Titles div (title + subtitle1 + subtitle2)
      const titlesDiv = document.createElement('div');
      titlesDiv.className = 'title-slide-titles';

            if (chapter.subtitle) {
        const subtitle1 = document.createElement('h1');
        subtitle1.className = 'title-slide-subtitle1';
        subtitle1.textContent = chapter.subtitle;
        titlesDiv.appendChild(subtitle1);
      }


      const title = document.createElement('h1');
      title.className = 'title-slide-title';
      title.textContent = chapter.title;
      titlesDiv.appendChild(title);


      if (chapter.subtitle2) {
        const subtitle2 = document.createElement('h2');
        subtitle2.className = 'title-slide-subtitle2';
        subtitle2.textContent = chapter.subtitle2;
        titlesDiv.appendChild(subtitle2);
      }

      titleSlideWrapper.appendChild(titlesDiv);

      // Instructions div
      if (chapter.instructions && chapter.instructions.length > 0) {
        const instructionsDiv = document.createElement('div');
        instructionsDiv.className = 'title-slide-instructions';

        chapter.instructions.forEach(instruction => {
          const instructionItem = document.createElement('p');
          instructionItem.textContent = instruction;
          instructionsDiv.appendChild(instructionItem);
        });

        titleSlideWrapper.appendChild(instructionsDiv);
      }

      // Button div
      const buttonDiv = document.createElement('div');
      buttonDiv.className = 'title-slide-button-container';

      const diveInButton = document.createElement('button');
      diveInButton.className = 'dive-in-button';
      diveInButton.textContent = 'Dive In';
      diveInButton.addEventListener('click', () => {
        // Scroll to chapter 1
        const chapter1 = document.getElementById('1');
        if (chapter1) {
          chapter1.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      buttonDiv.appendChild(diveInButton);

      titleSlideWrapper.appendChild(buttonDiv);
      chapterDiv.appendChild(titleSlideWrapper);
    } else {
      // Create wrapper for both content and image
      const chapterWrapper = document.createElement('div');
      chapterWrapper.className = 'chapter-wrapper';

      // Text content div
      const contentDiv = document.createElement('div');
      contentDiv.className = 'chapter-content';

      const title = document.createElement('h2');
      // Convert newlines in title to <br> tags for multi-line titles
      title.innerHTML = chapter.title.replace(/\n/g, '<br>');
      contentDiv.appendChild(title);

      if (chapter.description) {
        const description = document.createElement('p');
        // Parse description for <light> tags and convert newlines to <br>
        let processedDescription = chapter.description
          .replace(/\n/g, '<br>')  // Convert newlines to <br> tags
          .replace(/<light>(.*?)<\/light>/g, '<span class="highlight-text">$1</span>');
        description.innerHTML = processedDescription;
        contentDiv.appendChild(description);
      }

      if (chapter.descriptionSource) {
        const descSource = document.createElement('h4');
        descSource.className = 'chapter-source';
        descSource.textContent = chapter.descriptionSource;
        contentDiv.appendChild(descSource);
      }

      if (chapter.quote) {
        const quote = document.createElement('blockquote');
        quote.className = 'chapter-quote';
        // Parse quote for <light> tags and convert newlines to <br>
        let processedQuote = chapter.quote
          .replace(/\n/g, '<br>')  // Convert newlines to <br> tags
          .replace(/<light>(.*?)<\/light>/g, '<span class="highlight-text">$1</span>');
        quote.innerHTML = processedQuote;
        contentDiv.appendChild(quote);
      }

      if (chapter.quoteSource) {
        const quoteSource = document.createElement('h4');
        quoteSource.className = 'quote-source';
        quoteSource.textContent = chapter.quoteSource;
        contentDiv.appendChild(quoteSource);
      }

      chapterWrapper.appendChild(contentDiv);

      // Image div (separate from text content)
      if (chapter.image) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'chapter-image';

        const img = document.createElement('img');
        img.src = chapter.image;
        img.alt = chapter.title;
        img.style.cursor = 'pointer';

        // Add click and hold to enlarge image (mouse and touch support)
        let holdTimer;
        let isHoldingImage = false;

        // Function to start hold timer
        function startImageHold(e) {
          e.preventDefault();
          isHoldingImage = false;

          holdTimer = setTimeout(() => {
            isHoldingImage = true;
            showImagePopup(chapter.image, chapter.title, chapter.imageCaption);
          }, 200); // 200ms hold to trigger
        }

        // Function to cancel hold timer
        function cancelImageHold() {
          clearTimeout(holdTimer);
        }

        // Mouse events
        img.addEventListener('mousedown', startImageHold);
        img.addEventListener('mouseup', cancelImageHold);
        img.addEventListener('mouseleave', cancelImageHold);

        // Touch events for mobile
        img.addEventListener('touchstart', startImageHold, { passive: false });
        img.addEventListener('touchend', cancelImageHold);
        img.addEventListener('touchcancel', cancelImageHold);

        imageDiv.appendChild(img);

        if (chapter.imageCaption) {
          const caption = document.createElement('h4');
          caption.className = 'chapter-image-caption';
          caption.textContent = chapter.imageCaption;
          imageDiv.appendChild(caption);
        }

        chapterWrapper.appendChild(imageDiv);
      }

      // Add button for last chapter
      if (index === storyConfig.chapters.length - 1 && chapter.buttonText) {
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'chapter-button-container';

        const button = document.createElement('a');
        button.className = 'chapter-button';
        button.textContent = chapter.buttonText;

        if (chapter.buttonUrl) {
          button.href = chapter.buttonUrl;
          button.target = '_blank';
          button.rel = 'noopener noreferrer';
        } else {
          button.style.cursor = 'default';
        }

        buttonDiv.appendChild(button);
        chapterWrapper.appendChild(buttonDiv);
      }

      chapterDiv.appendChild(chapterWrapper);
    }

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
            activeChapterName = chapter.id;
            activeChapterIndex = chapterIndex;
            setActiveChapter(chapter, chapterIndex);
            updateArrowVisibility();
          }
        }
      });
    },
    {
      threshold: 0.2, // Trigger when 50% of chapter is visible
      rootMargin: '0px 0px -20% 0px'
    }
  );

  // Observe all chapters
  document.querySelectorAll('.chapter').forEach((chapter) => {
    observer.observe(chapter);
  });

  // Set the first chapter as active on page load
  if (storyConfig.chapters.length > 0) {
    const firstChapter = storyConfig.chapters[0];
    activeChapterIndex = 0;
    activeChapterName = firstChapter.id;
    setActiveChapter(firstChapter, 0);
  }

  // Set up next chapter arrow
  setupNextChapterArrow();
}

function setupNextChapterArrow() {
  const arrow = document.getElementById('scroll-indicator');

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

  // Initialize chapter navigation widget
  initChapterNavigation();
}

function initChapterNavigation() {
  const navMenu = document.getElementById('chapter-nav-menu');
  const navButton = document.getElementById('chapter-nav-button');

  // Populate chapter menu
  storyConfig.chapters.forEach((chapter, index) => {
    const navItem = document.createElement('div');
    navItem.className = 'chapter-nav-item';
    navItem.dataset.chapterIndex = index;

    const number = document.createElement('span');
    number.className = 'chapter-nav-item-number';
    number.textContent = `${chapter.id}.`;

    const title = document.createElement('span');
    title.className = 'chapter-nav-item-title';
    title.textContent = chapter.title;

    navItem.appendChild(number);
    navItem.appendChild(title);
    navMenu.appendChild(navItem);

    // Click handler to navigate to chapter
    navItem.addEventListener('click', () => {
      const targetChapter = document.querySelector(`[data-chapter-index="${index}"]`);
      if (targetChapter) {
        // Immediately update active chapter state
        activeChapterIndex = index;
        activeChapterName = chapter.id;
        setActiveChapter(chapter, index);
        updateArrowVisibility();

        // Scroll to chapter
        targetChapter.scrollIntoView({ behavior: 'smooth', block: 'center' });
        navMenu.classList.add('hidden');
      }
    });
  });

  // Toggle menu on button click
  navButton.addEventListener('click', () => {
    navMenu.classList.toggle('hidden');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!document.getElementById('chapter-nav-widget').contains(e.target)) {
      navMenu.classList.add('hidden');
    }
  });

  // Initial update
  updateChapterNavigationCounter();
}

function updateArrowVisibility() {
  const arrow = document.getElementById('scroll-indicator');
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

  // Update year timeline with animation
  const yearValue = document.getElementById('year-value');
  const currentYear = yearValue.textContent;
  if (chapter.year && chapter.year !== currentYear) {
    animateNumber(yearValue, currentYear, chapter.year, 1500);
  } else if (!chapter.year) {
    yearValue.textContent = '';
  }

  // Update population display with animation
  const populationValue = document.getElementById('population-value');
  const currentPopulation = populationValue.textContent;
  if (chapter.population && chapter.population !== currentPopulation) {
    animateNumber(populationValue, currentPopulation, chapter.population, 1500);
  } else if (!chapter.population) {
    populationValue.textContent = '';
  }

  // Hide/show UI elements based on title slide
  const instructionsPanel = document.getElementById('instructions-panel');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const chapterNavWidget = document.getElementById('chapter-nav-widget');
  const mapLegend = document.getElementById('map-legend');

  if (chapter.isTitleSlide) {
    // Hide UI elements on title slide
    if (instructionsPanel) instructionsPanel.style.display = 'none';
    if (scrollIndicator) scrollIndicator.style.display = 'none';
    if (chapterNavWidget) chapterNavWidget.style.display = 'none';
  } else {
    // Show UI elements on regular chapters
    if (instructionsPanel) instructionsPanel.style.display = '';
    if (scrollIndicator) scrollIndicator.style.display = '';
    if (chapterNavWidget) chapterNavWidget.style.display = '';
  }

  // Show legend only on chapter 2 (id === '2')
  if (mapLegend) {
    if (chapter.id === '2') {
      mapLegend.style.display = 'block';
    } else {
      mapLegend.style.display = 'none';
    }
  }

  // Animate map to chapter location
  if (chapter.bounds) {
    // Determine which bounds to use based on screen size
    let boundsToUse = chapter.bounds; // Default to desktop bounds
    let boundsType = 'desktop';

    const screenWidth = window.innerWidth;

    // Check for mobile bounds (phones - max 400px)
    if (screenWidth <= 400 && chapter.boundsMobile) {
      boundsToUse = chapter.boundsMobile;
      boundsType = 'mobile';
    }
    // Check for iPad portrait bounds (401px to 768px)
    else if (screenWidth > 400 && screenWidth <= 768 && chapter.boundsIpadPortrait) {
      boundsToUse = chapter.boundsIpadPortrait;
      boundsType = 'iPad Portrait';
    }
    // Check for iPad landscape bounds (769px to 1024px)
    else if (screenWidth > 768 && screenWidth <= 1024 && chapter.boundsIpad) {
      boundsToUse = chapter.boundsIpad;
      boundsType = 'iPad Landscape';
    }

    console.log(`Chapter ${chapter.id}: Using ${boundsType} bounds`, boundsToUse);

    // Use bounding box
    map.fitBounds(boundsToUse, {
      pitch: chapter.pitch || 0,
      bearing: chapter.bearing || 0,
      duration: chapter.duration || 2000,
      essential: true,
      padding: 0,
    });
  } else {
    console.log(`Chapter ${chapter.id}: Using center/zoom`, chapter.center, chapter.zoom);

    // Use center and zoom
    map.flyTo({
      center: chapter.center,
      zoom: chapter.zoom,
      pitch: chapter.pitch || 0,
      bearing: chapter.bearing || 0,
      duration: chapter.duration || 2000,
      essential: true
    });
  }

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

  // Update layer manager to show only visible layers for this chapter
  updateLayerManager(chapter);

  // Execute onChapterEnter callbacks
  if (chapter.onChapterEnter && chapter.onChapterEnter.length > 0) {
    chapter.onChapterEnter.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  // Update chapter navigation counter
  updateChapterNavigationCounter();
}

function updateChapterNavigationCounter() {
  const navCounter = document.getElementById('chapter-nav-counter');
  if (navCounter && activeChapterIndex !== null) {
    // Use chapter ID from config for current chapter
    const currentChapter = storyConfig.chapters[activeChapterIndex];

    // Don't show counter for title slide
    if (currentChapter.isTitleSlide) {
      navCounter.textContent = '';
      return;
    }

    // Calculate total excluding title slide
    const totalChapters = storyConfig.chapters.filter(ch => !ch.isTitleSlide).length;
    const actualChapterNumber = currentChapter.id;
    navCounter.textContent = `${actualChapterNumber}/${totalChapters}`;

    // Update active state in menu
    document.querySelectorAll('.chapter-nav-item').forEach((item) => {
      const chapterIndex = parseInt(item.dataset.chapterIndex);
      if (chapterIndex === activeChapterIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}

//#endregion


