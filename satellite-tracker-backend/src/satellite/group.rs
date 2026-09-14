use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]

pub enum SatelliteGroup {
    Starlink,
    #[serde(rename = "ONEWEB")]
    OneWeb,
    Iss,
    Gps,
    Weather,
    Iridium,
    Debris,
    Other,
}

impl SatelliteGroup {
    pub fn from_name(name: &str) -> Self {
        let name = name.to_uppercase();

        if name.contains("STARLINK") {
            Self::Starlink
        } else if name.contains("ONEWEB") {
            Self::OneWeb
        } else if name.contains("ISS") || name.contains("ZARYA") || name.contains("ZVEZDA") {
            Self::Iss
        } else if name.contains("GPS") || name.contains("NAVSTAR") {
            Self::Gps
        } else if name.contains("NOAA") || name.contains("WEATHER") {
            Self::Weather
        } else if name.contains("IRIDIUM") {
            Self::Iridium
        } else if name.contains("DEB") || name.contains("R/B") || name.contains("BODY") {
            Self::Debris
        } else {
            Self::Other
        }
    }

    pub fn color(&self) -> &'static str {
        match self {
            Self::Starlink => "#00aaff",
            Self::OneWeb => "#4488ff",
            Self::Iss => "#ffaa00",
            Self::Gps => "#aa00ff",
            Self::Weather => "#00ff88",
            Self::Iridium => "#ff44aa",
            Self::Debris => "#888888",
            Self::Other => "#ffffff",
        }
    }

    pub fn default_limit(&self) -> usize {
        match self {
            Self::Starlink => 50,
            Self::Debris => 25,
            Self::Iss => 10,
            _ => 30,
        }
    }

    pub fn all() -> &'static [Self] {
        &[
            Self::Starlink,
            Self::OneWeb,
            Self::Iss,
            Self::Gps,
            Self::Weather,
            Self::Iridium,
            Self::Debris,
            Self::Other,
        ]
    }
}

impl fmt::Display for SatelliteGroup {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Self::Starlink => "STARLINK",
                Self::OneWeb => "ONEWEB",
                Self::Iss => "ISS",
                Self::Gps => "GPS",
                Self::Weather => "WEATHER",
                Self::Iridium => "IRIDIUM",
                Self::Debris => "DEBRIS",
                Self::Other => "OTHER",
            }
        )
    }
}

impl std::str::FromStr for SatelliteGroup {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let upper = s.to_ascii_uppercase();
        match upper.as_str() {
            "STARLINK" => Ok(Self::Starlink),
            "ONEWEB" => Ok(Self::OneWeb),
            "ISS" => Ok(Self::Iss),
            "GPS" => Ok(Self::Gps),
            "WEATHER" => Ok(Self::Weather),
            "IRIDIUM" => Ok(Self::Iridium),
            "DEBRIS" => Ok(Self::Debris),
            "OTHER" => Ok(Self::Other),
            _ => Err(format!("unknown satellite group: {s}")),
        }
    }
}

#[test]
fn map_keys_use_screaming_snake_case() {
    use std::collections::HashMap;
    let mut m: HashMap<SatelliteGroup, usize> = HashMap::new();
    for g in SatelliteGroup::all() {
        m.insert(*g, 1);
    }

    let json = serde_json::to_string(&m).unwrap();

    for key in [
        "STARLINK", "ONEWEB", "ISS", "GPS", "WEATHER", "IRIDIUM", "DEBRIS", "OTHER",
    ] {
        assert!(json.contains(key), "expected {key} in {json}");
    }
}
