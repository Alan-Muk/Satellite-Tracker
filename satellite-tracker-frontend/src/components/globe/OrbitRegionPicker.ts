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

  const shells: THREE.Object3D[] = [];

  scene.traverse((object) => {
    if (object.name.startsWith("orbit-shell-")) {
      shells.push(object);
    }
  });

  const handleClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(shells, true);

    if (intersections.length === 0) {
      return;
    }

    let object: THREE.Object3D | undefined = intersections[0].object;

    while (object) {
      const region = object.userData.region as OrbitRegion | undefined;

      if (region) {
        onSelect(region);

        return;
      }

      object = object.parent ?? undefined;
    }
  };

  canvas.addEventListener("click", handleClick);

  return () => {
    canvas.removeEventListener("click", handleClick);
  };
}
