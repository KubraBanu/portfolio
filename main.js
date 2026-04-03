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
   NAV SCROLL
   =================================== */
(function() {
  const nav = document.getElementById('nav');
  let lastY = 0, ticking = false;
  function updateNav() {
    const y = window.scrollY;
    nav.classList.toggle('nav--scrolled', y > 20);
    nav.classList.toggle('nav--hidden', y > lastY + 8 && y > 80);
    if (y < lastY) nav.classList.remove('nav--hidden');
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateNav); ticking = true; } }, { passive: true });
})();

/* ===================================
   SCROLL REVEAL
   =================================== */
(function() {
  const items = document.querySelectorAll('.reveal-fade');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentElement?.querySelectorAll('.reveal-fade') || []);
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(idx * 90, 360)}ms`;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  items.forEach(el => obs.observe(el));
})();

/* ===================================
   COUNTER ANIMATION
   =================================== */
(function() {
  const counters = document.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const target = parseInt(e.target.getAttribute('data-count'), 10);
        const start = performance.now();
        const dur = 1600;
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          e.target.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
})();

/* ===================================
   ROLE PILLS — staggered entrance glow
   =================================== */
(function() {
  const pills = ['role-pill-1','role-pill-2','role-pill-3'];
  pills.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Subtle pulse glow on each pill in sequence
    setTimeout(() => {
      el.style.transition = 'box-shadow 0.4s ease';
      const colors = ['rgba(99,102,241,0.5)','rgba(6,182,212,0.5)','rgba(20,184,166,0.5)'];
      let on = false;
      setInterval(() => {
        on = !on;
        el.style.boxShadow = on ? `0 0 18px ${colors[i]}` : 'none';
      }, 2400 + i * 800);
    }, 1600 + i * 400);
  });
})();

/* ===================================
   CONTACT FORM
   =================================== */
(function() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!`;
    btn.disabled = true;
    btn.style.background = 'linear-gradient(135deg, #22c55e, #14b8a6)';
    setTimeout(() => {
      btn.innerHTML = `Send Message`;
      btn.disabled = false;
      btn.style.background = '';
      form.reset();
    }, 3000);
  });
})();

/* ===================================
   INIT LUCIDE
   =================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  if (window.Splitting) Splitting();
  initNetworkCanvas();
  initProjectCharts();
  initRadarChart();
});

/* ===================================
   HERO — LIVE DATA NETWORK GRAPH
   2D Canvas: nodes + edges, floating
   =================================== */
function initNetworkCanvas() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], mouse = { x: -999, y: -999 };

  const COLORS = {
    node: ['#6366f1', '#06b6d4', '#14b8a6', '#22c55e', '#f59e0b'],
    edge: 'rgba(99,102,241,0.12)'
  };

  // Data node labels — reflect Kubra's skills
  const labels = ['Python','SQL','Tableau','Power BI','PySpark','ML','R','ETL','Analytics','KNIME','PostgreSQL','Databricks'];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeNodes() {
    nodes = [];
    const count = Math.min(Math.floor(W / 80) * Math.floor(H / 80) + 10, 36);
    for (let i = 0; i < count; i++) {
      const label = labels[i % labels.length];
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 3 + 2,
        color: COLORS.node[Math.floor(Math.random() * COLORS.node.length)],
        label: i < labels.length ? label : null,
        alpha: Math.random() * 0.4 + 0.5,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  const MAX_DIST = 160;

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Update nodes
    nodes.forEach(n => {
      n.pulse += 0.018;
      n.x += n.vx;
      n.y += n.vy;
      // Bounce
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      // Mouse repulsion
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 100) {
        n.x += dx / d * 1.2;
        n.y += dy / d * 1.2;
      }
    });

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          // Gradient edge
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, a.color + Math.round(alpha * 255).toString(16).padStart(2,'0'));
          grad.addColorStop(1, b.color + Math.round(alpha * 255).toString(16).padStart(2,'0'));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const pulsedR = n.r + Math.sin(n.pulse) * 0.6;

      // Glow halo
      const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pulsedR * 5);
      glow.addColorStop(0, n.color + '30');
      glow.addColorStop(1, n.color + '00');
      ctx.beginPath();
      ctx.arc(n.x, n.y, pulsedR * 5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, pulsedR, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.globalAlpha = n.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label for bigger nodes
      if (n.label && n.r > 3.5) {
        ctx.font = '10px Space Mono, monospace';
        ctx.fillStyle = 'rgba(220,228,240,0.55)';
        ctx.fillText(n.label, n.x + pulsedR + 4, n.y + 4);
      }
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); makeNodes(); }, { passive: true });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });
  canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  resize();
  makeNodes();
  requestAnimationFrame(draw);
}

/* ===================================
   PROJECT MINI-CHARTS (Canvas 2D)
   =================================== */
function initProjectCharts() {

  // Chart 1 — Bias project: animated bar chart (model comparison)
  const c1 = document.getElementById('bias-chart');
  if (c1) {
    const ctx = c1.getContext('2d');
    const W = c1.offsetWidth || 400, H = c1.offsetHeight || 220;
    c1.width = W; c1.height = H;
    const models = ['Log. Reg', 'Rand. Forest', 'Dec. Tree', 'GBT'];
    const auc =    [0.81,       0.94,          0.88,        0.92];
    const colors = ['#6366f1','#06b6d4','#14b8a6','#22c55e'];
    let progress = 0;

    function drawBias() {
      ctx.clearRect(0, 0, W, H);
      const pad = { l: 40, r: 16, t: 20, b: 36 };
      const chartW = W - pad.l - pad.r;
      const chartH = H - pad.t - pad.b;
      const barW = chartW / models.length * 0.55;
      const gap   = chartW / models.length;

      // Grid lines
      [0.25,0.5,0.75,1].forEach(v => {
        const y = pad.t + chartH * (1 - v);
        ctx.beginPath();
        ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + chartW, y);
        ctx.strokeStyle = 'rgba(99,102,241,0.1)';
        ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '9px Space Mono,monospace';
        ctx.fillStyle = 'rgba(120,138,170,0.7)';
        ctx.fillText(v.toFixed(2), 2, y + 3);
      });

      models.forEach((m, i) => {
        const val = auc[i] * Math.min(progress, 1);
        const x = pad.l + gap * i + gap / 2 - barW / 2;
        const bH = chartH * val;
        const y = pad.t + chartH - bH;

        // Bar
        ctx.beginPath();
        ctx.roundRect(x, y, barW, bH, [4,4,0,0]);
        const grad = ctx.createLinearGradient(0, y, 0, y + bH);
        grad.addColorStop(0, colors[i]);
        grad.addColorStop(1, colors[i] + '55');
        ctx.fillStyle = grad;
        ctx.fill();

        // Label
        ctx.font = '9px Space Mono,monospace';
        ctx.fillStyle = 'rgba(200,218,255,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(m, x + barW / 2, pad.t + chartH + 16);

        // Value
        if (progress > 0.8) {
          ctx.font = 'bold 10px Space Mono,monospace';
          ctx.fillStyle = colors[i];
          ctx.fillText(auc[i].toFixed(2), x + barW / 2, y - 5);
        }
        ctx.textAlign = 'left';
      });

      if (progress < 1.05) {
        progress += 0.025;
        requestAnimationFrame(drawBias);
      }
    }
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) { drawBias(); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(c1);
  }

  // Chart 2 — EI: animated scatter plot
  const c2 = document.getElementById('ei-chart');
  if (c2) {
    const ctx = c2.getContext('2d');
    const W = c2.offsetWidth || 300, H = c2.offsetHeight || 180;
    c2.width = W; c2.height = H;
    const points = Array.from({ length: 50 }, () => ({
      x: Math.random() * 0.9 + 0.05,
      y: Math.random() * 0.7 + 0.05 + (Math.random() * 0.3),
      c: `hsl(${190 + Math.random()*40}, 80%, 60%)`
    }));
    let prog = 0;
    function drawEI() {
      ctx.clearRect(0, 0, W, H);
      const p = { l:20,r:10,t:14,b:20 };
      const cW = W-p.l-p.r, cH = H-p.t-p.b;
      const visible = Math.floor(points.length * Math.min(prog,1));
      points.slice(0,visible).forEach(pt => {
        ctx.beginPath();
        ctx.arc(p.l + pt.x*cW, p.t + (1-pt.y)*cH, 3.5, 0, Math.PI*2);
        ctx.fillStyle = pt.c + 'cc'; ctx.fill();
      });
      // Trend line
      if (prog > 0.9) {
        ctx.beginPath();
        ctx.moveTo(p.l, p.t + cH * 0.75);
        ctx.lineTo(p.l + cW, p.t + cH * 0.2);
        ctx.strokeStyle = 'rgba(6,182,212,0.5)';
        ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      }
      if (prog < 1.05) { prog += 0.04; requestAnimationFrame(drawEI); }
    }
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) { drawEI(); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(c2);
  }

  // Chart 3 — Investment: animated line chart
  const c3 = document.getElementById('invest-chart');
  if (c3) {
    const ctx = c3.getContext('2d');
    const W = c3.offsetWidth || 300, H = c3.offsetHeight || 180;
    c3.width = W; c3.height = H;
    const dataA = [42,45,41,48,52,49,55,58,54,61,66,62,70];
    const dataB = [42,43,46,44,50,53,51,56,60,57,64,68,65];
    let prog = 0;
    function drawLine() {
      ctx.clearRect(0, 0, W, H);
      const p={l:20,r:10,t:14,b:20};
      const cW=W-p.l-p.r,cH=H-p.t-p.b;
      const min=38,max=74,range=max-min;
      const visible = Math.ceil(dataA.length * Math.min(prog,1));
      function drawPath(data, color) {
        if (visible < 2) return;
        ctx.beginPath();
        data.slice(0,visible).forEach((v,i) => {
          const x = p.l + (i/(dataA.length-1))*cW;
          const y = p.t + cH - ((v-min)/range)*cH;
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        });
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        // Dot at end
        const last = data[visible-1];
        const ex = p.l + ((visible-1)/(dataA.length-1))*cW;
        const ey = p.t + cH - ((last-min)/range)*cH;
        ctx.beginPath(); ctx.arc(ex,ey,4,0,Math.PI*2);
        ctx.fillStyle = color; ctx.fill();
      }
      drawPath(dataA, '#22c55e');
      drawPath(dataB, '#6366f1');
      if (prog < 1.05) { prog += 0.03; requestAnimationFrame(drawLine); }
    }
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) { drawLine(); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(c3);
  }

  // Chart 4 — CHIPS: area chart
  const c4 = document.getElementById('chips-chart');
  if (c4) {
    const ctx = c4.getContext('2d');
    const W = c4.offsetWidth || 300, H = c4.offsetHeight || 180;
    c4.width = W; c4.height = H;
    const data = [30,35,32,40,38,45,52,48,58,62,55,70,75,68,80];
    let prog = 0;
    function drawArea() {
      ctx.clearRect(0, 0, W, H);
      const p={l:16,r:10,t:14,b:20};
      const cW=W-p.l-p.r,cH=H-p.t-p.b;
      const min=25,max=85,range=max-min;
      const visible = Math.ceil(data.length * Math.min(prog,1));
      if (visible >= 2) {
        ctx.beginPath();
        data.slice(0,visible).forEach((v,i) => {
          const x = p.l + (i/(data.length-1))*cW;
          const y = p.t + cH - ((v-min)/range)*cH;
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        });
        const lastX = p.l + ((visible-1)/(data.length-1))*cW;
        ctx.lineTo(lastX, p.t+cH);
        ctx.lineTo(p.l, p.t+cH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0,p.t,0,p.t+cH);
        grad.addColorStop(0,'rgba(245,158,11,0.5)');
        grad.addColorStop(1,'rgba(245,158,11,0.02)');
        ctx.fillStyle = grad; ctx.fill();
        // Line on top
        ctx.beginPath();
        data.slice(0,visible).forEach((v,i) => {
          const x = p.l + (i/(data.length-1))*cW;
          const y = p.t + cH - ((v-min)/range)*cH;
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        });
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();
      }
      if (prog < 1.05) { prog += 0.025; requestAnimationFrame(drawArea); }
    }
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) { drawArea(); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(c4);
  }
}

/* ===================================
   ABOUT — RADAR / SPIDER CHART
   =================================== */
function initRadarChart() {
  const canvas = document.getElementById('radar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SIZE = Math.min(canvas.offsetWidth, canvas.offsetHeight) || 340;
  canvas.width = SIZE; canvas.height = SIZE;

  const cx = SIZE / 2, cy = SIZE / 2;
  const R = SIZE * 0.38;

  const skills = [
    { label: 'Tableau/Power BI', val: 0.9 },
    { label: 'Python/PySpark',   val: 0.85 },
    { label: 'SQL/DB',           val: 0.88 },
    { label: 'Machine Learning', val: 0.82 },
    { label: 'R/Statistics',     val: 0.80 },
    { label: 'ETL/Data Eng.',    val: 0.85 },
  ];

  const N = skills.length;
  const angleStep = (Math.PI * 2) / N;

  function point(i, frac) {
    const angle = -Math.PI / 2 + angleStep * i;
    return { x: cx + Math.cos(angle) * R * frac, y: cy + Math.sin(angle) * R * frac };
  }

  let prog = 0;
  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Grid rings
    [0.25,0.5,0.75,1].forEach(f => {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const p = point(i, f);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = f === 1 ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)';
      ctx.lineWidth = 1; ctx.stroke();
    });

    // Axis lines
    for (let i = 0; i < N; i++) {
      const p = point(i, 1);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = 'rgba(99,102,241,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // Data polygon
    const p = Math.min(prog, 1);
    ctx.beginPath();
    skills.forEach((s, i) => {
      const pt = point(i, s.val * p);
      i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    const fillGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    fillGrad.addColorStop(0, 'rgba(99,102,241,0.35)');
    fillGrad.addColorStop(1, 'rgba(6,182,212,0.12)');
    ctx.fillStyle = fillGrad; ctx.fill();
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.stroke();

    // Data points
    skills.forEach((s, i) => {
      const pt = point(i, s.val * p);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4'; ctx.fill();
    });

    // Labels (always full position)
    skills.forEach((s, i) => {
      const pt = point(i, 1.18);
      ctx.font = `${Math.round(SIZE * 0.032)}px Space Mono, monospace`;
      ctx.textAlign = pt.x > cx + 5 ? 'left' : pt.x < cx - 5 ? 'right' : 'center';
      ctx.fillStyle = 'rgba(122,138,170,0.9)';
      ctx.fillText(s.label, pt.x, pt.y + 4);
    });

    if (prog < 1.02) { prog += 0.022; requestAnimationFrame(draw); }
  }

  const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) { draw(); obs.disconnect(); } }, { threshold: 0.3 });
  obs.observe(canvas);
}

/* ===================================
   ORBITAL FLOWER — Canvas
   =================================== */
(function(){
  const canvas = document.getElementById('orbitCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const S = 300; // canvas size
  const cx = S / 2, cy = S / 2;
  const RADIUS = 108;
  const PERIOD = 30000; // 30s per full rotation

  const petals = [
    { label: 'B.E.', sub: 'Electronics', color: '#6366f1', angle: -Math.PI/2 },
    { label: 'MBA',  sub: 'Strategy',    color: '#06b6d4', angle: 0 },
    { label: 'MSBA', sub: 'Clark Univ.', color: '#14b8a6', angle: Math.PI/2 },
    { label: 'PCEP', sub: 'Python',      color: '#a78bfa', angle: Math.PI },
  ];

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  function draw(ts) {
    ctx.clearRect(0, 0, S, S);
    const angle = (ts / PERIOD) * Math.PI * 2;

    // Dashed orbit ring
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.setLineDash([5, 8]);
    ctx.strokeStyle = 'rgba(99,102,241,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw petals
    petals.forEach(p => {
      const a = p.angle + angle;
      const px = cx + Math.cos(a) * RADIUS;
      const py = cy + Math.sin(a) * RADIUS;
      const rgb = hexToRgb(p.color);
      const R = 36;

      // Glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, R * 1.8);
      glow.addColorStop(0, `rgba(${rgb},0.25)`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.beginPath();
      ctx.arc(px, py, R * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Circle
      ctx.beginPath();
      ctx.arc(px, py, R, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(8,12,18,0.88)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb},0.6)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Clash Display", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, px, py - 6);

      // Sub label
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillText(p.sub.toUpperCase(), px, py + 9);
    });

    // Center core glow
    const pulse = 0.8 + 0.2 * Math.sin(ts / 1800);
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 58 * pulse);
    coreGlow.addColorStop(0,   'rgba(99,102,241,0.5)');
    coreGlow.addColorStop(0.5, 'rgba(6,182,212,0.2)');
    coreGlow.addColorStop(1,   'rgba(6,182,212,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 58 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = coreGlow;
    ctx.fill();

    // Center core circle
    const grad = ctx.createRadialGradient(cx-10, cy-10, 0, cx, cy, 50);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#14b8a6');
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Core text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Clash Display", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Unified', cx, cy - 8);
    ctx.fillText('Analyst', cx, cy + 9);

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
