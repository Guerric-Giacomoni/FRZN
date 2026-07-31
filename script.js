/* ════════════════════════════════════════════════════════════
   FRZN™ — script.js
   Lenis + GSAP ScrollTrigger · vanilla ES6 · no build step
   ════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.innerWidth >= 1024;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  let lenis = null;

  /* ────────── utilities ────────── */

  // hand-rolled splitText — wraps words in masked spans
  function splitWords(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    el.setAttribute('aria-label', text);
    const frag = document.createDocumentFragment();
    text.split(/\s+/).forEach((word, i) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'w__inner';
      inner.textContent = word;
      w.appendChild(inner);
      frag.appendChild(w);
      frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    return el.querySelectorAll('.w__inner');
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // scroll-scrubbed video: lerped currentTime driven by a ScrollTrigger progress
  function makeScrubber(video) {
    const state = { target: 0, current: 0, ready: false, raf: null };
    video.addEventListener('loadedmetadata', () => { state.ready = true; }, { once: true });
    if (video.readyState >= 1) state.ready = true;
    function tick() {
      state.raf = null;
      if (!state.ready || !video.duration) return;
      state.current += (state.target - state.current) * 0.12;
      const t = state.current * video.duration;
      if (Math.abs(video.currentTime - t) > 0.01) {
        try { video.currentTime = t; } catch (e) { /* seek not ready */ }
      }
      if (Math.abs(state.target - state.current) > 0.001) {
        state.raf = requestAnimationFrame(tick);
      }
    }
    return (progress) => {
      state.target = progress;
      tick(); // immediate step so scrubbing tracks even between rAF frames
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    };
  }

  /* ────────── init functions ────────── */

  function initLenis() {
    if (prefersReduced || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1.0,
      smoothWheel: true,
      smoothTouch: false
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;

    // anchor links through lenis
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4, easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 });
      });
    });
  }

  function initPreloader() {
    const pre = document.getElementById('preloader');
    const readout = document.getElementById('preloaderReadout');
    const rule = document.getElementById('preloaderRule');
    const pct = document.getElementById('preloaderPct');
    const lines = [
      '[ FRZN SYSTEM INIT_01 ]',
      'CALIBRATING VISUAL TEMP ......... −30°',
      'LOADING THERMAL ARCHITECTURE .... OK',
      'SERIES: STASIS MK.I ............. OK',
      'COLD LINE ONLINE'
    ];

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pct.textContent = '100';
      rule.style.width = '100%';
      pre.classList.add('is-done');
      const halves = pre.querySelectorAll('.preloader__half');
      const content = pre.querySelector('.preloader__content');
      if (prefersReduced) {
        pre.style.display = 'none';
        revealHero();
        return;
      }
      gsap.to(content, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(pct, { opacity: 0, duration: 0.3 });
      gsap.to(halves[0], { yPercent: -100, duration: 1.2, ease: 'expo.inOut', delay: 0.25 });
      gsap.to(halves[1], {
        yPercent: 100, duration: 1.2, ease: 'expo.inOut', delay: 0.25,
        onComplete: () => { pre.style.display = 'none'; revealHero(); }
      });
    };

    // typed readout
    if (!prefersReduced) {
      let li = 0;
      const typeLine = () => {
        if (li >= lines.length) return;
        readout.textContent += (li > 0 ? '\n' : '') + lines[li];
        li++;
        setTimeout(typeLine, 340);
      };
      typeLine();
    } else {
      readout.textContent = lines.join('\n');
    }

    // fake-but-honest progress: advance with real load, cap at 3.5s
    let progress = 0;
    const iv = setInterval(() => {
      progress = Math.min(progress + Math.random() * 14, 96);
      rule.style.width = progress + '%';
      pct.textContent = String(Math.floor(progress)).padStart(3, '0');
    }, 160);

    const heroVideo = document.getElementById('heroVideo');
    const armFinish = () => { clearInterval(iv); finish(); };
    if (heroVideo) {
      heroVideo.addEventListener('loadeddata', armFinish, { once: true });
    }
    window.addEventListener('load', () => setTimeout(armFinish, 400), { once: true });
    setTimeout(armFinish, 3500); // hard cap
  }

  function revealHero() {
    const inners = document.querySelectorAll('#hero .mask__inner');
    gsap.to(inners, {
      y: 0, yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09,
      onStart: () => {
        const frost = document.getElementById('heroFrost');
        gsap.fromTo(frost, { filter: 'blur(14px)' }, { filter: 'blur(0px)', duration: 1.2, delay: 0.4, ease: 'power2.out' });
      }
    });
    gsap.fromTo('#heroSub', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'expo.out' });
  }

  function initNav() {
    const nav = document.getElementById('nav');
    ScrollTrigger.create({
      start: 80,
      onEnter: () => nav.classList.add('is-scrolled'),
      onLeaveBack: () => nav.classList.remove('is-scrolled')
    });

    // letter-flip: wrap each character in a double-decked span
    document.querySelectorAll('.nav__link').forEach((link) => {
      const label = link.getAttribute('data-flip');
      if (!label) return;
      const chars = label.split('');
      const brackets = link.querySelectorAll('.nav__bracket');
      link.textContent = '';
      link.appendChild(brackets[0]);
      link.append(' ');
      chars.forEach((c, i) => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        const stack = document.createElement('span');
        stack.innerHTML = c + '<br>' + c;
        stack.style.transitionDelay = (i * 15) + 'ms';
        ch.appendChild(stack);
        link.appendChild(ch);
      });
      link.append(' ');
      link.appendChild(brackets[1]);
    });

    // mobile overlay
    const burger = document.getElementById('navBurger');
    const mnav = document.getElementById('mnav');
    burger.addEventListener('click', () => {
      const open = mnav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      mnav.setAttribute('aria-hidden', String(!open));
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      mnav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
    }));

    // add-to-cart pulse
    const badge = document.getElementById('cartBadge');
    let count = 0;
    document.querySelectorAll('[data-add-cart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        count++;
        badge.textContent = count;
        const glyph = badge.closest('.nav__glyph');
        glyph.classList.remove('pulse');
        void glyph.offsetWidth;
        glyph.classList.add('pulse');
      });
    });
  }

  function initCursor() {
    if (!finePointer || prefersReduced) return;
    document.body.classList.add('cursor-on');
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const label = document.getElementById('cursorLabel');
    const cursor = document.querySelector('.cursor');
    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };

    window.addEventListener('mousemove', (e) => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
    gsap.ticker.add(() => {
      ringPos.x += (pos.x - ringPos.x) * 0.12;
      ringPos.y += (pos.y - ringPos.y) * 0.12;
      dot.style.left = pos.x + 'px'; dot.style.top = pos.y + 'px';
      ring.style.left = ringPos.x + 'px'; ring.style.top = ringPos.y + 'px';
    });

    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const mode = el.getAttribute('data-cursor');
        cursor.classList.toggle('cursor--link', mode === 'link');
        cursor.classList.toggle('cursor--card', mode === 'card');
        label.textContent = mode === 'card' ? '↗' : (el.tagName === 'A' ? 'OPEN' : 'PRESS');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('cursor--link', 'cursor--card');
        label.textContent = '';
      });
    });

    // magnetic pull
    if (isDesktop()) {
      document.querySelectorAll('[data-magnetic]').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          if (Math.hypot(dx, dy) < 60 + r.width / 2) {
            gsap.to(el, { x: dx * 0.28, y: dy * 0.28, duration: 0.3, ease: 'power2.out' });
          }
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'expo.out' });
        });
      });
    }
  }

  function initHero() {
    const video = document.getElementById('heroVideo');
    if (prefersReduced) return; // poster stays

    if (!isDesktop()) {
      // mobile: progressive playback, no seeking needed
      video.src = './assets/video/scene-01-arrival-916.mp4';
      video.loop = true;
      video.load();
      video.play().catch(() => {});
      return;
    }

    // desktop: blob-load so the clip is fully seekable regardless of range support
    loadScrubVideo(video, './assets/video/scene-01-arrival.mp4').then(() => primeVideo(video));
    const scrub = makeScrubber(video);
    ScrollTrigger.create({
      trigger: '#heroPin',
      start: 'top top',
      end: '+=200%',
      pin: true,
      scrub: true,
      onUpdate: (self) => scrub(self.progress)
    });
  }

  // Fetch the clip into memory and point the video at a blob URL. A blob source
  // is always seekable — plain http.server (and many hosts) don't serve HTTP
  // Range requests, which leaves a streamed <video> with seekable=[0,0] and
  // makes scroll-scrubbing impossible. Files are small (~3MB), so this is cheap.
  function loadScrubVideo(video, url) {
    return fetch(url)
      .then((r) => r.blob())
      .then((blob) => new Promise((resolve) => {
        video.src = URL.createObjectURL(blob);
        video.addEventListener('loadeddata', () => resolve(video), { once: true });
        video.load();
      }))
      .catch(() => { video.src = url; video.load(); }); // fallback: direct src
  }

  // Chrome won't always paint a seeked frame until the decoder has run once —
  // a muted play→pause primes it so scroll-scrubbing shows frames immediately
  function primeVideo(video) {
    const kick = () => {
      const p = video.play();
      if (p && p.then) p.then(() => video.pause()).catch(() => {});
      else video.pause();
    };
    if (video.readyState >= 2) kick();
    else video.addEventListener('loadeddata', kick, { once: true });
  }

  function initStats() {
    const cells = document.querySelectorAll('.stats__cell');
    const nums = document.querySelectorAll('.stats__num');

    ScrollTrigger.create({
      trigger: '#stats',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        nums.forEach((el, i) => {
          const target = parseFloat(el.getAttribute('data-count'));
          const suffix = el.getAttribute('data-suffix') || '';
          const pad = parseInt(el.getAttribute('data-pad') || '0', 10);
          const group = el.hasAttribute('data-group');
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.4, delay: i * 0.08, ease: 'expo.inOut',
            onUpdate: () => {
              let n = Math.round(obj.v);
              let s = Math.abs(n).toString();
              if (pad) s = s.padStart(pad, '0');
              if (group) s = Number(s).toLocaleString('en-US');
              el.textContent = (n < 0 ? '−' : '') + s + suffix;
            }
          });
        });
        cells.forEach((c, i) => {
          const inner = c.querySelector('.mask__inner');
          if (inner) gsap.fromTo(inner, { yPercent: 110 }, { yPercent: 0, duration: 0.9, delay: i * 0.08 + 0.2, ease: 'expo.out' });
        });
      }
    });

    if (isDesktop() && !prefersReduced) {
      gsap.fromTo('#statsTrack', { x: -60 }, {
        x: 60, ease: 'none',
        scrollTrigger: { trigger: '#stats', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  function initReveals() {
    // generic mask-rise for every headline outside hero
    // (explicit onEnter callbacks: immune to scroll jumps and tab throttling)
    const bySection = new Map();
    document.querySelectorAll('section:not(#hero) .mask__inner, footer .mask__inner').forEach((inner) => {
      // #fclose runs its own reveal on the right trigger — skip it here
      if (inner.closest('#fclose')) return;
      // article first: each pillar reveals on its own, not with its section
      const host = inner.closest('article, section, footer');
      if (!bySection.has(host)) bySection.set(host, []);
      bySection.get(host).push(inner);
    });
    bySection.forEach((inners, host) => {
      ScrollTrigger.create({
        trigger: host, start: 'top 72%', once: true,
        onEnter: () => gsap.to(inners, { yPercent: 0, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: 'auto' })
      });
    });

    // word-split bodies
    document.querySelectorAll('[data-words]').forEach((p) => {
      const words = splitWords(p);
      ScrollTrigger.create({
        trigger: p, start: 'top 80%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.04, overwrite: 'auto' })
      });
    });

    // card grid entries
    document.querySelectorAll('.inventory__grid').forEach((grid) => {
      const cards = grid.querySelectorAll('.card');
      gsap.set(cards, { opacity: 0, y: 40, filter: 'blur(10px)' });
      ScrollTrigger.create({
        trigger: grid, start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to(cards, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: 'auto' });
          cards.forEach((c) => {
            const img = c.querySelector('img');
            gsap.fromTo(img, { scale: 1.06 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
          });
        }
      });
    });

    initTimeline();
  }

  function initTimeline() {
    const tlEl = document.getElementById('storyTimeline');
    const draw = document.getElementById('storyTimedraw');
    if (!tlEl || !draw) return;
    const nodes = gsap.utils.toArray('#storyTimeline .story__node');
    const dots = nodes.map((n) => n.querySelector('.story__dot'));
    const labels = nodes.map((n) => [n.querySelector('.story__year'), n.querySelector('.story__label')]);
    const vertical = () => window.innerWidth < 1024;

    if (prefersReduced) {
      tlEl.classList.add('is-drawn');
      gsap.set(dots, { scale: 1 });
      gsap.set(labels.flat(), { opacity: 1 });
      return;
    }

    gsap.set(dots, { scale: 0 });
    gsap.set(labels.flat(), { yPercent: 80, opacity: 0 });

    ScrollTrigger.create({
      trigger: tlEl, start: 'top 78%', once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          onComplete: () => { gsap.set(draw, { clearProps: 'transform' }); tlEl.classList.add('is-drawn'); }
        });
        // the line draws — vertical on mobile, horizontal on desktop
        const from = vertical() ? { scaleY: 0 } : { scaleX: 0 };
        const to = vertical() ? { scaleY: 1 } : { scaleX: 1 };
        tl.fromTo(draw, from, { ...to, duration: 1.3, ease: 'power2.inOut' }, 0);
        // each milestone lights up as the line passes it
        nodes.forEach((node, i) => {
          const at = 0.15 + i * (1.05 / nodes.length);
          tl.call(() => dots[i].classList.add('ping'), null, at);
          tl.to(dots[i], { scale: 1, duration: 0.4, ease: 'expo.out' }, at);
          tl.to(labels[i], { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.06 }, at + 0.04);
        });
      }
    });
  }

  function initMission() {
    if (prefersReduced) return;
    // kinetic pull-line scrubs horizontally through its scroll range
    gsap.fromTo('#missionPull', { xPercent: 4 }, {
      xPercent: -30, ease: 'none',
      scrollTrigger: { trigger: '.mission__pull', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  function initPillars() {
    const panels = [...document.querySelectorAll('[data-pillar]')];
    const roll = document.getElementById('pillarRoll');
    if (!panels.length) return;

    // yPercent is a share of the whole numeral track, so one step is 1/n of it
    const step = roll ? 100 / panels.length : 0;
    let current = -1;

    // ONE source of truth: the active pillar drives both the numeral and the
    // brightening, so they always change on the same frame.
    const setActive = (i) => {
      if (i === current || i < 0) return;
      current = i;
      if (roll) gsap.to(roll, { yPercent: -step * i, duration: prefersReduced ? 0 : 0.6, ease: 'expo.inOut', overwrite: true });
      if (!prefersReduced) {
        panels.forEach((p, k) => gsap.to(p, { opacity: k === i ? 1 : 0.4, duration: 0.5, ease: 'power2.out', overwrite: 'auto' }));
      }
    };

    if (!prefersReduced) panels.forEach((p, k) => gsap.set(p, { opacity: k === 0 ? 1 : 0.4 }));

    // A pillar is active while it spans the viewport centre (top-center →
    // bottom-center). Panels tile the scroll, so one deactivates exactly as the
    // next activates: the numeral and the brightening hand off on the same frame,
    // at the midpoint between the two texts. 01 is bright from load (setActive(0)).
    panels.forEach((panel, i) => {
      ScrollTrigger.create({
        trigger: panel, start: 'top center', end: 'bottom center',
        onEnter: () => setActive(i),      // scrolling down: this pillar reaches centre
        onEnterBack: () => setActive(i)   // scrolling up: this pillar reaches centre
      });
    });
    setActive(0);

    // The numeral centres on the panel's geometric middle, but the pillar title
    // sits above that (anno + title on top, body + chips below). Shift the numeral
    // up by that measured gap so it lines up with the title, at any viewport.
    const win = document.querySelector('.pillars__roll');
    const alignToTitle = () => {
      if (!win) return;
      if (!isDesktop()) { win.style.transform = ''; return; }
      const panel = panels[0];
      const title = panel.querySelector('.pillar__title');
      const pTop = panel.getBoundingClientRect().top;
      const tr = title.getBoundingClientRect();
      const titleCentreInPanel = (tr.top + tr.height / 2) - pTop;
      win.style.transform = 'translateY(' + (titleCentreInPanel - window.innerHeight / 2) + 'px)';
    };
    alignToTitle();
    window.addEventListener('resize', debounce(alignToTitle, 200));
    ScrollTrigger.addEventListener('refreshInit', alignToTitle);
  }

  function initKinetic() {
    // Scope the pinned desktop animation to a media query. gsap.matchMedia
    // auto-reverts everything it creates (inline transforms cleared, pin killed)
    // when the viewport drops below 1024 — so resizing to tablet/mobile falls
    // back cleanly to the stacked CSS layout instead of keeping stale transforms.
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '#kineticPin', start: 'top top', end: '+=300%', pin: true, scrub: true }
      });
      // xPercent/yPercent carry the -50%/-50% centring GSAP would otherwise overwrite
      tl.fromTo('#kineticJacket',
        { xPercent: -50, yPercent: -44, scale: 0.82, rotate: -2 },
        { xPercent: -50, yPercent: -56, scale: 1.06, rotate: 2, ease: 'none' }, 0)
        .fromTo('#kineticBack', { yPercent: 6 }, { yPercent: -14, ease: 'none' }, 0)
        .fromTo('#kineticFront', { xPercent: 30, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'none', duration: 0.5 }, 0.15)
        .fromTo('#kineticTag', { yPercent: 18, rotate: -4 }, { yPercent: -26, rotate: -7, ease: 'none' }, 0)
        .to('#kineticQuiet', { opacity: 0.6, filter: 'blur(6px)', ease: 'none', duration: 0.25 }, 0.75);
    });
  }

  function initStory() {
    if (prefersReduced) return;
    gsap.fromTo('#storyTopo', { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  function initGrid() {
    // mobile carousel readout
    const grids = document.querySelectorAll('.inventory__grid');
    const readout = document.getElementById('carouselReadout');
    if (!readout) return;
    const allCards = document.querySelectorAll('.inventory .card');
    const update = debounce(() => {
      if (window.innerWidth >= 768) return;
      let best = 0, bestDist = Infinity;
      allCards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - window.innerWidth / 2);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      readout.textContent = String(best + 1).padStart(2, '0') + ' / ' + String(allCards.length).padStart(2, '0');
    }, 80);
    grids.forEach((g) => g.addEventListener('scroll', update, { passive: true }));
  }

  function initFeatured() {
    if (prefersReduced) return;
    const track = document.getElementById('featuredMarquee');
    let dir = 1;
    let x = 0;
    let paused = false;
    track.closest('.featured__marquee').addEventListener('mouseenter', () => { paused = true; });
    track.closest('.featured__marquee').addEventListener('mouseleave', () => { paused = false; });
    if (lenis) lenis.on('scroll', (e) => { dir = e.direction >= 0 ? 1 : -1; });
    gsap.ticker.add(() => {
      if (paused) return;
      x -= 0.6 * dir;
      const half = track.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = 'translateX(' + x + 'px)';
    });
  }

  function initFinalCTA() {
    const video = document.getElementById('finalVideo');
    const desktopScrub = isDesktop() && !prefersReduced;
    const srcDesktop = './assets/video/scene-03-operator.mp4';
    const srcMobile = './assets/video/scene-03-operator-916.mp4';
    let loaded = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting || loaded) return;
        loaded = true;
        if (desktopScrub) {
          loadScrubVideo(video, srcDesktop).then(() => primeVideo(video));
        } else if (!prefersReduced) {
          video.src = srcMobile; video.loop = true; video.load();
          video.addEventListener('loadeddata', () => video.play().catch(() => {}), { once: true });
        }
      });
    }, { rootMargin: '600px' });
    io.observe(video);

    if (desktopScrub) {
      const scrub = makeScrubber(video);
      ScrollTrigger.create({
        trigger: '#finalPin',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => scrub(self.progress)
      });
    }

    // join-the-drop form
    const joinBtn = document.getElementById('joinDrop');
    const form = document.getElementById('dropForm');
    const email = document.getElementById('dropEmail');
    const invalid = document.getElementById('dropInvalid');
    const confirm = document.getElementById('dropConfirm');

    joinBtn.addEventListener('click', () => {
      const open = form.hidden;
      form.hidden = !open;
      joinBtn.setAttribute('aria-expanded', String(open));
      if (open) email.focus();
      ScrollTrigger.refresh();
    });

    const wireForm = (f, confirmEl) => {
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = f.querySelector('input[type="email"]');
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
        if (!ok) {
          input.classList.add('is-invalid');
          if (invalid && f === form) invalid.hidden = false;
          return;
        }
        input.classList.remove('is-invalid');
        if (invalid && f === form) invalid.hidden = true;
        // POST hook: send input.value to your endpoint here. Nothing is stored.
        f.hidden = true;
        confirmEl.hidden = false;
        // typed confirmation
        const full = confirmEl.textContent;
        if (!prefersReduced) {
          confirmEl.textContent = '';
          let i = 0;
          const type = () => {
            confirmEl.textContent = full.slice(0, ++i);
            if (i < full.length) setTimeout(type, 24);
          };
          type();
        }
      });
    };
    wireForm(form, confirm);
    const footForm = document.getElementById('footForm');
    const footConfirm = document.getElementById('footConfirm');
    if (footForm) wireForm(footForm, footConfirm);
  }

  function initFooterClose() {
    if (prefersReduced) return;
    // mountain drifts, tag creeps the other way, tagline rises on enter
    gsap.fromTo('#fcloseMountain', { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '#fclose', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
    });
    gsap.fromTo('#fcloseTag', { yPercent: 12, rotate: -2 }, {
      yPercent: -10, rotate: -3, ease: 'none',
      scrollTrigger: { trigger: '#fclose', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    const inners = document.querySelectorAll('#fcloseTagline .mask__inner');
    ScrollTrigger.create({
      trigger: '#fclose', start: 'top 65%', once: true,
      onEnter: () => gsap.to(inners, { yPercent: 0, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: 'auto' })
    });
  }

  /* ────────── boot ────────── */
  function init() {
    if (typeof gsap === 'undefined') { document.body.classList.add('no-js'); return; }
    gsap.registerPlugin(ScrollTrigger);

    initLenis();
    initPreloader();
    initNav();
    initCursor();
    initHero();
    initStats();
    initReveals();
    initMission();
    initPillars();
    initKinetic();
    initStory();
    initGrid();
    initFeatured();
    initFinalCTA();
    initFooterClose();

    window.addEventListener('resize', debounce(() => ScrollTrigger.refresh(), 200));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
