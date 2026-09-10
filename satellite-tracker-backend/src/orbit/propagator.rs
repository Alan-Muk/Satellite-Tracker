use chrono::{DateTime, Utc};
use sgp4::{Constants, Elements};

use crate::{orbit::position::SatellitePosition, satellite::model::Satellite};

const EARTH_RADIUS_KM: f64 = 6378.137;

pub fn propagate(satellite: &Satellite) -> Result<SatellitePosition, String> {
    propagate_at(satellite, Utc::now())
}

pub fn propagate_at(
    satellite: &Satellite,
    timestamp: DateTime<Utc>,
) -> Result<SatellitePosition, String> {
    let elements = Elements::from_tle(
        Some(satellite.name.clone()),
        satellite.line1.as_bytes(),
        satellite.line2.as_bytes(),
    )
    .map_err(|e| e.to_string())?;

    let constants = Constants::from_elements(&elements).map_err(|e| e.to_string())?;

    let minutes = elements
        .datetime_to_minutes_since_epoch(&timestamp.naive_utc())
        .map_err(|e| e.to_string())?;

    let prediction = constants.propagate(minutes).map_err(|e| e.to_string())?;

    let ecef_position = teme_to_ecef(prediction.position, &timestamp);

    let x = ecef_position[0];
    let y = ecef_position[1];
    let z = ecef_position[2];

    let longitude = y.atan2(x).to_degrees();

    let horizontal_distance = (x * x + y * y).sqrt();
    let latitude = z.atan2(horizontal_distance).to_degrees();

    let distance_from_center = (x * x + y * y + z * z).sqrt();
    let altitude_km = distance_from_center - EARTH_RADIUS_KM;

    let velocity = prediction.velocity;

    let velocity_km_s = (velocity[0].powi(2) + velocity[1].powi(2) + velocity[2].powi(2)).sqrt();

    Ok(SatellitePosition {
        norad_id: satellite.norad_id,
        latitude,
        longitude,
        altitude_km,
        velocity_km_s,
        timestamp,
    })
}

fn teme_to_ecef(position: [f64; 3], timestamp: &DateTime<Utc>) -> [f64; 3] {
    let theta = gmst_radians(timestamp);

    let cos_theta = theta.cos();
    let sin_theta = theta.sin();

    [
        cos_theta * position[0] + sin_theta * position[1],
        -sin_theta * position[0] + cos_theta * position[1],
        position[2],
    ]
}

fn gmst_radians(timestamp: &DateTime<Utc>) -> f64 {
    let julian_date = timestamp.timestamp() as f64 / 86_400.0
        + timestamp.timestamp_subsec_nanos() as f64 / 86_400.0 / 1_000_000_000.0
        + 2_440_587.5;

    let days_since_j2000 = julian_date - 2_451_545.0;
    let centuries_since_j2000 = days_since_j2000 / 36_525.0;

    let gmst_degrees = 280.460_618_37
        + 360.985_647_366_29 * days_since_j2000
        + 0.000_387_933 * centuries_since_j2000.powi(2)
        - centuries_since_j2000.powi(3) / 38_710_000.0;

    gmst_degrees.to_radians().rem_euclid(std::f64::consts::TAU)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn iss() -> Satellite {
        Satellite {
            norad_id: 25544,
            name: "ISS (ZARYA)".to_string(),
            line1: "1 25544U 98067A   26203.79832414  .00009714  00000+0  18351-3 0  9992"
                .to_string(),
            line2: "2 25544  51.6313 123.8641 0006897 326.7338  33.3216 15.49102905577270"
                .to_string(),
            orbit: None,
        }
    }

    #[test]
    fn propagates_iss_position() {
        let timestamp = DateTime::parse_from_rfc3339("2026-09-10T12:00:00Z")
            .unwrap()
            .with_timezone(&Utc);

        let position = propagate_at(&iss(), timestamp)
            .unwrap_or_else(|error| panic!("Propagation failed: {error}"));

        assert_eq!(position.norad_id, 25544);
        assert!(position.latitude.is_finite());
        assert!(position.longitude.is_finite());
        assert!(position.altitude_km.is_finite());
        assert!(position.velocity_km_s.is_finite());

        assert!((-90.0..=90.0).contains(&position.latitude));
        assert!((-180.0..=180.0).contains(&position.longitude));

        assert!(position.altitude_km > 300.0);
        assert!(position.altitude_km < 500.0);

        assert!(position.velocity_km_s > 7.0);
        assert!(position.velocity_km_s < 8.5);
    }

    #[test]
    fn longitude_changes_over_time() {
        let first_time = DateTime::parse_from_rfc3339("2026-09-10T12:00:00Z")
            .unwrap()
            .with_timezone(&Utc);

        let second_time = first_time + chrono::Duration::minutes(10);

        let first = propagate_at(&iss(), first_time).unwrap();
        let second = propagate_at(&iss(), second_time).unwrap();

        assert_ne!(first.longitude, second.longitude);
    }
}
