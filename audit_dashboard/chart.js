//#region Chart Configuration

// Chart instances storage
const chartInstances = {};

// Distinct palette for bar chart categories (team codes etc.)
const BAR_PALETTE = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf','#999999'];

// Chart color schemes
const CHART_COLORS = {
    green: '#28a745',
    orange: '#ff7f07ff',
    red: '#dc3545',
    primary: '#007cbf',
    grey: '#9aa3acff',
    purple: '#c477e2ff',
    blue: '#397ec4ff',

};

// Form 1 — physical / infrastructure condition data
function form1ColorMap(label) {
    const l = label.toLowerCase();
    if (l.includes('not applicable') || l.includes('n/a') || l.includes('know') || l.includes('cannot see'))        return CHART_COLORS.grey;
    if (l.includes('intact') || l.includes('good') || l.includes('no damage')|| l.includes('safe'))  return CHART_COLORS.green;
    if (l.includes('broken') || l.includes('only') || l.includes('fair') || l.includes('both'))     return CHART_COLORS.orange;
    if (l.includes('poor') || l.includes('bad') || l.includes('does not') || l.includes('obstructed'))    return CHART_COLORS.red;
    if (l.includes('no '))   return CHART_COLORS.green;
    if (l.includes('yes'))   return CHART_COLORS.red;
    if (l.includes('ssm'))   return CHART_COLORS.purple;
    if (l.includes('rcc'))   return CHART_COLORS.blue;
    return CHART_COLORS.primary;
}

// Form 2 — environmental / contamination data
function form2ColorMap(label) {
    const l = label.toLowerCase().replace(/_/g, ' ');
    // Cannot see / uncertain
    if (l.includes('cannot') || l.includes("can't") || l.includes('cannot say')) return CHART_COLORS.grey;
    // Not applicable
    if (l.includes('not applicable') || l === 'na')                return CHART_COLORS.grey;
    // Binary yes/no — yes = problem = red, no = good = green
    if (l === 'yes')                                               return CHART_COLORS.red;
    if (l === 'no')                                                return CHART_COLORS.green;
    // Water contamination indicators
    if (l.includes('continuous flow'))                             return CHART_COLORS.green;
    if (l.includes('froth') || l.includes('foam'))                 return CHART_COLORS.orange;
    if (l.includes('black or grey') || l.includes('oily') ||
        l.includes('solid particles'))                             return CHART_COLORS.red;
    // Water colour
    if (l.includes('clear'))                                       return CHART_COLORS.green;
    if (l.includes('greenish') || l.includes('milky') ||
        l.includes('yellow'))                                      return CHART_COLORS.orange;
    if (l.includes('black'))                                       return CHART_COLORS.red;
    // Odour / smell
    if (l.includes('no odor') || l.includes('no smell'))          return CHART_COLORS.green;
    if (l.includes('less odor') || l.includes('slight'))          return CHART_COLORS.orange;
    if (l.includes('strong'))                                      return CHART_COLORS.red;
    return CHART_COLORS.primary;
}

//#endregion

//#region Panel Controls

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const button = panel.querySelector('.panel-toggle');

    panel.classList.toggle('collapsed');
    button.textContent = panel.classList.contains('collapsed') ? '+' : '−';
}

function toggleColumn(columnId) {
    const column = document.getElementById(columnId);
    const toggle = column.querySelector('.column-toggle');

    column.classList.toggle('collapsed');
    toggle.textContent = column.classList.contains('collapsed') ? '+' : '−';
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.classList.add('hidden');
}

function showPanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.classList.remove('hidden');
}

//#endregion

//#region Data Processing Functions

// Format label: replace underscores with spaces and capitalize each word
function formatLabel(label) {
    if (!label) return '';
    return label
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function countValues(data, fieldName) {
    const counts = {};
    data.forEach(item => {
        const value = item[fieldName];
        if (value && value !== 'null' && value !== 'undefined') {
            counts[value] = (counts[value] || 0) + 1;
        }
    });
    return counts;
}

function processChartData(data, fieldName) {
    const counts = countValues(data, fieldName);
    return {
        labels: Object.keys(counts).map(formatLabel),
        rawLabels: Object.keys(counts),
        data: Object.values(counts),
        total: Object.values(counts).reduce((a, b) => a + b, 0)
    };
}

//#endregion

//#region Chart Creation Functions

function createPieChart(canvasId, title, data, fieldName, layerId = '', defaultColor = '', colorMapper = form1ColorMap) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const chartData = processChartData(data, fieldName);

    // Destroy existing chart if it exists
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const colors = chartData.labels.map(colorMapper);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            onClick(_event, elements) {
                if (!elements.length || !layerId || !window.MapFilterManager) return;
                const idx = elements[0].index;
                window.MapFilterManager.applyFilter(
                    canvasId, layerId, fieldName,
                    chartData.rawLabels[idx], colors[idx], defaultColor
                );
            },
            onHover(event, elements) {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'start',
                    labels: {
                        padding: 10,
                        font: { size: 11 },
                        textAlign: 'left'
                    },
                    onClick(_event, legendItem, _legend) {
                        if (!layerId || !window.MapFilterManager) return;
                        const idx = legendItem.index;
                        window.MapFilterManager.applyFilter(
                            canvasId, layerId, fieldName,
                            chartData.rawLabels[idx], colors[idx], defaultColor
                        );
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Register with MapFilterManager for header color-by feature
    if (layerId && window.MapFilterManager?.registerChart) {
        window.MapFilterManager.registerChart(canvasId, layerId, fieldName, chartData.rawLabels, colors, defaultColor);
    }

    // Update statistics
    updateChartStats(canvasId, chartData);

    return chartInstances[canvasId];
}

function createBarChart(canvasId, title, data, fieldName, layerId = '', defaultColor = '') {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const chartData = processChartData(data, fieldName);

    // Destroy existing chart if it exists
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const barColors = chartData.labels.map((_, i) => BAR_PALETTE[i % BAR_PALETTE.length]);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: title,
                data: chartData.data,
                backgroundColor: barColors,
                borderColor: barColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            onClick(_event, elements) {
                if (!elements.length || !layerId || !window.MapFilterManager) return;
                const idx = elements[0].index;
                window.MapFilterManager.applyFilter(
                    canvasId, layerId, fieldName,
                    chartData.rawLabels[idx], barColors[idx], defaultColor
                );
            },
            onHover(event, elements) {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `Count: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    // Register with MapFilterManager for header color-by feature
    if (layerId && window.MapFilterManager?.registerChart) {
        window.MapFilterManager.registerChart(canvasId, layerId, fieldName, chartData.rawLabels, barColors, defaultColor);
    }

    // Update statistics
    updateChartStats(canvasId, chartData);

    return chartInstances[canvasId];
}

function createHistogramChart(canvasId, title, data, fieldName, layerId = '', defaultColor = '', binSize = 2) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Parse numeric values; discard negatives and extreme outliers
    const values = data
        .map(row => parseFloat(row[fieldName]))
        .filter(v => !isNaN(v) && v >= 0 && v <= 50);

    if (values.length === 0) return null;

    const maxVal = Math.max(...values);
    const numBins = Math.ceil(maxVal / binSize) + 1;

    const bins = [];
    for (let i = 0; i < numBins; i++) {
        const lo = i * binSize;
        const hi = (i + 1) * binSize;
        const count = values.filter(v => v >= lo && v < hi).length;
        bins.push({ lo, hi, label: `${lo}–${hi}`, count });
    }
    // Trim trailing empty bins
    while (bins.length > 0 && bins[bins.length - 1].count === 0) bins.pop();

    const labels  = bins.map(b => b.label);
    const counts  = bins.map(b => b.count);

    // Color bins by height threshold: yellows below 6 ft, reds at/above 6 ft
    const WALL_THRESHOLD = 6;
    const YELLOW_SHADES  = ['#fff59d', '#ffee58', '#fdd835', '#f9a825', '#f57f17'];
    const RED_SHADES     = ['#ffcdd2', '#ef9a9a', '#e57373', '#e53935', '#c62828', '#b71c1c'];
    const belowBins      = bins.filter(b => b.hi <= WALL_THRESHOLD);
    const aboveBins      = bins.filter(b => b.lo >= WALL_THRESHOLD);
    const barColors = bins.map(b => {
        if (b.hi <= WALL_THRESHOLD) {
            const i = belowBins.indexOf(b);
            return YELLOW_SHADES[Math.min(i, YELLOW_SHADES.length - 1)];
        } else {
            const i = aboveBins.indexOf(b);
            return RED_SHADES[Math.min(i, RED_SHADES.length - 1)];
        }
    });
    const filterExprs = bins.map(b => ['all',
        ['>=', ['to-number', ['get', fieldName]], b.lo],
        ['<',  ['to-number', ['get', fieldName]], b.hi]
    ]);

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: title,
                data: counts,
                backgroundColor: barColors,
                borderColor: barColors,
                borderWidth: 0,
                borderRadius: 2,
                barPercentage: 1.0,
                categoryPercentage: 1.0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            onClick(_event, elements) {
                if (!elements.length || !layerId || !window.MapFilterManager) return;
                const idx = elements[0].index;
                window.MapFilterManager.applyRangeFilter(
                    canvasId, layerId, fieldName,
                    bins[idx].lo, bins[idx].hi, barColors[idx], defaultColor
                );
            },
            onHover(event, elements) {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: items => items[0].label + ' ft',
                        label(context) {
                            const v = context.parsed.y || 0;
                            const total = counts.reduce((a, b) => a + b, 0);
                            return `Count: ${v} (${((v / total) * 100).toFixed(1)}%)`;
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Height (ft)', font: { size: 11 } } },
                y: { beginAtZero: true, ticks: { stepSize: 1 },
                     title: { display: true, text: 'Count', font: { size: 11 } } }
            }
        }
    });

    // Register for colorByChart (passes filterExprs so colorByChart uses 'case' not 'match')
    if (layerId && window.MapFilterManager?.registerChart) {
        window.MapFilterManager.registerChart(canvasId, layerId, fieldName, labels, barColors, defaultColor, filterExprs);
    }

    // Stats block
    const statsId  = canvasId.replace('chart-', 'stats-');
    const statsDiv = document.getElementById(statsId);
    if (statsDiv) {
        const total    = counts.reduce((a, b) => a + b, 0);
        const maxCount = Math.max(...counts);
        const modeBin  = bins[counts.indexOf(maxCount)];
        statsDiv.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Recorded:</span>
                <span class="stat-value">${total}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Most Common:</span>
                <span class="stat-value">${modeBin.label} ft (${((maxCount / total) * 100).toFixed(1)}%)</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Range:</span>
                <span class="stat-value">${Math.min(...values).toFixed(1)}–${Math.max(...values).toFixed(1)} ft</span>
            </div>
        `;
    }

    return chartInstances[canvasId];
}

function updateChartStats(canvasId, chartData) {
    const statsId = canvasId.replace('chart-', 'stats-');
    const statsDiv = document.getElementById(statsId);
    
    if (!statsDiv) return;
    
    let statsHTML = `
        <div class="stat-item">
            <span class="stat-label">Total Submissions:</span>
            <span class="stat-value">${chartData.total}</span>
        </div>
    `;
    
    // Find most common value
    const maxIndex = chartData.data.indexOf(Math.max(...chartData.data));
    const mostCommon = chartData.labels[maxIndex];
    const mostCommonCount = chartData.data[maxIndex];
    const percentage = ((mostCommonCount / chartData.total) * 100).toFixed(1);
    
    statsHTML += `
        <div class="stat-item">
            <span class="stat-label">Most Common:</span>
            <span class="stat-value">${mostCommon} (${percentage}%)</span>
        </div>
    `;
    
    statsDiv.innerHTML = statsHTML;
}

//#endregion

//#region Initialize Charts from Local CSV Data

function initializeCharts(formsData) {
    console.log('=== INITIALIZING CHARTS ===');

    const form1Data = formsData.form1?.data || [];
    const form2Data = formsData.form2?.data || [];
    const form1Layer = 'data-form1-points';
    const form2Layer = 'data-form2-points';
    const form1Color = formsData.form1?.config?.color || '#007cbf';
    const form2Color = formsData.form2?.config?.color || '#e74c3c';

    console.log(`Form 1: ${form1Data.length} submissions`);
    console.log(`Form 2: ${form2Data.length} submissions`);

    // === FORM 1 CHARTS ===
    if (form1Data.length > 0) {
        if (form1Data.some(d => d['wall_condition'])) {
            createPieChart('chart-wall', 'Retaining Wall Conditions', form1Data, 'wall_condition', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['fence'])) {
            createPieChart('chart-fence', 'Fence Condition', form1Data, 'fence', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['wall_height'])) {
            createHistogramChart('chart-wall-height', 'Wall Height Distribution', form1Data, 'wall_height', form1Layer, form1Color, 2);
        }

        if (form1Data.some(d => d['wall_material'])) {
            createPieChart('chart-wall-material', 'Retaining Wall Material', form1Data, 'wall_material', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['bridge_condition'])) {
            createPieChart('chart-bridge', 'Bridge Conditions', form1Data, 'bridge_condition', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['bridge_type'])) {
            createPieChart('chart-bridge-type', 'Bridge Type', form1Data, 'bridge_type', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['bridge_walkable'])) {
            createPieChart('chart-bridge-walkable', 'Bridge Walkable', form1Data, 'bridge_walkable', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['piers_condition'])) {
            createPieChart('chart-piers-condition', 'Piers Condition', form1Data, 'piers_condition', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['piers_num'])) {
            createBarChart('chart-piers-num', 'Number of Piers', form1Data, 'piers_num', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['elec_condition'])) {
            createPieChart('chart-elec-condition', 'Electrical Condition', form1Data, 'elec_condition', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['cables_condition'])) {
            createPieChart('chart-cables-condition', 'Cables Condition', form1Data, 'cables_condition', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['manholes_condition'])) {
            createPieChart('chart-manholes-condition', 'Manholes Condition', form1Data, 'manholes_condition', form1Layer, form1Color);
        }

        if (form1Data.some(d => d['team_code'])) {
            createBarChart('chart-team1', 'Submissions by Team', form1Data, 'team_code', form1Layer, form1Color);
        }
    }

    // === FORM 2 CHARTS ===
    if (form2Data.length > 0) {
        if (form2Data.some(d => d['inlets'])) {
            createPieChart('chart-inlets', 'Inlets to SWD', form2Data, 'inlets', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['unauthorised_inlets'])) {
            createPieChart('chart-unauth-inlets', 'Unauthorised Inlets', form2Data, 'unauthorised_inlets', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['water_contamination'])) {
            createPieChart('chart-contam', 'Water Contamination', form2Data, 'water_contamination', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['water_colour'])) {
            createPieChart('chart-water-colour', 'Water Colour', form2Data, 'water_colour', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['water_smell'])) {
            createPieChart('chart-water-smell', 'Water Smell / Odour', form2Data, 'water_smell', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['sw_inside'])) {
            createPieChart('chart-sw-inside', 'Solid Waste Inside SWD', form2Data, 'sw_inside', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['sw_outside'])) {
            createPieChart('chart-sw-outside', 'Solid Waste Outside SWD', form2Data, 'sw_outside', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['sw_inside_source'])) {
            createPieChart('chart-sw-inside-source', 'Waste Inside — Source', form2Data, 'sw_inside_source', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['sw_outside_source'])) {
            createPieChart('chart-sw-outside-source', 'Waste Outside — Source', form2Data, 'sw_outside_source', form2Layer, form2Color, form2ColorMap);
        }

        if (form2Data.some(d => d['community_engagement'])) {
            createBarChart('chart-community', 'Community Engagement', form2Data, 'community_engagement', form2Layer, form2Color);
        }

        if (form2Data.some(d => d['team_code'])) {
            createBarChart('chart-team2', 'Submissions by Team', form2Data, 'team_code', form2Layer, form2Color);
        }
    }

    console.log('✓ Charts initialized');
}

//#endregion

//#region Make Panels Draggable

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.panel-header');
    
    if (header) {
        header.onmousedown = dragMouseDown;
    }
    
    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        element.style.position = "absolute";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

//#endregion

//#region Export Functions

// Export for use in script.js
window.ChartManager = {
    initialize: initializeCharts,
    createPieChart: createPieChart,
    createBarChart: createBarChart,
    createHistogramChart: createHistogramChart,
    togglePanel: togglePanel,
    toggleColumn: toggleColumn,
    closePanel: closePanel,
    showPanel: showPanel
};

//#endregion