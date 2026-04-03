"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Loader2, RotateCcw } from "lucide-react";
import { Appliance } from "@/types";

function getModelPath(category: string): string {
  const cat = category.toLowerCase();
  if (/tv|tele|television|televisión/.test(cat)) return "/models/tv.glb";
  if (/ac|aire|air|climat|acondicionado/.test(cat)) return "/models/ac.glb";
  if (/wash|lavadora|lavarr/.test(cat)) return "/models/washing_machine.glb";
  if (/dryer|secadora/.test(cat)) return "/models/dryer.glb";
  if (/oven|horno/.test(cat)) return "/models/oven.glb";
  if (/dish|lavavajillas/.test(cat)) return "/models/dishwasher.glb";
  if (/fridge|nev|refrig|frigorífico/.test(cat)) return "/models/refrigerator.glb";
  if (/micro/.test(cat)) return "/models/microwave.glb";
  if (/coffee|café|cafetera/.test(cat)) return "/models/coffee_maker.glb";
  if (/water|calent|boiler/.test(cat)) return "/models/water_heater.glb";
  return "/models/default.glb";
}

interface Props {
  appliance: Appliance;
}

interface Tooltip {
  label: string;
  x: number;
  y: number;
}

export default function ApplianceViewer({ appliance }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const hotspotMeshes = useRef<THREE.Mesh[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const resetCamera = () => {
    controlsRef.current?.reset();
    setTooltip(null);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    setLoadState("loading");
    setTooltip(null);
    hotspotMeshes.current = [];

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f7f4);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x88ebc0, 0.6);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 64),
      new THREE.MeshStandardMaterial({ color: 0xdff0e8, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.8;
    controls.maxDistance = 8;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(hotspotMeshes.current);
      if (hits.length > 0) {
        const label = hits[0].object.userData.label as string;
        setTooltip({ label, x: e.clientX - rect.left, y: e.clientY - rect.top - 48 });
      } else {
        setTooltip(null);
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

    const modelUrl = appliance.glbUrl || getModelPath(appliance.category);
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.6 / maxDim;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y = 0;

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);

        camera.position.set(0, size.y * scale * 0.6, maxDim * scale * 2.2);
        controls.target.set(0, size.y * scale * 0.3, 0);
        controls.saveState();
        controls.update();

        // Cargar hotspots y añadir esferas rojas
        fetch(`/api/appliances/hotspots?applianceId=${appliance.id}`)
          .then((r) => r.json())
          .then((hs: Array<{ id: string; label: string; positionX: number; positionY: number; positionZ: number }>) => {
            for (const h of hs) {
              const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.01, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xe24b4a })
              );
              sphere.position.set(h.positionX, h.positionY, h.positionZ);
              sphere.userData = { label: h.label, isHotspot: true };
              scene.add(sphere);
              hotspotMeshes.current.push(sphere);
            }
          })
          .catch(() => {});

        setLoadState("ok");
      },
      undefined,
      () => setLoadState("error")
    );

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      hotspotMeshes.current = [];
    };
  }, [appliance.category, appliance.glbUrl, appliance.id]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

      {/* Tooltip de hotspot */}
      {tooltip && (
        <div
          className="absolute z-10 bg-deep-forest text-white text-xs font-inter font-medium px-3 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {tooltip.label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-deep-forest" />
        </div>
      )}

      {loadState === "ok" && (
        <>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-deep-forest/50 font-inter bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
            Arrastra para rotar · Scroll para zoom
          </p>
          <button
            onClick={resetCamera}
            title="Resetear cámara"
            className="absolute top-3 right-3 w-8 h-8 bg-white/70 hover:bg-white border border-deep-forest/10 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-deep-forest/60" />
          </button>
        </>
      )}

      {loadState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f0f7f4]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-electric-mint" />
            <p className="text-sm text-slate-body font-inter">Cargando modelo 3D...</p>
          </div>
        </div>
      )}

      {loadState === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f0f7f4]">
          <div className="text-center space-y-3 px-6">
            <div className="text-5xl">📦</div>
            <p className="text-sm font-inter font-medium text-deep-forest">Modelo 3D no disponible</p>
            <p className="text-xs font-inter text-slate-body">
              Puedes preguntar al asistente sobre este electrodoméstico en el chat.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
