use serde::{Deserialize, Serialize};
use sgp4::Elements;

use crate::orbit::region::OrbitRegion;

const EARTH_RADIUS_KM: f64 = 6378.137;
const MU: f64 = 398_600.4418;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct OrbitMetadata {
    pub altitude_km: f64,
    pub inclination_deg: f64,
    pub period_minutes: f64,
    pub region: OrbitRegion,
}

/// Compute orbital metadata from already-parsed SGP4 elements.

pub fn calculate_metadata(elements: &Elements) -> OrbitMetadata {
    let inclination_deg = elements.inclination; // already in degrees
    let period_minutes = 1440.0 / elements.mean_motion;

    let mean_motion_rad_s = elements.mean_motion * 2.0 * std::f64::consts::PI / 86_400.0;
    let semi_major_axis_km = (MU / mean_motion_rad_s.powi(2)).cbrt();
    let altitude_km = semi_major_axis_km - EARTH_RADIUS_KM;

    OrbitMetadata {
        altitude_km,
        inclination_deg,
        period_minutes,
        region: OrbitRegion::from_altitude(altitude_km),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::satellite::model::Satellite;

    #[test]
    fn iss_inclination_is_correct() {
        let sat = Satellite::for_test(25544, "ISS (ZARYA)");
        let metadata = calculate_metadata(&sat.elements);

        assert!(
            (metadata.inclination_deg - 51.6).abs() < 1.0,
            "expected ~51.6°, got {}",
            metadata.inclination_deg
        );
    }

    #[test]
    fn iss_altitude_is_in_leo() {
        let sat = Satellite::for_test(25544, "ISS (ZARYA)");
        let metadata = calculate_metadata(&sat.elements);

        assert!(
            metadata.altitude_km > 380.0 && metadata.altitude_km < 450.0,
            "expected ~400-420 km, got {}",
            metadata.altitude_km
        );
        assert_eq!(metadata.region, OrbitRegion::Leo);
    }

    #[test]
    fn iss_period_is_about_92_minutes() {
        let sat = Satellite::for_test(25544, "ISS (ZARYA)");
        let metadata = calculate_metadata(&sat.elements);

        assert!(
            metadata.period_minutes > 88.0 && metadata.period_minutes < 95.0,
            "expected ~92 min, got {}",
            metadata.period_minutes
        );
    }
}
