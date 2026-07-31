'use client';
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function seeded(s) {
  let v = s;
  return () => {
    v = (v * 16807 + 0) % 2147483647;
    return (v - 1) / 2147483646;
  };
}

/* ── Central Signal Core ── */
function SignalCore() {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.15;
    }
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.1, 0]} />
        <MeshDistortMaterial
          color="#8A7260"
          emissive="#8A7260"
          emissiveIntensity={0.35}
          distort={0.18}
          speed={1.5}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

/* ── Rotating Rings ── */
function SignalRings() {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.25;
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.15) * 0.1;
    }
  });

  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.8, 0.025, 16, 64), []);

  return (
    <group ref={groupRef}>
      <mesh geometry={ringGeo} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#A58B77" transparent opacity={0.5} emissive="#8A7260" emissiveIntensity={0.15} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#A58B77" transparent opacity={0.35} emissive="#8A7260" emissiveIntensity={0.1} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <meshStandardMaterial color="#A58B77" transparent opacity={0.25} emissive="#8A7260" emissiveIntensity={0.08} />
      </mesh>
    </group>
  );
}

/* ── Floating Particles ── */
function Particles({ count = 120 }) {
  const meshRef = useRef();
  const rand = useMemo(() => seeded(42), []);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.5 + rand() * 4;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count, rand]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.05;
    if (meshRef.current) {
      const p = meshRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const r = 3.5 + ((i % 10) / 10) * 4;
        const theta = (idx * 0.7 + t * 10 + i * 0.3) % (Math.PI * 2);
        const phi = Math.acos(2 * ((i / count + t * 0.2) % 1) - 1);
        p[idx] = r * Math.sin(phi) * Math.cos(theta);
        p[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        p[idx + 2] = r * Math.cos(phi);
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  return (
    <points ref={meshRef} geometry={geo}>
      <pointsMaterial size={0.04} color="#A58B77" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ── Camera Controller (mouse-driven orbit) ── */
function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(() => {
    mouse.current.x += (target.current.x - mouse.current.x) * 0.04;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.04;
    camera.position.set(
      mouse.current.x * 2.5,
      -mouse.current.y * 1.8,
      6
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ── Main Scene ── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, -2, 4]} intensity={0.3} color="#8A7260" />
      <SignalCore />
      <SignalRings />
      <Particles count={150} />
      <CameraController />
    </>
  );
}

export default function HeroScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
