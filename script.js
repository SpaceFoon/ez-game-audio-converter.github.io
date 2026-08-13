// EZ Game Audio Converter - optimized joke-site effects
(() => {
  "use strict";

  const COLORS = ["#00ffff", "#ff0080", "#8a2be2", "#00ff80", "#ffd166", "#ffffff"];
  const FORMAT_WORDS = ["WAV!", "OGG!", "MP3!", "FLAC!", "OPUS!", "FFMPEG!", "BATCH!"];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const maxParticles = reducedMotion ? 24 : 260;
  const maxRings = reducedMotion ? 2 : 10;

  function injectPerformanceStyles() {
    const style = document.createElement("style");
    style.id = "ez-optimized-effects";
    style.textContent = `
      #particles { display: none !important; }
      .twinkle-layer { display: none !important; }
      .ez-cursor-glow {
        position: fixed;
        left: 0;
        top: 0;
        width: 220px;
        height: 220px;
        margin: -110px 0 0 -110px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 3;
        opacity: 0;
        background: radial-gradient(circle, rgba(0,255,255,.12) 0%, rgba(255,0,128,.055) 34%, transparent 68%);
        transform: translate3d(-999px,-999px,0);
        transition: opacity 180ms ease;
        contain: strict;
      }
      #ez-fx-canvas {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 4;
        contain: strict;
      }
      .stars { animation-duration: 34s !important; opacity: .62 !important; }
      .grid-lines { opacity: .52 !important; }
      .aurora { opacity: .72 !important; }
      body.ez-page-hidden .stars,
      body.ez-page-hidden .grid-lines,
      body.ez-page-hidden .aurora,
      body.ez-page-hidden .eq-bg span {
        animation-play-state: paused !important;
      }
      @media (prefers-reduced-motion: reduce) {
        .stars, .grid-lines, .aurora, .eq-bg span {
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function populateEQBars() {
    const eq = document.querySelector(".eq-bg");
    if (!eq) return;
    const width = Math.max(eq.clientWidth || 0, Math.min(window.innerWidth || 0, 2200));
    const targetCount = Math.min(96, Math.max(28, Math.ceil(width / 18)));
    if (eq.children.length === targetCount) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < targetCount; i++) {
      const span = document.createElement("span");
      span.style.setProperty("--dur", `${(1.05 + Math.random() * 0.9).toFixed(2)}s`);
      span.style.setProperty("--delay", `${(-Math.random() * 1.3).toFixed(2)}s`);
      span.style.setProperty("--peak", `${72 + Math.floor(Math.random() * 34)}%`);
      frag.appendChild(span);
    }
    eq.replaceChildren(frag);
  }

  function setupScrollAnimations() {
    const items = document.querySelectorAll(".feature-card, .step, .section");
    if (!items.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("animate-on-scroll"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("animate-on-scroll");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

    items.forEach((el) => observer.observe(el));
  }

  function setupCursorGlow() {
    if (reducedMotion || !window.matchMedia?.("(pointer:fine)")?.matches) return;

    const glow = document.createElement("div");
    glow.className = "ez-cursor-glow";
    document.body.appendChild(glow);

    let visible = false;
    window.addEventListener("pointermove", (event) => {
      glow.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      if (!visible) {
        visible = true;
        glow.style.opacity = "1";
      }
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", () => {
      visible = false;
      glow.style.opacity = "0";
    }, { passive: true });
  }

  function setupCanvasEffects() {
    const canvas = document.createElement("canvas");
    canvas.id = "ez-fx-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;
    let rafId = 0;
    let lastTime = 0;
    let clickCount = 0;
    let hidden = document.hidden;

    const particles = [];
    const rings = [];
    const labels = [];
    const delayed = [];
    const rockets = [];

    function resize() {
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(cssWidth * dpr));
      canvas.height = Math.max(1, Math.round(cssHeight * dpr));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function pick(list) {
      return list[(Math.random() * list.length) | 0];
    }

    function wake() {
      if (hidden || rafId) return;
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function addParticle(p) {
      if (particles.length >= maxParticles) {
        particles.splice(0, Math.max(1, particles.length - maxParticles + 1));
      }
      particles.push(p);
    }

    function sparkBurst(x, y, count = 28, speed = 250, gravity = 160, life = 0.85) {
      const amount = reducedMotion ? Math.min(count, 10) : count;
      for (let i = 0; i < amount; i++) {
        const angle = rand(0, Math.PI * 2);
        const velocity = rand(speed * 0.35, speed);
        addParticle({
          kind: Math.random() < 0.18 ? "square" : "spark",
          x, y,
          px: x, py: y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          gravity: gravity * rand(0.7, 1.25),
          drag: rand(0.965, 0.985),
          life: life * rand(0.7, 1.25),
          maxLife: life,
          size: rand(1.4, 3.5),
          color: pick(COLORS),
          spin: rand(-7, 7),
          rotation: rand(0, Math.PI * 2)
        });
      }
      wake();
    }

    function fireworkBurst(x, y, strength = 1) {
      const count = Math.round((reducedMotion ? 12 : 42) * strength);
      const spokes = Math.random() < 0.35;
      const baseColor = pick(COLORS.slice(0, 5));

      for (let i = 0; i < count; i++) {
        let angle;
        if (spokes) {
          const spoke = i % 10;
          angle = (spoke / 10) * Math.PI * 2 + rand(-0.055, 0.055);
        } else {
          angle = (i / count) * Math.PI * 2 + rand(-0.08, 0.08);
        }

        const velocity = rand(105, 315) * strength;
        addParticle({
          kind: "firework",
          x, y,
          px: x, py: y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          gravity: rand(95, 155),
          drag: rand(0.968, 0.986),
          life: rand(0.8, 1.45),
          maxLife: 1.45,
          size: rand(1.2, 2.8),
          color: Math.random() < 0.74 ? baseColor : pick(COLORS),
          twinkle: Math.random() < 0.25
        });
      }

      rings.push({
        x, y,
        r: 8,
        vr: 310 * strength,
        life: 0.55,
        maxLife: 0.55,
        color: baseColor,
        width: 2.2
      });
      if (rings.length > maxRings) rings.splice(0, rings.length - maxRings);
      wake();
    }

    function launchRocket(targetX, targetY, delay = 0) {
      delayed.push({
        at: performance.now() + delay,
        fn: () => {
          const startX = Math.max(30, Math.min(cssWidth - 30, targetX + rand(-150, 150)));
          const startY = cssHeight + 16;
          const travel = rand(0.42, 0.72);
          rockets.push({
            x: startX,
            y: startY,
            px: startX,
            py: startY,
            tx: targetX + rand(-95, 95),
            ty: Math.max(80, targetY + rand(-110, 60)),
            t: 0,
            travel,
            color: pick(COLORS.slice(0, 5))
          });
          wake();
        }
      });
      wake();
    }

    function addLabel(x, y) {
      if (reducedMotion || Math.random() > 0.32) return;
      labels.push({
        text: pick(FORMAT_WORDS),
        x,
        y,
        vy: rand(-55, -35),
        life: 0.7,
        maxLife: 0.7,
        color: pick(COLORS.slice(0, 5)),
        rotation: rand(-0.18, 0.18)
      });
      if (labels.length > 5) labels.shift();
    }

    function clickExplosion(x, y) {
      clickCount++;
      sparkBurst(x, y, 26, 300, 190, 0.78);
      fireworkBurst(x, y, 0.72);
      addLabel(x, y - 18);

      if (!reducedMotion) {
        launchRocket(x, y, 80);
        if (clickCount % 3 === 0 || Math.random() < 0.28) launchRocket(x, y, 180);

        if (clickCount % 7 === 0) {
          for (let i = 0; i < 3; i++) {
            delayed.push({
              at: performance.now() + 230 + i * 120,
              fn: () => fireworkBurst(
                Math.max(80, Math.min(cssWidth - 80, x + rand(-210, 210))),
                Math.max(90, Math.min(cssHeight - 90, y + rand(-150, 120))),
                0.8
              )
            });
          }
        }
      }

      wake();
    }

    function drawParticle(p, alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.kind === "spark" || p.kind === "firework") {
        ctx.lineWidth = p.kind === "firework" ? 1.6 : 1.25;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.twinkle && Math.random() < 0.16) {
          ctx.globalAlpha = alpha * 0.55;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size, -p.size * 0.55, p.size * 2, p.size * 1.1);
        ctx.restore();
      }
    }

    function updateParticles(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        p.px = p.x;
        p.py = p.y;
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy = p.vy * Math.pow(p.drag, dt * 60) + p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rotation != null) p.rotation += (p.spin || 0) * dt;

        const alpha = Math.max(0, Math.min(1, p.life / Math.min(p.maxLife || p.life, 0.7)));
        drawParticle(p, alpha);
      }
    }

    function updateRings(dt) {
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.life -= dt;
        if (ring.life <= 0) {
          rings.splice(i, 1);
          continue;
        }

        ring.r += ring.vr * dt;
        const alpha = ring.life / ring.maxLife;
        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function updateLabels(dt) {
      for (let i = labels.length - 1; i >= 0; i--) {
        const label = labels[i];
        label.life -= dt;
        if (label.life <= 0) {
          labels.splice(i, 1);
          continue;
        }
        label.y += label.vy * dt;
        const alpha = Math.min(1, label.life / 0.25);

        ctx.save();
        ctx.translate(label.x, label.y);
        ctx.rotate(label.rotation);
        ctx.globalAlpha = alpha;
        ctx.font = "900 18px Orbitron, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(0,0,0,.72)";
        ctx.strokeText(label.text, 0, 0);
        ctx.fillStyle = label.color;
        ctx.fillText(label.text, 0, 0);
        ctx.restore();
      }
    }

    function updateRockets(dt) {
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t += dt / r.travel;
        const t = Math.min(1, r.t);
        const eased = 1 - Math.pow(1 - t, 2.3);

        r.px = r.x;
        r.py = r.y;
        r.x = r.x + (r.tx - r.x) * Math.min(1, dt * 8);
        const baseY = cssHeight + (r.ty - cssHeight) * eased;
        r.y = baseY - Math.sin(Math.PI * t) * 70;

        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.px, r.py);
        ctx.lineTo(r.x, r.y);
        ctx.stroke();

        if (Math.random() < 0.6) {
          addParticle({
            kind: "spark",
            x: r.x, y: r.y,
            px: r.x, py: r.y,
            vx: rand(-28, 28),
            vy: rand(25, 75),
            gravity: 30,
            drag: 0.96,
            life: rand(0.18, 0.35),
            maxLife: 0.35,
            size: rand(0.8, 1.6),
            color: r.color
          });
        }

        if (t >= 1) {
          const bx = r.tx;
          const by = r.ty;
          rockets.splice(i, 1);
          fireworkBurst(bx, by, rand(0.72, 1.02));
        }
      }
    }

    function runDelayed(now) {
      for (let i = delayed.length - 1; i >= 0; i--) {
        if (now < delayed[i].at) continue;
        const item = delayed.splice(i, 1)[0];
        item.fn();
      }
    }

    function frame(now) {
      rafId = 0;
      if (hidden) return;

      const dt = Math.min(0.033, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      runDelayed(now);
      updateRockets(dt);
      updateParticles(dt);
      updateRings(dt);
      updateLabels(dt);

      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (particles.length || rings.length || labels.length || rockets.length || delayed.length) {
        rafId = requestAnimationFrame(frame);
      }
    }

    window.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) return;
      clickExplosion(event.clientX, event.clientY);
    }, { passive: true });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        populateEQBars();
      }, 160);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      hidden = document.hidden;
      document.body.classList.toggle("ez-page-hidden", hidden);
      if (hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (particles.length || rings.length || labels.length || rockets.length || delayed.length) {
        wake();
      }
    });

    resize();

    if (!reducedMotion) {
      window.setInterval(() => {
        if (hidden || Math.random() >= 0.55) return;
        const x = rand(cssWidth * 0.18, cssWidth * 0.82);
        const y = rand(90, Math.max(140, cssHeight * 0.42));
        launchRocket(x, y, 0);
      }, 11000);
    }
  }

  function init() {
    injectPerformanceStyles();
    setYear();
    populateEQBars();
    setupScrollAnimations();
    setupCursorGlow();
    setupCanvasEffects();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
