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
})();
