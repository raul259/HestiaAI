"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1b3022, 0.08);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 6);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x88ebc0, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(4, 8, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const mintLight = new THREE.PointLight(0x88ebc0, 2.5, 8);
    mintLight.position.set(-2, 3, 2);
    scene.add(mintLight);

    // House
    const houseGroup = new THREE.Group();

    const wallMat = new THREE.MeshPhongMaterial({ color: 0x1b3022, shininess: 30 });
    const roofMat = new THREE.MeshPhongMaterial({ color: 0x374151, shininess: 20 });
    const windowMat = new THREE.MeshPhongMaterial({
      color: 0x88ebc0,
      emissive: 0x88ebc0,
      emissiveIntensity: 0.6,
      shininess: 100,
    });
    const doorMat = new THREE.MeshPhongMaterial({ color: 0x2d5040, shininess: 40 });
    const chimMat = new THREE.MeshPhongMaterial({ color: 0x4b5563, shininess: 10 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 1.6), wallMat.clone());
    body.position.y = 0.7;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.label = "Paredes";
    houseGroup.add(body);

    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 1.3, 0.9, 4), roofMat.clone());
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.85;
    roof.castShadow = true;
    roof.userData.label = "Tejado";
    houseGroup.add(roof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.08), doorMat.clone());
    door.position.set(0, 0.28, 0.84);
    door.userData.label = "Puerta";
    houseGroup.add(door);

    const winPositions = [
      [-0.6, 0.85, 0.84],
      [0.6, 0.85, 0.84],
      [-0.6, 0.85, -0.84],
      [0.6, 0.85, -0.84],
    ];
    winPositions.forEach(([x, y, z]) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.08), windowMat.clone());
      win.position.set(x, y, z);
      win.userData.label = "Ventana";
      houseGroup.add(win);
    });

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), chimMat.clone());
    chimney.position.set(0.5, 2.4, 0);
    chimney.castShadow = true;
    chimney.userData.label = "Chimenea";
    houseGroup.add(chimney);

    const groundMat = new THREE.MeshPhongMaterial({
      color: 0x2d5040,
      transparent: true,
      opacity: 0.5,
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(2.8, 64), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    houseGroup.add(ground);

    scene.add(houseGroup);

    // Collect interactive meshes (all house parts except ground)
    const interactiveMeshes: THREE.Mesh[] = [];
    houseGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.userData.label) {
        interactiveMeshes.push(child);
      }
    });

    // Particles
    const particleCount = 250;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 5;
      const h = (Math.random() - 0.3) * 5;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = h;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleSpeeds[i] = 0.001 + Math.random() * 0.002;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x88ebc0,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const orbitRingGeo = new THREE.TorusGeometry(3.5, 0.01, 8, 80);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x88ebc0,
      transparent: true,
      opacity: 0.15,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2.5;
    scene.add(orbitRing);

    // Tooltip montado en el body para estar por encima de todo (z-index alto)
    const tooltipEl = document.createElement("div");
    tooltipEl.style.cssText = `
      position: fixed;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      background: rgba(27, 48, 34, 0.88);
      color: #88ebc0;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-family: Inter, sans-serif;
      font-weight: 500;
      border: 1px solid rgba(136, 235, 192, 0.35);
      backdrop-filter: blur(6px);
      white-space: nowrap;
      letter-spacing: 0.02em;
      z-index: 9999;
    `;
    document.body.appendChild(tooltipEl);

    // Raycasting — escuchamos en window para capturar eventos aunque el canvas esté detrás
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh: THREE.Mesh | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      tooltipEl.style.left = `${e.clientX + 14}px`;
      tooltipEl.style.top = `${e.clientY - 10}px`;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;

        if (mesh !== hoveredMesh) {
          if (hoveredMesh) {
            const mat = hoveredMesh.material as THREE.MeshPhongMaterial;
            mat.emissive.setHex(hoveredMesh.userData.origEmissive ?? 0x000000);
            mat.emissiveIntensity = hoveredMesh.userData.origEmissiveIntensity ?? 0;
          }

          hoveredMesh = mesh;
          const mat = mesh.material as THREE.MeshPhongMaterial;
          mesh.userData.origEmissive = mat.emissive.getHex();
          mesh.userData.origEmissiveIntensity = mat.emissiveIntensity;
          mat.emissive.setHex(0x88ebc0);
          mat.emissiveIntensity = 0.55;

          tooltipEl.textContent = mesh.userData.label;
          tooltipEl.style.opacity = "1";
        }
      } else {
        if (hoveredMesh) {
          const mat = hoveredMesh.material as THREE.MeshPhongMaterial;
          mat.emissive.setHex(hoveredMesh.userData.origEmissive ?? 0x000000);
          mat.emissiveIntensity = hoveredMesh.userData.origEmissiveIntensity ?? 0;
          hoveredMesh = null;
        }
        tooltipEl.style.opacity = "0";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      houseGroup.rotation.y = elapsed * 0.18;

      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;
        const angle = Math.atan2(positions[iz], positions[ix]);
        const radius = Math.sqrt(positions[ix] ** 2 + positions[iz] ** 2);
        const newAngle = angle + particleSpeeds[i];
        positions[ix] = Math.cos(newAngle) * radius;
        positions[iz] = Math.sin(newAngle) * radius;
        positions[iy] += Math.sin(elapsed + i) * 0.002;
      }
      particleGeo.attributes.position.needsUpdate = true;

      particles.rotation.y = elapsed * 0.03;
      orbitRing.rotation.z = elapsed * 0.08;
      mintLight.intensity = 2 + Math.sin(elapsed * 1.5) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (document.body.contains(tooltipEl)) document.body.removeChild(tooltipEl);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
