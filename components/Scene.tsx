'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type Side = 'boy' | 'girl';

export default function Scene({ sel }: { sel: Side | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef<Side | null>(null);
  const shimmerRef = useRef<() => void>(() => {});

  useEffect(() => {
    selRef.current = sel;
    if (!sel) return;
    const t = setTimeout(() => shimmerRef.current(), 900);
    return () => clearTimeout(t);
  }, [sel]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.z = 12;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-3, 5, 8); scene.add(key);
    const rim = new THREE.PointLight(0xffe3b0, 0.9, 30); rim.position.set(4, -3, 5); scene.add(rim);

    const makeOrb = (color: number, ph: number) => {
      const g = new THREE.Group();
      const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.15, transparent: true });
      g.add(new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 48), m));
      const rm = new THREE.MeshBasicMaterial({ color: 0xcfa96a, transparent: true, opacity: 0.7 });
      ([[1.9, 0.55], [2.25, -0.8]] as const).forEach(([r, tilt], i) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 160), rm);
        ring.rotation.x = 1.2 + tilt * 0.3; ring.rotation.y = tilt; ring.userData.sp = (i ? -1 : 1) * 0.15; g.add(ring);
      });
      g.userData = { m, rm, ph };
      scene.add(g);
      return g;
    };
    const orbs: Record<Side, THREE.Group> = { boy: makeOrb(0x9ebfe3, 0), girl: makeOrb(0xf0b9c8, 2.2) };

    const spr = document.createElement('canvas'); spr.width = spr.height = 64;
    const c2 = spr.getContext('2d')!;
    const gr = c2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,236,190,1)'); gr.addColorStop(0.35, 'rgba(235,196,120,.5)'); gr.addColorStop(1, 'rgba(235,196,120,0)');
    c2.fillStyle = gr; c2.fillRect(0, 0, 64, 64);
    const N = 260, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pos.set([(Math.random() - 0.5) * 22, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8], i * 3);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({ size: 0.22, map: new THREE.CanvasTexture(spr), transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });
    const dust = new THREE.Points(pg, pm); dust.frustumCulled = false; scene.add(dust);

    let layout = { x: 4.6, s: 1, y: 0 };
    const size = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      const halfW = Math.tan((20 * Math.PI) / 180) * 12 * cam.aspect, narrow = w < 620;
      layout = { x: narrow ? Math.min(halfW * 0.8, 3) : Math.min(halfW * 0.7, 5.2), s: narrow ? 0.6 : 1, y: narrow ? -3.6 : 0 };
    };
    size();
    let mx = 0, my = 0;
    const onMove = (e: PointerEvent) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener('resize', size); window.addEventListener('pointermove', onMove);

    shimmerRef.current = () => {
      const s = selRef.current; if (!s) return;
      const o = orbs[s];
      for (let i = 0; i < N; i++) {
        const a = Math.random() * 6.283, b = Math.random() * 3.14, f = 1.5 + Math.random() * 3.5, j = i * 3;
        pos.set([o.position.x, o.position.y, o.position.z], j);
        vel.set([Math.sin(b) * Math.cos(a) * f, Math.sin(b) * Math.sin(a) * f, Math.cos(b) * f], j);
      }
    };

    const clock = new THREE.Clock();
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    let raf = 0;
    const loop = () => {
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, k = reduce ? 0.2 : 1, sel = selRef.current;
      (['boy', 'girl'] as Side[]).forEach(side => {
        const o = orbs[side], u = o.userData, dir = side === 'boy' ? -1 : 1;
        let tx = dir * layout.x, ty = layout.y + Math.sin(t * 0.6 * k + u.ph) * 0.35, tz = -1, ts = layout.s, to = 1;
        if (sel) {
          if (sel === side) { tx = 0; ty = layout.y ? 1.8 : 2.3; tz = 3; ts = layout.s * 1.15; }
          else { ts = layout.s * 0.5; to = 0; tx = dir * layout.x * 1.5; }
        }
        o.position.x = lerp(o.position.x, tx, 0.045); o.position.y = lerp(o.position.y, ty, 0.045); o.position.z = lerp(o.position.z, tz, 0.045);
        o.scale.setScalar(lerp(o.scale.x, ts, 0.05));
        u.m.opacity = lerp(u.m.opacity, to, 0.05); u.rm.opacity = lerp(u.rm.opacity, to * 0.7, 0.05);
        o.rotation.y += dt * 0.25 * k;
        o.children.forEach(c => { if (c.userData.sp) c.rotation.z += dt * c.userData.sp * k; });
      });
      cam.position.x = lerp(cam.position.x, mx * 1.2, 0.03); cam.position.y = lerp(cam.position.y, -my * 0.8, 0.03); cam.lookAt(0, 0, 0);
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        pos[j] += vel[j] * dt; pos[j + 1] += (vel[j + 1] + 0.12 * k) * dt; pos[j + 2] += vel[j + 2] * dt;
        vel[j] *= 0.985; vel[j + 1] *= 0.985; vel[j + 2] *= 0.985;
        if (pos[j + 1] > 7.5) { pos[j + 1] = -7.5; pos[j] = (Math.random() - 0.5) * 22; }
      }
      pg.attributes.position.needsUpdate = true;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size); window.removeEventListener('pointermove', onMove);
      renderer.dispose();
    };
  }, []);

  return <canvas id="bg" ref={canvasRef} aria-hidden="true" />;
}
