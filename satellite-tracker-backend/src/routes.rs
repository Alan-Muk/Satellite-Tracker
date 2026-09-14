use axum::{Router, routing::get};

use tower_http::cors::CorsLayer;

use crate::{
    api::health::health_check,
    api::satellites::{
        get_satellite, get_satellite_groups, get_satellite_orbits, get_satellite_position,
        get_satellite_positions, get_satellite_prediction, list_satellites,
    },
    state::AppState,
    websocket::ws_handler,
};

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/satellites/groups", get(get_satellite_groups))
        .route("/satellites/orbits", get(get_satellite_orbits))
        .route("/satellites/positions", get(get_satellite_positions)) // ← new
        .route("/satellites", get(list_satellites))
        .route("/satellites/{norad_id}", get(get_satellite))
        .route("/ws", get(ws_handler))
        .route(
            "/satellites/{norad_id}/position",
            get(get_satellite_position),
        )
        .route(
            "/satellites/{norad_id}/prediction",
            get(get_satellite_prediction),
        )
        .layer({
            let allowed = std::env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:5173".to_string());
            let origins: Vec<axum::http::HeaderValue> = allowed
                .split(',')
                .filter_map(|s| s.trim().parse().ok())
                .collect();
            CorsLayer::new()
                .allow_origin(origins)
                .allow_methods([axum::http::Method::GET])
                .allow_headers([axum::http::header::CONTENT_TYPE])
        })
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
