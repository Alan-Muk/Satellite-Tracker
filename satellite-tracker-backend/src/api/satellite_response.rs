use serde::Serialize;

use crate::{
    orbit::metadata::OrbitMetadata,
    satellite::{group::SatelliteGroup, model::Satellite},
};

#[derive(Debug, Serialize)]
pub struct SatelliteResponse {
    pub norad_id: u32,
    pub name: String,
    pub group: SatelliteGroup,
    pub orbit: Option<OrbitMetadata>,
}

impl From<&Satellite> for SatelliteResponse {
    fn from(satellite: &Satellite) -> Self {
        Self {
            norad_id: satellite.norad_id,
            name: satellite.name.clone(),
            group: satellite.group,
            orbit: satellite.orbit,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::satellite::model::Satellite;

    #[test]
    fn response_from_satellite_preserves_fields() {
        let sat = Satellite::for_test(25544, "ISS (ZARYA)");
        let response = SatelliteResponse::from(&sat);

        assert_eq!(response.norad_id, 25544);
        assert_eq!(response.name, "ISS (ZARYA)");
        assert_eq!(response.group, SatelliteGroup::Iss);
    }
}
