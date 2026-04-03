"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { X, Trash2, Loader2, MapPin } from "lucide-react";
import { Appliance } from "@/types";

interface Hotspot {
  id: string;
  label: string;
  positionX: number;
  positionY: number;
  positionZ: number;
}

interface PendingScreen {
  x: number;
  y: number;
}

interface Props {
  appliance: Appliance;
  onClose: () => void;
}

export default function ApplianceHotspotEditor({ appliance, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hotspotSpheresRef = useRef<{ mesh: THREE.Mesh; id: string }[]>([]);
  const modelMeshesRef = useRef<THREE.Object3D[]>([]);
  const pendingPosRef = useRef<{ x: number; y: number; z: number } | null>(null);

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [pendingScreen, setPendingScreen] = useState<PendingScreen | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");

  // Cargar hotspots existentes
  useEffect(() => {
    fetch(`/api/appliances/hotspots?applianceId=${appliance.id}`)
      .then((r) => r.json())
      .then(setHotspots)
      .catch(() => {});
  }, [appliance.id]);

  // Three.js setup
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight || 380;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f7f4);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x88ebc0, 0.6);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 64),
      new THREE.MeshStandardMaterial({ color: 0xdff0e8, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.8;
    controls.maxDistance = 8;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      if (pendingPosRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(modelMeshesRef.current, true);
      if (hits.length > 0) {
        const pt = hits[0].point;
        pendingPosRef.current = { x: pt.x, y: pt.y, z: pt.z };
        setPendingScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };
    renderer.domElement.addEventListener("click", handleClick);

    const modelUrl = appliance.glbUrl!;
    new GLTFLoader().load(
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
            modelMeshesRef.current.push(child);
          }
        });
        scene.add(model);

        camera.position.set(0, size.y * scale * 0.6, maxDim * scale * 2.2);
        controls.target.set(0, size.y * scale * 0.3, 0);
        controls.saveState();
        controls.update();

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
      const h = mount.clientHeight || 380;
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
      modelMeshesRef.current = [];
      hotspotSpheresRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliance.glbUrl]);

  // Sincronizar esferas de hotspots cuando cambia la lista
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || loadState !== "ok") return;

    // Eliminar esferas huérfanas
    hotspotSpheresRef.current.forEach(({ mesh, id }) => {
      if (!hotspots.find((h) => h.id === id)) scene.remove(mesh);
    });
    hotspotSpheresRef.current = hotspotSpheresRef.current.filter(({ id }) =>
      hotspots.find((h) => h.id === id)
    );

    // Añadir esferas nuevas
    hotspots.forEach((h) => {
      if (hotspotSpheresRef.current.find((e) => e.id === h.id)) return;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xe24b4a })
      );
      mesh.position.set(h.positionX, h.positionY, h.positionZ);
      mesh.userData = { label: h.label };
      scene.add(mesh);
      hotspotSpheresRef.current.push({ mesh, id: h.id });
    });
  }, [hotspots, loadState]);

  const cancelPending = () => {
    pendingPosRef.current = null;
    setPendingScreen(null);
    setLabelInput("");
  };

  const saveHotspot = async () => {
    if (!pendingPosRef.current || !labelInput.trim()) return;
    setSaving(true);
    const { x, y, z } = pendingPosRef.current;
    const res = await fetch("/api/appliances/hotspots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applianceId: appliance.id,
        label: labelInput.trim(),
        positionX: x,
        positionY: y,
        positionZ: z,
      }),
    });
    const created = await res.json();
    setHotspots((prev) => [...prev, created]);
    cancelPending();
    setSaving(false);
  };

  const deleteHotspot = async (id: string) => {
    await fetch(`/api/appliances/hotspots?id=${id}`, { method: "DELETE" });
    setHotspots((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-outfit font-semibold text-deep-forest">
              Puntos de interés — {appliance.name}
            </h2>
            <p className="text-xs font-inter text-gray-400">
              Haz click sobre el modelo para marcar un punto
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="relative bg-[#f0f7f4]" style={{ height: 380 }}>
          <div ref={mountRef} className="w-full h-full" />

          {/* Input flotante al crear hotspot */}
          {pendingScreen && (
            <div
              className="absolute z-10 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 w-56"
              style={{
                left: Math.max(112, Math.min(pendingScreen.x, 999)),
                top: Math.max(8, pendingScreen.y - 90),
                transform: "translateX(-50%)",
              }}
            >
              <p className="text-xs font-inter text-gray-500 mb-2">Etiqueta del punto</p>
              <input
                autoFocus
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveHotspot()}
                placeholder="Ej: Botón de encendido"
                className="input-field text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={cancelPending} className="flex-1 btn-outline text-xs py-1.5">
                  Cancelar
                </button>
                <button
                  onClick={saveHotspot}
                  disabled={!labelInput.trim() || saving}
                  className="flex-1 btn-primary text-xs py-1.5 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {loadState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-electric-mint" />
                <p className="text-sm text-slate-body font-inter">Cargando modelo...</p>
              </div>
            </div>
          )}

          {loadState === "ok" && !pendingScreen && (
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-deep-forest/50 font-inter bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none whitespace-nowrap">
              Haz click sobre el modelo para añadir un punto · Arrastra para rotar
            </p>
          )}
        </div>

        {/* Lista de hotspots */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {hotspots.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-inter">Sin puntos de interés aún.</p>
              <p className="text-xs font-inter mt-1">Haz click sobre el modelo para añadir el primero.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-inter text-gray-400 mb-3">{hotspots.length} punto{hotspots.length !== 1 ? "s" : ""} marcado{hotspots.length !== 1 ? "s" : ""}</p>
              {hotspots.map((h) => (
                <div key={h.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#e24b4a] flex-shrink-0" />
                  <span className="flex-1 text-sm font-inter text-deep-forest">{h.label}</span>
                  <button
                    onClick={() => deleteHotspot(h.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full btn-primary text-sm py-2.5">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
