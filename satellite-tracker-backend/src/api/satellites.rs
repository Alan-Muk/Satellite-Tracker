use axum::{
    Json,
    extract::{Path, Query, State},
};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use std::collections::HashMap;

use crate::{
    api::satellite_response::SatelliteResponse,
    error::AppError,
    orbit::{
        metadata::OrbitMetadata, position::SatellitePosition, predictor::generate_prediction,
        propagator::propagate, propagator::propagate_at, region::OrbitRegion,
        trajectory::OrbitPrediction,
    },
    satellite::group::SatelliteGroup,
    satellite::model::Satellite,
    state::AppState,
};

#[derive(Serialize)]
pub struct SatelliteSummary {
    pub norad_id: u32,

    pub name: String,

    pub group: String,

    pub orbit: Option<OrbitMetadata>,
}

#[derive(Debug, Deserialize)]
pub struct SatelliteFilter {
    pub group: Option<SatelliteGroup>,
    pub orbit: Option<OrbitRegion>,
    pub limit: Option<usize>,
}

const DEFAULT_LIMIT: usize = 2000;
const MAX_LIMIT: usize = 5000;

pub async fn list_satellites(
    State(state): State<AppState>,
    Query(filter): Query<SatelliteFilter>,
) -> Json<Vec<SatelliteResponse>> {
    let manager = state.manager.read().await;

    let limit = filter.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);

    let mut response: Vec<SatelliteResponse> = manager
        .iter()
        .filter(|sat| {
            filter.group.map_or(true, |g| sat.group == g)
                && filter
                    .orbit
                    .map_or(true, |r| sat.orbit.map_or(false, |o| o.region == r))
        })
        .take(limit)
        .map(|sat| SatelliteResponse::from(sat.as_ref()))
        .collect();

    response.sort_unstable_by_key(|s| s.norad_id);

    Json(response)
}

pub async fn get_satellite(
    State(state): State<AppState>,
    Path(norad_id): Path<u32>,
) -> Result<Json<SatelliteResponse>, AppError> {
    let manager = state.manager.read().await;

    match manager.get(norad_id) {
        Some(satellite) => Ok(Json(SatelliteResponse::from(satellite.as_ref()))),
        None => Err(AppError::NotFound(norad_id)),
    }
}

pub async fn get_satellite_position(
    State(state): State<AppState>,
    Path(norad_id): Path<u32>,
) -> Result<Json<SatellitePosition>, AppError> {
    let satellite = {
        let manager = state.manager.read().await;
        manager.get(norad_id).ok_or(AppError::NotFound(norad_id))?
    }; // lock dropped here

    let position = propagate(
        satellite.norad_id,
        &satellite.elements,
        &satellite.constants,
    )
    .map_err(AppError::Propagation)?;

    Ok(Json(position))
}

#[derive(Debug, Deserialize)]
pub struct PositionsQuery {
    /// Comma-separated list of NORAD IDs.
    pub ids: String,
}

pub const MAX_IDS_PER_REQUEST: usize = 5000;

pub async fn get_satellite_positions(
    State(state): State<AppState>,
    Query(params): Query<PositionsQuery>,
) -> Result<Json<Vec<SatellitePosition>>, AppError> {
    let ids: Vec<u32> = params
        .ids
        .split(',')
        .filter_map(|s| s.trim().parse::<u32>().ok())
        .collect();

    if ids.is_empty() {
        return Err(AppError::BadRequest("ids parameter is empty".into()));
    }

    if ids.len() > MAX_IDS_PER_REQUEST {
        return Err(AppError::BadRequest(format!(
            "too many ids: {} (max {})",
            ids.len(),
            MAX_IDS_PER_REQUEST
        )));
    }

    // Look up all satellites under a single read lock, then drop it.
    let satellites: Vec<Arc<Satellite>> = {
        let manager = state.manager.read().await;
        ids.iter().filter_map(|id| manager.get(*id)).collect()
    };

    // Compute all positions at the same instant so the frame is time-coherent.
    let now = Utc::now();

    let mut positions = Vec::with_capacity(satellites.len());
    for satellite in &satellites {
        match propagate_at(
            satellite.norad_id,
            &satellite.elements,
            &satellite.constants,
            now,
        ) {
            Ok(position) => positions.push(position),
            Err(err) => {
                tracing::warn!(
                    norad_id = satellite.norad_id,
                    error = %err,
                    "propagation failed in batch position request"
                );
            }
        }
    }

    Ok(Json(positions))
}

pub async fn get_satellite_prediction(
    State(state): State<AppState>,
    Path(norad_id): Path<u32>,
) -> Result<Json<OrbitPrediction>, AppError> {
    let satellite = {
        let manager = state.manager.read().await;
        manager.get(norad_id).ok_or(AppError::NotFound(norad_id))?
    };

    let prediction = generate_prediction(&satellite, 90).map_err(AppError::Propagation)?;

    Ok(Json(prediction))
}

pub async fn get_satellite_groups(
    State(state): State<AppState>,
) -> Json<HashMap<SatelliteGroup, usize>> {
    Json(state.stats.by_group.clone())
}

pub async fn get_satellite_orbits(
    State(state): State<AppState>,
) -> Json<HashMap<OrbitRegion, usize>> {
    Json(state.stats.by_region.clone())
}

#[cfg(test)]
mod tests {

    #[test]
    fn parses_ids_from_query() {
        // Test the parsing logic in isolation
        let ids: Vec<u32> = "25544,44714,900"
            .split(',')
            .filter_map(|s| s.trim().parse::<u32>().ok())
            .collect();
        assert_eq!(ids, vec![25544, 44714, 900]);
    }

    #[test]
    fn skips_invalid_ids() {
        let ids: Vec<u32> = "25544,abc,,900"
            .split(',')
            .filter_map(|s| s.trim().parse::<u32>().ok())
            .collect();
        assert_eq!(ids, vec![25544, 900]);
    }
}
/*
 * HTTP handlers for the satellite API.
 *
 * This module exposes REST endpoints for querying satellite information,
 * including satellite listings, individual satellite details, current orbital
 * position, predicted trajectories, and aggregated statistics.
 *
 * Supported functionality:
 * - List satellites with optional filtering by group or orbit region and an
 *   optional result limit.
 * - Retrieve a satellite by its NORAD identifier.
 * - Compute and return the current propagated position of a satellite.
 * - Generate a short-term orbital prediction for a satellite.
 * - Return summary statistics for satellite groups.
 * - Return summary statistics for orbital regions.
 *
 * Handlers access shared application state through AppState, retrieve data
 * from the satellite manager, and return JSON responses suitable for API
 * clients.
 */
