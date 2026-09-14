use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
};
use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::time::interval;

use crate::{
    api::satellites::MAX_IDS_PER_REQUEST,
    orbit::{position::SatellitePosition, propagator::propagate_at},
    satellite::model::Satellite,
    state::AppState,
};

const FRAME_INTERVAL_MS: u64 = 500;

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClientMessage {
    Subscribe { ids: Vec<u32> },
    Unsubscribe,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ServerMessage {
    Hello {
        server_time: String,
        frame_interval_ms: u64,
    },
    Subscribed {
        count: usize,
    },
    Frame {
        timestamp: String,
        positions: Vec<SatellitePosition>,
    },
    Error {
        message: String,
    },
}

pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();

    // Send hello immediately so the client can measure clock offset.
    let hello = ServerMessage::Hello {
        server_time: Utc::now().to_rfc3339(),
        frame_interval_ms: FRAME_INTERVAL_MS,
    };
    if send_message(&mut sender, &hello).await.is_err() {
        return;
    }

    let mut subscribed: HashSet<u32> = HashSet::new();
    let mut ticker = interval(Duration::from_millis(FRAME_INTERVAL_MS));
    ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

    loop {
        tokio::select! {
            incoming = receiver.next() => {
                match incoming {
                    Some(Ok(Message::Text(text))) => {
                        match serde_json::from_str::<ClientMessage>(&text) {
                            Ok(ClientMessage::Subscribe { ids }) => {
                                if ids.len() > MAX_IDS_PER_REQUEST {
                                    let err = ServerMessage::Error {
                                        message: format!(
                                            "too many ids: {} (max {})",
                                            ids.len(),
                                            MAX_IDS_PER_REQUEST
                                        ),
                                    };
                                    let _ = send_message(&mut sender, &err).await;
                                    continue;
                                }
                                subscribed = ids.into_iter().collect();
                                let ack = ServerMessage::Subscribed {
                                    count: subscribed.len(),
                                };
                                if send_message(&mut sender, &ack).await.is_err() {
                                    break;
                                }
                            }
                            Ok(ClientMessage::Unsubscribe) => {
                                subscribed.clear();
                                let ack = ServerMessage::Subscribed { count: 0 };
                                if send_message(&mut sender, &ack).await.is_err() {
                                    break;
                                }
                            }
                            Err(err) => {
                                let msg = ServerMessage::Error {
                                    message: format!("invalid message: {err}"),
                                };
                                if send_message(&mut sender, &msg).await.is_err() {
                                    break;
                                }
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Ok(Message::Ping(_))) | Some(Ok(Message::Pong(_))) => {
                        // Axum handles ping/pong automatically at a lower level.
                    }
                    Some(Ok(Message::Binary(_))) => {
                        // Not used; ignore.
                    }
                    Some(Err(_)) => break,
                }
            }

            _ = ticker.tick() => {
                if subscribed.is_empty() {
                    continue;
                }

                // Look up all subscribed satellites under one lock.
                let satellites: Vec<Arc<Satellite>> = {
                    let manager = state.manager.read().await;
                    subscribed
                        .iter()
                        .filter_map(|id| manager.get(*id))
                        .collect()
                };

                // Compute all positions at the same instant.
                let now = Utc::now();
                let mut positions = Vec::with_capacity(satellites.len());
                for sat in &satellites {
                    if let Ok(pos) = propagate_at(
                        sat.norad_id,
                        &sat.elements,
                        &sat.constants,
                        now,
                    ) {
                        positions.push(pos);
                    }
                }

                let frame = ServerMessage::Frame {
                    timestamp: now.to_rfc3339(),
                    positions,
                };
                if send_message(&mut sender, &frame).await.is_err() {
                    break;
                }
            }
        }
    }
}

async fn send_message<S>(sender: &mut S, msg: &ServerMessage) -> Result<(), ()>
where
    S: SinkExt<Message> + Unpin,
    <S as futures_util::Sink<Message>>::Error: std::fmt::Debug,
{
    let text = match serde_json::to_string(msg) {
        Ok(t) => t,
        Err(_) => return Err(()),
    };
    sender
        .send(Message::Text(text.into()))
        .await
        .map_err(|_| ())
}
