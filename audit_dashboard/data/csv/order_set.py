import os
import geopandas as gpd
import pandas as pd

def assign_audit_point_order(
    audit_csv_path,
    primary_drains_path,
    secondary_drains_path,
    drain_col_audit="_drain",
    secondary_drain_col_audit="_secondarydrain",
    drain_col_primary="Drain num",
    drain_col_secondary="Drain num",
    lat_col="lat",
    lon_col="long",
    output_path=None
):
    # --- Load audit points ---
    df = pd.read_csv(audit_csv_path, skiprows=[1], encoding="utf-8-sig")
    df[lat_col] = pd.to_numeric(df[lat_col].astype(str).str.replace(r'[^\d.\-]', '', regex=True), errors='coerce')
    df[lon_col] = pd.to_numeric(df[lon_col].astype(str).str.replace(r'[^\d.\-]', '', regex=True), errors='coerce')
    df = df.dropna(subset=[lat_col, lon_col])

    df_primary = df[df[drain_col_audit].notna()].copy()
    df_secondary = df[df[secondary_drain_col_audit].notna()].copy()

    print(f"Audit points — primary: {len(df_primary)}, secondary: {len(df_secondary)}")

    TARGET_CRS = "EPSG:32643"

    def make_gdf(df_subset):
        return gpd.GeoDataFrame(
            df_subset,
            geometry=gpd.points_from_xy(df_subset[lon_col], df_subset[lat_col]),
            crs="EPSG:4326"
        ).to_crs(TARGET_CRS)

    gdf_primary_points = make_gdf(df_primary)
    gdf_secondary_points = make_gdf(df_secondary)

    gdf_primary_drains = gpd.read_file(primary_drains_path).reset_index(drop=True)
    gdf_secondary_drains = gpd.read_file(secondary_drains_path).reset_index(drop=True)

    gdf_primary_drains = gdf_primary_drains.to_crs(TARGET_CRS)
    gdf_secondary_drains = gdf_secondary_drains.to_crs(TARGET_CRS)

    gdf_primary_drains["_drain_seq"] = gdf_primary_drains.index
    gdf_secondary_drains["_drain_seq"] = gdf_secondary_drains.index

    def build_lookup(gdf_drains, drain_col):
        lookup = {}
        for _, row in gdf_drains.iterrows():
            drain_id = str(row[drain_col])
            lookup[drain_id] = {"geom": row.geometry, "seq": row["_drain_seq"]}
        return lookup

    primary_lookup = build_lookup(gdf_primary_drains, drain_col_primary)
    secondary_lookup = build_lookup(gdf_secondary_drains, drain_col_secondary)

    def annotate_points(gdf_points, ref_col, lookup):
        def get_seq(row):
            entry = lookup.get(str(row[ref_col]))
            return entry["seq"] if entry else None

        def get_dist(row):
            entry = lookup.get(str(row[ref_col]))
            return entry["geom"].project(row.geometry) if entry else None

        gdf_points = gdf_points.copy()
        gdf_points["_drain_seq"] = gdf_points.apply(get_seq, axis=1)
        gdf_points["_dist_along_drain"] = gdf_points.apply(get_dist, axis=1)
        return gdf_points

    gdf_primary_points = annotate_points(gdf_primary_points, drain_col_audit, primary_lookup)
    gdf_secondary_points = annotate_points(gdf_secondary_points, secondary_drain_col_audit, secondary_lookup)

    gdf_primary_points = gdf_primary_points.sort_values(
        ["_drain_seq", "_dist_along_drain"], ascending=[True, True]
    ).reset_index(drop=True)

    gdf_secondary_points = gdf_secondary_points.sort_values(
        ["_drain_seq", "_dist_along_drain"], ascending=[True, True]
    ).reset_index(drop=True)

    gdf_primary_points["order"] = gdf_primary_points.index + 1
    primary_count = len(gdf_primary_points)
    gdf_secondary_points["order"] = gdf_secondary_points.index + 1 + primary_count

    combined = pd.concat([gdf_primary_points, gdf_secondary_points], ignore_index=True)
    result = combined.drop(columns=["geometry", "_drain_seq", "_dist_along_drain"])

    if output_path:
        result.to_csv(output_path, index=False)
        print(f"Saved to {output_path}")

    return result


# --- Usage ---
audit_csv_path = "form-1.csv"

df_ordered = assign_audit_point_order(
    audit_csv_path=audit_csv_path,
    primary_drains_path="../../../download_center/data/json/primarydrains.geojson",
    secondary_drains_path="../../../download_center/data/json/secondarydrains.geojson",
    drain_col_audit="_drain",
    secondary_drain_col_audit="_secondarydrain",
    drain_col_primary="Drain num",
    drain_col_secondary="Drain num",
    output_path=os.path.join(
        os.path.dirname(os.path.abspath(audit_csv_path)),
        "form-1-ordered.csv"
    )
)

print(df_ordered[["_drain", "_secondarydrain", "order"]].to_string())