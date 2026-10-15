import {
  AmbientLight, BoxGeometry, BufferGeometry, CanvasTexture, Color, ConeGeometry,
  CylinderGeometry, DirectionalLight, DoubleSide, Group, Material, Mesh,
  MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, PointLight,
  Raycaster, Scene, SphereGeometry, SpotLight, SRGBColorSpace, Vector2, WebGLRenderer,
} from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { RoomController, RoomOptions } from '../types';
import { RoomCamera, SCREEN_CENTER, SCREEN_HEIGHT, SCREEN_WIDTH, SCREEN_WORLD_WIDTH } from './camera';

/** A single DOM screen, rendered with the exact same perspective as its physical room. */
export function createRoom(options: RoomOptions): RoomController {
  const { host, screenElement } = options;
  // If WebGL is unavailable this intentionally throws; the caller supplies the readable fallback.
  const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const scene = new Scene();
  scene.background = new Color('#15191a');
  const camera = new PerspectiveCamera(40, 1, 0.1, 60);
  const cssRenderer = new CSS3DRenderer();
  const canvas = renderer.domElement;
  canvas.className = 'room-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', display: 'block', zIndex: '0' });
  cssRenderer.domElement.className = 'room-dom-layer';
  Object.assign(cssRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '1', overflow: 'hidden' });

  const previousScreenStyle = screenElement.getAttribute('style');
  Object.assign(screenElement.style, { width: `${SCREEN_WIDTH}px`, height: `${SCREEN_HEIGHT}px`, pointerEvents: 'none', backfaceVisibility: 'hidden' });
  const screen = new CSS3DObject(screenElement);
  // CSS3DObject opts its element into pointer events in its constructor.
  screenElement.style.pointerEvents = 'none';
  screenElement.style.userSelect = 'text';
  screen.position.copy(SCREEN_CENTER);
  screen.scale.setScalar(SCREEN_WORLD_WIDTH / SCREEN_WIDTH);
  const cssScene = new Scene();
  cssScene.add(screen);
  host.append(canvas, cssRenderer.domElement);

  const materials = new Set<Material>();
  const geometries = new Set<BufferGeometry>();
  const textures = new Set<CanvasTexture>();
  const material = (color: string, roughness = 0.9, metalness = 0) => {
    const value = new MeshStandardMaterial({ color, roughness, metalness });
    materials.add(value);
    return value;
  };
  const wall = material('#41433d');
  const floor = material('#252825');
  const caseMaterial = material('#666358', 0.84);
  const frameMaterial = material('#777366', 0.86);
  const black = material('#101715', 0.85);
  const lampMetal = material('#706c5f', 0.68, 0.18);
  const lampShade = material('#98917d', 0.85, 0.04);
  lampShade.side = DoubleSide;
  const wood = material('#5b4432', 0.84);
  const keyboardShell = material('#4d4d43', 0.86);
  const keyMaterial = material('#918b76', 0.90);
  const keyAlternate = material('#706e60', 0.9);

  const add = (geometry: BufferGeometry, mat: Material, x: number, y: number, z: number, parent: Scene | Group = scene) => {
    geometries.add(geometry);
    const mesh = new Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, parent: Scene | Group = scene) => add(new BoxGeometry(w, h, d), mat, x, y, z, parent);
  const roundedBox = (w: number, h: number, d: number, radius: number, mat: Material, x: number, y: number, z: number, parent: Scene | Group = scene) => add(new RoundedBoxGeometry(w, h, d, 2, radius), mat, x, y, z, parent);

  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 512;
  grainCanvas.height = 128;
  const grain = grainCanvas.getContext('2d');
  if (grain) {
    grain.fillStyle = '#65503c';
    grain.fillRect(0, 0, 512, 128);
    // Low-contrast, uneven pores avoid the regular banding of repeated stripes.
    for (let i = 0; i < 49; i++) {
      const y = i * 2.75 + Math.sin(i * 7.3) * 2.2;
      grain.strokeStyle = i % 3 === 0 ? 'rgba(33,23,15,.055)' : 'rgba(145,117,80,.045)';
      grain.lineWidth = i % 4 === 0 ? 0.8 : 0.4;
      grain.beginPath();
      grain.moveTo(-40 + Math.sin(i * 3) * 90, y);
      grain.bezierCurveTo(145, y + Math.sin(i) * 8, 340, y - Math.cos(i) * 5, 535 + Math.cos(i * 4) * 60, y + Math.sin(i * 2) * 4);
      grain.stroke();
    }
    const map = new CanvasTexture(grainCanvas);
    map.colorSpace = SRGBColorSpace;
    textures.add(map);
    wood.map = map;
    wood.color.set('#bca58b');
  }

  const plasterCanvas = document.createElement('canvas');
  plasterCanvas.width = plasterCanvas.height = 256;
  const plaster = plasterCanvas.getContext('2d');
  if (plaster) {
    const pixels = plaster.createImageData(256, 256);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const index = i / 4;
      const x = index % 256;
      const y = Math.floor(index / 256);
      const value = 228 + Math.round(Math.sin(x * 1.7 + y * 0.6) * Math.sin(y * 1.1 - x * 0.3) * 5);
      pixels.data[i] = value;
      pixels.data[i + 1] = value;
      pixels.data[i + 2] = value - 2;
      pixels.data[i + 3] = 255;
    }
    plaster.putImageData(pixels, 0, 0);
    const map = new CanvasTexture(plasterCanvas);
    map.colorSpace = SRGBColorSpace;
    textures.add(map);
    wall.map = map;
  }

  box(15, 0.18, 16, floor, 0, -1.15, 0);
  box(15, 7, 0.2, wall, 0, 2.2, -5.3);
  box(0.2, 7, 16, wall, -6.6, 2.2, 0);
  box(0.2, 7, 16, wall, 6.6, 2.2, 0);
  box(6.7, 0.18, 3.35, wood, 0, 0.16, 0.55);
  box(0.14, 1.25, 2.65, black, -2.95, -0.55, 0.55);
  box(0.14, 1.25, 2.65, black, 2.95, -0.55, 0.55);
  box(5.8, 0.32, 0.12, black, 0, -0.22, -0.9);

  const monitor = new Group();
  scene.add(monitor);
  const hitMeshes: Mesh[] = [];
  hitMeshes.push(roundedBox(3.35, 2.37, 1.17, 0.075, caseMaterial, 0, 1.57, -0.57, monitor));
  // The four solid frame pieces surround the clean, perfectly flat HTML display.
  hitMeshes.push(roundedBox(3.40, 0.24, 0.20, 0.025, frameMaterial, 0, 2.62, 0.03, monitor));
  hitMeshes.push(roundedBox(3.40, 0.29, 0.20, 0.025, frameMaterial, 0, 0.555, 0.03, monitor));
  hitMeshes.push(roundedBox(0.26, 1.83, 0.20, 0.025, frameMaterial, -1.57, 1.59, 0.03, monitor));
  hitMeshes.push(roundedBox(0.26, 1.83, 0.20, 0.025, frameMaterial, 1.57, 1.59, 0.03, monitor));
  box(2.99, 1.91, 0.035, black, 0, 1.6, 0.11, monitor);
  roundedBox(2.25, 0.12, 0.97, 0.035, caseMaterial, 0, 0.32, -0.49, monitor);
  const powerMaterial = material('#91aa85');
  powerMaterial.emissive.set('#66895f');
  powerMaterial.emissiveIntensity = 0.65;
  add(new SphereGeometry(0.018, 10, 8), powerMaterial, 1.40, 0.52, 0.139, monitor);
  box(0.16, 0.035, 0.025, black, 1.17, 0.52, 0.14, monitor);

  // A quiet, physical input set gives the desk its familiar scale.
  roundedBox(2.08, 0.09, 0.66, 0.035, keyboardShell, 0, 0.295, 1.12);
  const keyGeometry = new RoundedBoxGeometry(0.113, 0.028, 0.103, 1, 0.008);
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 14; column++) {
      add(keyGeometry, column > 11 ? keyAlternate : keyMaterial, -0.88 + column * 0.133, 0.354, 0.90 + row * 0.125);
    }
  }
  roundedBox(0.84, 0.028, 0.103, 0.008, keyMaterial, -0.10, 0.354, 1.40);
  roundedBox(0.21, 0.028, 0.103, 0.008, keyAlternate, -0.83, 0.354, 1.40);
  roundedBox(0.21, 0.028, 0.103, 0.008, keyAlternate, 0.81, 0.354, 1.40);
  const mouse = add(new SphereGeometry(0.19, 24, 16), keyAlternate, 1.47, 0.30, 1.22);
  mouse.scale.set(0.76, 0.38, 1.2);
  roundedBox(0.017, 0.012, 0.065, 0.004, black, 1.47, 0.373, 1.16);

  const lampX = -2.45;
  const lampZ = -0.1;
  add(new CylinderGeometry(0.35, 0.39, 0.09, 32), lampMetal, lampX, 0.30, lampZ);
  add(new CylinderGeometry(0.036, 0.046, 1.50, 16), lampMetal, lampX, 1.06, lampZ);
  add(new ConeGeometry(0.49, 0.52, 32, 1, true), lampShade, lampX, 1.79, lampZ);
  const bulbMaterial = material('#ffe2a6');
  bulbMaterial.emissive.set('#ffc275');
  bulbMaterial.emissiveIntensity = 2;
  add(new SphereGeometry(0.085, 16, 12), bulbMaterial, lampX, 1.61, lampZ);
  const bulbLight = new PointLight('#ffd293', 3.7, 6, 2);
  bulbLight.position.set(lampX, 1.59, lampZ);
  scene.add(bulbLight);
  const lampLight = new SpotLight('#ffce8e', 38, 9, Math.PI / 3.2, 0.75, 2);
  lampLight.position.set(lampX, 1.64, lampZ);
  lampLight.target.position.set(-1.75, 0.20, 0.55);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.0005;
  scene.add(lampLight, lampLight.target);
  scene.add(new AmbientLight('#c2c9c5', 0.44));
  const roomFill = new DirectionalLight('#a0b6be', 0.28);
  roomFill.position.set(3, 4, 3);
  scene.add(roomFill);
  const screenLight = new PointLight('#c7decf', 0.40, 3.6, 2);
  screenLight.position.set(0, 1.5, 0.45);
  scene.add(screenLight);

  let disposed = false;
  let frame = 0;
  let lastTime = performance.now();
  const cameraController = new RoomCamera(camera, options.reducedMotion, state => {
    screenElement.style.pointerEvents = state === 'focused' ? 'auto' : 'none';
    canvas.style.cursor = '';
    options.onViewChange(state);
  });
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height);
    cssRenderer.setSize(width, height);
    cameraController.resize(width, height);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  window.addEventListener('resize', resize);
  resize();

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const isMonitor = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return false;
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    camera.updateMatrixWorld();
    monitor.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(hitMeshes, false).length > 0;
  };
  const onPointerMove = (event: PointerEvent) => {
    if (cameraController.viewState !== 'seated') return;
    const bounds = canvas.getBoundingClientRect();
    cameraController.setPointer((event.clientX - bounds.left) / Math.max(bounds.width, 1) * 2 - 1, (event.clientY - bounds.top) / Math.max(bounds.height, 1) * 2 - 1);
    canvas.style.cursor = isMonitor(event) ? 'pointer' : '';
  };
  const onPointerLeave = () => { cameraController.setPointer(0, 0); canvas.style.cursor = ''; };
  let pointerDown: { x: number; y: number; id: number; onMonitor: boolean } | undefined;
  const onPointerDown = (event: PointerEvent) => {
    if (event.button === 0 && cameraController.viewState === 'seated') pointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId, onMonitor: isMonitor(event) };
  };
  const onPointerUp = (event: PointerEvent) => {
    const down = pointerDown;
    pointerDown = undefined;
    if (down && down.id === event.pointerId && down.onMonitor && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 8 && cameraController.viewState === 'seated' && isMonitor(event)) options.onMonitorActivate();
  };
  const onPointerCancel = () => { pointerDown = undefined; };
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);

  const animate = (now: number) => {
    if (disposed) return;
    cameraController.update(now, (now - lastTime) / 1000);
    lastTime = now;
    renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);

  return {
    focus: () => { if (!disposed) cameraController.focus(); },
    returnToSeat: () => { if (!disposed) cameraController.returnToSeat(); },
    setReducedMotion: value => { if (!disposed) cameraController.setReducedMotion(value); },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      geometries.forEach(value => value.dispose());
      materials.forEach(value => value.dispose());
      textures.forEach(value => value.dispose());
      lampLight.shadow.dispose();
      renderer.dispose();
      cssScene.remove(screen);
      screenElement.remove();
      if (previousScreenStyle === null) screenElement.removeAttribute('style');
      else screenElement.setAttribute('style', previousScreenStyle);
      canvas.remove();
      cssRenderer.domElement.remove();
      scene.clear();
    },
  };
}
