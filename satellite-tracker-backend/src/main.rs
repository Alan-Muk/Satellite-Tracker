use satellite_tracker_backend::{
    routes, satellite::loader::load_active_satellites, state::AppState,
};

#[tokio::main]
async fn main() {
    let manager = match load_active_satellites().await {
        Ok(m) => m,
        Err(err) => {
            eprintln!("Failed to load satellites: {err}");
            std::process::exit(1);
        }
    };

    println!("Loaded {} satellites", manager.count());

    let state = AppState::from_manager(manager);
    let app = routes::create_router(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("failed to bind address");
    println!("Server running on http://{addr}");

    axum::serve(listener, app).await.expect("server failed");
}
