# <span style="color: #0d6aff;">Datasets and Sources</span>

Most of the data has been created and analysed by MOD Foundation. Some datasets have been taken from [Open City](https://data.opencity.in) and [Well Labs](https://welllabs.org).

## <span style="color: #0d6aff;">Data Catalog</span>

### <span style="color: #68c2fb;">Drains</span>

| Layer | Source | Description | Link | Resource |
|-------|--------|-------------|------|----------|
| **Primary Drains** | Map depicting Storm Drainage Network under BBMP | The map of SWDs has been georeferenced. Please refer to page 3 of the CAG report for SWD map. The primary and secondary drains were digitised to produce files in GIS format. The data can be downloaded from Interactive map. | [Geojson](/datasets/primarydrains.geojson)| [CAG Performance Audit - Open City](https://data.opencity.in/dataset/cag-performance-audit-of-stormwater-drains-in-bengaluru/resource/cag-performance-audit-of-stormwater-drains-in-bengaluru) |
| **Secondary Drains** | Map depicting Storm Drainage Network under BBMP | The map of SWDs has been georeferenced. Please refer to page 3 of the CAG report for SWD map. The primary and secondary drains were digitised to produce files in GIS format. The data can be downloaded from Interactive map. |[Geojson](/datasets/primarydrains.geojson)| [CAG Performance Audit - Open City](https://data.opencity.in/dataset/cag-performance-audit-of-stormwater-drains-in-bengaluru/resource/cag-performance-audit-of-stormwater-drains-in-bengaluru) |

### <span style="color: #68c2fb;">Tanks</span>

| Layer | Source | Description | Link |
|-------|--------|-------------|------|
| **Existing Tanks** | GIS Analysis by Mod Foundation | Reconciled the Well Labs and ATREE crowdsourced [dateset]( https://drive.google.com/drive/folders/1Vs0sDJiDlv45K-F0OeBeaMuDmueUMLUX) with the data on BBMP Lakes [dashboard](https://lms.bbmpgov.in/lake) to confirm location of lakes. Verified with the comprehensive list of 201 lakes released in 2024 by [KTCDA](https://ktcda.karnataka.gov.in/storage/pdf-files/BBMP%20Lakes.pdf) |[Geojson](/datasets/lakes_existing.geojson)|
| **Lost Tanks** | GIS Analysis by Mod Foundation | GIS Analysis performed by tracing georeferenced maps for the years 1791 (Robert Homes Survey of Pete and Kote), 1870 (Revenue Survey Map Chief Commisioner Bangalore) and 1969(Survey of India). Verified with Revenue Maps of Bangalore [SSLR](https://www.landrecords.karnataka.gov.in/service3/Lakeencroachment.aspx) [Open City Cadastral](https://data.opencity.in/dataset/bengaluru-cadastral-maps/resource/bbmp-area-cadastral-map) . The waterbodies were digitised and their names have been added in the attribute data. |[Geojson](/datasets/lakes_lost.geojson)|

### <span style="color: #68c2fb;">Geographic Features</span>

| Layer | Source | Description | Link |
|-------|--------|-------------|------|
| **Watershed Basins** | Hydroshed | [Geojson](/datasets/all_basins.geojson) | [Hydroshed](https://www.hydrosheds.org/)  |
| **Valleys** | Hydroshed | [Geojson](/datasets/valley.geojson) | [Hydroshed](https://www.hydrosheds.org/)   |
| **Streamorder** | Hydroshed | [Geojson](/datasets/streamorder.geojson) | [Hydroshed](https://www.hydrosheds.org/)   |
| **Parks** | Open City | [Geojson](/datasets/parks.geojson) | - |
| **Wetlands** | Open City | [Geojson](/datasets/wetlands.geojson) | - |

### <span style="color: #68c2fb;">Administrative Boundaries</span>

| Layer | Source | Description | Link | Resource |
|-------|--------|-------------|------|----------|
| **GBA Wards** | Open City | Greater Bengaluru Authority Wards Delimitation 2025  | [Geojson](/datasets/gba_wards.geojson) | [GBA Wards - Open City](https://data.opencity.in/dataset/gba-wards-delimitation-2025) |
| **GBA Ward Boundary** | Open City | Greater Bengaluru Authority Ward Boundary Delimitation 2025 | [Geojson](/datasets/gba_boundary.geojson) | [GBA Wards - Open City](https://data.opencity.in/dataset/gba-wards-delimitation-2025) |

### <span style="color: #68c2fb;">Background Layers</span>

| Layer | Source | Description | Link | Resource |
|-------|--------|-------------|------|----------|
| **DEM** | USGS Earth Explorer | Digital Elevation Model (DEM) 30m resolution downloaded from Earth Explorer | [TIF](/datasets/DEM.tif) | [USGS Earth Explorer](https://earthexplorer.usgs.gov/) |
| **Roads** | Mapbox | Click on "Copy this style into your account" | [Style Link](https://api.mapbox.com/styles/v1/modfoundation/cmimsj4eh00q401qw4s9b2ogt.htmltitle=copy&access_token=pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A&zoomwheel=true&fresh=true#2/38/-34) |
| **Place Labels** | Mapbox | Click on "Copy this style into your account" | [Style Link](https://api.mapbox.com/styles/v1/modfoundation/cmimsj4eh00q401qw4s9b2ogt.htmltitle=copy&access_token=pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A&zoomwheel=true&fresh=true#2/38/-34) |
| **Basemap** | Mapbox | Click on "Copy this style into your account" | [Style Link](https://api.mapbox.com/styles/v1/modfoundation/cmimsj4eh00q401qw4s9b2ogt.htmltitle=copy&access_token=pk.eyJ1IjoibW9kLWZvdW5kYXRpb24iLCJhIjoiY21ncnNrcmx4MXdlOTJqc2FjNW85ZnR3NSJ9.0Ha_bpb4AJ-O2pvIumHu7A&zoomwheel=true&fresh=true#2/38/-34) |

### <span style="color: #68c2fb;">Typologies</span>

| Layer | Source | Description | Link |
|-------|--------|-------------|------|
| **Typology Guidebook** | Building a Resilient Bengaluru | Comprehensive guidebook on drain typologies | [Typology Guidebook](https://buildingaresilientbengaluru.com/) |
| **Typology Analysis for C100** | MOD Foundation | Access the Streetview and Satellite imager screenshots [here](/files) | [Geojson](/datasets/typology_analysis.geojson) |

---

## <span style="color: #0d6aff;">Data Processing Notes</span>

- **Georeferencing**: Historical Survey of India maps (1790, 1870, 1969) were georeferenced for tank analysis
- **Digitization**: Primary and secondary drains were manually digitized from CAG report maps
- **Attribution**: Waterbody names and relevant metadata were added to attribute tables
- **Format**: All spatial data is available in GIS-compatible formats

## <span style="color: #0d6aff;">Data Access</span>

Interactive versions of these datasets can be explored and downloaded through:
- [Building a Resilient Bengaluru Interactive Map](https://buildingaresilientbengaluru.com/ecology-map/)
- [Open City Data Portal](https://data.opencity.in)

---

## GIS DISCLAIMER

While every effort has been made to ensure the accuracy of this information, Mod Foundation makes no warranty, expressed or implied, as to its absolute accuracy. This product is for informational purposes and is not suitable for legal, engineering, or surveying purposes. It does not represent an on-the-ground survey and represents only approximate relative locations.

*For questions about data quality, methodology, or access, please contact MOD Foundation.*
