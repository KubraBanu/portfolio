import * as THREE from 'three';

/* ===================================
   THEME TOGGLE
   =================================== */
(function() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  function updateToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    toggle.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }

  updateToggle();

  toggle && toggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    updateToggle();
  });
})();

/* ===================================
   NAV SCROLL BEHAVIOR
   =================================== */
(function() {
  const nav = document.getElementById('nav');
  let lastY = 0;
  let ticking = false;

  function updateNav() {
    const y = window.scrollY;
    nav.classList.toggle('nav--scrolled', y > 20);
    nav.classList.toggle('nav--hidden', y > lastY + 10 && y > 80);
    if (y < lastY) nav.classList.remove('nav--hidden');
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });
})();

/* ===================================
   KINETIC TYPOGRAPHY — Splitting.js
   =================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (window.Splitting) {
    Splitting();
  }
  // Init Lucide icons
  if (window.lucide) lucide.createIcons();
});

/* ===================================
   COUNTER ANIMATION
   =================================== */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  const duration = 1800;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Trigger counters when stats enter view
const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

/* ===================================
   SCROLL REVEAL — IntersectionObserver
   =================================== */
(function initScrollReveal() {
  const items = document.querySelectorAll('.reveal-fade');
  if (!items.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings slightly
        const siblings = Array.from(entry.target.parentElement?.querySelectorAll('.reveal-fade') || []);
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(idx * 80, 320)}ms`;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => obs.observe(el));
})();

/* ===================================
   CONTACT FORM
   =================================== */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!`;
    btn.disabled = true;
    btn.style.background = 'var(--color-green)';
    btn.style.boxShadow = '0 4px 20px rgba(16,185,129,0.3)';
    setTimeout(() => {
      btn.innerHTML = `Send Message <i data-lucide="send"></i>`;
      btn.disabled = false;
      btn.style.background = '';
      btn.style.boxShadow = '';
      form.reset();
      if (window.lucide) lucide.createIcons();
    }, 3000);
  });
}

/* ===================================
   THREE.JS — HERO SCENE
   Animated particle field + floating sphere
   =================================== */
(function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 6;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || document.body);
  resize();

  // Particles
  const COUNT = 1200;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);

  const palette = [
    new THREE.Color('#a855f7'),
    new THREE.Color('#06b6d4'),
    new THREE.Color('#ec4899'),
    new THREE.Color('#8b5cf6'),
  ];

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 2 + 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Central glowing sphere
  const sphereGeo = new THREE.IcosahedronGeometry(1.2, 4);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x6022aa,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8,
    wireframe: false,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.set(3.5, -0.5, -1);
  scene.add(sphere);

  // Wireframe overlay
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.15 });
  const wireframe = new THREE.Mesh(sphereGeo.clone(), wireMat);
  sphere.add(wireframe);

  // Ring
  const ringGeo = new THREE.TorusGeometry(1.8, 0.02, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.5 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  sphere.add(ring);

  // Ring 2
  const ring2Geo = new THREE.TorusGeometry(2.2, 0.012, 16, 100);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.3 });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI / 5;
  ring2.rotation.y = Math.PI / 4;
  sphere.add(ring2);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x332255, 2);
  scene.add(ambientLight);
  const pointLight1 = new THREE.PointLight(0xa855f7, 5, 20);
  pointLight1.position.set(2, 3, 4);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0x06b6d4, 4, 20);
  pointLight2.position.set(-3, -2, 3);
  scene.add(pointLight2);

  // Mouse tracking
  let mouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let raf;
  function animate(t) {
    raf = requestAnimationFrame(animate);
    const time = t * 0.001;

    // Rotate particles slowly
    particles.rotation.y = time * 0.04;
    particles.rotation.x = time * 0.02;

    // Sphere float + rotation
    sphere.rotation.x = time * 0.3;
    sphere.rotation.y = time * 0.5;
    sphere.position.y = -0.5 + Math.sin(time * 0.6) * 0.3;

    // Scale breathe
    const breathe = 1 + Math.sin(time * 0.8) * 0.04;
    sphere.scale.setScalar(breathe);

    // Mouse parallax
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate(0);

  // Cleanup on disconnect
  return () => { cancelAnimationFrame(raf); renderer.dispose(); ro.disconnect(); };
})();

/* ===================================
   THREE.JS — FEATURED PROJECT CANVAS
   Abstract DNA helix
   =================================== */
(function initProjectScene() {
  const canvas = document.getElementById('proj-canvas-1');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || canvas);
  resize();

  // Galaxy-like spiral particles
  const COUNT = 2000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    const t = (i / COUNT) * Math.PI * 8;
    const r = (i / COUNT) * 2.5;
    const arm = i % 2 === 0 ? 0 : Math.PI;
    pos[i * 3]     = Math.cos(t + arm) * r + (Math.random() - 0.5) * 0.4;
    pos[i * 3 + 1] = (i / COUNT - 0.5) * 6;
    pos[i * 3 + 2] = Math.sin(t + arm) * r + (Math.random() - 0.5) * 0.4;

    const frac = i / COUNT;
    const c = new THREE.Color().lerpColors(
      new THREE.Color('#a855f7'),
      new THREE.Color('#06b6d4'),
      frac
    );
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const light1 = new THREE.PointLight(0xa855f7, 3, 10);
  light1.position.set(2, 2, 2);
  scene.add(light1);
  scene.add(new THREE.AmbientLight(0x1a0033, 3));

  let raf2;
  function animate(t) {
    raf2 = requestAnimationFrame(animate);
    const time = t * 0.001;
    points.rotation.y = time * 0.3;
    renderer.render(scene, camera);
  }
  animate(0);
})();

/* ===================================
   THREE.JS — ABOUT CANVAS
   Morphing abstract shape
   =================================== */
(function initAboutScene() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 0.8, 0.1, 100);
  camera.position.z = 4;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || canvas);
  resize();

  // Layered translucent spheres
  function makeSphere(r, color, emissive, opacity, wireframe = false) {
    const geo = new THREE.IcosahedronGeometry(r, wireframe ? 2 : 5);
    const mat = wireframe
      ? new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity })
      : new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.7, transparent: true, opacity });
    return new THREE.Mesh(geo, mat);
  }

  const s1 = makeSphere(1.2, 0xa855f7, 0x6020bb, 0.85);
  const s2 = makeSphere(1.35, 0x06b6d4, 0x035e80, 0.3);
  const s3 = makeSphere(1.5, 0xa855f7, 0x000000, 0.12, true);
  const s4 = makeSphere(1.7, 0xec4899, 0x000000, 0.06, true);

  const group = new THREE.Group();
  group.add(s1, s2, s3, s4);
  scene.add(group);

  // Floating particles around the sphere
  const pGeo = new THREE.BufferGeometry();
  const pCount = 300;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.8 + Math.random() * 0.8;
    pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i*3+2] = r * Math.cos(phi);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.05, color: 0x06b6d4, transparent: true, opacity: 0.7 });
  const pPoints = new THREE.Points(pGeo, pMat);
  group.add(pPoints);

  // Lights
  scene.add(new THREE.AmbientLight(0x221133, 3));
  const l1 = new THREE.PointLight(0xa855f7, 4, 15);
  l1.position.set(3, 3, 3);
  scene.add(l1);
  const l2 = new THREE.PointLight(0x06b6d4, 3, 15);
  l2.position.set(-3, -2, 2);
  scene.add(l2);

  // Morph the geometry vertices
  const origPos = s1.geometry.attributes.position.array.slice();

  let raf3;
  function animate(t) {
    raf3 = requestAnimationFrame(animate);
    const time = t * 0.001;

    // Morph sphere vertices
    const pos = s1.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x0 = origPos[i*3], y0 = origPos[i*3+1], z0 = origPos[i*3+2];
      const noise = Math.sin(x0 * 3 + time) * Math.cos(y0 * 2 + time * 0.7) * 0.15;
      const len = Math.sqrt(x0*x0 + y0*y0 + z0*z0);
      const f = (len + noise) / len;
      pos.setXYZ(i, x0 * f, y0 * f, z0 * f);
    }
    pos.needsUpdate = true;
    s1.geometry.computeVertexNormals();

    group.rotation.y = time * 0.4;
    group.rotation.x = Math.sin(time * 0.3) * 0.2;
    s2.rotation.y = -time * 0.6;
    s3.rotation.x = time * 0.3;

    renderer.render(scene, camera);
  }
  animate(0);
})();
