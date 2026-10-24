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


  // An animated coherent-control field: a phase-modulated wavefront over a
  // perspective control plane. This is deliberately conceptual, not measured
  // experimental data or a reconstruction of any specific quantum state.
  const fieldCanvas = document.getElementById('control-canvas');
  if (fieldCanvas) {
    const ctx = fieldCanvas.getContext('2d', { alpha: true });
    if (ctx) {
      const W = 760, H = 660;
      let active = false, visible = true, lastFrame = 0;
      const point = (u, v, z = 0) => ({ x: 76 + 570 * u + 76 * v, y: 472 - 158 * u + 105 * v - z });
      const displacement = (u, v, t) => {
        const envelope = Math.pow(Math.sin(Math.PI * Math.max(0, Math.min(1, u))), 1.2);
        const carrier = Math.sin(14.0 * u - t * .00066 + 1.7 * v);
        const secondary = .26 * Math.sin(27 * u + 2.8 * v + t * .00031);
        return 96 * envelope * Math.cos(v * 1.05) * (carrier + secondary);
      };
      const drawPolyline = (samples, color, lineWidth, opacity, glow = 0) => {
        if (!samples.length) return;
        ctx.save();
        ctx.beginPath();
        samples.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (glow) { ctx.shadowColor = '#8cffdf'; ctx.shadowBlur = glow; }
        ctx.stroke();
        ctx.restore();
      };
      const drawDot = (x, y, size, color, glow) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.restore();
      };

      function drawField(stamp) {
        const t = reduceMotion ? 0 : stamp;
        ctx.clearRect(0, 0, W, H);

        // Soft atmosphere follows the flowing field, never resolving into an orb.
        const ambient = ctx.createRadialGradient(410, 332, 40, 410, 332, 375);
        ambient.addColorStop(0, 'rgba(23,116,132,.19)');
        ambient.addColorStop(.55, 'rgba(10,73,98,.065)');
        ambient.addColorStop(1, 'rgba(4,9,18,0)');
        ctx.fillStyle = ambient;
        ctx.fillRect(0, 0, W, H);

        const floor = [point(0, -1), point(1, -1), point(1, 1), point(0, 1)];
        ctx.beginPath();
        floor.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        const floorShade = ctx.createLinearGradient(110, 420, 670, 255);
        floorShade.addColorStop(0, 'rgba(16,43,63,.01)');
        floorShade.addColorStop(.48, 'rgba(22,69,84,.19)');
        floorShade.addColorStop(1, 'rgba(12,44,61,.025)');
        ctx.fillStyle = floorShade;
        ctx.fill();
        ctx.strokeStyle = 'rgba(121,193,215,.20)';
        ctx.lineWidth = .9;
        ctx.stroke();

        // Instrument-plane calibration marks and depth lines.
        for (let i = 0; i <= 26; i++) {
          const u = i / 26;
          drawPolyline([point(u, -1), point(u, 1)], '#80bad4', i % 5 === 0 ? .9 : .5, i % 5 === 0 ? .19 : .085);
        }
        for (let i = 0; i <= 16; i++) {
          const v = -1 + i / 8;
          drawPolyline([point(0, v), point(1, v)], '#6da6c2', .55, i === 8 ? .22 : .085);
        }

        // Sculptural interference surface: coupled phase-modulated control lines.
        for (let i = 0; i <= 34; i++) {
          const v = -1 + 2 * i / 34;
          const points = [];
          for (let j = 0; j <= 148; j++) {
            const u = j / 148;
            points.push(point(u, v, displacement(u, v, t)));
          }
          const foreground = i > 15 && i < 23;
          const alpha = foreground ? .54 : (.18 + (1 - Math.abs(v)) * .21);
          const gradient = ctx.createLinearGradient(85, 450, 660, 245);
          gradient.addColorStop(0, '#608ab7');
          gradient.addColorStop(.42, '#6ab9df');
          gradient.addColorStop(.78, '#7de8d0');
          gradient.addColorStop(1, '#b9fbe0');
          drawPolyline(points, gradient, foreground ? 1.3 : .8, alpha);
        }

        // Fine transverse filaments establish a legible 3D woven surface.
        for (let i = 2; i <= 42; i++) {
          const u = i / 44;
          const points = [];
          for (let j = 0; j <= 40; j++) {
            const v = -1 + j / 20;
            points.push(point(u, v, displacement(u, v, t)));
          }
          drawPolyline(points, '#81d7d6', i % 5 === 0 ? .85 : .52, i % 5 === 0 ? .33 : .12);
        }

        // One privileged pulse trajectory makes the graphic read instantly.
        const centerTrace = [];
        for (let j = 0; j <= 240; j++) {
          const u = j / 240;
          centerTrace.push(point(u, -.08, displacement(u, -.08, t)));
        }
        const bright = ctx.createLinearGradient(98, 420, 677, 250);
        bright.addColorStop(0, '#73adf5');
        bright.addColorStop(.43, '#b2f1f6');
        bright.addColorStop(.77, '#8cf9cf');
        bright.addColorStop(1, '#d8ffea');
        drawPolyline(centerTrace, bright, 2.1, .86, 12);
        drawPolyline(centerTrace, '#e0fffa', .75, .88);

        const u = .09 + .82 * ((t * .00007) % 1);
        const emitter = point(u, -.08, displacement(u, -.08, t));
        const bloom = ctx.createRadialGradient(emitter.x, emitter.y, 0, emitter.x, emitter.y, 66);
        bloom.addColorStop(0, 'rgba(181,255,223,.28)');
        bloom.addColorStop(.27, 'rgba(111,243,218,.12)');
        bloom.addColorStop(1, 'rgba(90,233,208,0)');
        ctx.fillStyle = bloom;
        ctx.beginPath(); ctx.arc(emitter.x, emitter.y, 66, 0, Math.PI * 2); ctx.fill();
        drawDot(emitter.x, emitter.y, 5.0, '#eafff7', 28);
        drawDot(emitter.x, emitter.y, 1.7, '#ffffff', 8);

        // Three signal probes tie the object to amplitude, phase and time.
        [0.21, 0.52, 0.81].forEach((u, i) => {
          const at = point(u, -.08, displacement(u, -.08, t));
          const baseline = point(u, -.08);
          drawPolyline([at, baseline], '#b9f9e3', .8, .22);
          drawDot(baseline.x, baseline.y, 2, i === 1 ? '#a9ffe5' : '#75bbd1', 7);
        });

        // Edges are material cues, not bogus experimental readouts.
        const nv = point(.025, -.13, 0), sc = point(.978, -.13, 0);
        drawDot(nv.x, nv.y, 4, '#8cc7f5', 14);
        drawDot(sc.x, sc.y, 4, '#91f0d4', 14);
        ctx.save();
        ctx.setLineDash([2, 7]);
        drawPolyline([point(0, -1), point(0, 1)], '#b4dbe9', .9, .36);
        drawPolyline([point(1, -1), point(1, 1)], '#b4ffe0', .9, .44);
        ctx.restore();

        // Diagnostic mini-trace: a pulse envelope, rather than another sphere.
        ctx.save();
        ctx.lineWidth = .9;
        ctx.strokeStyle = 'rgba(115,180,196,.32)';
        ctx.beginPath(); ctx.moveTo(320, 565); ctx.lineTo(665, 565); ctx.stroke();
        const dataPath = [];
        for (let i = 0; i <= 120; i++) {
          const u = i / 120;
          const env = Math.pow(Math.sin(Math.PI * u), 2);
          dataPath.push({ x: 320 + 345 * u, y: 565 - 34 * env * (1 + .13 * Math.cos(t * .0005 + 18 * u)) });
        }
        drawPolyline(dataPath, '#78dacf', 1.4, .54);
        ctx.restore();
      }

      const fit = () => {
        const box = fieldCanvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        fieldCanvas.width = Math.round(Math.max(160, box.width) * dpr);
        fieldCanvas.height = Math.round(Math.max(160, box.height) * dpr);
        ctx.setTransform(fieldCanvas.width / W, 0, 0, fieldCanvas.height / H, 0, 0);
        drawField(0);
      };
      const frame = stamp => {
        if (!active) return;
        if (stamp - lastFrame > 30) { lastFrame = stamp; drawField(stamp); }
        requestAnimationFrame(frame);
      };
      const start = () => {
        if (active || reduceMotion || !visible || document.hidden) return;
        active = true;
        requestAnimationFrame(frame);
      };
      const stop = () => { active = false; };
      fit();
      if ('ResizeObserver' in window) new ResizeObserver(fit).observe(fieldCanvas);
      else window.addEventListener('resize', fit);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) start(); else stop();
        }, { threshold: 0 }).observe(fieldCanvas);
      }
      document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
      start();
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
      { id: 'cambridge', name: 'Cambridge', country: 'MASSACHUSETTS · UNITED STATES', lon: -71.1056, lat: 42.3736, year: 2026,
        category: 'research',
        note: 'My current research base at MIT, through the Fulbright visiting-student programme.',
        events: [{ type: 'RESEARCH STAY', title: 'MIT · Engineering Quantum Systems (EQuS) / Cao Group', detail: '2026–present' }] },
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
    const cityTitle = document.getElementById('atlas-location-title');
    const country = document.getElementById('atlas-location-country');
    const note = document.getElementById('atlas-location-note');
    const eventsList = document.getElementById('atlas-events');
    const idx = atlas.querySelector('.atlas-inspector-index');
    let active = 'cambridge';
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

    const selectCity = id => {
      active = id;
      const place = locations.find(location => location.id === id);
      if (!place) return;
      cityTitle.textContent = place.name;
      country.textContent = place.country;
      note.textContent = place.note;
      idx.textContent = `${String(locations.indexOf(place) + 1).padStart(2, '0')} / ${String(locations.length).padStart(2, '0')}`;
      eventsList.replaceChildren();
      place.events.forEach(event => {
        const type = document.createElement('span');
        type.textContent = place.category === 'research'
          ? 'RESEARCH STAY · 2026—PRESENT'
          : `${event.type} · ${place.year}${event.detail ? ' · ' + event.detail : ''}`;
        const title = document.createElement('strong');
        title.textContent = event.title;
        eventsList.append(type, title);
      });
      atlas.querySelectorAll('.atlas-pin').forEach(button => {
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
      locations.filter(place => view === 'overview' || (place.id !== 'denver' && place.id !== 'cambridge')).forEach(place => {
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
        pin.setAttribute('aria-label', place.category === 'research'
          ? 'Cambridge, Massachusetts — MIT research base, 2026–present'
          : `${place.name}, ${place.country.toLowerCase()}, ${place.events.length} conference ${place.events.length === 1 ? 'contribution' : 'contributions'}`);
        const text = document.createElement('span');
        text.className = 'atlas-pin-label';
        text.textContent = place.category === 'research' ? 'MIT · Cambridge' : place.name;
        pin.append(text);
        pin.addEventListener('click', () => selectCity(place.id));
        pin.addEventListener('focus', () => selectCity(place.id));
        pinLayer.append(pin);
      });
      selectCity(active);
    }

    atlas.querySelectorAll('[data-atlas-view]').forEach(button => button.addEventListener('click', () => {
      view = button.dataset.atlasView;
      if (view === 'europe' && (active === 'denver' || active === 'cambridge')) active = 'ulm';
      renderMap();
    }));
    atlas.querySelector('.atlas-explore-link')?.addEventListener('click', () => {
      const archive = document.getElementById('conference-archive');
      if (archive) archive.open = true;
    });
    renderMap();
  }
})();
