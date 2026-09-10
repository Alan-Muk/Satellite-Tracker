use axum::{Router, routing::get};

use tower_http::cors::CorsLayer;

use crate::{
    api::health::health_check,
    api::satellites::{
        get_satellite, get_satellite_groups, get_satellite_orbits, get_satellite_position,
        get_satellite_prediction, list_satellites,
    },
    state::AppState,
};

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/satellites/groups", get(get_satellite_groups))
        .route("/satellites/orbits", get(get_satellite_orbits))
        .route("/satellites", get(list_satellites))
        .route("/satellites/{norad_id}", get(get_satellite))
        .route(
            "/satellites/{norad_id}/position",
            get(get_satellite_position),
        )
        .route(
            "/satellites/{norad_id}/prediction",
            get(get_satellite_prediction),
        )
        .layer(
            CorsLayer::new()
                .allow_origin(
                    "http://localhost:5173"
                        .parse::<axum::http::HeaderValue>()
                        .unwrap(),
                )
                .allow_methods([axum::http::Method::GET]),
        )
        .with_state(state)
}

/*
 * Configures the application's HTTP router.
 *
 * This module defines all API routes exposed by the backend, including
 * endpoints for health checks, satellite queries, orbital propagation,
 * trajectory prediction, and summary statistics.
 *
 * The router also applies global middleware, such as CORS configuration,
 * and attaches the shared application state so it is accessible from all
 * request handlers.
 */
