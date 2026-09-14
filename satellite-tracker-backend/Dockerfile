# ---- Build stage ----
FROM rust:1.83-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
# Pre-build deps with a dummy main to cache the dependency layer
RUN mkdir src && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src

COPY src ./src
COPY data ./data

# Touch main.rs so the real binary is rebuilt
RUN touch src/main.rs && cargo build --release

# ---- Runtime stage ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/satellite-tracker-backend /app/server
COPY --from=builder /app/data ./data

ENV PORT=3000
EXPOSE 3000

CMD ["/app/server"]