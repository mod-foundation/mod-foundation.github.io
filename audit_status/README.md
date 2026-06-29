# Audit Status Map — How It Works & How to Update It

## Overview

The map reads a single Excel file (`drains_auditing.xlsx`) and uses it to colour-code drain lines on the map and populate the side panel with team details when a drain is clicked. Every update to the map is done by editing that one file and adding photos to the images folder.

---

## File Locations

```
audit_status/
├── data/
│   ├── csv/
│   │   └── drains_auditing.xlsx        ← THE file you edit
│   └── images/
│       ├── team-captain.png            (icon — do not touch)
│       ├── team-crew.png               (icon — do not touch)
│       ├── brb_1.jpeg                  (team photos)
│       ├── brb_2.jpeg
│       └── ...
├── index.html
└── script.js
```

---

## The Excel File — Column Reference

Open `audit_status/data/csv/drains_auditing.xlsx`. The first sheet is what the map reads. Each row = one audit assignment (one team, one or more drain segments).

| Column | What to enter | Example |
|---|---|---|
| `area` | Neighbourhood / locality name | `Basavanagudi` |
| `name` | Short label for the audit stretch | `BRB Canal North` |
| `status` | Audit progress — **must be exactly one of the values below** | `done` |
| `pri_drain_id` | Primary drain ID(s) this team covers | `12` or `12,15,18` |
| `sec_drain_id` | Secondary drain ID(s) this team covers | `201` or `201,204` |
| `team_captain_name` | Full name of the Captain | `Pooja Sharma` |
| `team_captain_institute` | Institute/org of the Captain (optional) | `MSRIT` |
| `team_crew_name` | Crew member names, comma-separated | `Rahul K, Sneha M` |
| `img_id` | Image filename **without** the `.jpeg` extension | `brb_1` |

### Status values — exact spelling required

The map colour-codes by status. You must use these exact strings (lowercase):

| Value to type | Colour on map |
|---|---|
| `done` | Green |
| `in progress` | Pink / magenta |
| *(anything else or blank)* | Default drain colour (not highlighted) |

---

## How Drain IDs Work

Each drain line on the map has a numeric ID in the underlying GeoJSON data:

- **Primary drains** use the `id` property → goes in `pri_drain_id`
- **Secondary drains** use the `sec_id` property → goes in `sec_drain_id`

To find the ID of a drain, open the primarydrains.geojson and secondarydrains.geojson on QGIS. the IDs are available in their attribute table. IDs are unique for each feature.

You can assign **multiple drain segments to one team** by listing IDs separated by commas in the same cell:

```
pri_drain_id: 12,15,18
```

A team can cover both primary and secondary drains — just fill in both columns for that row.

---

## Adding a Team Photo

1. Take or export the photo as a **JPEG**.
2. Rename it with a short, unique ID — no spaces, no capitals. Example: `brb_5.jpeg`, `rmv_team.jpeg`.
3. Drop the file into `audit_status/data/images/`.
4. In the Excel, set `img_id` to that filename **without** `.jpeg`. Example: `brb_5`.

The photo appears in the side panel when a user clicks on that team's drain on the map.

**Image rules:**
- Format: `.jpeg` only (the code appends `.jpeg` automatically)
- No spaces in the filename
- Keep file sizes reasonable (under 500 KB) so the map loads fast

---

## Step-by-Step: Adding a New Audit Team

1. Open `drains_auditing.xlsx`
2. Add a new row at the bottom
3. Fill in all relevant columns (at minimum: `status`, and at least one of `pri_drain_id` / `sec_drain_id`)
4. If you have a team photo, add the `.jpeg` to `audit_status/data/images/` and put the filename (without extension) in `img_id`
5. Save the Excel file
6. Commit and push to GitHub — the live map will update automatically

---

## Step-by-Step: Marking an Audit as Done

1. Open `drains_auditing.xlsx`
2. Find the row for that team/stretch
3. Change the `status` cell from `in progress` to `done`
4. Save, commit, push

---

## How the Map Builds Itself (Technical Summary)

When the page loads, `script.js` does the following:

1. Fetches `drains_auditing.xlsx` and parses every row
2. Fetches `primarydrains.geojson` and `secondarydrains.geojson` from the shared download center data folder
3. Matches each Excel row to drain features by ID, tagging them with `audit_status`, captain, crew, and image data
4. Re-colours the drain lines on the map based on `audit_status`
5. Updates the legend km totals for Done and In Progress

When a user clicks a coloured drain, the side panel shows the Captain name, institute, crew, and team photo pulled from those tagged properties.

---

## Common Mistakes to Avoid

| Mistake | Effect | Fix |
|---|---|---|
| Typing `Done` or `In Progress` (capital letters) | Drain stays default colour | Use lowercase: `done` / `in progress` |
| Wrong drain ID | Row is silently ignored, drain stays uncoloured | Double-check IDs in the Audit Dashboard |
| Image named with spaces (`brb team 1.jpeg`) | Photo won't load | Rename with underscores: `brb_team_1.jpeg` |
| Using `.jpg` instead of `.jpeg` | Photo won't load | The code expects `.jpeg` exactly |
| Data not on the first sheet | Map reads only the first sheet | Keep all data on Sheet 1 |
