// ═══════════════════════════════════════════════════════════════════════════
//  charts.js  —  Reusable Chart.js helpers for the Audit Dashboard
//  Requires Chart.js 4 to be loaded before this file.
// ═══════════════════════════════════════════════════════════════════════════


// ─── Fallback colour palette (used when a value has no matching key) ─────────

const _FALLBACK_PALETTE = [
    '#4a90d9', '#e8a838', '#4caf50', '#e05252', '#9c6ee0',
    '#26b5a8', '#f06292', '#8d6e63', '#78909c', '#aab724',
];


// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Resolves `container` to a .chart-slot DOM element. Accepts:
 *   - A DOM element                          → passed through unchanged
 *   - '#some-id'  or  'some-id'              → document.getElementById lookup,
 *                                              then finds .chart-slot inside it
 *   - A sub-section label string             → matches [slot="summary"] text
 *                                              (case-insensitive) and returns
 *                                              the .chart-slot inside that wa-details
 *
 * Examples:
 *   container: 'Retaining Wall'          // label match
 *   container: '#panel-infrastructure'   // id match → first .chart-slot in panel
 *   container: 'panel-infrastructure'    // same, without the #
 */
function _resolveContainer(container) {
    if (container instanceof Element) return container;

    const raw = String(container).trim();

    // ID lookup: '#foo' or 'foo' where document.getElementById('foo') exists
    const idStr = raw.startsWith('#') ? raw.slice(1) : raw;
    const byId = document.getElementById(idStr);
    if (byId) return byId.querySelector('.chart-slot') || byId;

    // Label lookup: match [slot="summary"] text inside nested wa-details
    const label = raw.toLowerCase();
    for (const details of document.querySelectorAll('wa-details wa-details')) {
        const summary = details.querySelector('[slot="summary"]');
        if (summary && summary.textContent.trim().toLowerCase() === label) {
            return details.querySelector('.chart-slot');
        }
    }

    console.warn(`charts.js: no sub-section or element found for "${container}"`);
    return null;
}

/**
 * Clears `container`, appends a fresh <canvas>, and returns it.
 * Destroys any existing Chart.js instance on the old canvas first.
 */
function _createCanvas(container) {
    const existing = container.querySelector('canvas');
    if (existing && existing._chartInstance) {
        existing._chartInstance.destroy();
    }
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    return canvas;
}

/**
 * Counts occurrences of each unique value for `field` across `data`.
 * Null / undefined / empty-string values are skipped.
 * Returns { value: count, ... } sorted by count descending.
 */
function _countValues(data, field) {
    const counts = {};
    for (const row of data) {
        const val = row[field];
        if (val == null || val === '') continue;
        counts[val] = (counts[val] || 0) + 1;
    }
    return Object.fromEntries(
        Object.entries(counts).sort((a, b) => b[1] - a[1])
    );
}

/**
 * Resolves an array of background colours for the given raw CSV keys.
 * Looks up each key in `colors` (case-insensitive).
 * Falls back to _FALLBACK_PALETTE for any unmatched key.
 *
 * @param {string[]} rawKeys
 * @param {object|undefined} colors   e.g. { 'good': '#4caf50', 'poor': '#ef5350' }
 * @returns {string[]}
 */
function _resolveColors(rawKeys, colors) {
    return rawKeys.map((key, i) => {
        if (!colors) return _FALLBACK_PALETTE[i % _FALLBACK_PALETTE.length];
        const match = Object.keys(colors).find(
            k => k.toLowerCase() === String(key).toLowerCase()
        );
        return match ? colors[match] : _FALLBACK_PALETTE[i % _FALLBACK_PALETTE.length];
    });
}

/**
 * Maps raw CSV values to display names for chart labels.
 * Looks up each key in `labelMap` (case-insensitive).
 * Falls back to the original value for any unmapped key.
 *
 * @param {string[]} rawKeys
 * @param {object|undefined} labelMap   e.g. { 'yes': 'Present', 'no': 'Absent' }
 * @returns {string[]}
 */
function _resolveLabels(rawKeys, labelMap) {
    if (!labelMap) return rawKeys;
    return rawKeys.map(k => {
        const match = Object.keys(labelMap).find(
            m => m.toLowerCase() === String(k).toLowerCase()
        );
        return match ? labelMap[match] : k;
    });
}


// ─── Chart functions ──────────────────────────────────────────────────────────

/**
 * Renders a Pie (or Donut) chart showing the distribution of a categorical field.
 *
 * @param {object}      opts
 * @param {HTMLElement} opts.container   .chart-slot element to render into
 * @param {object[]}    opts.data        Array of row objects from PapaParse
 * @param {string}      opts.field       CSV column name to aggregate
 * @param {object}      [opts.colors]    { 'csv_value': '#hexcolor', ... }
 * @param {object}      [opts.labels]    { 'csv_value': 'Display Name', ... }
 * @param {string}      [opts.title]     Chart title
 * @param {boolean}     [opts.donut]     Render as donut instead of pie (default: false)
 */
function makePieChart({ container, data, field, colors, labels: labelMap, title, donut = false }) {
    const el = _resolveContainer(container);
    if (!el) return;
    const canvas = _createCanvas(el);
    const counts = _countValues(data, field);
    const rawKeys = Object.keys(counts);
    const labels = _resolveLabels(rawKeys, labelMap);
    const values = rawKeys.map(k => counts[k]);
    const bgColors = _resolveColors(rawKeys, colors);

    const chart = new Chart(canvas, {
        type: donut ? 'doughnut' : 'pie',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 1,
                borderColor: '#fff',
            }],
        },
        options: {
            responsive: true,
            plugins: {
                title:  title ? { display: true, text: title, font: { size: 13 } } : { display: false },
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: { callbacks: {
                    label: ctx => ` ${ctx.label}: ${ctx.parsed} (${
                        Math.round(ctx.parsed / values.reduce((a,b) => a+b, 0) * 100)
                    }%)`,
                }},
            },
        },
    });
    canvas._chartInstance = chart;
}

/**
 * Renders a Bar chart showing counts of a categorical field.
 *
 * @param {object}      opts
 * @param {HTMLElement} opts.container    .chart-slot element to render into
 * @param {object[]}    opts.data         Array of row objects from PapaParse
 * @param {string}      opts.field        CSV column name to aggregate
 * @param {object}      [opts.colors]     { 'csv_value': '#hexcolor', ... }
 * @param {object}      [opts.labels]     { 'csv_value': 'Display Name', ... }
 * @param {string}      [opts.title]      Chart title
 * @param {boolean}     [opts.horizontal] Flip to horizontal bars (default: false)
 */
function makeBarChart({ container, data, field, colors, labels: labelMap, title, horizontal = false }) {
    const el = _resolveContainer(container);
    if (!el) return;
    const canvas = _createCanvas(el);
    const counts = _countValues(data, field);
    const rawKeys = Object.keys(counts);
    const labels = _resolveLabels(rawKeys, labelMap);
    const values = rawKeys.map(k => counts[k]);
    const bgColors = _resolveColors(rawKeys, colors);

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 0,
                borderRadius: 3,
            }],
        },
        options: {
            indexAxis: horizontal ? 'y' : 'x',
            responsive: true,
            plugins: {
                title:  title ? { display: true, text: title, font: { size: 13 } } : { display: false },
                legend: { display: false },
            },
            scales: {
                x: { grid: { display: horizontal  }, ticks: { font: { size: 11 } } },
                y: { grid: { display: !horizontal, color: '#f0f0f0' }, beginAtZero: true, ticks: { font: { size: 11 } } },
            },
        },
    });
    canvas._chartInstance = chart;
}

/**
 * Renders a Histogram for a numeric field, binned into equal-width buckets.
 *
 * @param {object}        opts
 * @param {HTMLElement}   opts.container  .chart-slot element to render into
 * @param {object[]}      opts.data       Array of row objects from PapaParse
 * @param {string}        opts.field      Numeric CSV column name
 * @param {string}        [opts.color]    Single hex colour for all bars (default: '#4a90d9')
 * @param {string}        [opts.title]    Chart title
 * @param {number}        [opts.bins]     Number of buckets (default: 10)
 */
function makeHistogram({ container, data, field, color = '#4a90d9', title, bins = 10 }) {
    const el = _resolveContainer(container);
    if (!el) return;
    const canvas = _createCanvas(el);
    const values = data
        .map(row => parseFloat(row[field]))
        .filter(v => !isNaN(v));

    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins || 1;

    const buckets = Array.from({ length: bins }, (_, i) => ({
        label: `${(min + i * binSize).toFixed(1)}–${(min + (i + 1) * binSize).toFixed(1)}`,
        count: 0,
    }));

    for (const v of values) {
        const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
        buckets[idx].count++;
    }

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: buckets.map(b => b.label),
            datasets: [{
                data: buckets.map(b => b.count),
                backgroundColor: color,
                borderWidth: 0,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                title:  title ? { display: true, text: title, font: { size: 13 } } : { display: false },
                legend: { display: false },
            },
            scales: {
                x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } } },
            },
        },
    });
    canvas._chartInstance = chart;
}


// ═══════════════════════════════════════════════════════════════════════════
//  CHART CALL TEMPLATES
//  Fill in the color constants and uncomment each call when ready.
//  `data` should be the array of merged records from your data loader.
// ═══════════════════════════════════════════════════════════════════════════

// #region Infrastructure ──────────────────────────────────────────────────────

const WALL_CONDITION_COLORS  = { 'good': '#4caf50', 'fair': '#ffb300', 'poor': '#ef5350', 'critical': '#9c27b0'};
const WALL_CONDITION_LABELS  = { 'intact': 'Intact', 'fair': 'Fair', 'poor': 'Poor', 'critical': 'Critical' };

const WALL_MATERIAL_COLORS   = { /* 'concrete': '#78909c', 'brick': '#8d6e63', 'stone': '#aaa' */ };
const WALL_MATERIAL_LABELS   = { /* 'concrete': 'Concrete', 'brick': 'Brick', 'stone': 'Stone' */ };

const BRIDGE_TYPE_COLORS     = { /* 'concrete': '#4a90d9', 'steel': '#78909c', 'timber': '#8d6e63' */ };
const BRIDGE_TYPE_LABELS     = { /* 'concrete': 'Concrete', 'steel': 'Steel', 'timber': 'Timber' */ };

const BRIDGE_CONDITION_COLORS = { /* 'good': '#4caf50', 'fair': '#ffb300', 'poor': '#ef5350' */ };
const BRIDGE_CONDITION_LABELS = { /* 'good': 'Good', 'fair': 'Fair', 'poor': 'Poor' */ };

const PIERS_CONDITION_COLORS = { /* 'good': '#4caf50', 'fair': '#ffb300', 'poor': '#ef5350' */ };
const PIERS_CONDITION_LABELS = { /* 'good': 'Good', 'fair': 'Fair', 'poor': 'Poor' */ };

const ELEC_CONDITION_COLORS  = { /* 'good': '#4caf50', 'fair': '#ffb300', 'poor': '#ef5350' */ };
const ELEC_CONDITION_LABELS  = { /* 'good': 'Good', 'fair': 'Fair', 'poor': 'Poor' */ };

const CABLES_CONDITION_COLORS = { /* 'good': '#4caf50', 'fair': '#ffb300', 'poor': '#ef5350' */ };
const CABLES_CONDITION_LABELS = { /* 'good': 'Good', 'fair': 'Fair', 'poor': 'Poor' */ };

const MANHOLES_CONDITION_COLORS = { /* 'good': '#4caf50', 'fair': '#ffb300', 'poor': '#ef5350' */ };
const MANHOLES_CONDITION_LABELS = { /* 'good': 'Good', 'fair': 'Fair', 'poor': 'Poor' */ };

function renderInfrastructureCharts(data) {
    makePieChart({ container: 'Retaining Wall',
                   data, field: 'wall_condition',
                   colors: WALL_CONDITION_COLORS, labels: WALL_CONDITION_LABELS,
                   title: 'Wall Condition' });

    makeBarChart({ container: 'Bridge',            data, field: 'bridge_type',      colors: BRIDGE_TYPE_COLORS,      labels: BRIDGE_TYPE_LABELS,      title: 'Bridge Type'          });
    makePieChart({ container: 'Piers',             data, field: 'piers_condition',  colors: PIERS_CONDITION_COLORS,  labels: PIERS_CONDITION_LABELS,  title: 'Piers Condition'      });
    makeBarChart({ container: 'Electrical',        data, field: 'elec_condition',   colors: ELEC_CONDITION_COLORS,   labels: ELEC_CONDITION_LABELS,   title: 'Electrical Condition' });
    makeBarChart({ container: 'Cables & Manholes', data, field: 'cables_condition', colors: CABLES_CONDITION_COLORS, labels: CABLES_CONDITION_LABELS, title: 'Cables Condition'     });
}

// #endregion Infrastructure


// #region Water Quality ────────────────────────────────────────────────────────

const INLETS_COLORS              = { /* 'yes': '#4a90d9', 'no': '#e0e0e0' */ };
const INLETS_LABELS              = { /* 'yes': 'Present', 'no': 'None' */ };

const UNAUTHORISED_INLETS_COLORS = { /* 'yes': '#ef5350', 'no': '#4caf50' */ };
const UNAUTHORISED_INLETS_LABELS = { /* 'yes': 'Unauthorised', 'no': 'Authorised' */ };

const WATER_STAGNANT_COLORS      = { /* 'flowing': '#4a90d9', 'stagnant': '#e8a838' */ };
const WATER_STAGNANT_LABELS      = { /* 'flowing': 'Flowing', 'stagnant': 'Stagnant' */ };

const WATER_CONTAMINATION_COLORS = { /* 'none': '#4caf50', 'low': '#ffb300', 'medium': '#ef5350', 'high': '#9c27b0' */ };
const WATER_CONTAMINATION_LABELS = { /* 'none': 'None', 'low': 'Low', 'medium': 'Medium', 'high': 'High' */ };

const WATER_COLOUR_COLORS        = { 'clear': '#b3e5fc', 'brown': '#8d6e63', 'green': '#4caf50', 'grey': '#90a4ae' };
const WATER_COLOUR_LABELS        = { /* 'clear': 'Clear', 'brown': 'Brown', 'green': 'Green', 'grey': 'Grey' */ };

const WATER_TURBIDITY_COLORS     = { /* 'clear': '#b3e5fc', 'slightly turbid': '#e8a838', 'turbid': '#ef5350' */ };
const WATER_TURBIDITY_LABELS     = { /* 'clear': 'Clear', 'slightly turbid': 'Slightly Turbid', 'turbid': 'Turbid' */ };

const WATER_SMELL_COLORS         = { /* 'none': '#4caf50', 'mild': '#ffb300', 'strong': '#ef5350' */ };
const WATER_SMELL_LABELS         = { /* 'none': 'None', 'mild': 'Mild', 'strong': 'Strong' */ };

const SW_INSIDE_COLORS           = { /* 'yes': '#ef5350', 'no': '#4caf50' */ };
const SW_INSIDE_LABELS           = { /* 'yes': 'Present', 'no': 'None' */ };

const SW_OUTSIDE_COLORS          = { /* 'yes': '#ef5350', 'no': '#4caf50' */ };
const SW_OUTSIDE_LABELS          = { /* 'yes': 'Present', 'no': 'None' */ };

function renderWaterQualityCharts(data) {
    makeBarChart({ container: 'Inlets',                data, field: 'inlets',              colors: INLETS_COLORS,              labels: INLETS_LABELS,              title: 'Inlets'                  });
    makePieChart({ container: 'Water Flow',            data, field: 'water_stagnant',      colors: WATER_STAGNANT_COLORS,      labels: WATER_STAGNANT_LABELS,      title: 'Water Flow'              });
    makeBarChart({ container: 'Contamination',         data, field: 'water_contamination', colors: WATER_CONTAMINATION_COLORS, labels: WATER_CONTAMINATION_LABELS, title: 'Contamination'           });
    makePieChart({ container: 'Solid Waste — Inside',  data, field: 'sw_inside',           colors: SW_INSIDE_COLORS,           labels: SW_INSIDE_LABELS,           title: 'Solid Waste (Inside)'    });
    makePieChart({ container: 'Solid Waste — Outside', data, field: 'sw_outside',          colors: SW_OUTSIDE_COLORS,          labels: SW_OUTSIDE_LABELS,          title: 'Solid Waste (Outside)'   });
}

// #endregion Water Quality


// #region Community Engagement ────────────────────────────────────────────────

const SW_CLEAN_UP_COLORS          = { /* 'yes': '#4caf50', 'no': '#ef5350' */ };
const SW_CLEAN_UP_LABELS          = { /* 'yes': 'Active', 'no': 'None' */ };

const COMMUNITY_ENGAGEMENT_COLORS = { /* 'high': '#4caf50', 'medium': '#ffb300', 'low': '#ef5350', 'none': '#e0e0e0' */ };
const COMMUNITY_ENGAGEMENT_LABELS = { /* 'high': 'High', 'medium': 'Medium', 'low': 'Low', 'none': 'None' */ };

function renderCommunityCharts(data) {
    makePieChart({ container: 'Cleanup Efforts',         data, field: 'sw_clean_up',         colors: SW_CLEAN_UP_COLORS,          labels: SW_CLEAN_UP_LABELS,          title: 'Cleanup Efforts'           });
    makeBarChart({ container: 'Community Participation', data, field: 'community_engagement', colors: COMMUNITY_ENGAGEMENT_COLORS, labels: COMMUNITY_ENGAGEMENT_LABELS, title: 'Community Participation'   });
    makeBarChart({ container: 'Waste Comparison',        data, field: 'sw_inside',            colors: SW_INSIDE_COLORS,            labels: SW_INSIDE_LABELS,            title: 'Waste — Inside vs Outside' });
}

// #endregion Community Engagement
