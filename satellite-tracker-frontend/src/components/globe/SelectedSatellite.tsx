import { useEffect } from "react";

import type { MutableRefObject } from "react";

import type { GlobeMethods } from "react-globe.gl";

import * as THREE from "three";

import type { SatellitePosition } from "../../api";

import { renderPosition } from "./rendering";

interface Props {
  globeRef: MutableRefObject<GlobeMethods | undefined>;

  position: SatellitePosition;
}

export default function SelectedSatellite({
  globeRef,

  position,
}: Props) {
  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    const scene = globe.scene();

    const renderPositionData = renderPosition(
      position.longitude,

      position.latitude,

      position.altitude_km,
    );

    const coords = globe.getCoords(
      renderPositionData.lat,

      renderPositionData.lng,

      renderPositionData.altitude,
    );

    //
    // Outer white ring.
    //

    const outlineGeometry = new THREE.SphereGeometry(
      0.026,

      16,

      16,
    );

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: "#ffffff",

      transparent: true,

      opacity: 0.95,

      depthTest: false,
    });

    const outline = new THREE.Mesh(
      outlineGeometry,

      outlineMaterial,
    );

    //
    // Inner cyan marker.
    //

    const markerGeometry = new THREE.SphereGeometry(
      0.018,

      16,

      16,
    );

    const markerMaterial = new THREE.MeshBasicMaterial({
      color: "#00ffff",

      depthTest: false,
    });

    const marker = new THREE.Mesh(
      markerGeometry,

      markerMaterial,
    );

    marker.position.set(
      coords.x,

      coords.y,

      coords.z,
    );

    outline.position.copy(marker.position);

    //
    // Keep the selected marker above the satellite
    // points and orbit geometry.
    //

    marker.renderOrder = 1000;

    outline.renderOrder = 999;

    scene.add(outline);

    scene.add(marker);

    return () => {
      scene.remove(marker);

      scene.remove(outline);

      marker.geometry.dispose();

      marker.material.dispose();

      outline.geometry.dispose();

      outline.material.dispose();
    };
  }, [globeRef, position.latitude, position.longitude, position.altitude_km]);

  return null;
}
