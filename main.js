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

  // ── Chart 1: Silent Disparities — Gender fairness radial rings
  const c1 = document.getElementById('bias-chart');
  if (c1) {
    const ctx = c1.getContext('2d');
    const W = c1.offsetWidth || 400, H = c1.offsetHeight || 220;
    c1.width = W; c1.height = H;
    const cx = W/2, cy = H/2+10;
    const models = ['LR','RF','GBT','MLP'];
    const maleAUC  = [0.78, 0.94, 0.92, 0.89];
    const femAUC   = [0.74, 0.90, 0.88, 0.85];
    const colors   = ['#6366f1','#06b6d4','#14b8a6','#a78bfa'];
    let prog = 0;
    function drawBias(ts) {
      ctx.clearRect(0,0,W,H);
      const p = Math.min(prog,1);
      const maxR = Math.min(W,H)*0.38;
      models.forEach((m,i) => {
        const angle = (i/models.length)*Math.PI*2 - Math.PI/2;
        const mR = maleAUC[i]*maxR*p;
        const fR = femAUC[i]*maxR*p;
        // Male arc (outer)
        ctx.beginPath();
        ctx.arc(cx,cy,mR,angle-0.22,angle+0.22);
        ctx.strokeStyle = colors[i]; ctx.lineWidth=8; ctx.lineCap='round';
        ctx.globalAlpha=0.85; ctx.stroke(); ctx.globalAlpha=1;
        // Female arc (inner — offset)
        ctx.beginPath();
        ctx.arc(cx,cy,fR*0.78,angle-0.22,angle+0.22);
        ctx.strokeStyle = colors[i]+'88'; ctx.lineWidth=5; ctx.lineCap='round';
        ctx.stroke();
        // Label
        if(p>0.7){
          const lx = cx + Math.cos(angle)*(mR+16);
          const ly = cy + Math.sin(angle)*(mR+16);
          ctx.font='bold 9px Space Mono,monospace';
          ctx.fillStyle=colors[i]; ctx.textAlign='center';
          ctx.fillText(m,lx,ly+3);
        }
      });
      // Center label
      ctx.textAlign='center';
      ctx.font='9px Space Mono,monospace';
      ctx.fillStyle='rgba(180,200,240,0.5)';
      ctx.fillText('AUC',cx,cy+4);
      // Legend
      ctx.font='8px Space Mono,monospace';
      ctx.fillStyle='rgba(150,170,210,0.7)'; ctx.textAlign='left';
      ctx.fillText('▬ Male  ▬ Female',14,H-8);
      ctx.textAlign='left';
      if(prog<1.05){prog+=0.022;requestAnimationFrame(drawBias);}
    }
    const obs=new IntersectionObserver(e=>{if(e[0].isIntersecting){drawBias();obs.disconnect();}},{threshold:0.2});
    obs.observe(c1);
  }

  // ── Chart 2: EI — Animated brain wave / heartbeat style
  const c2 = document.getElementById('ei-chart');
  if (c2) {
    const ctx = c2.getContext('2d');
    const W = c2.offsetWidth || 300, H = c2.offsetHeight || 180;
    c2.width = W; c2.height = H;
    // 7 regression model R² values
    const models = ['M1','M2','M3','M4','M5','M6','M7'];
    const r2 = [0.12,0.19,0.28,0.35,0.41,0.38,0.44];
    const colors7 = ['#6366f1','#818cf8','#06b6d4','#22d3ee','#14b8a6','#34d399','#a78bfa'];
    let prog = 0;
    function drawEI() {
      ctx.clearRect(0,0,W,H);
      const p={l:24,r:10,t:16,b:28};
      const cW=W-p.l-p.r, cH=H-p.t-p.b;
      const barW = cW/models.length*0.6;
      const gap = cW/models.length;
      // Subtle grid
      [0.25,0.5,0.75].forEach(v=>{
        const y=p.t+cH*(1-v);
        ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(p.l+cW,y);
        ctx.strokeStyle='rgba(99,102,241,0.08)';ctx.lineWidth=1;ctx.stroke();
      });
      models.forEach((m,i)=>{
        const val=r2[i]*Math.min(prog,1);
        const x=p.l+gap*i+gap/2-barW/2;
        const bH=cH*val; const y=p.t+cH-bH;
        // Glowing bar
        const grad=ctx.createLinearGradient(0,y,0,y+bH);
        grad.addColorStop(0,colors7[i]);
        grad.addColorStop(1,colors7[i]+'22');
        ctx.beginPath();ctx.roundRect(x,y,barW,bH,[3,3,0,0]);
        ctx.fillStyle=grad;ctx.fill();
        // Glow
        ctx.shadowColor=colors7[i];ctx.shadowBlur=8;
        ctx.beginPath();ctx.roundRect(x,y,barW,Math.min(bH,4),[2]);
        ctx.fillStyle=colors7[i];ctx.fill();
        ctx.shadowBlur=0;
        // Label
        ctx.font='8px Space Mono,monospace';ctx.fillStyle='rgba(180,200,240,0.6)';
        ctx.textAlign='center';ctx.fillText(m,x+barW/2,p.t+cH+14);
        if(prog>0.85){
          ctx.font='bold 8px Space Mono,monospace';ctx.fillStyle=colors7[i];
          ctx.fillText(r2[i].toFixed(2),x+barW/2,y-4);
        }
        ctx.textAlign='left';
      });
      // Y-axis label
      ctx.save();ctx.translate(10,p.t+cH/2);ctx.rotate(-Math.PI/2);
      ctx.font='7px Space Mono,monospace';ctx.fillStyle='rgba(130,150,190,0.5)';
      ctx.textAlign='center';ctx.fillText('R²',0,0);ctx.restore();
      if(prog<1.05){prog+=0.025;requestAnimationFrame(drawEI);}
    }
    const obs=new IntersectionObserver(e=>{if(e[0].isIntersecting){drawEI();obs.disconnect();}},{threshold:0.2});
    obs.observe(c2);
  }

  // ── Chart 3: Investment — Candlestick style NVDA vs model
  const c3 = document.getElementById('invest-chart');
  if (c3) {
    const ctx = c3.getContext('2d');
    const W = c3.offsetWidth || 300, H = c3.offsetHeight || 180;
    c3.width = W; c3.height = H;
    // NVDA-style price movement data
    const candles = [
      {o:42,h:48,l:40,c:46},{o:46,h:50,l:44,c:48},{o:48,h:52,l:45,c:44},
      {o:44,h:47,l:41,c:52},{o:52,h:58,l:50,c:56},{o:56,h:60,l:53,c:54},
      {o:54,h:62,l:52,c:61},{o:61,h:66,l:59,c:64},{o:64,h:70,l:62,c:68},
      {o:68,h:74,l:65,c:70},{o:70,h:78,l:68,c:75},{o:75,h:82,l:72,c:80},
    ];
    let prog=0;
    function drawInvest(){
      ctx.clearRect(0,0,W,H);
      const p={l:10,r:10,t:14,b:18};
      const cW=W-p.l-p.r,cH=H-p.t-p.b;
      const min=38,max=84,range=max-min;
      const visible=Math.ceil(candles.length*Math.min(prog,1));
      const cw=cW/candles.length;
      candles.slice(0,visible).forEach((c,i)=>{
        const x=p.l+cw*i+cw/2;
        const toY=v=>p.t+cH-((v-min)/range)*cH;
        const bull=c.c>=c.o;
        const col=bull?'#22c55e':'#ef4444';
        // Wick
        ctx.beginPath();ctx.moveTo(x,toY(c.h));ctx.lineTo(x,toY(c.l));
        ctx.strokeStyle=col+'88';ctx.lineWidth=1;ctx.stroke();
        // Body
        const bodyY=toY(Math.max(c.o,c.c));
        const bodyH=Math.max(2,Math.abs(toY(c.o)-toY(c.c)));
        ctx.beginPath();ctx.roundRect(x-cw*0.28,bodyY,cw*0.56,bodyH,[1]);
        const grad=ctx.createLinearGradient(0,bodyY,0,bodyY+bodyH);
        grad.addColorStop(0,col);grad.addColorStop(1,col+'55');
        ctx.fillStyle=grad;ctx.fill();
      });
      // ML prediction line
      if(prog>0.5){
        const mlData=[44,47,51,54,58,57,62,65,68,71,74,78];
        const vis=Math.ceil(mlData.length*Math.min((prog-0.5)*2,1));
        ctx.beginPath();
        mlData.slice(0,vis).forEach((v,i)=>{
          const x=p.l+cW/candles.length*i+cW/candles.length/2;
          const y=p.t+cH-((v-min)/range)*cH;
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        });
        ctx.strokeStyle='rgba(99,102,241,0.8)';ctx.lineWidth=1.5;
        ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);
      }
      // Labels
      ctx.font='8px Space Mono,monospace';ctx.fillStyle='rgba(150,170,210,0.6)';
      ctx.textAlign='left';
      ctx.fillText('NVDA',p.l,p.t+10);
      if(prog>0.5){ctx.fillStyle='rgba(99,102,241,0.7)';ctx.fillText('ML Pred',p.l+40,p.t+10);}
      if(prog<1.05){prog+=0.025;requestAnimationFrame(drawInvest);}
    }
    const obs=new IntersectionObserver(e=>{if(e[0].isIntersecting){drawInvest();obs.disconnect();}},{threshold:0.2});
    obs.observe(c3);
  }

  // ── Chart 4: CHIPS Act — Semiconductor chip grid pulse
  const c4 = document.getElementById('chips-chart');
  if (c4) {
    const ctx = c4.getContext('2d');
    const W = c4.offsetWidth || 300, H = c4.offsetHeight || 180;
    c4.width = W; c4.height = H;
    const COLS=10, ROWS=6;
    const padX=16,padY=14;
    const cellW=(W-padX*2)/COLS, cellH=(H-padY*2)/ROWS;
    // Before/after CHIPS Act — 0=inactive, 1=pre, 2=post
    const grid=Array.from({length:ROWS},(_,r)=>Array.from({length:COLS},(_,c)=>{
      const idx=r*COLS+c;
      return {val: idx<28?1:2, active:false, delay: idx*40};
    }));
    let startTs=null;
    function drawChips(ts){
      if(!startTs)startTs=ts;
      const elapsed=ts-startTs;
      ctx.clearRect(0,0,W,H);
      grid.forEach((row,r)=>row.forEach((cell,c)=>{
        const active=elapsed>cell.delay;
        const x=padX+c*cellW+cellW*0.1;
        const y=padY+r*cellH+cellH*0.1;
        const w=cellW*0.8,h=cellH*0.8;
        const isPost=cell.val===2;
        const col=isPost?'#06b6d4':'#6366f1';
        if(active){
          // Glow
          ctx.shadowColor=col;ctx.shadowBlur=active?6:0;
          ctx.beginPath();ctx.roundRect(x,y,w,h,[2]);
          const g=ctx.createLinearGradient(x,y,x+w,y+h);
          g.addColorStop(0,col+(isPost?'cc':'88'));
          g.addColorStop(1,col+'33');
          ctx.fillStyle=g;ctx.fill();
          ctx.shadowBlur=0;
          // Circuit dot
          ctx.beginPath();ctx.arc(x+w/2,y+h/2,2,0,Math.PI*2);
          ctx.fillStyle=col;ctx.fill();
        } else {
          ctx.beginPath();ctx.roundRect(x,y,w,h,[2]);
          ctx.fillStyle='rgba(30,40,60,0.4)';ctx.fill();
        }
      }));
      // Legend
      ctx.font='8px Space Mono,monospace';ctx.shadowBlur=0;
      ctx.fillStyle='#6366f1bb';ctx.textAlign='left';
      ctx.fillText('Pre-CHIPS',padX,H-4);
      ctx.fillStyle='#06b6d4bb';
      ctx.fillText('Post-CHIPS',padX+68,H-4);
      requestAnimationFrame(drawChips);
    }
    const obs=new IntersectionObserver(e=>{if(e[0].isIntersecting){requestAnimationFrame(drawChips);obs.disconnect();}},{threshold:0.2});
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
