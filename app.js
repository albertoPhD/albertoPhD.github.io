(() => {
  document.body.classList.add('js-ready');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const art = document.querySelector('.hero-light-sculpture');

  // Lightweight scroll response: progress, navigation surface, current anchor.
  let pendingFrame = false;
  const updateScroll = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const percent = Math.max(0, Math.min(100, window.scrollY / maxScroll * 100));
    if (progress) progress.style.width = percent.toFixed(2) + '%';
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
    if (art && !reduceMotion) {
      art.style.setProperty('--scroll-shift', (Math.min(window.scrollY, window.innerHeight) * 0.055).toFixed(1) + 'px');
    }
    pendingFrame = false;
  };
  window.addEventListener('scroll', () => {
    if (!pendingFrame) {
      pendingFrame = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  // Accessible mobile navigation.
  const menuButton = document.querySelector('.menu-button');
  const navigation = document.getElementById('nav');
  const closeNavigation = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    navigation.classList.remove('open');
  };
  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      navigation.classList.toggle('open', open);
    });
    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeNavigation();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeNavigation();
    });
  }

  // Content arrives with the reader instead of every section appearing at once.
  const revealElements = [...document.querySelectorAll('.reveal')];
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    revealElements.forEach(element => revealObserver.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add('is-visible'));
  }

  // Small optical movement on pointer devices. The graphic is purely decorative.
  const hero = document.querySelector('.hero');
  if (!reduceMotion && art && hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pointerFrame = false;
    let targetX = 0;
    let targetY = 0;
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
      if (pointerFrame) return;
      pointerFrame = true;
      requestAnimationFrame(() => {
        art.style.setProperty('--pointer-x', targetX.toFixed(1) + 'px');
        art.style.setProperty('--pointer-y', targetY.toFixed(1) + 'px');
        pointerFrame = false;
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      art.style.setProperty('--pointer-x', '0px');
      art.style.setProperty('--pointer-y', '0px');
    });
  }

  // The publication list is explicitly filterable and retains its direct paper links.
  const publications = [...document.querySelectorAll('.pub-row')];
  const filters = [...document.querySelectorAll('.filter')];
  const publicationCount = document.getElementById('publication-count');
  filters.forEach(button => button.addEventListener('click', () => {
    const chosen = button.dataset.filter;
    let count = 0;
    publications.forEach(item => {
      const visible = chosen === 'all' || item.dataset.kind === chosen;
      item.hidden = !visible;
      if (visible) count += 1;
    });
    filters.forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (publicationCount) publicationCount.textContent = `Showing ${count} selected ${count === 1 ? 'work' : 'works'}`;
  }));

  // Mouse-following optical light provides subtle, tangible response on project panels.
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-spotlight]').forEach(panel => {
      let scheduled = false;
      let point = { x: 0, y: 0 };
      panel.addEventListener('pointermove', event => {
        const rect = panel.getBoundingClientRect();
        point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          panel.style.setProperty('--mouse-x', point.x + 'px');
          panel.style.setProperty('--mouse-y', point.y + 'px');
          scheduled = false;
        });
      }, { passive: true });
    });
  }

  // Conference archive disclosure. Full content remains available without JavaScript.
  const speakingToggle = document.querySelector('.speaking-toggle');
  const speakingExtra = document.getElementById('speaking-extra');
  if (speakingToggle && speakingExtra) {
    speakingExtra.hidden = true;
    speakingToggle.addEventListener('click', () => {
      const opening = speakingToggle.getAttribute('aria-expanded') !== 'true';
      speakingToggle.setAttribute('aria-expanded', String(opening));
      speakingExtra.hidden = !opening;
      speakingToggle.innerHTML = opening
        ? 'Show fewer presentations <span aria-hidden="true">＋</span>'
        : 'View all presentations <span aria-hidden="true">＋</span>';
      if (opening && !reduceMotion) {
        speakingExtra.animate([
          { opacity: 0, transform: 'translateY(-10px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  }

  // Active section in main navigation.
  if ('IntersectionObserver' in window) {
    const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
    const sectionLinks = navLinks.map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
      .filter(item => item.section);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const id = visible[0].target.id;
      sectionLinks.forEach(({ link }) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }, { rootMargin: '-18% 0px -53% 0px', threshold: [0, .1, .3] });
    sectionLinks.forEach(({ section }) => observer.observe(section));
  }

  // A high-DPI, orthographically projected Bloch-sphere study: real 3D
  // wireframe geometry, illuminated state vector and slowly evolving orbit.
  // This is a conceptual visual, not an experimental state reconstruction.
  const blochCanvas = document.getElementById('bloch-canvas');
  if (blochCanvas) {
    const ctx = blochCanvas.getContext('2d', { alpha: true });
    if (ctx) {
      let side = 700;
      let visible = true;
      let running = false;
      let lastDrawn = 0;
      let motionX = 0;
      let motionY = 0;
      const TAU = Math.PI * 2;

      const fitCanvas = () => {
        const bounds = blochCanvas.getBoundingClientRect();
        side = Math.max(160, bounds.width || 700);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        blochCanvas.width = Math.round(side * ratio);
        blochCanvas.height = Math.round(side * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        if (reduceMotion) drawSphere(0);
      };

      const project = (point, yaw, pitch, center, radius) => {
        const [x, y, z] = point;
        const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
        const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
        const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
        const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
        return { x: center + x1 * radius, y: center - y1 * radius, depth: z2 };
      };

      const drawStroke = (points, hemisphere, yaw, pitch, center, radius, stroke, opacity, width) => {
        ctx.beginPath();
        let previousVisible = false;
        for (const point of points) {
          const next = project(point, yaw, pitch, center, radius);
          const currentVisible = hemisphere === 'both' || (hemisphere === 'front' ? next.depth >= -0.005 : next.depth < 0.005);
          if (currentVisible) {
            if (!previousVisible) ctx.moveTo(next.x, next.y);
            else ctx.lineTo(next.x, next.y);
          }
          previousVisible = currentVisible;
        }
        ctx.strokeStyle = stroke;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      const meridians = Array.from({ length: 12 }, (_, i) => {
        const lon = (i / 12) * TAU;
        return Array.from({ length: 71 }, (_, j) => {
          const lat = -Math.PI / 2 + (j / 70) * Math.PI;
          return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
        });
      });
      const parallels = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75].map(degrees => {
        const lat = degrees * Math.PI / 180;
        return Array.from({ length: 113 }, (_, j) => {
          const lon = j / 112 * TAU;
          return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
        });
      });

      function drawSphere(time) {
        const center = side / 2;
        const radius = side * .299;
        const yaw = .35 + time * .000075 + motionX * .11;
        const pitch = -.34 + Math.sin(time * .00027) * .07 + motionY * .08;
        ctx.clearRect(0, 0, side, side);

        // Atmospheric halo and faint glass body give the line geometry depth.
        const aura = ctx.createRadialGradient(center, center, radius * .13, center, center, radius * 1.65);
        aura.addColorStop(0, 'rgba(50,145,181,.16)');
        aura.addColorStop(.5, 'rgba(24,99,140,.13)');
        aura.addColorStop(1, 'rgba(2,9,20,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, side, side);
        const glass = ctx.createRadialGradient(center - radius * .31, center - radius * .4, radius * .12, center, center, radius * 1.05);
        glass.addColorStop(0, 'rgba(64,144,173,.14)');
        glass.addColorStop(.6, 'rgba(26,72,110,.19)');
        glass.addColorStop(1, 'rgba(4,15,25,.28)');
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, TAU);
        ctx.fillStyle = glass;
        ctx.fill();

        for (const hemisphere of ['back', 'front']) {
          const front = hemisphere === 'front';
          meridians.forEach((curve, i) => drawStroke(curve, hemisphere, yaw, pitch, center, radius, '#8bd2e9', front ? .33 + (i % 3) * .035 : .09, front ? .8 : .63));
          parallels.forEach((curve, i) => drawStroke(curve, hemisphere, yaw, pitch, center, radius, '#92c9eb', front ? (i === 5 ? .59 : .28) : .085, i === 5 ? 1.2 : .75));
        }

        // Orbiting control trajectory, with a travelling luminous point.
        const ring = Array.from({ length: 161 }, (_, j) => {
          const a = j / 160 * TAU;
          return [Math.cos(a) * 1.13, Math.sin(a) * .58, Math.sin(a) * 1.0];
        });
        drawStroke(ring, 'both', yaw + .18, pitch + .14, center, radius, '#56a7cc', .36, 1.15);
        const beadPhase = time * .00035 + 1.4;
        const bead = project([Math.cos(beadPhase) * 1.13, Math.sin(beadPhase) * .58, Math.sin(beadPhase)], yaw + .18, pitch + .14, center, radius);
        ctx.beginPath();
        ctx.arc(bead.x, bead.y, radius * .018, 0, TAU);
        ctx.fillStyle = 'rgba(122,245,218,.9)';
        ctx.shadowColor = '#66ffe1';
        ctx.shadowBlur = radius * .11;
        ctx.fill();
        ctx.shadowBlur = 0;

        // State vector and arrow. The vector itself moves slowly, independently
        // of the sphere's coordinate grid.
        const stateLat = .65 + Math.sin(time * .00019) * .08;
        const stateLon = 1.07 + Math.cos(time * .00022) * .11;
        const vector = [Math.cos(stateLat) * Math.cos(stateLon), Math.sin(stateLat), Math.cos(stateLat) * Math.sin(stateLon)];
        const endpoint = project(vector, yaw, pitch, center, radius);
        const glow = ctx.createLinearGradient(center, center, endpoint.x, endpoint.y);
        glow.addColorStop(0, 'rgba(132,206,247,.26)');
        glow.addColorStop(1, 'rgba(157,255,226,1)');
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(endpoint.x, endpoint.y);
        ctx.strokeStyle = glow;
        ctx.lineWidth = 2.3;
        ctx.shadowColor = 'rgba(111,234,229,.72)';
        ctx.shadowBlur = 13;
        ctx.stroke();
        ctx.shadowBlur = 0;
        const angle = Math.atan2(endpoint.y - center, endpoint.x - center);
        ctx.beginPath();
        ctx.moveTo(endpoint.x, endpoint.y);
        ctx.lineTo(endpoint.x - 12 * Math.cos(angle - .42), endpoint.y - 12 * Math.sin(angle - .42));
        ctx.moveTo(endpoint.x, endpoint.y);
        ctx.lineTo(endpoint.x - 12 * Math.cos(angle + .42), endpoint.y - 12 * Math.sin(angle + .42));
        ctx.strokeStyle = '#c1ffeb';
        ctx.lineWidth = 1.9;
        ctx.stroke();
        const bloom = ctx.createRadialGradient(endpoint.x, endpoint.y, 0, endpoint.x, endpoint.y, radius * .16);
        bloom.addColorStop(0, 'rgba(169,255,228,.43)');
        bloom.addColorStop(1, 'rgba(97,238,188,0)');
        ctx.beginPath();
        ctx.arc(endpoint.x, endpoint.y, radius * .16, 0, TAU);
        ctx.fillStyle = bloom;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(endpoint.x, endpoint.y, radius * .021, 0, TAU);
        ctx.fillStyle = '#caffeb';
        ctx.fill();
        ctx.strokeStyle = 'rgba(178,251,240,.6)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(center, center, 3, 0, TAU);
        ctx.fillStyle = '#def7ff';
        ctx.fill();

        ctx.font = `${Math.max(12, side * .020)}px 'IBM Plex Mono', monospace`;
        ctx.fillStyle = 'rgba(190,255,238,.94)';
        ctx.fillText('|ψ⟩', endpoint.x + 12, endpoint.y - 13);
        ctx.font = `${Math.max(10, side * .014)}px 'IBM Plex Mono', monospace`;
        ctx.fillStyle = 'rgba(165,207,224,.67)';
        ctx.fillText('X', center + radius + 20, center + 4);
        ctx.fillText('Z', center + 8, center - radius - 14);
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, TAU);
        ctx.strokeStyle = 'rgba(145,211,234,.39)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      const animate = stamp => {
        if (!running) return;
        if (stamp - lastDrawn >= 31) {
          lastDrawn = stamp;
          drawSphere(stamp);
        }
        requestAnimationFrame(animate);
      };
      const start = () => {
        if (running || reduceMotion || document.hidden || !visible) return;
        running = true;
        requestAnimationFrame(animate);
      };
      const stop = () => { running = false; };
      fitCanvas();
      if ('ResizeObserver' in window) new ResizeObserver(fitCanvas).observe(blochCanvas);
      else window.addEventListener('resize', fitCanvas);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) start(); else stop();
        }, { threshold: 0 }).observe(blochCanvas);
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
      });
      if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        hero?.addEventListener('pointermove', event => {
          const rect = hero.getBoundingClientRect();
          motionX = ((event.clientX - rect.left) / rect.width - .5) * 2;
          motionY = ((event.clientY - rect.top) / rect.height - .5) * 2;
        }, { passive: true });
        hero?.addEventListener('pointerleave', () => { motionX = 0; motionY = 0; });
      }
      if (reduceMotion) drawSphere(0);
      else start();
    }
  }

  // A schematic, but geographically projected, interactive conference map.
  // Two activities lack a verified city and remain in the full archive below.
  const atlas = document.getElementById('conference-atlas');
  if (atlas) {
    const locations = [
      { id: 'denver', name: 'Denver', country: 'UNITED STATES', lon: -104.99, lat: 39.74, year: 2026,
        note: 'Two contributions at the APS Global Physics Summit.',
        events: [{ type: 'ORAL TALK', title: 'APS Global Physics Summit', detail: 'March 17, 2026' }, { type: 'POSTER', title: 'APS Global Physics Summit', detail: 'March 19, 2026' }] },
      { id: 'valencia', name: 'Valencia', country: 'SPAIN', lon: -.376, lat: 39.47, year: 2025,
        note: 'Quantum Information in Spain · ICE-10.', events: [{ type: 'POSTER', title: 'ICE-10 · Quantum Information in Spain' }] },
      { id: 'ulm', name: 'Ulm', country: 'GERMANY', lon: 9.99, lat: 48.40, year: 2025,
        note: 'Research exchange at Universität Ulm.', events: [{ type: 'SEMINAR', title: 'Universität Ulm · Research seminar' }] },
      { id: 'murcia', name: 'Murcia', country: 'SPAIN', lon: -1.13, lat: 37.99, year: 2025,
        note: 'Doctoral research meeting UMU–UPCT.', events: [{ type: 'PRESENTATION', title: 'X Jornadas Doctorales UMU–UPCT' }] },
      { id: 'bad-honnef', name: 'Bad Honnef', country: 'GERMANY', lon: 7.23, lat: 50.64, year: 2025,
        note: 'Multiparameter quantum sensing and metrology.', events: [{ type: 'POSTER', title: '827th WE-Heraeus Seminar' }] },
      { id: 'paris', name: 'Paris', country: 'FRANCE', lon: 2.35, lat: 48.86, year: 2024,
        note: 'Three-level control for advanced sensing.', events: [{ type: 'ORAL TALK', title: 'Polaron Day X · Sorbonne Université' }] },
      { id: 'donostia', name: 'Donostia', country: 'SPAIN', lon: -1.98, lat: 43.32, year: 2024,
        note: 'Nanotechnology Meets Quantum Information.', events: [{ type: 'POSTER', title: "NanoQI'24" }] },
      { id: 'darmstadt', name: 'Darmstadt', country: 'GERMANY', lon: 8.65, lat: 49.87, year: 2024,
        note: 'European University of Technology workshop.', events: [{ type: 'ORAL TALK', title: '3rd EUT+ Workshop on Nanomaterials' }] }
    ];
    const views = {
      overview: { west: -124, east: 26, south: 18, north: 72 },
      europe: { west: -19, east: 24, south: 32, north: 60 }
    };
    const map = atlas.querySelector('.atlas-map-viewport');
    const routes = document.getElementById('atlas-routes');
    const pinLayer = document.getElementById('atlas-pin-layer');
    const cityIndex = document.getElementById('atlas-city-index');
    const cityTitle = document.getElementById('atlas-location-title');
    const country = document.getElementById('atlas-location-country');
    const note = document.getElementById('atlas-location-note');
    const eventsList = document.getElementById('atlas-events');
    const idx = atlas.querySelector('.atlas-inspector-index');
    let active = 'denver';
    let view = 'overview';
    const svgNS = 'http://www.w3.org/2000/svg';
    const origin = { lon: -.985, lat: 37.6 };
    const project = (location, bounds) => ({
      x: (location.lon - bounds.west) / (bounds.east - bounds.west) * 1100,
      y: (bounds.north - location.lat) / (bounds.north - bounds.south) * 480
    });
    const pathFor = (a, b) => {
      const dx = Math.abs(b.x - a.x);
      const lift = Math.min(145, 18 + dx * .20);
      return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${((a.x + b.x) / 2).toFixed(1)},${(Math.min(a.y, b.y) - lift).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    };
    const svg = (tag, attrs) => {
      const el = document.createElementNS(svgNS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
      return el;
    };

    const selectCity = (id, changeView = false) => {
      if (id === 'denver' && view === 'europe' && changeView) {
        view = 'overview';
        renderMap();
      }
      active = id;
      const place = locations.find(location => location.id === id);
      if (!place) return;
      cityTitle.textContent = place.name;
      country.textContent = place.country;
      note.textContent = place.note;
      idx.textContent = `${String(locations.indexOf(place) + 1).padStart(2, '0')} / 08`;
      eventsList.replaceChildren();
      place.events.forEach(event => {
        const type = document.createElement('span');
        type.textContent = `${event.type} · ${place.year}${event.detail ? ' · ' + event.detail : ''}`;
        const title = document.createElement('strong');
        title.textContent = event.title;
        eventsList.append(type, title);
      });
      atlas.querySelectorAll('.atlas-pin,.atlas-city-index button').forEach(button => {
        const selected = button.dataset.city === id;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      routes.querySelectorAll('[data-route-city]').forEach(line => line.classList.toggle('is-selected', line.dataset.routeCity === id));
      document.querySelectorAll('[data-atlas-city]').forEach(entry => entry.classList.toggle('atlas-matched', entry.dataset.atlasCity === id));
    };

    function renderMap() {
      map.dataset.atlasCurrentView = view;
      atlas.querySelectorAll('[data-atlas-view]').forEach(button => {
        const selected = button.dataset.atlasView === view;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      pinLayer.replaceChildren();
      routes.replaceChildren();
      const bounds = views[view];
      const start = project(origin, bounds);
      const base = document.createElement('span');
      base.className = 'atlas-base';
      base.style.left = start.x / 11 + '%';
      base.style.top = start.y / 4.8 + '%';
      base.textContent = 'UPCT';
      base.setAttribute('aria-hidden', 'true');
      pinLayer.append(base);
      locations.filter(place => view === 'overview' || place.id !== 'denver').forEach(place => {
        const end = project(place, bounds);
        const path = pathFor(start, end);
        for (const className of ['atlas-route-glow', 'atlas-route', 'atlas-route-tracer']) {
          const curve = svg('path', { d: path, class: className, 'data-route-city': place.id });
          if (reduceMotion && className === 'atlas-route-tracer') curve.setAttribute('stroke-dasharray', 'none');
          routes.append(curve);
        }
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'atlas-pin';
        pin.dataset.city = place.id;
        pin.style.left = end.x / 11 + '%';
        pin.style.top = end.y / 4.8 + '%';
        pin.setAttribute('aria-label', `${place.name}, ${place.country.toLowerCase()}, ${place.events.length} conference ${place.events.length === 1 ? 'contribution' : 'contributions'}`);
        const text = document.createElement('span');
        text.className = 'atlas-pin-label';
        text.textContent = place.name;
        pin.append(text);
        pin.addEventListener('click', () => selectCity(place.id));
        pin.addEventListener('focus', () => selectCity(place.id));
        pinLayer.append(pin);
      });
      selectCity(active);
    }

    locations.forEach(place => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.city = place.id;
      button.textContent = place.name;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => selectCity(place.id, true));
      cityIndex.append(button);
    });
    atlas.querySelectorAll('[data-atlas-view]').forEach(button => button.addEventListener('click', () => {
      view = button.dataset.atlasView;
      if (view === 'europe' && active === 'denver') active = 'ulm';
      renderMap();
    }));
    atlas.querySelector('.atlas-explore-link')?.addEventListener('click', () => {
      const archive = document.getElementById('conference-archive');
      if (archive) archive.open = true;
    });
    renderMap();
  }
})();
