import * as THREE from "three";

import type { OrbitRegion } from "../../api";

interface Props {
  scene: THREE.Scene;
  camera: THREE.Camera;
  canvas: HTMLCanvasElement;
  onSelect: (region: OrbitRegion) => void;
}

export function createOrbitRegionPicker({
  scene,
  camera,
  canvas,
  onSelect,
}: Props) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  raycaster.params.Line.threshold = 0.01;

  const resolveRegion = (object: THREE.Object3D): OrbitRegion | undefined => {
    let current: THREE.Object3D | null = object;
    while (current) {
      const region = current.userData.region as OrbitRegion | undefined;
      if (region) return region;
      current = current.parent;
    }
    return undefined;
  };

  const handleClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // Re-collect on every click — shells may not exist at install time.
    const shells: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (object.name.startsWith("orbit-shell-")) shells.push(object);
    });
    if (shells.length === 0) return;

    const intersections = raycaster.intersectObjects(shells, true);

    for (const hit of intersections) {
      const region = resolveRegion(hit.object);
      if (region) {
        onSelect(region);
        return;
      }
    }
  };

  canvas.addEventListener("click", handleClick);
  return () => canvas.removeEventListener("click", handleClick);
}
