# Audit Dashboard — How It Works & How to Update It

## Overview

The dashboard reads three CSV files exported from KoboToolbox (form-1, form-2, form-3) and plots each audit point on the map. Clicking a point shows the audit photos and attribute values in the side panels. Charts update live when you filter by team, drain, corporation, or valley.

---

## File Locations

```
audit_dashboard/
├── data/
│   ├── csv/
│   │   ├── form-1.csv          ← Main audit data (infrastructure, coordinates)
│   │   ├── form-2.csv          ← Water quality & solid waste data
│   │   └── form-3.csv          ← Community interview data
│   └── media/
│       └── form-1/images/      ← Audit photos (auto-organised by submission UUID)
│           └── <uuid>/
│               └── <filename>.jpg
├── index.html
├── script.js
└── charts.js
```

---

## The Three Forms — What Each Contains

| File | Form | What it records |
|---|---|---|
| `form-1.csv` | Form 1 | Infrastructure: wall condition, bridges, utilities, electricity, cables, manholes. Has GPS coordinates. |
| `form-2.csv` | Form 2 | Water quality: inlets, contamination, colour, turbidity, smell, solid waste inside/outside drain. |
| `form-3.csv` | Form 3 | Community interviews: flood history, desilting, last cleaned, drain maintainer. |

Form-2 rows are matched to Form-1 rows using the `_index_f1` column (which references Form-1's `_index`). Form-3 is matched by `team_code` and drain ID.

---

## How to Update the Data

### Exporting from KoboToolbox

1. Log in to KoboToolbox
2. Open the relevant form project
3. Go to **Data → Downloads**
4. Choose **CSV** format, **Export** — download all three forms
5. Replace the corresponding file in `audit_dashboard/data/csv/`
6. Commit and push — the dashboard updates automatically

### Validation Status

The map filters out submissions where `_validation_status = no` (i.e., rejected submissions). Only `yes` (validated) and blank-status submissions appear on the map.

- **Green dot** = `_validation_status: yes` (validated)
- **Orange/pink dot** = submitted but not yet validated

To validate a submission, do it in KoboToolbox, then re-export the CSV.

---

## Map Points — What the Colours Mean

Point colours change depending on which attribute dropdown is selected in the side panel. By default they show **water contamination**. Clicking any dropdown in the category panels recolours all points by that attribute.

The colour-coding is defined in `charts.js` and is consistent between map points and chart bars — same colour for the same value everywhere.

---

## Side Panels — Category Reference

Each panel on the right covers one category. The dropdown inside each panel controls which attribute is shown on the map and which photo appears.

| Panel | Default attribute | Photo source |
|---|---|---|
| Retaining Wall | Wall Condition | Form-1 (`wall_pic`) |
| Utilities | Electrical Condition | Form-1 (`elec_pic`, `cables_pic`, `manholes_pic`) |
| Bridge | Bridge Condition | Form-1 (`bridge_pic`, `piers_pic`) |
| Water Quality | Water Contamination | Form-2 (`water_pic`) |
| Solid Waste | Solid Waste Inside | Form-2 (`sw_inside_pic`, `sw_outside_pic`) |
| Street / Community | Community Participation | Form-2 (`community_engagement_pic`), Form-1 (`street_pic`) |

---

## Photos — How They Are Stored and Loaded

Photos are **not stored in the repository**. They are served from Cloudflare R2 storage at:

```
https://pub-4d67c97c1d2843adbeffa3b98cd45d19.r2.dev/form-<N>/images/<uuid>/<filename>
```

Where:
- `<N>` is the form number (1 or 2)
- `<uuid>` is the submission's `_rootUuid` from the CSV (without the `uuid:` prefix)
- `<filename>` is the image filename from the corresponding `_pic` column

If a photo fails to load (e.g., the UUID changed between exports), the dashboard automatically tries the alternate UUID field (`_uuid`) before giving up.

A local copy of form-1 photos is also kept in `data/media/form-1/images/` as a backup, but the live dashboard reads from R2.

---

## Filters

Four dropdown filters appear in the map's top bar:

| Filter | Filters by |
|---|---|
| Team | `team_name` |
| Drain | `_drain` or `_secondarydrain` |
| Corporation | `corporatio` |
| Valley | `valley` |

Filters are cumulative (AND logic between filters). Selecting a team and a valley shows only that team's points in that valley.

Charts, photos, and drain line highlighting on the map all respect the active filters.

**Reset:** The "Reset Filters" button clears all dropdown and chart filters at once.

---

## Chart Filters

Clicking a bar in any chart filters the map to show only points with that value. Click the same bar again to deselect. Multiple values can be selected within a chart (OR logic within a chart, AND logic across charts).

---

## Navigating Points

- **Click** any point on the map to select it
- **← / → arrow keys** or the prev/next buttons navigate to the previous/next audit point in sequence
- Navigation respects active filters — it only cycles through currently visible points

---

## Uploading KML Layers

The upload button (top-left, arrow-up icon) lets you overlay a KML file from your computer. Up to 5 layers can be uploaded at once. Each uploaded layer supports colour and opacity adjustment. Layers are not saved — they disappear on page refresh.

---

## How the Dashboard Builds Itself (Technical Summary)

When the page loads, `script.js` does the following:

1. Fetches `form-1.csv`, `form-2.csv`, and `form-3.csv` and parses them
2. Joins Form-2 rows to Form-1 rows by `_index_f1 → _index`
3. Builds a GeoJSON FeatureCollection from Form-1 coordinates, adding all Form-2 fields as properties
4. Form-2 rows with no matching Form-1 entry are plotted separately (pink dots)
5. Loads drain lines and boundary layers from the shared download center data folder
6. Renders infrastructure, water quality, and community charts via `charts.js`
7. Sets up dropdown filters and connects them to both the map and the charts

---

## Common Mistakes to Avoid

| Mistake | Effect | Fix |
|---|---|---|
| Exporting CSV without the sub-header row intact | Columns misread, data wrong | KoboToolbox export always includes a sub-header row on row 2 — the dashboard skips it automatically, don't remove it manually |
| Replacing only form-1 but not form-2 | Water quality data goes stale | Export and replace all three CSVs together |
| Uploading CSVs with BOM encoding | Parse errors | Export as UTF-8 without BOM from KoboToolbox |
| Photo UUID mismatch after re-export | Photos fail to load | Re-export from KoboToolbox — new export will have consistent UUIDs |
| `_validation_status = no` rows appearing | They should be hidden | They are filtered out automatically; if you see them, check the CSV has the correct column |
