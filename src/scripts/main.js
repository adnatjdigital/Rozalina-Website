(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Year ----- */
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ----- Top bar rotator ----- */
  const rot = $('[data-rotator]');
  if (rot && !reduceMotion) {
    const items = $$('span', rot);
    let i = 0;
    setInterval(() => {
      const cur = items[i];
      cur.classList.remove('is-active');
      cur.classList.add('is-out');
      i = (i + 1) % items.length;
      const next = items[i];
      next.classList.remove('is-out');
      next.classList.add('is-active');
      setTimeout(() => cur.classList.remove('is-out'), 650);
    }, 4200);
  }

  /* ----- Header scroll state + FAB ----- */
  const header = $('#header');
  const fab = $('.fab');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    fab.classList.toggle('is-visible', y > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- Mobile nav ----- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setNav = open => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    document.body.classList.toggle('nav-open', open);
  };
  burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !burger.contains(e.target)) setNav(false);
  });

  /* ----- Active nav link on scroll ----- */
  const links = $$('.nav a[href^="#"]');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ----- Hero slider ----- */
  const slides = $$('.slide');
  const dots = $$('.hero__dots button');
  let current = 0, timer;
  const go = n => {
    current = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === current);
      s.setAttribute('aria-hidden', i !== current);
      $$('a, button', s).forEach(el => (el.tabIndex = i === current ? 0 : -1));
    });
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
      d.setAttribute('aria-selected', i === current);
    });
  };
  const play = () => {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = setInterval(() => go(current + 1), 6500);
  };
  $('[data-next]').addEventListener('click', () => { go(current + 1); play(); });
  $('[data-prev]').addEventListener('click', () => { go(current - 1); play(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { go(i); play(); }));
  const hero = $('.hero');
  hero.addEventListener('mouseenter', () => clearInterval(timer));
  hero.addEventListener('mouseleave', play);
  let sx = null;
  hero.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  hero.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) { go(current + (dx < 0 ? 1 : -1)); play(); }
    sx = null;
  });
  go(0);
  play();

  /* ----- Subtle parallax on hero art ----- */
  if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      $$('.slide.is-active .slide__art').forEach(a => {
        a.style.transform = `translate(${x * -14}px, ${y * -10}px)`;
      });
    });
  }

  /* ----- Reveal on scroll ----- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const el = en.target;
        const siblings = $$('.reveal', el.parentElement);
        const idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 80, 400) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(() => (el.style.transitionDelay = ''), 1400);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ----- Product filters ----- */
  const chips = $$('.chip');
  const cards = $$('.card');
  const empty = $('.products__empty');
  const filter = cat => {
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.filter === cat));
    let shown = 0;
    cards.forEach(card => {
      const match = cat === 'sve' || card.dataset.cat.split(' ').includes(cat);
      card.classList.toggle('is-hidden', !match);
      if (match) {
        shown++;
        card.classList.add('is-in');
        card.classList.remove('is-entering');
        void card.offsetWidth;
        card.classList.add('is-entering');
      }
    });
    empty.hidden = shown > 0;
  };
  chips.forEach(c => c.addEventListener('click', () => filter(c.dataset.filter)));
  $$('[data-filter-link]').forEach(a => a.addEventListener('click', () => filter(a.dataset.filterLink)));

  /* ----- Wishlist (saved in this browser only) ----- */
  const KEY = 'rozalina-wish';
  let wish = [];
  try { wish = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { wish = []; }
  const wishBtn = $('[data-wish-open]');
  const wishN = $('[data-wish-n]');
  const wishList = $('#wish-list');
  const wishEmpty = $('#wish-empty');
  const cardData = card => ({
    id: card.dataset.id,
    title: $('.card__title', card).textContent,
    img: $('.card__media img', card).getAttribute('src'),
  });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(wish)); } catch (e) { /* storage unavailable */ } };
  const renderWish = () => {
    wishN.textContent = wish.length;
    wishBtn.classList.toggle('has-items', wish.length > 0);
    cards.forEach(card => {
      $('.card__wish', card).setAttribute('aria-pressed', wish.includes(card.dataset.id));
    });
    wishList.innerHTML = '';
    wish.forEach(id => {
      const card = cards.find(c => c.dataset.id === id);
      if (!card) return;
      const d = cardData(card);
      const li = document.createElement('li');
      li.innerHTML = `<img src="${d.img}" alt=""><div><strong></strong><small>Izrada po narudžbi</small></div><button type="button" aria-label="Ukloni">×</button>`;
      $('strong', li).textContent = d.title;
      $('button', li).addEventListener('click', () => toggleWish(id));
      wishList.appendChild(li);
    });
    wishEmpty.hidden = wish.length > 0;
  };
  const toast = $('#toast');
  let toastT;
  const say = msg => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  const toggleWish = id => {
    const had = wish.includes(id);
    wish = had ? wish.filter(x => x !== id) : [...wish, id];
    save();
    renderWish();
    wishBtn.classList.remove('bump'); void wishBtn.offsetWidth; wishBtn.classList.add('bump');
    say(had ? 'Uklonjeno iz omiljenih' : 'Dodano u omiljene ♡');
  };
  cards.forEach(card => {
    $('.card__wish', card).addEventListener('click', e => {
      e.stopPropagation();
      toggleWish(card.dataset.id);
      if (!reduceMotion) burst(e.clientX, e.clientY);
    });
  });
  const drawer = $('#drawer');
  wishBtn.addEventListener('click', () => { drawer.hidden = false; });
  $$('[data-wish-close]').forEach(el => el.addEventListener('click', () => { drawer.hidden = true; }));
  renderWish();

  /* ----- Product modal ----- */
  const modal = $('#modal');
  const mImg = $('#modal-img');
  let lastFocus;
  const openModal = card => {
    lastFocus = document.activeElement;
    const img = $('.card__media img', card);
    mImg.src = img.getAttribute('src');
    mImg.alt = img.alt;
    $('#modal-title').textContent = $('.card__title', card).textContent;
    $('#modal-cat').textContent = $('.card__cat', card).textContent;
    $('#modal-desc').textContent = card.dataset.desc;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal__close', modal).focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  cards.forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });
  $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) closeModal();
    if (!drawer.hidden) drawer.hidden = true;
    if (nav.classList.contains('is-open')) setNav(false);
  });

  /* ----- Falling petals ----- */
  const canvas = $('#petals');
  const ctx = canvas.getContext('2d');
  let W, H, petals = [], dpr = Math.min(devicePixelRatio || 1, 2);
  const COLORS = ['#f4b8c6', '#eda3b5', '#f9d3dc', '#e7a0b2', '#fbe2e8'];
  const resize = () => {
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
  };
  const makePetal = (burstAt) => ({
    x: burstAt ? burstAt.x * dpr : Math.random() * W,
    y: burstAt ? burstAt.y * dpr : -20 * dpr - Math.random() * H,
    r: (6 + Math.random() * 7) * dpr,
    vx: burstAt ? (Math.random() - 0.5) * 5 * dpr : (0.2 + Math.random() * 0.5) * dpr,
    vy: burstAt ? (-2 - Math.random() * 3) * dpr : (0.5 + Math.random() * 0.8) * dpr,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.04,
    sway: Math.random() * Math.PI * 2,
    c: COLORS[(Math.random() * COLORS.length) | 0],
    life: burstAt ? 1 : Infinity,
    burst: !!burstAt,
  });
  const drawPetal = p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.burst ? Math.max(p.life, 0) : 0.75;
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.moveTo(0, -p.r);
    ctx.bezierCurveTo(p.r, -p.r * 0.6, p.r * 0.7, p.r * 0.6, 0, p.r);
    ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.6, -p.r, -p.r * 0.6, 0, -p.r);
    ctx.fill();
    ctx.restore();
  };
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    petals.forEach(p => {
      p.sway += 0.02;
      p.x += p.vx + Math.sin(p.sway) * 0.4 * dpr;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.burst) { p.vy += 0.12 * dpr; p.life -= 0.012; }
      else if (p.y > H + 30 * dpr) { p.y = -20 * dpr; p.x = Math.random() * W; }
      drawPetal(p);
    });
    petals = petals.filter(p => p.life > 0);
    requestAnimationFrame(tick);
  };
  function burst(x, y) {
    for (let i = 0; i < 14; i++) petals.push(makePetal({ x, y }));
  }
  if (!reduceMotion) {
    resize();
    addEventListener('resize', resize);
    const count = innerWidth < 640 ? 9 : 16;
    for (let i = 0; i < count; i++) petals.push(makePetal());
    requestAnimationFrame(tick);
  }
})();
