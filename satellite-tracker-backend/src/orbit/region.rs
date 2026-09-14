use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrbitRegion {
    Vleo,
    Leo,
    Meo,
    Geo,
    Heo,
    Unknown,
}

impl OrbitRegion {
    /// Classify an orbit by its altitude above the Earth's surface.
    ///
    /// This is a coarse approximation: it cannot distinguish HEO orbits
    /// (which are defined by eccentricity) from circular orbits at the
    /// same mean altitude, and it treats "GEO" as a narrow band around
    /// 35,786 km.
    ///
    /// Non-finite or non-positive altitudes return `Unknown`.
    pub fn from_altitude(altitude_km: f64) -> Self {
        if !altitude_km.is_finite() || altitude_km <= 0.0 {
            return Self::Unknown;
        }

        match altitude_km {
            a if a <= 300.0 => Self::Vleo,
            a if a <= 2_000.0 => Self::Leo,
            a if a <= 35_286.0 => Self::Meo,
            a if a <= 36_286.0 => Self::Geo,
            _ => Self::Heo,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Vleo => "VLEO",
            Self::Leo => "LEO",
            Self::Meo => "MEO",
            Self::Geo => "GEO",
            Self::Heo => "HEO",
            Self::Unknown => "UNKNOWN",
        }
    }
}

impl fmt::Display for OrbitRegion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl std::str::FromStr for OrbitRegion {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let upper = s.to_ascii_uppercase();
        match upper.as_str() {
            "VLEO" => Ok(Self::Vleo),
            "LEO" => Ok(Self::Leo),
            "MEO" => Ok(Self::Meo),
            "GEO" => Ok(Self::Geo),
            "HEO" => Ok(Self::Heo),
            "UNKNOWN" => Ok(Self::Unknown),
            _ => Err(format!("unknown orbit region: {s}")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_by_altitude() {
        assert_eq!(OrbitRegion::from_altitude(100.0), OrbitRegion::Vleo);
        assert_eq!(OrbitRegion::from_altitude(250.0), OrbitRegion::Vleo);
        assert_eq!(OrbitRegion::from_altitude(400.0), OrbitRegion::Leo);
        assert_eq!(OrbitRegion::from_altitude(1_500.0), OrbitRegion::Leo);
        assert_eq!(OrbitRegion::from_altitude(20_200.0), OrbitRegion::Meo); // GPS
        assert_eq!(OrbitRegion::from_altitude(35_786.0), OrbitRegion::Geo);
        assert_eq!(OrbitRegion::from_altitude(40_000.0), OrbitRegion::Heo);
    }

    #[test]
    fn handles_boundaries() {
        assert_eq!(OrbitRegion::from_altitude(300.0), OrbitRegion::Vleo);
        assert_eq!(OrbitRegion::from_altitude(2_000.0), OrbitRegion::Leo);
        assert_eq!(OrbitRegion::from_altitude(35_286.0), OrbitRegion::Meo);
        assert_eq!(OrbitRegion::from_altitude(36_286.0), OrbitRegion::Geo);
    }

    #[test]
    fn handles_invalid_input() {
        assert_eq!(OrbitRegion::from_altitude(f64::NAN), OrbitRegion::Unknown);
        assert_eq!(
            OrbitRegion::from_altitude(f64::INFINITY),
            OrbitRegion::Unknown
        );
        assert_eq!(OrbitRegion::from_altitude(-100.0), OrbitRegion::Unknown);
        assert_eq!(OrbitRegion::from_altitude(0.0), OrbitRegion::Unknown);
    }

    #[test]
    fn serde_matches_display() {
        for region in [
            OrbitRegion::Vleo,
            OrbitRegion::Leo,
            OrbitRegion::Meo,
            OrbitRegion::Geo,
            OrbitRegion::Heo,
            OrbitRegion::Unknown,
        ] {
            let json = serde_json::to_string(&region).unwrap();
            assert_eq!(json, format!("\"{}\"", region));
        }
    }

    #[test]
    fn from_str_matches_display() {
        for region in [
            OrbitRegion::Vleo,
            OrbitRegion::Leo,
            OrbitRegion::Meo,
            OrbitRegion::Geo,
            OrbitRegion::Heo,
            OrbitRegion::Unknown,
        ] {
            let s = region.to_string();
            assert_eq!(s.parse::<OrbitRegion>().unwrap(), region);
        }
        assert!("bogus".parse::<OrbitRegion>().is_err());
    }

    #[test]
    fn map_keys_use_screaming_snake_case() {
        use std::collections::HashMap;
        let mut m: HashMap<OrbitRegion, usize> = HashMap::new();
        m.insert(OrbitRegion::Vleo, 1);
        m.insert(OrbitRegion::Leo, 2);
        m.insert(OrbitRegion::Meo, 3);
        m.insert(OrbitRegion::Geo, 4);
        m.insert(OrbitRegion::Heo, 5);
        m.insert(OrbitRegion::Unknown, 6);

        let json = serde_json::to_string(&m).unwrap();

        for key in ["VLEO", "LEO", "MEO", "GEO", "HEO", "UNKNOWN"] {
            assert!(json.contains(key), "expected {key} in {json}");
        }
    }
}
