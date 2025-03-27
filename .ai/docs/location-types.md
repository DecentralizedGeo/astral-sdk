---
id: location-types
title: Location Extensions Library Overview
sidebar_label: Location Extensions
---

# Location Extensions Library Overview

The Location Extensions Library is a core component of Astral's Location Proof Protocol, designed to provide a flexible, standardized way to work with a diversity of geospatial data. This Location Extensions Library contains detailed information defining a range of different location types supported by the protocol. Code for creating, parsing and validating this geospatial data is implemented in the Astral SDK repo.

## Overview

Each location format is defined by a unique identifier (the Location Format Identifier — a `string` value included in the `locationType` attribute). In the `location` attribute, a payload can be found that contains the geospatial data formatted according to that identifier. This approach enables:

- **Extensibility:** New location formats can be added easily without impacting existing functionality.
- **Interoperability:** A standardized interface allows different systems and proof strategies to work together seamlessly.
- **Flexibility:** Support for both vector and raster data types is built in, with clear distinctions made through our naming convention.

In v0.1 of the Astral SDK, all location formats are eventually converted to GeoJSON internally for vector data, which facilitates analysis and visualization. For raster data, the system will usually treat the payload as a pointer (typically a link to an asset stored on IPFS) to the raster artifact.

## Location Format Identifier Naming Convention

The **Location Format Identifier** is a string that uniquely defines how the location data is structured. It is designed to be:
 
- **All lower case**
- **Dot-separated**, with each segment conveying a specific piece of information
- **Kebab-case** for multi-word segments

The general structure is:

`<format>-<type>[+<additional-details>]`

Where:
- **`format`:** Specifies the underlying data format or family (e.g., `coordinate`, `geojson`, `wkt`, `geohash`, `raster`).
- **type:** Indicates the feature type or data subtype (e.g., `decimal`, `point`, `polygon`, `geotiff`). Note that this is recommended, but not required, and for some format types, not relevant.
- **additional-details (optional):** Provides extra context, such as ordering or specific variants (e.g., `lon-lat` (preferred) vs `lat-lon`). This component is only included when relevant.

### Location Format Identifiers

| Format                         | Format ID  | Type                                                        | Identifier                     | v0.1 Support | Additional Details                                                                 |
|--------------------------------|-----------|-------------------------------------------------------------|--------------------------------|--------------|-----------------------------------------------------------------------------------|
| Decimal Degrees (Vector)       | `coordinate` | `decimal`                                                     | `lon-lat`, `lat-lon`           | Yes          | Decimal coordinates with values ordered as longitude then latitude.              |
| GeoJSON (Vector)               | `geojson`    | `point`, `linestring`, `polygon`, etc.                      |                                | Yes          | Standard GeoJSON object; type determined by the geometry property.               |
| WKT (Vector)                   | `wkt`       | `point`, `linestring`, `polygon`, `multipoint`, `multilinestring`, `multipolygon`, `featurecollection` |                                | Yes          | Well-Known Text string representing various vector geometries.                   |
| H3 (Vector)                    | `h3`        | (Implicit cell region)                                      |                                | Yes       | H3 index used for spatial indexing.                                              |
| Degrees Minutes Seconds (Vector) | `coordinate` | `dms`                                                         | `lon-lat`, `lat-lon`           | Future       | Coordinates in degrees, minutes, seconds; ordered as latitude then longitude.    |
| Geohash (Vector)               | `geohash`   | (Implicit cell region)                                      |                                | Future       | Geohash string representing a spatial grid cell; useful for spatial queries.     |
| W3W (Vector)                   | `w3w`       | (Implicit cell region)                                      |                                | Future (Likely) | Three-word addressing system for pinpointing locations.                      |
| SHP (Vector)                   | `shp`       | TBD                                                         |                                | Future       | Shapefile format; usually references a collection of files rather than a string. |
| GeoTIFF (Raster)               | `raster`    | `geotiff`                                                       |                                | Future       | Pointer (e.g., an IPFS CID) to a GeoTIFF image used for raster imagery.         |
| JPEG2000 (Raster)              | `raster`    | `jpeg2000`                                                    |                                | Future       | Pointer to a JPEG2000 image; used for high-resolution remote sensing imagery.    |
| PNG (Raster)                   | `raster`    | `png`                                                         |                                | Future       | Pointer to a PNG image; used for simpler raster maps and visualizations.        |


## Handling Vector and Raster Data

### Vector Data
For vector data, the SDK converts all inputs into GeoJSON internally. This conversion facilitates standard operations like mapping, spatial analysis, and integration with web applications. Examples of vector formats include:
- `coordinate-decimal+lon-lat`
- `geojson-point`
- `wkt-polygon`

### Raster Data
Raster formats are distinguished by the `raster` prefix. The `location` field for raster formats is most typically used as a pointer to an external resource (e.g., a GeoTIFF file stored on IPFS). The identifier for raster formats follows the same dot-notation principles. For example:
- `raster-geotiff`

Using the `raster` prefix makes it immediately clear that the payload does not contain a direct geometric representation but a link to a raster artifact.

For v0.1, the SDK will attempt to detect a polygon, bounding box, or centroid (in that order) representing the geographic location of the raster artifact.

## Extensibility and Future-Proofing

The beauty of this extensions library is its inherent flexibility:
- **Emerging Formats:** As new data types emerge—whether new vector standards or advanced raster formats—you can simply define new identifiers (e.g., `raster-geotiff+multiband`).
- **Custom Extensions:** If specialized use cases arise, new extensions can be built without impacting the core functionality. This modular approach allows the protocol to evolve organically.
- **Simplicity First:** We're not trying to boil the ocean from the start. The goal is to cover the most common formats now, and then expand as needed.

Note that for v0.1, the only spatial reference system (`srs`) supported is WGS84, or EPSG:4326. We prefer using the `EPSG:<SRID>` notation in the `srs` attribute, though this is subject to change in future versions.

### Additional Considerations

The Location Proof Protocol is intended to be as interoperable with the rest of the geospatial web as possible. One way to think about location proofs is as a wrapper around a geospatial data artifact that includes digital signatures and evidence about its truthfulness or authenticity. 

In that sense, location proofs are spatio-temporal assets. We are considering how to integrate / harmonize the Location Proof Protocol with the STAC spec — weigh in [here](https://github.com/DecentralizedGeo/location-proofs/issues/2).

## Conclusion

The Location Extensions Library provides a robust and adaptable framework for handling a wide range of geospatial data types. By employing a clean, dot-notation naming convention for our Location Format Identifiers, we ensure that our system is both intuitive and forward-compatible. With clear distinctions between vector and raster data, the library is well-positioned to accommodate emerging data types while maintaining simplicity and consistency.

For contributions, questions, or further discussions, please refer to our contributing guidelines and join our [community channels](https://t.me/+UkTOSXnDcDM5ZTBk).