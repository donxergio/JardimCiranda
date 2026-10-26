/**
 * Jardim Ciranda — main.js
 * Interações gerais: menu, cabeçalho, animações suaves, WhatsApp flutuante,
 * aviso de privacidade (LGPD) e mapa sob demanda.
 * Sem dependências. Sem innerHTML com dados variáveis.
 */
(function () {
  'use strict';

  var CFG = window.CIRANDA_CONFIG || {};
  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  /* ---------- Defesa contra clickjacking ----------
     GitHub Pages não permite o cabeçalho X-Frame-Options e "frame-ancestors" é ignorado em <meta> CSP.
     Se a página for embutida em um iframe de outro site, saímos dele. */
  if (window.top !== window.self) {
    try { window.top.location.replace(window.self.location.href); } catch (e) { doc.body.hidden = true; }
  }

  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Ano no rodapé ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Links de WhatsApp com mensagem padrão ---------- */
  function buildWaUrl(message) {
    var number = String(CFG.whatsappNumber || '').replace(/\D/g, '');
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message || '');
  }
  window.CIRANDA_buildWaUrl = buildWaUrl; // reutilizado por form.js

  $$('[data-wa-link]').forEach(function (a) {
    a.href = buildWaUrl(CFG.whatsappDefaultMessage);
    a.rel = 'noopener noreferrer';
  });

  /* ---------- Garante rel seguro em TODOS os links externos ---------- */
  $$('a[href^="http"]').forEach(function (a) {
    if (a.host !== window.location.host) {
      a.rel = 'noopener noreferrer';
      if (!a.target) a.target = '_blank';
    }
  });

  /* ---------- Menu mobile ---------- */
  var toggle = $('.nav-toggle');
  var nav = $('#menu-principal');
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
  }

  /* ---------- Cabeçalho + WhatsApp flutuante conforme rolagem ---------- */
  var header = $('.site-header');
  var waFloat = $('.wa-float');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (waFloat) waFloat.classList.toggle('is-visible', y > 420);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Destaque do item de menu ativo ---------- */
  if ('IntersectionObserver' in window) {
    var links = $$('.nav__list a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Animações de entrada (suaves, respeitam reduced-motion) ---------- */
  var reveals = $$('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* =====================================================================
     PRIVACIDADE (LGPD)
     - Nenhum cookie é criado por este site.
     - A escolha do visitante fica no localStorage (apenas no próprio navegador).
     - "externos" libera o carregamento do mapa (OpenStreetMap).
     ===================================================================== */
  var CONSENT_KEY = 'ciranda-privacidade';
  var banner = $('#aviso-privacidade');

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== CFG.consentVersion) return null;
      return data.choice === 'externos' || data.choice === 'essencial' ? data.choice : null;
    } catch (e) { return null; }
  }

  function saveConsent(choice) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CFG.consentVersion, choice: choice, at: new Date().toISOString() }));
    } catch (e) { /* modo privado: segue sem persistir */ }
  }

  function updateBannerOffset() {
    if (!banner) return;
    var visible = !banner.hidden;
    doc.body.classList.toggle('has-consent-banner', visible && window.innerWidth < 700);
    if (visible) root.style.setProperty('--banner-h', (banner.offsetHeight + 16) + 'px');
  }

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    updateBannerOffset();
  }
  function hideBanner() {
    if (!banner) return;
    banner.hidden = true;
    updateBannerOffset();
  }

  if (banner) {
    if (!readConsent()) window.setTimeout(showBanner, 900);
    $$('[data-consent]', banner).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var choice = btn.getAttribute('data-consent') === 'externos' ? 'externos' : 'essencial';
        saveConsent(choice);
        hideBanner();
        if (choice === 'externos') maybeAutoLoadMap();
      });
    });
    window.addEventListener('resize', updateBannerOffset, { passive: true });
  }
  $$('[data-open-consent]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showBanner();
      var first = banner && banner.querySelector('button');
      if (first) first.focus();
    });
  });

  /* =====================================================================
     MAPA SOB DEMANDA (facade)
     O iframe só é criado após clique, ou automaticamente (com lazy-loading)
     se o visitante já permitiu conteúdos externos.
     ===================================================================== */
  var mapBox = $('#mapa');
  var mapLoaded = false;

  function loadMap() {
    if (!mapBox || mapLoaded) return;
    mapLoaded = true;
    var m = CFG.map || {};
    var src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(m.bbox) +
      '&layer=mapnik&marker=' + encodeURIComponent(m.lat + ',' + m.lng);
    var iframe = doc.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Mapa: localização do Jardim Ciranda na Rua General Andrade Neves, 462, Joinville';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    mapBox.textContent = '';
    mapBox.appendChild(iframe);
  }

  function maybeAutoLoadMap() {
    if (!mapBox || readConsent() !== 'externos') return;
    if ('IntersectionObserver' in window) {
      var mo = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadMap(); mo.disconnect(); }
      }, { rootMargin: '300px' });
      mo.observe(mapBox);
    } else {
      loadMap();
    }
  }

  var mapBtn = $('#btn-carregar-mapa');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      // Clique explícito = consentimento para este conteúdo
      loadMap();
    });
  }
  maybeAutoLoadMap();
})();
