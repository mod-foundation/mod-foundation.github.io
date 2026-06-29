# Ecology Map — How It Works & How to Update It

## Overview

The ecology map is a richly layered Mapbox map covering Bengaluru's stormwater ecology — drains, tanks (existing and lost across centuries), valleys, watershed, DEM/hillshade, wards, flood hotspots, sewer lines, and drain typologies. Layers are toggled via a collapsible legend panel, and clicking features shows a popup with properties. The typology panel shows LHS/RHS axonometric diagrams when a typology drain segment is clicked.

---

## File Locations

```
ecology_map/
├── typology_axos/          ← Axonometric diagram images (t1-t2.png format)
├── images/
│   └── dem_section.jpg     ← DEM section image used in the panel
├── index.html
├── main.js
└── map-style.css
```

---

## The Map Style

The map uses a **Mapbox hosted style** (`mapbox://styles/mod-foundation/cmimsj4eh00q401qw4s9b2ogt`). All base layers, colours, label placements, and source tile URLs are defined in that Mapbox Studio style — not in this repo's code.

To change visual styling (colours, fonts, label sizes, layer order in the base style), edit the style in **Mapbox Studio** and publish it. Changes appear on the live map immediately without any code changes.

---

## Layer Groups — What's on the Map

Layers are grouped in the legend panel. Each group can be toggled on/off with its checkbox and its opacity adjusted with the slider.

| Group | What it shows |
|---|---|
| Primary Drains | Primary stormwater drain network |
| Secondary Drains | Secondary drain network |
| Existing Tanks | Current lakes/tanks |
| Lost Tanks | Tanks lost after 2000 |
| Tanks 1700 | Tank network as of the 1700s |
| Tanks 1800 | Tank network as of the 1800s (lost and existing) |
| Tanks 1900 | Tank network as of the 1900s (lost and existing) |
| Flood Hotspots | Known flood-prone locations |
| BWSSB Sewer Lines | Underground sewer network (300mm+ and less) |
| Valleys | Valley boundaries |
| Valley Categories | Colour-coded valley types |
| Sub Valleys | Sub-valley boundaries |
| Watershed | Strahler stream order / watershed |
| Greens | Parks and wetlands |
| Boundaries | GBA boundary and ward boundaries |
| Background | Satellite, roads, place labels, DEM, hillshade, Carto basemap |
| Typologies | Drain typology analysis layer (LHS/RHS side coding) |

Layers hidden by default on load: Typologies, Tanks 1700/1800/1900, Flood Hotspots, Sewer Lines, Carto Positron, Carto Dark, Satellite Overlay, All Basins, Watershed, Valley Categories.

---

## Typology Codes

The typology layer codes each side of every drain segment as one of 12 types:

| Code | Description |
|---|---|
| t1 | Road Adjacent with Footpath |
| t2 | Road Adjacent without Footpath |
| t3 | Road Adjacent Ring Road / Highway |
| t4 | Property Adjacent Abutting Buildings |
| t5 | Property Adjacent with Setback |
| t6 | Lake Adjacent with Pathway |
| t7 | Lake Adjacent without Pathway |
| t8 | Inside Private Property / Campus |
| t9 | Railway Adjacent |
| t10 | Open Space Adjacent |
| t11 | Agricultural Land Adjacent |
| t12 | Vacant Land Adjacent |

Each drain segment has a **LHS** (left-hand side) and **RHS** (right-hand side) typology code. Clicking a typology drain segment shows both sides in popups on the map and loads the matching axonometric diagram in the panel.

---

## Typology Axonometric Images

The `typology_axos/` folder holds PNG diagrams named in the format `<lhs>-<rhs>.png`, e.g. `t1-t2.png` means the left bank is t1 and the right bank is t2.

When a typology segment is clicked, the panel reads the LHS and RHS codes from the feature and loads `typology_axos/<lhs>-<rhs>.png` automatically.

**To add or replace an axonometric image:**
1. Name the file exactly `<lhs_code>-<rhs_code>.png` in lowercase (e.g. `t3-t7.png`)
2. Drop it into `ecology_map/typology_axos/`
3. Commit and push — it will appear automatically when the matching typology pair is clicked

---

## Interactive Features

| Feature | How it works |
|---|---|
| Click a drain/tank/park | Shows a popup with feature properties (name, drain number, status, etc.) |
| Click a typology segment | Shows LHS/RHS typology popups on the map + loads axo diagram in the side panel |
| Hover over a drain or tank | Cursor changes to pointer |
| Legend checkbox | Toggles the layer group on/off |
| Legend opacity slider | Fades the layer group without hiding it |
| DEM 3D button | Tilts and rotates the map to show DEM in 3D perspective |
| Valley view button | Zooms out to show the wider valley context |
| Filters panel | Filters drains, tanks, wards by valley, ward, corporation, drain number |

---

## Filters

The filter panel lets you narrow visible features by:

- **Valley** — shows only drains/tanks in selected valleys
- **Ward** — filters by ward name (supports search)
- **Primary drain number** — filter to a specific primary drain (supports search)
- **Secondary drain number** — filter to a specific secondary drain (supports search)

Filters use AND logic between groups and OR logic within each dropdown. The "Select All" and "Clear" buttons inside each dropdown apply to that filter only.

When a filter is active, the statistics panel updates to show the count and total length of currently visible drains and the count of visible tanks.

---

## Layer Data Sources

All vector tile data comes from the Mapbox hosted style. The shared download center GeoJSON files are **not** used in the ecology map (unlike the audit dashboard). All geometry lives in Mapbox tilesets linked to the style in Mapbox Studio.

To update any layer's geometry (e.g., add new drains, update tank boundaries):
1. Update the source dataset in **Mapbox Studio → Tilesets**
2. The style automatically picks up the new tileset version — no code changes needed

---

## View Presets

The map has three built-in view presets used by buttons and animated sequences:

| Preset | Description |
|---|---|
| Default view | City-scale view of the GBA area |
| DEM 3D view | Tilted 45°, rotated for terrain perspective |
| Valley view | Wider zoom to show the full valley network |

These are defined in `main.js` as `defaultViewBounds`, `dem3DViewBounds`, and `valleyViewBounds`.

---

## How the Map Builds Itself (Technical Summary)

When the page loads, `main.js` does the following:

1. Initialises a Mapbox map with the hosted style
2. Reads `layerConfig` — a central registry of every layer group, its label, and which Mapbox layer IDs belong to it
3. Generates the legend dynamically from `layerConfig` (checkboxes + opacity sliders)
4. Hides the layers listed in `hideLayers` (layers off by default)
5. Sets up click interactivity on interactive layers (drains, tanks, wards, parks, flood hotspots)
6. Initialises filter dropdowns linked to layer attributes
7. Sets up typology click handling to show LHS/RHS popups and load the axonometric diagram

---

## Common Mistakes to Avoid

| Mistake | Effect | Fix |
|---|---|---|
| Renaming a layer in Mapbox Studio without updating `layerConfig` in `main.js` | Layer disappears or toggle breaks | Keep `layerConfig` layer ID arrays in sync with Mapbox Studio layer IDs |
| Adding a new layer in Mapbox Studio but not adding it to `layerConfig` | Layer is not controllable via legend | Add the new layer ID to an existing group or create a new group in `layerConfig` |
| Axo image named `T1-T2.png` (uppercase) | Image won't load — filenames are case-sensitive on the server | Use lowercase: `t1-t2.png` |
| Axo image missing for a typology pair | Panel shows no image when that pair is clicked | Add the missing `<lhs>-<rhs>.png` file to `typology_axos/` |
| Editing the Mapbox style ID in `main.js` incorrectly | Map fails to load | The style URL must match a published style in the `mod-foundation` Mapbox account |
