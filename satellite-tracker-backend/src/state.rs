use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;

use crate::orbit::region::OrbitRegion;
use crate::satellite::group::SatelliteGroup;
use crate::satellite::manager::SatelliteManager;

#[derive(Debug, Default, Clone)]
pub struct CatalogStats {
    pub total: usize,
    pub by_group: HashMap<SatelliteGroup, usize>,
    pub by_region: HashMap<OrbitRegion, usize>,
}

impl CatalogStats {
    pub fn compute(manager: &SatelliteManager) -> Self {
        let mut by_group: HashMap<SatelliteGroup, usize> = HashMap::new();
        let mut by_region: HashMap<OrbitRegion, usize> = HashMap::new();
        let mut total = 0;

        for sat in manager.iter() {
            total += 1;
            *by_group.entry(sat.group).or_insert(0) += 1;
            if let Some(orbit) = sat.orbit {
                *by_region.entry(orbit.region).or_insert(0) += 1;
            }
        }

        Self {
            total,
            by_group,
            by_region,
        }
    }
}

#[derive(Clone)]
pub struct AppState {
    pub manager: Arc<RwLock<SatelliteManager>>,
    pub stats: Arc<CatalogStats>,
}

impl AppState {
    /// Empty state, useful for tests.
    pub fn empty() -> Self {
        Self {
            manager: Arc::new(RwLock::new(SatelliteManager::new())),
            stats: Arc::new(CatalogStats::default()),
        }
    }

    /// Construct from an already-loaded manager.
    pub fn from_manager(manager: SatelliteManager) -> Self {
        let stats = CatalogStats::compute(&manager);
        Self {
            manager: Arc::new(RwLock::new(manager)),
            stats: Arc::new(stats),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::satellite::model::Satellite;

    #[test]
    fn empty_state_has_zero_stats() {
        let state = AppState::empty();
        assert_eq!(state.stats.total, 0);
        assert!(state.stats.by_group.is_empty());
        assert!(state.stats.by_region.is_empty());
    }

    #[test]
    fn computes_stats_from_manager() {
        let mut manager = SatelliteManager::new();
        manager.insert(Satellite::for_test(1, "ISS"));
        manager.insert(Satellite::for_test(2, "STARLINK-1000"));

        let stats = CatalogStats::compute(&manager);

        assert_eq!(stats.total, 2);
        assert_eq!(stats.by_group.get(&SatelliteGroup::Iss), Some(&1));
        assert_eq!(stats.by_group.get(&SatelliteGroup::Starlink), Some(&1));
    }

    #[test]
    fn from_manager_computes_stats() {
        let mut manager = SatelliteManager::new();
        manager.insert(Satellite::for_test(1, "ISS"));

        let state = AppState::from_manager(manager);

        assert_eq!(state.stats.total, 1);
        assert_eq!(state.stats.by_group.get(&SatelliteGroup::Iss), Some(&1));
    }
}
