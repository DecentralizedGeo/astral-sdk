---
title: Geospatial Concepts  
sidebar_position: 2
description: Spatial data and coordinate systems concepts for Web3 developers
---

# Geospatial Concepts for Web3 Developers

If you're comfortable with blockchain and Web3 but new to spatial data, this guide covers what you need to know to work with location-based applications.

## What is Spatial Data?

**Spatial data** represents the location, shape, and characteristics of features on Earth (or other surfaces). Every feature has:

- **Geometry**: Where it is (coordinates, shapes)
- **Attributes**: What it is (properties, metadata)
- **Relationships**: How it relates to other features

Think of it like a database where every record has a "location" column that contains geometric information instead of just text or numbers.

## Coordinate Systems

All locations need a **coordinate reference system** to make sense:

### Geographic Coordinates (Most Common)
- **Longitude**: East-West position (-180° to +180°)
- **Latitude**: North-South position (-90° to +90°)  
- **Order**: Always `[longitude, latitude]` in GeoJSON (like `[x, y]`)

```typescript
// London coordinates
const london = {
  type: 'Point',
  coordinates: [-0.1276, 51.5074] // [longitude, latitude]
};
```

### Important Notes
- **Longitude first**: This trips up many developers! Unlike "lat, lng" in some mapping libraries, GeoJSON uses `[lng, lat]`
- **Decimal degrees**: Modern systems use decimal numbers, not degrees/minutes/seconds
- **WGS84**: The global standard coordinate system (GPS uses this)

## GeoJSON Format

**GeoJSON** is the de facto standard for spatial data on the web. It's just JSON with specific structure for geometry:

### Basic Geometries

```typescript
// Point - single location
{
  type: 'Point',
  coordinates: [139.6917, 35.6895] // Tokyo
}

// LineString - connected path  
{
  type: 'LineString',
  coordinates: [
    [lng1, lat1], [lng2, lat2], [lng3, lat3]
  ]
}

// Polygon - enclosed area
{
  type: 'Polygon',
  coordinates: [[
    [lng1, lat1], [lng2, lat2], [lng3, lat3], [lng1, lat1] // Must close!
  ]]
}
```

### Features with Metadata

```typescript
// Feature - geometry + properties
{
  type: 'Feature',
  properties: {
    name: 'Central Park',
    area_hectares: 341,
    established: 1857
  },
  geometry: {
    type: 'Polygon',
    coordinates: [/* polygon coordinates */]
  }
}

// FeatureCollection - multiple features
{
  type: 'FeatureCollection',
  features: [feature1, feature2, feature3]
}
```

## Spatial Data Types

### Vector Data (What Astral SDK Uses)
**Discrete features** represented as points, lines, and polygons:

- **Points**: GPS coordinates, sensors, landmarks, events
- **Lines**: Roads, trails, pipelines, boundaries  
- **Polygons**: Buildings, parks, administrative areas, watersheds

### Raster Data (Images/Grids)
**Continuous data** in pixel/cell format:
- Satellite imagery, elevation models, weather data
- Not directly supported in current Astral SDK (coming later)

## Common Spatial Operations

Understanding these concepts helps you work with location attestations:

### Containment
"Is this point inside this polygon?"
```typescript
// Useful for: "Was this GPS reading inside the authorized zone?"
```

### Distance  
"How far apart are these locations?"
```typescript
// Useful for: "Are these two attestations close enough to be the same place?"
```

### Buffering
"Create an area around this point/line"
```typescript
// Useful for: "Create a 100m radius around this monitoring station"
```

## Precision and Accuracy

**Precision**: How many decimal places in coordinates
- 1 decimal place ≈ 11 km
- 2 decimal places ≈ 1.1 km  
- 3 decimal places ≈ 110 m
- 4 decimal places ≈ 11 m
- 5 decimal places ≈ 1.1 m

**Accuracy**: How close coordinates are to reality
- GPS: Usually 3-5 meters accuracy
- Survey equipment: Centimeter accuracy
- Cell phone: 10-50 meters accuracy

Choose precision that matches your accuracy - don't use 8 decimal places for cell phone GPS!

## Spatial Reference Systems

**EPSG:4326** (WGS84) is the global standard that Astral SDK uses by default. You might encounter others:

- **EPSG:3857**: Web Mercator (Google Maps, most web maps)
- **EPSG:4269**: NAD83 (North America)
- **Local projections**: Country or region-specific systems

For most applications, stick with WGS84 (EPSG:4326) unless you have specific requirements.

## Working with Spatial Libraries

Astral SDK integrates well with popular spatial libraries:

### Turf.js (JavaScript)
```typescript
import * as turf from '@turf/turf';

// Validate GeoJSON before creating attestation
const point = { type: 'Point', coordinates: [lng, lat] };
if (turf.booleanValid(point)) {
  const attestation = await sdk.createOffchainLocationAttestation({
    location: point,
    memo: 'Validated coordinate'
  });
}
```

### Mapbox/Leaflet Integration
```typescript
// From map click to attestation
map.on('click', async (e) => {
  const attestation = await sdk.createOffchainLocationAttestation({
    location: {
      type: 'Point', 
      coordinates: [e.lngLat.lng, e.lngLat.lat]
    },
    memo: 'User-selected location'
  });
});
```

## Common Spatial Data Sources

**Open Data**:
- OpenStreetMap (global mapping data)
- Natural Earth (country/state boundaries)
- Government open data portals

**Commercial**:
- Google Maps API
- Mapbox datasets  
- Esri ArcGIS services

**Sensors**:
- GPS devices
- IoT environmental sensors
- Mobile phone location services

## Spatial Data Quality

When creating location attestations, consider:

**Completeness**: Do you have all required coordinates?

**Consistency**: Are coordinates in the expected range and format?

**Accuracy**: Does the precision match your data source quality?

**Temporal**: When was this location data collected?

```typescript
// Example validation before attestation
function validateLocation(coordinates: [number, number]) {
  const [lng, lat] = coordinates;
  
  if (lng < -180 || lng > 180) throw new Error('Invalid longitude');
  if (lat < -90 || lat > 90) throw new Error('Invalid latitude');
  
  // Check precision matches expected accuracy
  const precision = lng.toString().split('.')[1]?.length || 0;
  if (precision > 6) console.warn('Unusually high precision for GPS data');
  
  return true;
}
```

## Location Privacy Considerations

Spatial data is sensitive! Consider:

**Exact vs. approximate**: Do you need precise coordinates or general area?

**Aggregation**: Can you use areas instead of points?

**Temporal granularity**: Hourly vs. daily vs. weekly data?

**Access control**: Who should be able to see this location data?

```typescript
// Example: Reduce precision for privacy
function reduceLocationPrecision(coordinates: [number, number], precision = 3) {
  return coordinates.map(coord => 
    parseFloat(coord.toFixed(precision))
  ) as [number, number];
}
```

## Integration Patterns

### From Spatial Database to Attestation
```typescript
// PostGIS/PostgreSQL example
const query = `
  SELECT 
    ST_AsGeoJSON(geom)::json as geometry,
    site_id,
    measurement_type,
    recorded_at
  FROM sensor_readings 
  WHERE recorded_at >= NOW() - INTERVAL '1 hour'
`;

const results = await db.query(query);

for (const row of results) {
  await sdk.createOffchainLocationAttestation({
    location: row.geometry,
    memo: `${row.measurement_type} from sensor ${row.site_id}`,
    timestamp: row.recorded_at
  });
}
```

### From Web Map to Attestation
```typescript
// Leaflet example
const map = L.map('map');

map.on('click', async (e) => {
  const attestation = await sdk.createOffchainLocationAttestation({
    location: {
      type: 'Point',
      coordinates: [e.latlng.lng, e.latlng.lat] // Note: Leaflet uses lat,lng
    },
    memo: 'User-marked location'
  });
});
```

## Next Steps

- **[Quick Start](../quick-start)** - Create your first spatial attestation
- **[Getting Started Guide](../guides/getting-started)** - Complete tutorial with examples
- **[Web3 Concepts](./web3)** - If you want to understand the blockchain side too

Understanding these spatial fundamentals will help you build more effective location-based applications with Astral SDK!