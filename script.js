// EZ Game Audio Converter - Main JavaScript

// Dynamically fill EQ bars to the edges of the viewport
function populateEQBars() {
  const eq = document.querySelector(".eq-bg");
  if (!eq) return;

  const barWidth = 10; // must match .eq-bg span width
  const gap = 4; // must match .eq-bg gap
  const containerWidth = Math.max(eq.clientWidth || 0, window.innerWidth || 0);
  const targetCount = Math.ceil(containerWidth / (barWidth + gap)) + 8; // add a few extra for overflow

  if (eq.children.length === targetCount) return;

  eq.innerHTML = "";
  for (let i = 0; i < targetCount; i++) {
    const span = document.createElement("span");
    // randomize animation timing/peaks for 80s feel
    span.style.setProperty(
      "--dur",
      `${(0.9 + Math.random() * 0.8).toFixed(2)}s`
    );
    span.style.setProperty("--delay", `${(-Math.random() * 0.8).toFixed(2)}s`);
    span.style.setProperty("--peak", `${80 + Math.floor(Math.random() * 40)}%`);
    eq.appendChild(span);
  }
}

// Generate floating particles
function createParticles() {
  const particlesContainer = document.getElementById("particles");
  if (!particlesContainer) return;

  const particleCount = 50;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 20 + "s";
    particle.style.animationDuration = Math.random() * 10 + 15 + "s";
    particlesContainer.appendChild(particle);
  }
}

// Create a layer of twinkling stars
function createTwinkleStars() {
  let layer = document.querySelector(".twinkle-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "twinkle-layer";
    document.body.appendChild(layer);
  }
  const populate = () => {
    if (layer.childElementCount) return;
    const vw = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    const vh = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );
    const area = vw * vh;
    const target = Math.min(60, Math.max(20, Math.round(area / 65000)));
    for (let i = 0; i < target; i++) {
      const s = document.createElement("span");
      s.className = "twinkle-star";
      const x = Math.random() * vw;
      const y = Math.random() * vh;
      const delay = (Math.random() * 5).toFixed(2);
      const dur = (2 + Math.random() * 3).toFixed(2);
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.animationDelay = delay + "s";
      s.style.animationDuration = dur + "s";
      s.style.setProperty("--glare-len", `${18 + Math.random() * 34}px`);
      s.style.setProperty("--glare-thick", `${0.8 + Math.random() * 1.6}px`);
      // store base positions for parallax wrap
      s.dataset.baseX = String(x);
      s.dataset.baseY = String(y);
      layer.appendChild(s);
    }
  };
  populate();
  window.addEventListener(
    "resize",
    throttle(() => {
      if (!layer) return;
      layer.innerHTML = "";
      populate();
    }, 400)
  );
}

// Spawn a comet occasionally
function spawnComet() {
  const comet = document.createElement("div");
  comet.className = "comet";
  // Randomize side and path
  const fromRight = Math.random() > 0.5;
  const startX = fromRight ? window.innerWidth + 120 : -120;
  const startY = Math.random() * (window.innerHeight * 0.6);
  const endX = fromRight ? -240 : window.innerWidth + 240;
  const endY =
    startY +
    (fromRight ? 240 + Math.random() * 300 : -240 - Math.random() * 300);
  const dur = 2000 + Math.random() * 1800;
  const tail = 200 + Math.random() * 260;

  comet.style.left = startX + "px";
  comet.style.top = startY + "px";
  comet.style.opacity = "0";
  comet.style.setProperty("--tail", `${tail}px`);
  comet.style.transition = `transform ${dur}ms linear, opacity ${Math.min(
    1400,
    dur * 0.7
  )}ms ease-out`;
  // Pre-rotate to align tail with travel direction
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
  comet.style.transform = `rotate(${angle}deg)`;
  document.body.appendChild(comet);

  requestAnimationFrame(() => {
    comet.style.opacity = "1";
    comet.style.transform = `translate(${endX - startX}px, ${
      endY - startY
    }px) rotate(${angle}deg)`;
  });

  const cleanup = () => {
    if (comet.parentNode) comet.parentNode.removeChild(comet);
  };
  comet.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, dur + 200);
}

// Intersection Observer for scroll animations
function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-on-scroll");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  document.querySelectorAll(".feature-card, .step, .section").forEach((el) => {
    observer.observe(el);
  });
}

// Mouse-following glow effect (visible + efficient)
function setupMouseGlow() {
  const glow = document.createElement("div");
  glow.style.position = "fixed";
  glow.style.left = "50%";
  glow.style.top = "50%";
  glow.style.width = "260px";
  glow.style.height = "260px";
  glow.style.background =
    "radial-gradient(circle, rgba(0,255,255,0.08) 0%, transparent 60%)";
  glow.style.borderRadius = "50%";
  glow.style.pointerEvents = "none";
  glow.style.zIndex = "3"; // above cosmic background (z=2), below hero content
  glow.style.transform = "translate(-50%, -50%)";
  glow.style.mixBlendMode = "screen";
  document.body.appendChild(glow);

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;
  let lastEmit = 0;
  let lastMove = 0;
  let particleCount = 0;
  const MAX_PARTICLES = 140;
  const EMIT_INTERVAL = 50; // ms

  function emitParticle(px, py) {
    if (particleCount >= MAX_PARTICLES) return;
    particleCount++;
    const p = document.createElement("span");
    const size = 2 + Math.random() * 4;
    const dx = (Math.random() - 0.5) * 120; // spread
    const dy = (Math.random() - 0.5) * 120;
    const dur = 600 + Math.random() * 500;
    const color =
      Math.random() < 0.5
        ? "#00ffff"
        : Math.random() < 0.5
        ? "#ff0080"
        : "#8000ff";

    p.style.position = "fixed";
    p.style.left = px + "px";
    p.style.top = py + "px";
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.borderRadius = "50%";
    p.style.background = color;
    p.style.boxShadow = `0 0 8px ${color}, 0 0 16px ${color}`;
    p.style.opacity = "0.95";
    p.style.transform = "translate(-50%, -50%) scale(1)";
    p.style.transition = `transform ${dur}ms ease-out, opacity ${dur}ms ease-out`;
    p.style.pointerEvents = "none";
    p.style.zIndex = "3";
    p.style.mixBlendMode = "screen";
    document.body.appendChild(p);

    // ensure transition runs
    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`;
      p.style.opacity = "0";
    });

    const cleanup = () => {
      if (p.parentNode) p.parentNode.removeChild(p);
      particleCount--;
    };
    p.addEventListener("transitionend", cleanup, { once: true });
    // Fallback cleanup
    setTimeout(cleanup, dur + 100);
  }

  function emitBurstParticle(px, py) {
    if (particleCount >= MAX_PARTICLES) return;
    particleCount++;
    const p = document.createElement("span");
    const size = 3 + Math.random() * 6;
    const angle = Math.random() * Math.PI * 2;
    const distance = 140 + Math.random() * 220;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const dur = 700 + Math.random() * 600;
    const color =
      Math.random() < 0.5
        ? "#00ffff"
        : Math.random() < 0.5
        ? "#ff0080"
        : "#8000ff";

    p.style.position = "fixed";
    p.style.left = px + "px";
    p.style.top = py + "px";
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.borderRadius = "50%";
    p.style.background = color;
    p.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
    p.style.opacity = "0.98";
    p.style.transform = "translate(-50%, -50%) scale(1)";
    p.style.transition = `transform ${dur}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${dur}ms ease-out`;
    p.style.pointerEvents = "none";
    p.style.zIndex = "3";
    p.style.mixBlendMode = "screen";
    document.body.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.7)`;
      p.style.opacity = "0";
    });

    const cleanup = () => {
      if (p.parentNode) p.parentNode.removeChild(p);
      particleCount--;
    };
    p.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, dur + 120);
  }

  function shockwave(px, py) {
    const ring = document.createElement("div");
    ring.style.position = "fixed";
    ring.style.left = px + "px";
    ring.style.top = py + "px";
    ring.style.width = "16px";
    ring.style.height = "16px";
    ring.style.borderRadius = "50%";
    ring.style.borderStyle = "solid";
    ring.style.borderColor = "rgba(0,255,255,0.95)";
    ring.style.borderWidth = "3px";
    ring.style.boxShadow =
      "0 0 28px rgba(0,255,255,0.7), inset 0 0 14px rgba(0,255,255,0.5)";
    ring.style.transform = "translate(-50%, -50%) scale(0.2)";
    ring.style.opacity = "0.95";
    ring.style.pointerEvents = "none";
    ring.style.zIndex = "3";
    ring.style.mixBlendMode = "screen";
    ring.style.willChange =
      "transform, opacity, border-color, border-width, box-shadow";
    // Expand relative to viewport to feel large
    const diag = Math.hypot(window.innerWidth, window.innerHeight);
    const finalScale = Math.max(24, Math.min(80, diag / 10)) / 8;
    const dur = 1100;
    ring.style.transition = `transform ${dur}ms cubic-bezier(0.22,1,0.36,1), opacity ${dur}ms ease-out, border-color ${dur}ms ease-out, border-width ${dur}ms ease-out, box-shadow ${dur}ms ease-out`;
    document.body.appendChild(ring);

    requestAnimationFrame(() => {
      ring.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
      ring.style.opacity = "0";
      ring.style.borderColor = "rgba(0,255,255,0)";
      ring.style.borderWidth = "0px";
      ring.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    });

    const cleanup = () => {
      if (ring.parentNode) ring.parentNode.removeChild(ring);
    };
    ring.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, dur + 200);
  }

  const animate = () => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    glow.style.left = x + "px";
    glow.style.top = y + "px";
    const now = performance.now();
    const moving = now - lastMove < 120; // consider moving if recent movement
    if (moving && now - lastEmit > EMIT_INTERVAL) {
      // Emit 1-2 particles around current glow position
      emitParticle(
        x + (Math.random() - 0.5) * 16,
        y + (Math.random() - 0.5) * 16
      );
      if (Math.random() < 0.4)
        emitParticle(
          x + (Math.random() - 0.5) * 16,
          y + (Math.random() - 0.5) * 16
        );
      lastEmit = now;
    }
    requestAnimationFrame(animate);
  };
  animate();

  window.addEventListener(
    "mousemove",
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
      lastMove = performance.now();
    },
    { passive: true }
  );

  // Explode on click/tap
  window.addEventListener(
    "pointerdown",
    (e) => {
      const px = e.clientX;
      const py = e.clientY;
      shockwave(px, py);
      const capacity = Math.max(0, MAX_PARTICLES - particleCount);
      const toSpawn = Math.min(70, capacity);
      for (let i = 0; i < toSpawn; i++) emitBurstParticle(px, py);
      // also nudge the glow target to the click location for responsiveness
      tx = px;
      ty = py;
      lastMove = performance.now();
    },
    { passive: true }
  );
}

// Enhanced button interactions
function setupButtonEffects() {
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", (e) => {
      const ripple = document.createElement("div");
      ripple.style.position = "absolute";
      ripple.style.left = "0";
      ripple.style.top = "0";
      ripple.style.width = "100%";
      ripple.style.height = "100%";
      ripple.style.background =
        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)";
      ripple.style.borderRadius = "inherit";
      ripple.style.pointerEvents = "none";
      ripple.style.opacity = "0";
      ripple.style.transition = "opacity 0.3s ease";

      e.target.style.position = "relative";
      e.target.appendChild(ripple);

      setTimeout(() => {
        ripple.style.opacity = "1";
      }, 10);
    });

    button.addEventListener("mouseleave", (e) => {
      const ripples = e.target.querySelectorAll("div");
      ripples.forEach((ripple) => {
        if (
          ripple.style.background &&
          ripple.style.background.includes("radial-gradient")
        ) {
          ripple.style.opacity = "0";
          setTimeout(() => {
            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
          }, 300);
        }
      });
    });
  });
}

// Subtle 3D tilt for feature cards
function setupCardTilt() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const cards = document.querySelectorAll(".feature-card");
  if (!cards.length) return;
  const maxTilt = 10; // degrees for clearer effect
  const damp = 0.12;

  cards.forEach((card) => {
    let rx = 0,
      ry = 0,
      tx = 0,
      ty = 0;
    let raf = null;
    let running = false;

    const animate = () => {
      rx += (tx - rx) * damp;
      ry += (ty - ry) * damp;
      // Set CSS vars so hover transforms can compose
      card.style.setProperty("--rx", `${rx}deg`);
      card.style.setProperty("--ry", `${ry}deg`);
      // If we're close enough to target and target is neutral, stop the loop
      if (
        Math.abs(tx - rx) < 0.01 &&
        Math.abs(ty - ry) < 0.01 &&
        tx === 0 &&
        ty === 0
      ) {
        running = false;
        raf = null;
        return;
      }
      raf = requestAnimationFrame(animate);
    };

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientY - cy) / (rect.height / 2);
      const dy = (e.clientX - cx) / (rect.width / 2);
      tx = Math.max(-maxTilt, Math.min(maxTilt, -dx * maxTilt));
      ty = Math.max(-maxTilt, Math.min(maxTilt, dy * maxTilt));
      if (!running) {
        running = true;
        raf = requestAnimationFrame(animate);
      }
    };
    card.addEventListener("pointermove", onMove, { passive: true });
    // Fallbacks for browsers not firing pointer events consistently
    card.addEventListener("mousemove", onMove, { passive: true });

    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(animate);
      }
    };
    card.addEventListener("pointerleave", onLeave);
    card.addEventListener("mouseleave", onLeave);
  });
}

// Parallax scrolling effect (RAF + distinct speeds per layer)
function setupParallax() {
  const twinkleLayer = document.querySelector(".twinkle-layer");
  const aurora = document.querySelector(".aurora");
  let lastY = window.pageYOffset;
  let ticking = false;

  const apply = () => {
    const s = lastY;
    // Twinkle stars: offset individually and wrap in viewport so they don't scroll out
    if (twinkleLayer) {
      const twinkles = twinkleLayer.children;
      const vh = Math.max(
        document.documentElement.clientHeight,
        window.innerHeight || 0
      );
      const vx = Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      );
      const ty = s * 0.22;
      const tx = -s * 0.04;
      for (let i = 0; i < twinkles.length; i++) {
        const el = twinkles[i];
        const baseX = parseFloat(el.dataset.baseX || "0");
        const baseY = parseFloat(el.dataset.baseY || "0");
        // Wrap Y within [0, vh)
        let y = baseY + ty;
        y = ((y % vh) + vh) % vh;
        // Wrap X within [0, vx)
        let x = baseX + tx;
        x = ((x % vx) + vx) % vx;
        el.style.left = x + "px";
        el.style.top = y + "px";
      }
    }
    // Aurora gentle drift
    if (aurora) {
      aurora.style.transform = `translateY(${(s * 0.1).toFixed(2)}px)`;
    }
    ticking = false;
  };

  const onScroll = () => {
    lastY = window.pageYOffset;
    if (!ticking) {
      requestAnimationFrame(apply);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  // apply once for initial position
  requestAnimationFrame(apply);
}

// Performance optimization: throttle scroll events
function throttle(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Initialize EQ bars
  populateEQBars();

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Only add motion effects if user hasn't requested reduced motion
  if (!prefersReducedMotion) {
    createParticles();
    createTwinkleStars();
    setupMouseGlow();
    setupParallax();
    // spawn comets sooner and more frequently with some randomness
    setTimeout(spawnComet, 400 + Math.random() * 800);
    setInterval(() => {
      spawnComet();
      if (Math.random() < 0.35)
        setTimeout(spawnComet, 600 + Math.random() * 600);
    }, 3500);
  }

  // Always setup these interactions
  setupScrollAnimations();
  setupButtonEffects();
  setupCardTilt();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return; // ignore placeholder links

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Recompute EQ bars on resize
  window.addEventListener("resize", throttle(populateEQBars, 150));
});

// Additional throttled scroll events
window.addEventListener(
  "scroll",
  throttle(() => {
    // Additional scroll-based effects can be added here
  }, 16)
);
