use sgp4::{Constants, Elements};

use crate::orbit::metadata::calculate_metadata;
use crate::satellite::{group::SatelliteGroup, model::Satellite};
use crate::tle::error::TleError;

pub fn parse_tle(input: &str) -> Result<Vec<Satellite>, TleError> {
    if input.trim().is_empty() {
        return Err(TleError::EmptyInput);
    }

    let lines: Vec<&str> = input.lines().filter(|l| !l.trim().is_empty()).collect();

    if lines.len() % 3 != 0 {
        return Err(TleError::InvalidRecord);
    }

    let mut satellites = Vec::with_capacity(lines.len() / 3);

    for chunk in lines.chunks(3) {
        let name = chunk[0].trim().to_string();
        let line1 = chunk[1].to_string();
        let line2 = chunk[2].to_string();

        let elements = Elements::from_tle(None, line1.as_bytes(), line2.as_bytes())
            .map_err(|_| TleError::InvalidRecord)?;

        let norad_id = u32::try_from(elements.norad_id).map_err(|_| TleError::InvalidRecord)?;

        let constants = Constants::from_elements(&elements).map_err(|_| TleError::InvalidRecord)?;

        let group = SatelliteGroup::from_name(&name);
        let orbit = Some(calculate_metadata(&elements));

        satellites.push(Satellite {
            norad_id,
            name,
            group,
            line1,
            line2,
            elements,
            constants,
            orbit,
        });
    }

    Ok(satellites)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::satellite::group::SatelliteGroup;

    const ISS_TLE: &str = "\
ISS (ZARYA)             
1 25544U 98067A   26255.20788499  .00004954  00000+0  97729-4 0  9996
2 25544  51.6305 229.4056 0004952 131.3152 228.8264 15.49086570585247";

    const CALSPHERE_TLE: &str = "\
CALSPHERE 1             
1 00900U 64063C   26255.32563985  .00000429  00000+0  42672-3 0  9997
2 00900  90.2175  73.7885 0026957  32.5298  86.0285 13.76701804 83413";

    const STARLINK_TLE: &str = "\
STARLINK-1008           
1 44714U 19074B   26255.33919507  .00066252  00000+0  67510-3 0  9990
2 44714  53.1482   6.9507 0002220  72.2562 287.8695 15.64518751377793";

    #[test]
    fn parses_single_satellite() {
        let sats = parse_tle(ISS_TLE).unwrap();
        assert_eq!(sats.len(), 1);
        assert_eq!(sats[0].name, "ISS (ZARYA)");
        assert_eq!(sats[0].norad_id, 25544);
        assert!(sats[0].orbit.is_some());
    }

    #[test]
    fn parses_multiple_satellites() {
        let input = format!("{ISS_TLE}\n{CALSPHERE_TLE}");
        let sats = parse_tle(&input).unwrap();
        assert_eq!(sats.len(), 2);
        assert_eq!(sats[0].norad_id, 25544);
        assert_eq!(sats[1].norad_id, 900);
    }

    #[test]
    fn empty_input_returns_error() {
        assert!(matches!(parse_tle(""), Err(TleError::EmptyInput)));
    }

    #[test]
    fn malformed_input_returns_error() {
        let input = "ISS\n1 AAA\n2 BBB";
        assert!(matches!(parse_tle(input), Err(TleError::InvalidRecord)));
    }

    #[test]
    fn odd_line_count_returns_error() {
        let input = "ISS\n1 25544U 98067A";
        assert!(matches!(parse_tle(input), Err(TleError::InvalidRecord)));
    }

    #[test]
    fn parses_real_station_catalog() {
        let input = include_str!("../../data/active.tle");
        let satellites = parse_tle(input).unwrap();
        assert!(!satellites.is_empty());
        assert!(satellites.iter().any(|sat| sat.norad_id == 25544));
    }

    #[test]
    fn classifies_starlink() {
        let sats = parse_tle(STARLINK_TLE).unwrap();
        assert_eq!(sats[0].group, SatelliteGroup::Starlink);
    }
}
