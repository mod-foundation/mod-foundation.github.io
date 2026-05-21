const DATA_FILE = 'downloadcentre.xlsx';

const SECTION_LABELS = {
    'D': 'Drains',
    'T': 'Tanks',
    'A': 'Citizen Audit Data',
    'W': 'Watershed',
    'B': 'Boundaries',
    'G': 'Greens',
    'S': 'Historical Maps'
};

async function populateDownloadTable() {
    const tableBody = document.getElementById('download-table-body');
    if (!tableBody) return;

    try {
        const response = await fetch(DATA_FILE);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" class="loading-row">No data found in spreadsheet.</td></tr>';
            return;
        }

        let currentSection = null;

        data.forEach(row => {
            const id = row.ID || row.id || '';
            const layerName = row.Layer || row.layer || row.Name || row.name || '';
            const sourceName = row.Source || row.source || '';
            const rawUrl = row['Download Link'] || row.Link || row.link || row.URL || row.url || '';
            const downloadUrl = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
            const accessLink = row['Access Link'] || row['access link'] || '';

            if (id && id !== currentSection) {
                currentSection = id;
                const sectionLabel = SECTION_LABELS[id] || id;
                const sectionRow = document.createElement('tr');
                sectionRow.className = 'section-header';
                const sectionCell = document.createElement('td');
                sectionCell.colSpan = 3;
                sectionCell.textContent = sectionLabel;
                sectionRow.appendChild(sectionCell);
                tableBody.appendChild(sectionRow);
            }

            const tr = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = layerName;
            tr.appendChild(nameCell);

            const sourceCell = document.createElement('td');
            sourceCell.textContent = sourceName;
            tr.appendChild(sourceCell);

            const linkCell = document.createElement('td');

            if (accessLink) {
                const span = document.createElement('span');
                span.className = 'access-link';
                span.textContent = accessLink;
                linkCell.appendChild(span);
            } else if (downloadUrl) {
                const a = document.createElement('a');
                const fileName = 'mod-foundation_' + downloadUrl.split('/').pop();
                a.href = downloadUrl;
                a.download = fileName;
                a.className = 'download-link';
                a.textContent = 'Download';
                linkCell.appendChild(a);
            } else {
                linkCell.textContent = '—';
            }

            tr.appendChild(linkCell);
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading download centre data:', error);
        tableBody.innerHTML = `<tr><td colspan="3" class="error-row">Could not load data. Make sure <code>${DATA_FILE}</code> is in the same folder.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', populateDownloadTable);
