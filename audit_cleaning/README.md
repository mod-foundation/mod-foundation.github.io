# Audit Cleaning Dashboard — How It Works & How to Update It

## Overview

The audit cleaning dashboard is an interactive map and chart view of the KoboToolbox audit data, used for reviewing and cross-checking submissions. It reads the same CSV data as the Audit Dashboard and displays it alongside 22 charts covering infrastructure condition and water quality. Clicking any audit point opens a side-by-side popup showing the Form-1 (infrastructure) and Form-2 (water quality) data for that submission, with photos.

This view is intended for internal data review — checking submissions, spotting outliers, and understanding the distribution of conditions across the audit area.

---

## File Locations

```
audit_cleaning/
├── index.html
├── script.js
├── charts.js
└── styles.css

(Data comes from sibling folders — nothing is stored here)
├── ../audit_dashboard/data/csv/
│   ├── form-1.csv          ← Infrastructure audit records
│   ├── form-2.csv          ← Water quality records
│   └── form-3.csv          ← Community interview records
├── ../audit_dashboard/data/media_compressed/
│   ├── form-1/images/      ← Compressed Form-1 photos
│   └── form-2/images/      ← Compressed Form-2 photos
└── ../download_center/data/json/
    ├── primarydrains.geojson
    ├── secondarydrains.geojson
    └── typology.geojson
```

The dashboard does not store any data of its own — it reads directly from the paths above. Updating the CSVs in `audit_dashboard/data/csv/` automatically updates this dashboard too.

---

## Map Points — What the Colours Mean

Each submitted audit record appears as a dot on the map.

| Colour | Meaning |
|---|---|
| Green | Submission validated (`_validation_status = yes`) |
| Orange | Form-1 submission not yet validated |
| Pink | Form-2 submission not yet validated, or Form-2 with no matching Form-1 record |

Submissions rejected in KoboToolbox (`_validation_status = no`) are hidden from the map entirely.

**Form-2 only points** (pink): When a Form-2 water quality record exists but has no corresponding Form-1 record matched by `_index_f1`, it is plotted separately using Form-2's own coordinates. These appear as pink dots and are worth investigating — they may indicate a data entry issue.

---

## Side Panels

The dashboard has two collapsible panels flanking the map.

### Left Panel — Infrastructure

Covers data from **Form-1**. Divided into three sub-sections:

- **Retaining Wall** — wall condition, fence, wall material, wall height
- **Bridge** — bridge type, condition, walkability, piers condition, piers count
- **Utilities** — electrical condition, cables condition, manholes condition

### Right Panel — Water Quality

Covers data from **Form-2**. Divided into two sub-sections:

- **Water** — authorised inlets, unauthorised inlets, water flow, contamination, colour, turbidity, smell
- **Solid Waste** — solid waste inside (presence and type), solid waste outside (presence and type)

Each sub-section is collapsible. Click the section header to expand or collapse it.

---

## Charts — Full List

All 22 charts update dynamically when filters are applied.

### Infrastructure Charts (Left Panel)

| Chart | Form field | Type |
|---|---|---|
| Wall Condition | `wall_condition` | Pie |
| Fence | `fence` | Pie |
| Wall Material | `wall_material` | Pie |
| Wall Height | `wall_height` | Histogram (1 ft bins) |
| Bridge Type | `bridge_type` | Pie |
| Bridge Condition | `bridge_condition` | Pie |
| Walkable | `bridge_walkable` | Pie |
| Piers Condition | `piers_condition` | Pie |
| Piers Count | `piers_num` | Bar |
| Electrical | `elec_condition` | Bar |
| Cables | `cables_condition` | Bar |
| Manholes | `manholes_condition` | Bar |

### Water Quality Charts (Right Panel)

| Chart | Form field | Type |
|---|---|---|
| Authorised Inlets | `inlets` | Pie |
| Unauthorised Inlets | `unauthorised_inlets` | Pie |
| Water Flow | `water_stagnant` | Pie |
| Water Contamination | `water_contamination` | Pie |
| Water Colour | `water_colour` | Pie |
| Water Turbidity | `water_turbidity` | Pie |
| Water Smell | `water_smell` | Pie |
| Solid Waste Inside | `sw_inside` | Pie |
| Solid Waste Inside — Type | `sw_inside_type` | Pie |
| Solid Waste Outside | `sw_outside` | Pie |
| Solid Waste Outside — Type | `sw_outside_type` | Pie |

---

## Filters

### Dropdown Filters

Two dropdowns appear at the top of the map:

- **Team** — filters by `team_code`, multi-select
- **Drain** — filters by drain ID (`_drain` or `_secondarydrain`), multi-select

Both dropdowns cross-filter each other: selecting a team narrows the drain options to only drains that team visited, and vice versa.

### Chart Filters

Clicking a slice or bar in any chart filters the map to show only points with that value. The selected slice/bar stays highlighted; others dim. Click again to deselect.

Chart filters and dropdown filters work together (AND logic). For example: selecting team "BRB" and clicking "Black" on the Water Colour chart shows only BRB team's points where water colour was recorded as black.

### Reset Filters

The **Reset** button (top of map) clears all chart filters. It is only visible when at least one chart filter is active. Dropdown filters must be cleared manually from the dropdowns.

---

## Typology Toggle

A toggle switch at the top of the map shows or hides the drain typology overlay. When on, drain segments are coloured by their LHS/RHS typology code (t1–t12). This is the same typology data used in the Ecology Map.

Toggle it off to reduce visual clutter when reviewing audit points.

---

## Audit Point Popup

Clicking any point on the map opens a detailed popup showing all recorded data for that submission. The popup has two columns:

- **Left column (Form-1)** — infrastructure data: wall condition, fence, material, height, bridge, piers, utilities, and the Form-1 photo
- **Right column (Form-2)** — water quality data: inlets, contamination, water colour, turbidity, smell, solid waste, and the Form-2 photo

Photos are loaded from the local `media_compressed` folder. If a photo is missing or not yet compressed and uploaded, that image slot will be empty.

---

## How the Dashboard Builds Itself (Technical Summary)

When the page loads, `script.js` does the following:

1. Fetches `form-1.csv`, `form-2.csv`, and `form-3.csv` from `../audit_dashboard/data/csv/`
2. Joins Form-2 rows to Form-1 rows by `_index_f1 → _index`
3. Builds a GeoJSON FeatureCollection from Form-1 coordinates, embedding all Form-2 fields as properties
4. Form-2 rows with no matching Form-1 record are plotted separately as pink dots
5. Loads primary drains, secondary drains, and typology GeoJSON from `../download_center/data/json/`
6. Renders all 22 charts via `charts.js`
7. Sets up the team and drain filter dropdowns

---

## Common Mistakes to Avoid

| Mistake | Effect | Fix |
|---|---|---|
| Photos not compressed yet | Image slots empty in popup | Run `compress_images.py` then `upload_images.py` as described in the Audit Dashboard README |
| CSVs not updated after new submissions | Dashboard shows stale data | Export fresh CSVs from KoboToolbox and replace the files in `audit_dashboard/data/csv/` |
| Form-2 only (pink) dots appearing | May indicate unmatched records | Check that Form-2 rows have a valid `_index_f1` matching a Form-1 `_index` |
| Typology overlay not appearing | `typology.geojson` missing or empty | Check the file exists in `../download_center/data/json/typology.geojson` |
