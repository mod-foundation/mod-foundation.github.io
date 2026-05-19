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

    // data-chart attribute lookup
    const byAttr = document.querySelector(`.chart-slot[data-chart="${raw}"]`);
    if (byAttr) return byAttr;

    // Label lookup: match [slot="summary"] text inside nested wa-details
    const label = raw.toLowerCase();
    for (const details of document.querySelectorAll('wa-details')) {
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
        const lk = String(key).toLowerCase();
        const match = Object.keys(colors).find(k => lk === k.toLowerCase() || lk.includes(k.toLowerCase()));
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
function _wrapLegendText(text, maxChars = 18) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length > maxChars && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    return lines.length === 1 ? lines[0] : lines;
}

function _resolveLabels(rawKeys, labelMap) {
    if (!labelMap) return rawKeys;
    return rawKeys.map(k => {
        const lk = String(k).toLowerCase();
        const match = Object.keys(labelMap).find(m => lk === m.toLowerCase() || lk.includes(m.toLowerCase()));
        return match ? labelMap[match] : k;
    });
}

function _filterIgnored(rawKeys, ignore) {
    if (!ignore) return rawKeys;
    const list = (Array.isArray(ignore) ? ignore : [ignore]).map(v => String(v).toLowerCase());
    return rawKeys.filter(k => !list.includes(String(k).toLowerCase()));
}

function _setChartFilter(field, visibleRawKeys, allRawKeys) {
    if (visibleRawKeys.length === allRawKeys.length) {
        delete window._chartFilters[field];
    } else {
        window._chartFilters[field] = new Set(visibleRawKeys);
    }
    if (typeof window._applyChartFilters === 'function') window._applyChartFilters();
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
function makePieChart({ container, data, field, colors, labels: labelMap, title, donut = false, ignore, interactive = true }) {
    if (window._chartFilters?.[field]) return;
    const el = _resolveContainer(container);
    if (!el) return;

    // Destroy any existing chart then rebuild slot with canvas + scrollable legend
    const existing = el.querySelector('canvas');
    if (existing?._chartInstance) existing._chartInstance.destroy();
    el.innerHTML = '';

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'chart-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvasWrap.appendChild(canvas);
    const legendDiv = document.createElement('div');
    legendDiv.className = 'chart-legend-div';
    el.appendChild(canvasWrap);
    el.appendChild(legendDiv);

    const counts = _countValues(data, field);
    const rawKeys = _filterIgnored(Object.keys(counts), ignore);
    const labels = _resolveLabels(rawKeys, labelMap);
    const values = rawKeys.map(k => counts[k]);
    const bgColors = _resolveColors(rawKeys, colors);
    const total = values.reduce((a, b) => a + b, 0);

    const htmlLegendPlugin = {
        id: 'htmlLegend',
        afterUpdate(chart) {
            legendDiv.innerHTML = '';
            const ul = document.createElement('ul');
            ul.className = 'chart-legend-list';
            (chart.legend?.legendItems || []).forEach(item => {
                const li = document.createElement('li');
                li.className = 'chart-legend-item' + (item.hidden ? ' is-hidden' : '');

                const box = document.createElement('span');
                box.className = 'chart-legend-box';
                box.style.background = item.fillStyle;

                const text = document.createElement('span');
                text.className = 'chart-legend-text';
                text.textContent = Array.isArray(item.text) ? item.text.join(' ') : item.text;

                if (interactive) {
                    li.style.cursor = 'pointer';
                    li.addEventListener('click', () => {
                        const idx = item.index;
                        const wasVisible = chart.getDataVisibility(idx);
                        chart.toggleDataVisibility(idx);
                        chart.update();
                        const visible = rawKeys.filter((_, i) => i === idx ? !wasVisible : chart.getDataVisibility(i));
                        _setChartFilter(field, visible, rawKeys);
                    });
                }

                li.appendChild(box);
                li.appendChild(text);
                ul.appendChild(li);
            });
            legendDiv.appendChild(ul);
        },
    };

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
            maintainAspectRatio: false,
            plugins: {
                title:   { display: false },
                legend:  { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${Math.round(ctx.parsed / total * 100)}%`,
                        title: () => '',
                    },
                },
            },
            ...(interactive && {
                onClick(e, elements, chart) {
                    if (!elements.length) return;
                    const idx = elements[0].index;
                    const wasVisible = chart.getDataVisibility(idx);
                    chart.toggleDataVisibility(idx);
                    chart.update();
                    const visible = rawKeys.filter((_, i) => i === idx ? !wasVisible : chart.getDataVisibility(i));
                    _setChartFilter(field, visible, rawKeys);
                },
            }),
        },
        plugins: [htmlLegendPlugin],
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
function makeBarChart({ container, data, field, colors, labels: labelMap, title, horizontal = false, ignore, interactive = true }) {
    if (window._chartFilters?.[field]) return;
    const el = _resolveContainer(container);
    if (!el) return;
    const canvas = _createCanvas(el);
    const counts = _countValues(data, field);
    const rawKeys = _filterIgnored(Object.keys(counts), ignore);
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
            maintainAspectRatio: false,
            plugins: {
                title:    { display: false },
                subtitle: { display: !!title, text: title, align: 'start', position : 'bottom', font: { size: 13 }, padding: { top: 12 } },
                legend: { display: false },
            },
            scales: {
                x: { grid: { display: horizontal  }, ticks: { font: { size: 11 } } },
                y: { grid: { display: !horizontal, color: '#f0f0f0' }, beginAtZero: true, ticks: { font: { size: 11 } } },
            },
            ...(interactive && {
                onClick(e, elements, chart) {
                    if (!elements.length) return;
                    const idx = elements[0].index;
                    const key = rawKeys[idx];
                    if (chart._hiddenKeys.has(key)) chart._hiddenKeys.delete(key);
                    else chart._hiddenKeys.add(key);
                    chart.data.datasets[0].backgroundColor = rawKeys.map((k, i) =>
                        chart._hiddenKeys.has(k) ? 'rgba(180,180,180,0.35)' : bgColors[i]
                    );
                    chart.update();
                    _setChartFilter(field, rawKeys.filter(k => !chart._hiddenKeys.has(k)), rawKeys);
                },
            }),
        },
    });
    chart._hiddenKeys = new Set();
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
function makeHistogram({ container, data, field, color = '#4a90d9', title, bins = 10, fixedMin, step }) {
    const el = _resolveContainer(container);
    if (!el) return;
    const canvas = _createCanvas(el);
    const values = data
        .map(row => parseFloat(row[field]))
        .filter(v => !isNaN(v));

    if (values.length === 0) return;

    let min, binSize, numBins;
    if (fixedMin !== undefined && step !== undefined) {
        min = fixedMin;
        binSize = step;
        numBins = Math.max(1, Math.ceil((Math.max(...values) - min) / step));
    } else {
        min = Math.min(...values);
        binSize = (Math.max(...values) - min) / bins || 1;
        numBins = bins;
    }

    const buckets = Array.from({ length: numBins }, (_, i) => ({
        label: `${min + i * binSize}–${min + (i + 1) * binSize}`,
        count: 0,
    }));

    for (const v of values) {
        const idx = Math.min(Math.floor((v - min) / binSize), numBins - 1);
        if (idx >= 0) buckets[idx].count++;
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
            maintainAspectRatio: false,
            plugins: {
                title:    { display: false },
                subtitle: { display: !!title, text: title, align: 'start', position: 'bottom', font: { size: 13 }, padding: { top: 12 } },
                legend: { display: false },
            },
            scales: {
                x: { beginAtZero: false,grid: { display: false }, ticks: { stepSize: 1, precision: 0, maxRotation: 90, font: { size: 10 } } },
                y: { beginAtZero: false, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1, precision: 0, font: { size: 11 } } },
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

window._chartFilters = {};

// #region Infrastructure ──────────────────────────────────────────────────────

const WALL_CONDITION_COLORS  = { 'intact': '#4caf50', 'broken': '#ffb300', 'exist': '#ef5350', 'critical': '#9c27b0'};
const WALL_CONDITION_LABELS  = { 'intact': 'Intact', 'broken': 'Broken', 'exist': 'Does Not Exist', 'critical': 'Critical' };

const WALL_MATERIAL_COLORS   = {'concrete': '#b6b6b6', 'stone': '#644438ff', 'both': '#ffb300', 'not': '#ef5350'};
const WALL_MATERIAL_LABELS   = { 'concrete': 'Reinforced Cement Concrete (RCC)', 'stone': 'Solid Stone Masonry (SSM)', 'Both': 'Both RCC & SSM', 'Not': 'Not Applicable'};

const FENCE_COLORS           = { 'only on sides': '#ffb300', 'sides and top': '#ef5350', 'no': '#4caf50'};
const FENCE_LABELS           = { 'only on sides': 'Yes, Sides', 'sides and top': 'Yes, Sides & Top', 'no': 'No Fence' };

const BRIDGE_TYPE_COLORS     = { 'vehicular': '#4a90d9', 'pedestrian': '#ffb300', 'not': '#b6b6b638' };
const BRIDGE_TYPE_LABELS     = { 'vehicular': 'Vehicular', 'pedestrian': 'Pedestrian', 'not': 'No Bridge' };

const BRIDGE_CONDITION_COLORS = { 'intact': '#4caf50', 'path': '#e97d7bff', 'wall': '#ef5350', 'not': '#b6b6b638' };
const BRIDGE_CONDITION_LABELS = { 'intact': 'Intact', 'wall': 'Broken wall', 'path': 'Broken path', 'not': 'No Bridge' };

const BRIDGE_WALKABLE_COLORS  = { 'clear': '#4caf50', 'parking': '#e97d7bff', 'solid': '#ef5350' , 'not': '#b6b6b638'};
const BRIDGE_WALKABLE_LABELS  = { 'clear': 'Clear Path', 'parking': 'Obstructed Path (Parking)' , 'solid': 'Obstructed Path (Solid Waste)', 'not': 'No Bridge' };

const PIERS_CONDITION_COLORS = { 'yes': '#ef5350', 'not': '#b6b6b638', 'no': '#4caf50',};
const PIERS_CONDITION_LABELS = { 'yes': 'Yes', 'applicable': 'No Bridge', 'no': 'No', };

const PIERS_NUM_COLORS = { 'not': '#b6b6b638' };
const PIERS_NUM_LABELS = { 'not': 'No Bridge'};

const ELEC_CONDITION_COLORS  = { 'no': '#4caf50', 'yes': '#ef5350'};
const ELEC_CONDITION_LABELS  = { 'no': 'No', 'yes': 'Yes'};

const CABLES_CONDITION_COLORS = {'cannot':'#b6b6b6' ,'no': '#4caf50', 'yes': '#ef5350'};
const CABLES_CONDITION_LABELS = { 'cannot':'Cannot See','no': 'No', 'yes': 'Yes' };

const MANHOLES_CONDITION_COLORS = { 'cannot':'#b6b6b6','no': '#4caf50', 'yes': '#ef5350',};
const MANHOLES_CONDITION_LABELS = { 'cannot':'Cannot See','no': 'No', 'yes': 'Yes' };

function renderInfrastructureCharts(data) {
    // Retaining Wall
    makePieChart({ container: 'Wall Condition', data, field: 'wall_condition', colors: WALL_CONDITION_COLORS,  labels: WALL_CONDITION_LABELS,  title: 'Wall Condition'  });
    makePieChart({ container: 'Fence',          data, field: 'fence',          colors: FENCE_COLORS,           labels: FENCE_LABELS,           title: 'Fence on Wall'   });
    makePieChart({ container: 'Wall Material',  data, field: 'wall_material',  colors: WALL_MATERIAL_COLORS,   labels: WALL_MATERIAL_LABELS,   title: 'Wall Material'   });
    makeHistogram({ container: 'Wall Height (feet)',   data, field: 'wall_height',    title: 'Height of the wall from the ground (road,etc)', fixedMin: 0, step: 1 });

    // Bridge
    makePieChart({ container: 'Bridge Type',      data, field: 'bridge_type',      colors: BRIDGE_TYPE_COLORS,       labels: BRIDGE_TYPE_LABELS,       title: 'Bridge Type',        ignore:'Not applicable ' });
    makePieChart({ container: 'Bridge Condition', data, field: 'bridge_condition', colors: BRIDGE_CONDITION_COLORS,  labels: BRIDGE_CONDITION_LABELS,  title: 'Bridge Condition',   ignore:'Not applicable' });
    makePieChart({ container: 'Walkable',         data, field: 'bridge_walkable',  colors: BRIDGE_WALKABLE_COLORS,   labels: BRIDGE_WALKABLE_LABELS,   title: 'Walkable',           ignore:'Not applicable' });
    makePieChart({  container: 'Piers Condition', data, field: 'piers_condition',  colors: PIERS_CONDITION_COLORS,   labels: PIERS_CONDITION_LABELS,   title: 'Piers Condition',    ignore:'Not applicable' });                
    makeBarChart({  container: 'Piers Count',     data, field: 'piers_num',        colors: PIERS_NUM_COLORS,         labels: PIERS_NUM_LABELS,   title: 'Number of Piers',          ignore:'Not applicable' });

    // Utilities                          
    makePieChart({  container: 'Electrical',      data, field: 'elec_condition',     colors: ELEC_CONDITION_COLORS,     labels: ELEC_CONDITION_LABELS,     title: 'Electricity lines outside the Drain'      });
    makePieChart({  container: 'Cables',          data, field: 'cables_condition',   colors: CABLES_CONDITION_COLORS,   labels: CABLES_CONDITION_LABELS,   title: 'Cables or lines crossing the Drain'          });
    makePieChart({  container: 'Manholes',        data, field: 'manholes_condition', colors: MANHOLES_CONDITION_COLORS, labels: MANHOLES_CONDITION_LABELS, title: 'Manholes inside the Drain'        });
}

// #endregion Infrastructure


// #region Water Quality ────────────────────────────────────────────────────────

const INLETS_COLORS              = {'cannot':'#b6b6b6' ,'no': '#4caf50', 'yes': '#ffb300'};
const INLETS_LABELS              = { 'cannot':'Cannot See','no': 'No', 'yes': 'Yes' };

const UNAUTHORISED_INLETS_COLORS = {'cannot':'#b6b6b6' ,'no': '#4caf50', 'yes': '#ef5350'};
const UNAUTHORISED_INLETS_LABELS = { 'cannot':'Cannot See','no': 'No', 'yes': 'Yes' };

const WATER_STAGNANT_COLORS      = { 'flowing': '#4a90d9', 'stagnant': '#e8a838' ,'cannot':'#b6b6b6' };
const WATER_STAGNANT_LABELS      = { 'flowing': 'Flowing', 'stagnant': 'Stagnant','cannot':'Cannot See'};

const WATER_CONTAMINATION_COLORS = { 'black': '#546e7a', 'clear': '#b3e5fc', 'solid': '#8d6e63', 'froth': '#4caf50', 'cannot': '#b6b6b6' };
const WATER_CONTAMINATION_LABELS = { 'black': 'Black/ Grey', 'clear': 'Clear', 'solid': 'Particles/Oily_Film', 'froth': 'Froth/ Foam', 'cannot': 'Cannot See' };

const WATER_COLOUR_COLORS        = { 'clear': '#b3e5fc', 'black': '#546e7a', 'green': '#4caf50', 'cannot': '#b6b6b6', 'other': '#8c5ec9ff' , 'milky': '#90a4ae', 'yellow': '#ffb300'};
const WATER_COLOUR_LABELS        = { /* 'clear': 'Clear', 'brown': 'Brown', 'green': 'Green', 'grey': 'Grey' */ };

const WATER_TURBIDITY_COLORS     = { 'clear': '#b3e5fc', 'Cloudy': '#e8a838', 'Opaque': '#ef5350','cannot': '#b6b6b6' };
const WATER_TURBIDITY_LABELS     = { /* 'clear': 'Clear', 'slightly turbid': 'Slightly Turbid', 'turbid': 'Turbid' */ };

const WATER_SMELL_COLORS         = {'cannot': '#b6b6b6' , 'No Odour': '#4caf50', 'Less Odour': '#ffb300', 'unable': '#ef5350','necessarily': '#ee9795ff'};
const WATER_SMELL_LABELS         = { 'cannot': 'Cannot See', 'no odour': 'No Odour', 'Less Odour': 'Less','unable': 'Strong - Sewage','necessarily':'Strong-Not Sewage' };

const SW_INSIDE_COLORS           = { 'cannot':'#b6b6b6','yes': '#ef5350', 'no': '#4caf50'};
const SW_INSIDE_LABELS           = { 'cannot':'Cannot See','yes': 'Yes', 'no': 'No' };

const SW_INSIDE_TYPE_COLORS      = { 'cannot': '#b6b6b6' ,'household': '#4a90d9', 'mixed': '#ffb300', 'no': '#b6b6b6', 'commercial': '#ef5350', 'debris': '#9c6ee0' };
const SW_INSIDE_TYPE_LABELS      = { 'cannot':'Cannot See', 'household': 'Household', 'mixed': 'Mixed', 'no': 'No Waste', 'commercial': 'Commercial', 'debris': 'Debris' };

const SW_OUTSIDE_COLORS          = { 'yes': '#ef5350', 'no': '#4caf50'};
const SW_OUTSIDE_LABELS          = { 'yes': 'Yes', 'no': 'No' };

const SW_OUTSIDE_TYPE_COLORS     = { 'cannot': '#b6b6b6' ,'household': '#4a90d9', 'mixed': '#ffb300', 'no': '#b6b6b6', 'commercial': '#ef5350', 'debris': '#9c6ee0' };
const SW_OUTSIDE_TYPE_LABELS     = { 'cannot':'Cannot See','household': 'Household', 'mixed': 'Mixed', 'no': 'No Waste', 'commercial': 'Commercial', 'debris': 'Debris' };

function renderWaterQualityCharts(data) {
    makePieChart({ container: 'Authorised Inlets',           data, field: 'inlets',              colors: INLETS_COLORS,              labels: INLETS_LABELS,              });
    makePieChart({ container: 'Unauthorised Inlets',         data, field: 'unauthorised_inlets', colors: UNAUTHORISED_INLETS_COLORS, labels: UNAUTHORISED_INLETS_LABELS, });
    makePieChart({ container: 'Water Flow',                  data, field: 'water_stagnant',      colors: WATER_STAGNANT_COLORS,      labels: WATER_STAGNANT_LABELS,      });
    makePieChart({ container: 'Water Contamination',         data, field: 'water_contamination', colors: WATER_CONTAMINATION_COLORS, labels: WATER_CONTAMINATION_LABELS, });
    makePieChart({ container: 'Water Colour',                data, field: 'water_colour',        colors: WATER_COLOUR_COLORS,        labels: WATER_COLOUR_LABELS,        });
    makePieChart({ container: 'Water Turbidity',             data, field: 'water_turbidity',     colors: WATER_TURBIDITY_COLORS,     labels: WATER_TURBIDITY_LABELS,     });
    makePieChart({ container: 'Water Smell',                 data, field: 'water_smell',         colors: WATER_SMELL_COLORS,         labels: WATER_SMELL_LABELS,         });
    makePieChart({ container: 'Solid Waste Inside',          data, field: 'sw_inside',           colors: SW_INSIDE_COLORS,           labels: SW_INSIDE_LABELS,           });
    makePieChart({ container: 'Solid Waste Inside - Type',   data, field: 'sw_inside_type',      colors: SW_INSIDE_TYPE_COLORS,      labels: SW_INSIDE_TYPE_LABELS,      });
    makePieChart({ container: 'Solid Waste Outside',         data, field: 'sw_outside',          colors: SW_OUTSIDE_COLORS,          labels: SW_OUTSIDE_LABELS,          });
    makePieChart({ container: 'Solid Waste Outside - Type',  data, field: 'sw_outside_type',     colors: SW_OUTSIDE_TYPE_COLORS,     labels: SW_OUTSIDE_TYPE_LABELS,     });

}

// #endregion Water Quality


// #region Community Engagement ────────────────────────────────────────────────

const SW_CLEAN_UP_COLORS          = { /* 'yes': '#4caf50', 'no': '#ef5350' */ };
const SW_CLEAN_UP_LABELS          = { /* 'yes': 'Active', 'no': 'None' */ };

const COMMUNITY_ENGAGEMENT_COLORS = { 'Trees': '#0d520fff', 'Plants': '#319e35ff','Park': '#7caf4cff', 'Murals': '#ffb300', 'Poster': '#ef5350', 'Idols': '#9c27b0','Benches': '#29dab3ff','Gym': '#ef50c7ff','not': '#b6b6b657','Cattle': '#e8a838','null': '#b6b6b6b4',};
const COMMUNITY_ENGAGEMENT_LABELS = { /* 'high': 'High', 'medium': 'Medium', 'low': 'Low', 'none': 'None' */ };

const FLOOD_HISTORY_COLORS   = { 'cannot': '#b6b6b6', 'yes': '#ef5350', 'no': '#4caf50',  };
const FLOOD_HISTORY_LABELS   = { 'cannot': 'Cannot Find Info', 'yes': 'Yes', 'no': 'No',  };

const FLOOD_HEIGHT_COLORS    = { 'does not': '#4caf50', 'upto': '#ffb300', '2-5': '#e8a838', '6-10': '#ef5350', 'more': '#9c27b0' };
const FLOOD_HEIGHT_LABELS    = { 'does not': 'Does Not Flood', 'upto': 'Up to 1 inch', '2-5': '2–5 inches', '6-10': '6–10 inches', 'more': 'More than 10 inches' };

const DESILTING_COLORS       = { 'every 6': '#4caf50', 'once': '#ffb300', 'do not': '#90a4ae', 'cannot': '#b6b6b6' };
const DESILTING_LABELS       = { 'every 6': 'Every 6 Months', 'once': 'Once a Year', 'do not': 'Do Not Know', 'cannot': 'Cannot Find Info' };

const LAST_CLEANED_COLORS    = { '2-6': '#ffb300', 'more': '#ef5350', 'cannot': '#b6b6b6' };
const LAST_CLEANED_LABELS    = { '2-6': '2–6 Months Ago', 'more': 'More than 6 Months', 'cannot': 'Cannot Find Info' };

const DRAIN_MAINTAINER_COLORS = { 'no one': '#ef5350', 'do not': '#90a4ae', 'cannot': '#b6b6b6' };
const DRAIN_MAINTAINER_LABELS = {} ;

function _splitSpaceValues(data, field) {
    const out = [];
    for (const row of data) {
        const val = String(row[field] ?? '').trim();
        if (!val || /not applicable/i.test(val)) { out.push(row); continue; }
        for (const token of val.split(/\s+/)) out.push({ ...row, [field]: token });
    }
    return out;
}

function renderCommunityCharts(data, communityData = []) {
    const engData = _splitSpaceValues(data, 'community_engagement');
    makeBarChart({ container: 'Community Engagement', data: engData, field: 'community_engagement', colors: COMMUNITY_ENGAGEMENT_COLORS, labels: COMMUNITY_ENGAGEMENT_LABELS, ignore: 'Not Applicable' });

    makePieChart({ container: 'Flood History',    data: communityData, field: 'flood_history',    colors: FLOOD_HISTORY_COLORS,    labels: FLOOD_HISTORY_LABELS,    interactive: false });
    makeBarChart({ container: 'Flood Height',     data: communityData, field: 'flood_height',     colors: FLOOD_HEIGHT_COLORS,     labels: FLOOD_HEIGHT_LABELS,     interactive: false });
    makePieChart({ container: 'Desilting',        data: communityData, field: 'desilting',        colors: DESILTING_COLORS,        labels: DESILTING_LABELS,        interactive: false });
    makePieChart({ container: 'Last Cleaned',     data: communityData, field: 'last_cleaned',     colors: LAST_CLEANED_COLORS,     labels: LAST_CLEANED_LABELS,     interactive: false });
    makeBarChart({ container: 'Drain Maintainer', data: communityData, field: 'drain_maintainer', colors: DRAIN_MAINTAINER_COLORS, labels: DRAIN_MAINTAINER_LABELS, interactive: false });
}

// #endregion Community Engagement


// ─── Badge colour lookup ──────────────────────────────────────────────────────

const _FIELD_COLORS = {
    wall_condition:       WALL_CONDITION_COLORS,
    wall_material:        WALL_MATERIAL_COLORS,
    wall_height:          null,
    fence:                FENCE_COLORS,
    bridge_type:          BRIDGE_TYPE_COLORS,
    bridge_condition:     BRIDGE_CONDITION_COLORS,
    bridge_walkable:      BRIDGE_WALKABLE_COLORS,
    piers_condition:      PIERS_CONDITION_COLORS,
    piers_num:            PIERS_NUM_COLORS,
    elec_condition:       ELEC_CONDITION_COLORS,
    cables_condition:     CABLES_CONDITION_COLORS,
    manholes_condition:   MANHOLES_CONDITION_COLORS,
    inlets:               INLETS_COLORS,
    unauthorised_inlets:  UNAUTHORISED_INLETS_COLORS,
    water_stagnant:       WATER_STAGNANT_COLORS,
    water_contamination:  WATER_CONTAMINATION_COLORS,
    water_colour:         WATER_COLOUR_COLORS,
    water_turbidity:      WATER_TURBIDITY_COLORS,
    water_smell:          WATER_SMELL_COLORS,
    sw_inside:            SW_INSIDE_COLORS,
    sw_inside_type:       SW_INSIDE_TYPE_COLORS,
    sw_outside:           SW_OUTSIDE_COLORS,
    sw_outside_type:      SW_OUTSIDE_TYPE_COLORS,
    community_engagement: COMMUNITY_ENGAGEMENT_COLORS,
};

/**
 * Returns the chart colour for a given field + raw CSV value, or null if unknown.
 * Uses the same case-insensitive partial-match logic as _resolveColors.
 */
function getValueColor(field, value) {
    const colors = _FIELD_COLORS[field];
    if (!colors || !value || value === '—') return null;
    const lk = String(value).toLowerCase();
    const match = Object.keys(colors).find(k => lk === k.toLowerCase() || lk.includes(k.toLowerCase()));
    return match ? colors[match] : null;
}
window.getValueColor = getValueColor;

const _FIELD_LABELS = {
    wall_condition:       WALL_CONDITION_LABELS,
    wall_material:        WALL_MATERIAL_LABELS,
    wall_height:          null,
    fence:                FENCE_LABELS,
    bridge_type:          BRIDGE_TYPE_LABELS,
    bridge_condition:     BRIDGE_CONDITION_LABELS,
    bridge_walkable:      BRIDGE_WALKABLE_LABELS,
    piers_condition:      PIERS_CONDITION_LABELS,
    piers_num:            PIERS_NUM_LABELS,
    elec_condition:       ELEC_CONDITION_LABELS,
    cables_condition:     CABLES_CONDITION_LABELS,
    manholes_condition:   MANHOLES_CONDITION_LABELS,
    inlets:               INLETS_LABELS,
    unauthorised_inlets:  UNAUTHORISED_INLETS_LABELS,
    water_stagnant:       WATER_STAGNANT_LABELS,
    water_contamination:  WATER_CONTAMINATION_LABELS,
    water_colour:         WATER_COLOUR_LABELS,
    water_turbidity:      WATER_TURBIDITY_LABELS,
    water_smell:          WATER_SMELL_LABELS,
    sw_inside:            SW_INSIDE_LABELS,
    sw_inside_type:       SW_INSIDE_TYPE_LABELS,
    sw_outside:           SW_OUTSIDE_LABELS,
    sw_outside_type:      SW_OUTSIDE_TYPE_LABELS,
    community_engagement: COMMUNITY_ENGAGEMENT_LABELS,
};

function getValueLabel(field, value) {
    const labels = _FIELD_LABELS[field];
    if (!labels || !value || value === '—') return null;
    const lk = String(value).toLowerCase();
    const match = Object.keys(labels).find(k => lk === k.toLowerCase() || lk.includes(k.toLowerCase()));
    return match ? labels[match] : null;
}
window.getValueLabel = getValueLabel;
