use serde::Serialize;
use sgp4::{Constants, Elements};

use crate::orbit::metadata::OrbitMetadata;
use crate::orbit::region::OrbitRegion;
use crate::satellite::group::SatelliteGroup;

#[derive(Debug, Clone, Serialize)]
pub struct Satellite {
    pub norad_id: u32,
    pub name: String,
    pub group: SatelliteGroup, // ← new field
    pub line1: String,
    pub line2: String,

    #[serde(skip)]
    pub elements: Elements,

    #[serde(skip)]
    pub constants: Constants,

    pub orbit: Option<OrbitMetadata>,
}

impl Satellite {
    pub fn orbit_region(&self) -> OrbitRegion {
        match &self.orbit {
            Some(orbit) => orbit.region,
            None => OrbitRegion::Unknown,
        }
    }
}

#[cfg(test)]
impl Satellite {
    pub fn for_test(norad_id: u32, name: &str) -> Self {
        const LINE1: &str = "1 25544U 98067A   26255.20788499  .00004954  00000+0  97729-4 0  9996";
        const LINE2: &str = "2 25544  51.6305 229.4056 0004952 131.3152 228.8264 15.49086570585247";

        let elements = sgp4::Elements::from_tle(None, LINE1.as_bytes(), LINE2.as_bytes()).unwrap();
        let constants = sgp4::Constants::from_elements(&elements).unwrap();

        Self {
            norad_id,
            name: name.to_string(),
            group: SatelliteGroup::from_name(name),
            line1: LINE1.to_string(),
            line2: LINE2.to_string(),
            elements,
            constants,
            orbit: None,
        }
    }
}
