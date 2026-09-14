use std::{collections::HashMap, sync::Arc};

use super::model::Satellite;

#[derive(Default)]
pub struct SatelliteManager {
    satellites: HashMap<u32, Arc<Satellite>>,
}

impl SatelliteManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(&mut self, satellite: Satellite) {
        self.satellites
            .insert(satellite.norad_id, Arc::new(satellite));
    }

    pub fn insert_many(&mut self, satellites: Vec<Satellite>) {
        self.satellites.reserve(satellites.len());
        for satellite in satellites {
            self.insert(satellite);
        }
    }

    /// Replace the entire catalog. Use this for periodic refreshes: it
    /// discards satellites that are no longer present in the source.
    pub fn replace_all(&mut self, satellites: Vec<Satellite>) {
        self.satellites.clear();
        self.satellites.reserve(satellites.len());
        for satellite in satellites {
            self.insert(satellite);
        }
    }

    /// Cheap clone: increments a refcount, does not deep-copy the satellite.
    pub fn get(&self, norad_id: u32) -> Option<Arc<Satellite>> {
        self.satellites.get(&norad_id).cloned()
    }

    /// Cheap clone of every satellite's `Arc`. Prefer `iter()` if you don't
    /// need an owned collection.
    pub fn all(&self) -> Vec<Arc<Satellite>> {
        self.satellites.values().cloned().collect()
    }

    /// Iterate without allocating or cloning.
    pub fn iter(&self) -> impl Iterator<Item = &Arc<Satellite>> {
        self.satellites.values()
    }

    pub fn count(&self) -> usize {
        self.satellites.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn insert_and_get() {
        let mut mgr = SatelliteManager::new();
        mgr.insert(Satellite::for_test(25544, "ISS"));

        let sat = mgr.get(25544).expect("should find ISS");
        assert_eq!(sat.norad_id, 25544);
        assert_eq!(sat.name, "ISS");
    }

    #[test]
    fn get_returns_shared_handle() {
        let mut mgr = SatelliteManager::new();
        mgr.insert(Satellite::for_test(25544, "ISS"));

        let a = mgr.get(25544).unwrap();
        let b = mgr.get(25544).unwrap();
        assert!(Arc::ptr_eq(&a, &b));
    }

    #[test]
    fn insert_many_replaces_duplicates() {
        let mut mgr = SatelliteManager::new();
        mgr.insert_many(vec![
            Satellite::for_test(1, "A"),
            Satellite::for_test(2, "B"),
        ]);
        mgr.insert_many(vec![Satellite::for_test(1, "A2")]);

        assert_eq!(mgr.count(), 2);
        assert_eq!(mgr.get(1).unwrap().name, "A2");
    }

    #[test]
    fn replace_all_drops_missing() {
        let mut mgr = SatelliteManager::new();
        mgr.insert_many(vec![
            Satellite::for_test(1, "A"),
            Satellite::for_test(2, "B"),
        ]);

        mgr.replace_all(vec![Satellite::for_test(3, "C")]);

        assert_eq!(mgr.count(), 1);
        assert!(mgr.get(1).is_none());
        assert!(mgr.get(3).is_some());
    }

    #[test]
    fn iter_yields_arcs() {
        let mut mgr = SatelliteManager::new();
        mgr.insert_many(vec![
            Satellite::for_test(1, "A"),
            Satellite::for_test(2, "B"),
        ]);

        let ids: Vec<u32> = mgr.iter().map(|s| s.norad_id).collect();
        assert_eq!(ids.len(), 2);
        assert!(ids.contains(&1));
        assert!(ids.contains(&2));
    }
}
