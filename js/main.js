/* Saathi Living · co-living pg1 — interactions */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (hasGsap && !reduce && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  function scrollToTarget(el) {
    if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(t);
    });
  });

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    if (lenis) lenis.start();
  }
  burger && burger.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    if (open) nav.classList.remove('is-hidden');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Nav hide on scroll down ---------- */
  const nav = $('#nav');
  let lastY = 0;
  function onScrollNav(y) {
    if (y > 200 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 200) nav.classList.remove('is-hidden');
    lastY = y;
  }
  if (lenis) lenis.on('scroll', (l) => onScrollNav(l.scroll));
  else window.addEventListener('scroll', () => onScrollNav(window.scrollY), { passive: true });

  /* ---------- Loader: doors swing open ---------- */
  const loader = $('#loader');
  const pctEl = $('#loaderPct');
  let shown = 0, target = 0, finished = false;

  const critical = ['/assets/video/hero-poster.jpg', '/assets/img/common-hall.jpg', '/assets/img/room-private.jpg'];
  let loaded = 0;
  const total = critical.length + 1; // + fonts
  const bump = () => { loaded++; target = Math.round((loaded / total) * 100); };
  critical.forEach((src) => { const i = new Image(); i.onload = i.onerror = bump; i.src = src; });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(bump);

  function tickLoader() {
    shown += (target - shown) * 0.12 + 0.4;
    if (shown > target) shown = target;
    pctEl.textContent = Math.round(shown);
    if (shown >= 100) return openDoors();
    requestAnimationFrame(tickLoader);
  }
  requestAnimationFrame(tickLoader);
  setTimeout(() => { target = 100; }, 4500); // never hold the visitor longer than this

  function openDoors() {
    if (finished) return;
    finished = true;
    document.body.classList.remove('is-loading');
    const done = () => {
      loader.classList.add('is-done');
      if (lenis) lenis.start();
      const v = $('#heroVideo');
      v && v.play && v.play().catch(() => {});
    };
    if (!hasGsap || reduce) { done(); heroIntro(); return; }
    const tl = gsap.timeline({ onComplete: done });
    tl.to('.loader__center', { opacity: 0, y: -10, duration: 0.35, ease: 'power2.in' })
      .to('.loader__door--l', { rotationY: -100, duration: 1.3, ease: 'power3.inOut' }, 0.2)
      .to('.loader__door--r', { rotationY: 100, duration: 1.3, ease: 'power3.inOut' }, 0.2)
      .to('.loader__door', { opacity: 0, duration: 0.4 }, 1.1)
      .add(heroIntro, 0.75);
  }

  function heroIntro() {
    if (!hasGsap || reduce) return;
    gsap.from('.hero__title .line > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.09 });
    gsap.from(['.hero__kicker', '.hero__lede', '.hero__ctas'], { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.25 });
    gsap.from('.hero__arch', { clipPath: 'inset(100% 0% 0% 0% round 260px 260px 32px 32px)', duration: 1.4, ease: 'power4.inOut', clearProps: 'clipPath', onComplete: buildHero });
    gsap.from('.hero__chip', { y: 30, opacity: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.12, delay: 0.9 });
  }

  /* ---------- Hero: arch opens to full screen on scroll ---------- */
  const hero = $('.hero');
  const arch = $('#heroArch');
  let heroST = null, heroW = window.innerWidth;

  function killHero() {
    if (heroST) { heroST.scrollTrigger && heroST.scrollTrigger.kill(true); heroST.kill(); heroST = null; }
    hero.classList.remove('is-expand');
    gsap.set([arch, '.hero__copy', '.hero__chip', '#heroCaption', '#heroVideo'], { clearProps: 'all' });
  }

  function buildHero() {
    if (!hasGsap || reduce || !isDesktop() || heroST) return;
    const r = arch.getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    hero.classList.add('is-expand');
    const W = hero.clientWidth, H = hero.clientHeight;
    const top = r.top - hr.top, left = r.left - hr.left;
    const right = W - (left + r.width), bottom = H - (top + r.height);
    const rad = r.width / 2;
    const start = `inset(${top}px ${right}px ${bottom}px ${left}px round ${rad}px ${rad}px 32px 32px)`;
    // keep chips where they were, relative to the visible window
    gsap.set('.hero__chip--a', { left: left + 18, bottom: bottom + 96 });
    gsap.set('.hero__chip--b', { right: right + 18, bottom: bottom + 42 });

    heroST = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=140%', scrub: 0.8, pin: true, anticipatePin: 1, refreshPriority: 10 }
    });
    heroST.fromTo(arch, { clipPath: start }, { clipPath: 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      .to('.hero__copy', { y: -140, opacity: 0, ease: 'power1.in', duration: 0.45 }, 0)
      .to('.hero__chip', { opacity: 0, y: 24, duration: 0.25 }, 0)
      .fromTo('#heroVideo', { scale: 1.18 }, { scale: 1, ease: 'none', duration: 1 }, 0)
      .to('#heroCaption', { opacity: 1, duration: 0.25 }, 0.78)
      .fromTo('#heroCaption', { y: 30 }, { y: 0, duration: 0.25 }, 0.78);
    // the hero pin is added after the other scenes exist, so re-measure everything below it
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  window.addEventListener('resize', debounce(() => {
    if (!hasGsap || Math.abs(window.innerWidth - heroW) < 40) return;
    heroW = window.innerWidth;
    killHero();
    buildHero();
    ScrollTrigger.refresh();
  }, 250));

  /* ---------- Who tabs ---------- */
  const tabs = $$('.who__tabs [role="tab"]');
  const whoImgs = $$('.who__img');
  const whoItems = $$('.who__item');
  function setWho(i) {
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    whoImgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
    whoItems.forEach((it, k) => it.classList.toggle('is-on', k === i));
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setWho(i));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[n].focus(); setWho(n);
    });
  });

  /* ---------- Pointer tilt (3D) ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach((el) => {
      el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)';
      el.addEventListener('mousemove', (e) => {
        const b = el.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width - 0.5;
        const y = (e.clientY - b.top) / b.height - 0.5;
        el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      el.parentElement.style.perspective = el.parentElement.style.perspective || '1200px';
    });
  }

  /* ---------- Form ---------- */
  const form = $('#visitForm');
  const dateIn = $('#f-date');
  if (dateIn) {
    const t = new Date();
    const iso = new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateIn.min = iso;
  }
  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const check = (id, valid) => {
      const f = $('#' + id).closest('.field');
      f.classList.toggle('has-err', !valid);
      $('#' + id).setAttribute('aria-invalid', String(!valid));
      if (!valid && ok) $('#' + id).focus();
      if (!valid) ok = false;
    };
    check('f-name', $('#f-name').value.trim().length > 1);
    check('f-phone', /^[6-9]\d{9}$/.test($('#f-phone').value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')));
    check('f-date', !!dateIn.value && dateIn.value >= dateIn.min);
    if (!ok) return;
    const okMsg = $('#formOk');
    okMsg.hidden = false;
    form.querySelector('button[type="submit"]').textContent = 'Visit requested';
    form.querySelector('button[type="submit"]').disabled = true;
    // Hook up to the client's CRM / email endpoint here.
  });
  ['f-name', 'f-phone', 'f-date'].forEach((id) => {
    const el = $('#' + id);
    el && el.addEventListener('input', () => el.closest('.field').classList.remove('has-err'));
  });

  /* ---------- Lazy videos ---------- */
  const lazyVids = $$('video[data-lazy-video]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) {
          if (!v.dataset.ready) {
            $$('source[data-src]', v).forEach((s) => { s.src = s.dataset.src; });
            v.load(); v.dataset.ready = '1';
          }
          if (!reduce) v.play().catch(() => {});
        } else if (v.dataset.ready) v.pause();
      });
    }, { rootMargin: '200px 0px' });
    lazyVids.forEach((v) => io.observe(v));
  }

  /* ---------- Scroll scenes ---------- */
  if (!hasGsap) return;

  // Headings: a quiet rise
  if (!reduce) {
    $$('main .h2, .visit__title').forEach((h) => {
      gsap.from(h, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
  }

  const mm = gsap.matchMedia();

  // Rooms: horizontal 3D reel (desktop)
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    const track = $('#roomsTrack');
    const cards = $$('.room', track);
    const idx = $('#roomIdx');
    const dist = () => track.scrollWidth - window.innerWidth;

    const depth = () => {
      const mid = window.innerWidth / 2;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const b = c.getBoundingClientRect();
        const d = (b.left + b.width / 2 - mid) / window.innerWidth; // -1..1
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
        gsap.set(c, { rotationY: gsap.utils.clamp(-22, 22, d * -30), z: -Math.abs(d) * 140, transformOrigin: 'center center' });
        const img = c.querySelector('.room__img img');
        if (img) gsap.set(img, { xPercent: d * -8 });
      });
      idx.textContent = Math.min(best + 1, 5);
    };

    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.rooms', start: 'top top', end: () => '+=' + dist(), pin: '.rooms__pin',
        scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: depth, onRefresh: depth
      }
    });
    depth();
    return () => gsap.set(cards, { clearProps: 'all' });
  });

  // Rooms on touch screens: native swipe, keep the counter in sync
  mm.add('(max-width: 900px)', () => {
    const track = $('#roomsTrack');
    const cards = $$('.room', track);
    const idx = $('#roomIdx');
    const onSwipe = () => {
      const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => { const b = c.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
      idx.textContent = best + 1;
    };
    track.addEventListener('scroll', onSwipe, { passive: true });
    return () => track.removeEventListener('scroll', onSwipe);
  });

  // House: exploded building
  const slabs = $$('.slab');
  const floorsLi = $$('#floorList li');
  const iso = $('#iso');
  let curFloor = 4;
  let isScrollingProgrammatically = false;

  function updateSlabs(f) {
    const gap = isDesktop() ? 72 : 46;
    const lift = isDesktop() ? 38 : 22;

    slabs.forEach((slab) => {
      const fl = +slab.dataset.floor;
      const isActive = fl === f;
      const isAbove = fl > f;
      let targetZ = fl * gap;
      if (isActive || isAbove) {
        targetZ += lift;
      }
      slab.classList.toggle('is-on', isActive);
      if (hasGsap) {
        gsap.to(slab, {
          z: targetZ,
          scale: isActive ? 1.03 : 1,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    });
  }

  function setFloor(f, fromScroll = false) {
    if (curFloor === f && !fromScroll) return;
    curFloor = f;

    floorsLi.forEach((li) => {
      const match = +li.dataset.floor === f;
      li.classList.toggle('is-on', match);
      li.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    updateSlabs(f);
  }

  // Initial positioning
  updateSlabs(4);

  let houseST = null;

  // Interaction handlers for floor items (left) and slabs (right)
  floorsLi.forEach((li) => {
    const f = +li.dataset.floor;
    li.addEventListener('click', () => {
      setFloor(f);
      if (houseST && houseST.pin && isDesktop()) {
        isScrollingProgrammatically = true;
        const progress = (4 - f) / 4;
        const targetScroll = houseST.start + progress * (houseST.end - houseST.start);
        if (lenis) {
          lenis.scrollTo(targetScroll, {
            duration: 0.6,
            onComplete: () => { isScrollingProgrammatically = false; }
          });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
          setTimeout(() => { isScrollingProgrammatically = false; }, 600);
        }
      }
    });
    li.addEventListener('mouseenter', () => {
      if (!isScrollingProgrammatically) setFloor(f);
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        li.click();
      }
    });
  });

  slabs.forEach((slab) => {
    const f = +slab.dataset.floor;
    slab.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = floorsLi.find((item) => +item.dataset.floor === f);
      if (li) li.click();
      else setFloor(f);
    });
    slab.addEventListener('mouseenter', () => {
      if (!isScrollingProgrammatically) setFloor(f);
    });
    slab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        slab.click();
      }
    });
  });

  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    // Intro stagger when approaching section
    gsap.from(slabs, {
      z: 0,
      opacity: 0.4,
      stagger: 0.06,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.house',
        start: 'top 75%',
        once: true
      }
    });

    // Pinned scroll-through
    houseST = ScrollTrigger.create({
      trigger: '.house',
      start: 'top top',
      end: '+=130%',
      pin: '.house__pin',
      anticipatePin: 1,
      onUpdate: (self) => {
        if (isScrollingProgrammatically) return;
        const p = self.progress;
        const f = Math.max(0, Math.min(4, 4 - Math.floor(p * 4.99)));
        if (f !== curFloor) {
          setFloor(f, true);
        }
      }
    });

    setFloor(4);
    return () => {
      if (houseST) {
        houseST.kill();
        houseST = null;
      }
      gsap.set(slabs, { clearProps: 'all' });
    };
  });

  mm.add('(max-width: 900px), (prefers-reduced-motion: reduce)', () => {
    setFloor(4);
    floorsLi.forEach((li) => {
      ScrollTrigger.create({
        trigger: li,
        start: 'top 70%',
        end: 'bottom 70%',
        onToggle: (s) => s.isActive && setFloor(+li.dataset.floor)
      });
    });
  });

  // Rent receipt
  if (!reduce) {
    const lines = $$('.receipt__lines li');
    const totalEl = $('#rentTotal');
    const counter = { v: 0 };
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#receipt', start: 'top 75%', once: true } });
    tl.from('#receipt', { y: 60, rotationX: 18, opacity: 0, duration: 1, ease: 'power3.out' })
      .from(lines, { opacity: 0, x: -14, duration: 0.45, stagger: 0.08, ease: 'power2.out' }, 0.35)
      .to(counter, { v: 18500, duration: 1.3, ease: 'power2.out', onUpdate: () => { totalEl.textContent = '₹' + Math.round(counter.v).toLocaleString('en-IN'); } }, 0.45)
      .from('.receipt__stamp', { scale: 2.4, opacity: 0, rotation: -30, duration: 0.6, ease: 'back.out(2.2)' }, '>-0.2');

    gsap.to('.rent__ph--a', { y: -40, ease: 'none', scrollTrigger: { trigger: '.rent', scrub: true } });
    gsap.to('.rent__ph--b', { y: 30, ease: 'none', scrollTrigger: { trigger: '.rent', scrub: true } });
  }

  // Day timeline
  const steps = $$('.step');
  const dayImgs = $$('.day__img');
  const clock = $('#dayClock');
  let dayCur = 0, zTop = 2;
  function setStep(i) {
    if (i === dayCur) return;
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    dayImgs.forEach((im) => { if (im.classList.contains('is-on')) { im.classList.remove('is-on'); im.classList.add('was-on'); } });
    const next = dayImgs[i];
    next.classList.remove('was-on');
    next.style.zIndex = ++zTop;
    void next.offsetWidth;
    next.classList.add('is-on');
    clock.textContent = steps[i].querySelector('time').textContent;
    dayCur = i;
    setTimeout(() => dayImgs.forEach((im, k) => { if (k !== i && !im.classList.contains('is-on')) im.classList.remove('was-on'); }), 1200);
  }
  mm.add('(min-width: 901px)', () => {
    // one trigger for the whole list, so fast scrolling can never skip a step
    const pick = () => {
      const line = window.innerHeight * 0.55;
      let i = 0;
      steps.forEach((s, k) => { if (s.getBoundingClientRect().top <= line) i = k; });
      setStep(i);
    };
    ScrollTrigger.create({ trigger: '.day__steps', start: 'top bottom', end: 'bottom top', onUpdate: pick, onRefresh: pick });
  });

  if (!reduce) {
    // Film band: grows to full width, video drifts
    gsap.fromTo('#filmFrame', { scale: 0.86, borderRadius: 48 }, { scale: 1, borderRadius: 32, ease: 'none', scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'top 15%', scrub: true } });
    gsap.fromTo('.film__video', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.film', scrub: true } });
    gsap.from('.film__quote', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.film', start: 'top 40%', once: true } });

    // Gallery parallax + staggered entrance
    $$('.g__in').forEach((g) => {
      gsap.fromTo(g, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: g.parentElement, scrub: true } });
    });
    gsap.from('.g', { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'power4.inOut', stagger: 0.1, scrollTrigger: { trigger: '.gallery', start: 'top 80%', once: true } });

    // Parents photo slow zoom
    gsap.fromTo('.parents__media img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.parents', scrub: true } });
  }

  // Locations: floating photo follows the cursor
  const float = $('#locFloat');
  const sect = $('.locations');
  if (float && window.matchMedia('(hover: hover)').matches) {
    const fimg = float.querySelector('img');
    const qx = gsap.quickTo(float, 'x', { duration: 0.5, ease: 'power3' });
    const qy = gsap.quickTo(float, 'y', { duration: 0.5, ease: 'power3' });
    $$('.loc__row').forEach((row) => {
      row.addEventListener('mouseenter', () => { fimg.src = row.dataset.img; float.classList.add('is-on'); });
      row.addEventListener('mouseleave', () => float.classList.remove('is-on'));
    });
    sect.addEventListener('mousemove', (e) => {
      const b = sect.getBoundingClientRect();
      qx(e.clientX - b.left + 24);
      qy(e.clientY - b.top - 110);
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());

  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
})();
