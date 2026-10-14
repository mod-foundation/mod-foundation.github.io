// ═══════════════════════════════════════════════════════════════════════════
//  tour.js — Guided onboarding tour for the Audit Dashboard, built on Driver.js v1
//  (loaded from jsDelivr in index.html). Runs after script.js / charts.js.
//
//  Nothing in this file renames, moves or restructures any existing element,
//  ID, class or function — it only reads the DOM that script.js/charts.js/
//  index.html already produce, and adds its own button + overlay on top.
//
//  To remove the tour entirely: delete this file and tour.css, and remove the
//  <!-- TOUR --> marked blocks from index.html (Driver.js <link>/<script> tags,
//  the tour.css <link>, the tour.js <script>, and the "Take the tour" button).
// ═══════════════════════════════════════════════════════════════════════════

// Single on/off switch. Set to false to disable the tour and hide the
// "Take the tour" button — no other behaviour changes when this is false.
const TOUR_ENABLED = true;

(function () {
    const SEEN_KEY = 'auditDashboardTourSeen_v1';

    // Mirrors the breakpoint styles.css uses for #desktop-overlay
    // (`@media (max-width: 1024px)` shows the "open on a larger screen"
    // overlay and hides the rest of the dashboard) — the tour must never run
    // underneath that overlay.
    const DESKTOP_QUERY = '(min-width: 1025px)';

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function safeGet(key) {
        // localStorage can throw (not just return null) inside a sandboxed/
        // storage-blocked iframe, which is how this dashboard is embedded on
        // the WordPress site — every access is wrapped accordingly.
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // Storage blocked — the tour will simply show again next visit.
        }
    }

    function isDesktop() {
        return window.matchMedia(DESKTOP_QUERY).matches;
    }

    function hideTourButton() {
        const btn = document.getElementById('tour-btn');
        if (btn) btn.style.display = 'none';
    }

    if (!TOUR_ENABLED) {
        ready(hideTourButton);
        return;
    }

    // Each step's `element` is a CSS selector checked against the live DOM
    // right before the tour starts; steps whose target doesn't currently
    // exist are filtered out below instead of breaking the tour sequence.
    const TOUR_STEPS = [
        {
            element: '#dashboard-title',
            popover: {
                title: 'Welcome',
                description: 'This dashboard shows citizen audits of stormwater drains across Bengaluru — infrastructure, water quality and community engagement, all mapped point by point.',
            },
        },
        {
            // MapLibre draws everything onto a <canvas>, so individual map
            // features can't be spotlighted on their own — the whole
            // container is highlighted instead.
            element: '#map-container',
            popover: {
                title: 'The map',
                description: 'Click any audit point to see its photos and recorded values in the panels on either side.',
            },
        },
        {
            element: '.point-nav-ctrl',
            popover: {
                title: 'Step through points',
                description: 'Use these buttons — or the ← and → arrow keys — to jump to the previous or next audit point.',
            },
        },
        {
            element: '#filter-row',
            popover: {
                title: 'Filters',
                description: 'Narrow the map down by team, drain ID, corporation or valley.',
            },
        },
        {
            element: '#reset-filters-btn',
            popover: {
                title: 'Reset filters',
                description: 'Clear every active filter and chart selection to bring back the full dataset.',
            },
        },
        {
            element: '#cat-retaining-wall .attr-select',
            popover: {
                title: 'Recolour the map',
                description: 'Pick an attribute in any category panel to recolour the map points by that value.',
            },
        },
        {
            element: '#cat-retaining-wall .chart-slot',
            popover: {
                title: 'Filter by chart',
                description: 'Click a bar in a chart to filter the map down to audit points with that value.',
            },
        },
        {
            element: '.layer-manager',
            popover: {
                title: 'Layers & basemap',
                description: 'Turn map layers on or off and switch between basemaps here.',
            },
        },
        {
            element: '.upload-ctrl',
            popover: {
                title: 'Upload your own data',
                description: 'Add a KML file to overlay your own layer on top of the map.',
            },
        },
        {
            element: '.download-ctrl',
            popover: {
                title: 'Download the data',
                description: 'Open the download centre to get the underlying audit datasets.',
            },
        },
        {
            element: '#stats',
            popover: {
                title: 'Summary stats',
                description: 'A running total of auditors, drain length audited and residents engaged so far.',
            },
        },
    ];

    function buildDriver() {
        if (!window.driver || !window.driver.js || typeof window.driver.js.driver !== 'function') {
            console.warn('tour.js: Driver.js failed to load — skipping tour.');
            return null;
        }
        const steps = TOUR_STEPS.filter(step => {
            try {
                return !!document.querySelector(step.element);
            } catch (e) {
                return false;
            }
        });
        if (!steps.length) return null;

        return window.driver.js.driver({
            showProgress: true,
            allowClose: true,
            skipMissingElement: true, // extra safety net alongside the filter above
            overlayOpacity: 0.6,
            popoverClass: 'audit-tour-popover',
            nextBtnText: 'Next',
            prevBtnText: 'Back',
            doneBtnText: 'Done',
            steps,
        });
    }

    function startTour() {
        if (!isDesktop()) return;
        const driverInstance = buildDriver();
        if (!driverInstance) return;
        driverInstance.drive();
    }

    // Several targets (point nav, layer manager, upload/download controls)
    // are added asynchronously inside script.js's map.on('load', ...)
    // handler, after it awaits loadAuditData(). `.point-nav-ctrl` is created
    // right after that await resolves, with the layer manager and
    // upload/download controls added immediately around it in the same
    // synchronous block — so its presence is a reliable, single signal that
    // every map-load-dependent tour target now exists.
    function whenControlsReady(callback, attemptsLeft) {
        if (attemptsLeft === undefined) attemptsLeft = 75; // ~15s at 200ms steps
        if (document.querySelector('.point-nav-ctrl') || attemptsLeft <= 0) {
            callback();
            return;
        }
        setTimeout(() => whenControlsReady(callback, attemptsLeft - 1), 200);
    }

    function initTourButton() {
        const btn = document.getElementById('tour-btn');
        if (!btn) return;
        btn.addEventListener('click', startTour);
    }

    ready(() => {
        initTourButton();

        whenControlsReady(() => {
            if (!isDesktop()) return;
            if (safeGet(SEEN_KEY)) return;
            safeSet(SEEN_KEY, '1');
            startTour();
        });
    });
})();
