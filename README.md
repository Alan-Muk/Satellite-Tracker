
# Satellite Tracking System

![Rust](https://img.shields.io/badge/Rust-1.89-000000?logo=rust)
![Axum](https://img.shields.io/badge/Axum-Web_Server-000000)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![CesiumJS](https://img.shields.io/badge/CesiumJS-3D_Globe-6CADDF)
![Tokio](https://img.shields.io/badge/Tokio-Async_Runtime-000000)
![License](https://img.shields.io/badge/License-MIT-green)

A full-stack satellite visualization platform that downloads, parses, classifies and renders thousands of active Earth-orbiting satellites in real time.

The application combines a high-performance asynchronous Rust backend with a React + Cesium frontend to provide an interactive 3D globe capable of displaying orbital motion, constellation classification, orbit prediction and real-time satellite visualization.

---

# Overview

The system is designed around the complete satellite data lifecycle.

```text
                CelesTrak

                    │
                    ▼

          TLE Download Service

                    │
                    ▼

             Local Cache Layer

                    │
                    ▼

             TLE Parser Engine

                    │
                    ▼

         Orbit Metadata Generator

                    │
                    ▼

          Satellite Manager (Rust)

                    │
          REST API (Axum)

                    │
                    ▼

      React + TypeScript Frontend

                    │
                    ▼

         Cesium 3D Globe Renderer

                    │
                    ▼

      Interactive Satellite Tracking
```

The backend continuously maintains a catalogue of active satellites while the frontend focuses entirely on visualization, interaction and animation.

---

# Motivation

Tracking satellites involves significantly more than displaying coordinates on a globe.

A complete visualization platform must address:

- ingesting thousands of TLE records
- validating orbital data
- deriving orbital characteristics
- organizing satellites into constellations
- exposing a queryable API
- rendering thousands of moving objects efficiently
- animating orbital motion
- visualizing orbital regions
- supporting user interaction at scale

This project explores how modern systems programming and GPU-accelerated rendering can be combined to build a performant satellite visualization platform.

---

# Architecture

## High-Level Architecture

```text
                        CelesTrak

                            │
                Download Active Catalog

                            │

                Validate TLE Records

                            │

                 Parse Orbital Elements

                            │

            Compute Orbit Characteristics

                            │

             Store in Satellite Manager

                            │

                Axum REST Endpoints

                            │

               React Data Fetching Hooks

                            │

                 Cesium Scene Graph

                            │

           Animated Satellite Rendering
```

---

# Backend

The backend is entirely written in Rust.

Responsibilities include:

- downloading active TLE catalogues
- validating downloaded data
- maintaining an offline cache
- parsing orbital elements
- generating derived orbital metadata
- satellite classification
- REST API
- prediction generation
- orbital position calculation

The backend separates responsibilities into dedicated modules, allowing each subsystem to evolve independently.

---

# TLE Download Pipeline

The backend downloads the current active satellite catalogue directly from CelesTrak.

Workflow:

```text
HTTP Request

      │

      ▼

Receive TLE File

      │

Validate Format

      │

      ▼

Save Local Cache

      │

      ▼

Parse Records

      │

      ▼

Insert Into Manager
```

If downloading fails, the application automatically falls back to the cached catalogue, allowing the system to continue operating without network access.

---

# TLE Parser

The parser processes every satellite using the standard three-line format:

```text
Satellite Name

Line 1

Line 2
```

For every record it extracts:

- NORAD identifier
- satellite name
- original TLE lines
- derived orbital metadata

Malformed records are rejected before entering the application.

---

# Orbit Metadata

Rather than exposing raw TLE information, the backend computes higher-level orbital characteristics.

Derived values include:

- orbital altitude
- inclination
- orbital period
- orbit region

This allows the frontend to perform visualization without understanding TLE mathematics.

---

# Orbit Classification

Satellites are automatically classified according to their altitude.

| Region | Approximate Altitude |
|---------|---------------------:|
| VLEO | 0–300 km |
| LEO | 300–2,000 km |
| MEO | 2,000–35,786 km |
| GEO | ~35,786 km |
| HEO | Above GEO |

These classifications drive filtering, coloring and visualization.

---

# Satellite Classification

Constellations are automatically identified from satellite names.

Examples include:

- Starlink
- GPS
- Galileo
- OneWeb
- NOAA
- Iridium
- Landsat
- ISS

Grouping satellites allows constellation-based filtering and statistics.

---

# Satellite Manager

The backend stores satellites inside an in-memory manager backed by a HashMap.

Responsibilities include:

- insertion
- lookup by NORAD ID
- bulk loading
- iteration
- catalogue statistics

The manager acts as the application's primary data store.

---

# REST API

The backend exposes multiple endpoints.

## Health

```
GET /health
```

Returns application status.

---

## Satellite Catalogue

```
GET /satellites
```

Returns active satellites.

Supports configurable limits.

---

## Individual Satellite

```
GET /satellites/{norad_id}
```

Returns metadata for a specific satellite.

---

## Live Position

```
GET /satellites/{norad_id}/position
```

Calculates the current orbital position.

---

## Orbit Prediction

```
GET /satellites/{norad_id}/prediction
```

Generates a future orbital path using SGP4 propagation.

---

## Group Statistics

```
GET /satellites/groups
```

Returns constellation counts.

---

## Orbit Statistics

```
GET /satellites/orbits
```

Returns the distribution of orbital regions.

---

# Frontend

The frontend is implemented using React, TypeScript and CesiumJS.

Responsibilities include:

- rendering the globe
- managing camera interaction
- fetching backend data
- animating satellites
- displaying orbital trails
- rendering orbit predictions
- filtering orbital regions
- user interaction

---

# Cesium Rendering Engine

Rendering is split into independent scene layers.

```
Viewer

 ├── Globe
 ├── Stars
 ├── Earth
 ├── Orbit Shells
 ├── Satellite Points
 ├── Satellite Trails
 ├── Prediction Lines
 └── Selected Satellite
```

Each layer manages only one responsibility, keeping rendering modular and maintainable.

---

# Satellite Animation

Rather than repeatedly querying live positions, the frontend performs smooth interpolation between predicted orbit points.

For each frame:

1. elapsed simulation time advances
2. neighboring orbit points are selected
3. latitude is interpolated
4. longitude interpolation correctly wraps around ±180°
5. altitude is interpolated
6. Cesium point primitives are updated

This produces continuous orbital motion instead of discrete jumps.

---

# Orbit Prediction Rendering

When a satellite is selected, the backend-generated prediction is converted into Cartesian coordinates and rendered as a polyline around Earth.

This allows users to visualize an upcoming orbital path before the satellite reaches it.

---

# Orbit Regions

The application visualizes major orbital regions using translucent spherical shells.

Displayed regions include:

- VLEO
- LEO
- MEO
- GEO
- HEO

Selecting a region automatically:

- highlights the shell
- filters satellites
- moves the camera
- updates visible statistics

---

# Camera System

The camera supports:

- smooth orbital movement
- automatic region fly-to
- zoom constraints
- optimized render requests
- persistent interaction

---

# Visual Design

The globe uses a custom space-themed appearance.

Features include:

- grayscale Earth
- atmospheric lighting
- procedural star field
- colored constellation markers
- orbital shells
- fading orbital trails
- highlighted selected satellites

The visualization prioritizes readability over photorealism.

---

# Performance Considerations

Rendering thousands of satellites requires minimizing expensive React updates.

The application therefore:

- stores primitives directly inside Cesium collections
- updates positions imperatively
- reuses objects
- enables request-based rendering
- separates static and dynamic scene layers

This significantly reduces rendering overhead.

---

# Data Flow

```text
Download TLE

      │

Parse Records

      │

Compute Metadata

      │

Store Satellites

      │

Expose REST API

      │

Fetch From React

      │

Build Cesium Scene

      │

Animate Satellites

      │

User Interaction
```

---

# Testing

The backend includes unit and integration tests covering:

- TLE parsing
- NORAD extraction
- malformed input
- catalogue parsing
- constellation classification
- REST endpoints

These tests ensure correctness of both parsing logic and API behaviour.

---

# Technologies

## Backend

- Rust
- Tokio
- Axum
- Reqwest
- Serde
- ThisError

## Frontend

- React
- TypeScript
- CesiumJS
- Resium
- Vite

---
<img width="756" height="642" alt="Screenshot From 2026-09-10 10-41-39" src="https://github.com/user-attachments/assets/a995a0d5-ddc3-483d-a517-967060a32391" />
<img width="1366" height="768" alt="Screenshot From 2026-09-11 14-48-44" src="https://github.com/user-attachments/assets/d4730085-38de-4e36-a3f6-c5aa7a095086" />
<img width="1366" height="768" alt="Screenshot From 2026-09-11 14-48-29" src="https://github.com/user-attachments/assets/ac95dbfa-2d29-472c-88e7-27e9e42c2a9e" />
<img width="1366" height="768" alt="Screenshot From 2026-09-11 14-48-24" src="https://github.com/user-attachments/assets/6e9093c8-8eff-4dc4-bd56-01ebe9e6eb7b" />
<img width="1366" height="768" alt="Screenshot From 2026-09-11 14-48-17" src="https://github.com/user-attachments/assets/a00e1109-c55b-4b5a-a51f-f55561ec52fb" />
# Future Improvements

Potential extensions include:

- WebSocket streaming for live updates
- continuous TLE refresh scheduling
- search and autocomplete
- pass prediction over user locations
- ground station visualization
- orbital collision analysis
- historical orbit replay
- space debris visualization
- launch history integration
- GPU-instanced rendering for very large constellations

---

# License

MIT License
