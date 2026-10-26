/* PICO · núcleo del juego: escala, ajustes, HUD, modales, tarjetas, arrastrar/seleccionar, confeti */
(function () {
  'use strict';
  var W = 1920, H = 1080;
  var CANCEL = { cancel: true };
  var PIC = {
    bano: { label: 'BAÑO' }, aula: { label: 'AULA' }, patio: { label: 'PATIO' },
    direccion: { label: 'DIRECCIÓN' }, secretaria: { label: 'SECRETARÍA' }, edfisica: { label: 'EDUCACIÓN FÍSICA' },
    biblioteca: { label: 'BIBLIOTECA' }, entrada: { label: 'ENTRADA' },
    bano_m: { label: 'BAÑO MUJERES' }, bano_v: { label: 'BAÑO VARONES' }
  };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var ICON = {
    home: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 24 24 8l18 16" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22v18h8V29h8v11h8V22" fill="currentColor"/></svg>',
    soundOn: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 18h8l10-8v28l-10-8H6z" fill="currentColor"/><path d="M31 17c3 4 3 10 0 14M37 11c6 7 6 19 0 26" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 18h8l10-8v28l-10-8H6z" fill="currentColor"/><path d="M32 18l12 12M44 18 32 30" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/></svg>',
    access: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="9" r="5" fill="currentColor"/><path d="M8 17h32M24 17v13M24 30 15 43M24 30l9 13" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    repeat: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 18h8l10-8v28l-10-8H5z" fill="currentColor"/><path d="M30 16c4 5 4 11 0 16M36 10c7 8 7 20 0 28" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4l6.2 12.9 14.1 1.9-10.3 9.8 2.6 14L24 35.7 11.4 42.6l2.6-14L3.7 18.8l14.1-1.9z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 8v32l26-16z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>',
    again: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-5-10.7" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M40 6v13H27" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    how: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="5"/><path d="M18 19c0-4 3-6 6-6s6 2 6 5.5c0 4-6 4.5-6 9" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="36" r="2.8" fill="currentColor"/></svg>',
    print: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 16V6h22v10M13 34H6V16h36v18h-7" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/><rect x="13" y="28" width="22" height="14" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 10l28 28M38 10 10 38" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg>'
  };

  var G = window.G = {
    W: W, H: H, PIC: PIC, ICON: ICON, CANCEL: CANCEL, h: h, $: $, $$: $$, shuffle: shuffle, rnd: rnd,
    scale: 1, calm: false, fast: false, speedScale: 1, picos: [], screens: {}, levels: {},
    cfg: { calm: false, big: false, hc: false, master: true, music: true, voice: true, sfx: true },
    save: { done: [] }, run: null, instr: null, pico: null, cur: null, errors: 0, prog: { n: 0, total: 0 }
  };

  /* ---------- guardado local (solo avance y opciones; nunca datos personales) ---------- */
  function loadSave() {
    var hadCfg = false;
    try {
      var s = JSON.parse(localStorage.getItem('pico_inclusion_v1') || '{}');
      if (s.cfg) { for (var k in s.cfg) if (k in G.cfg) G.cfg[k] = !!s.cfg[k]; hadCfg = true; }
      if (s.done && s.done.length) G.save.done = s.done.filter(function (n) { return n >= 1 && n <= 5; });
    } catch (e) {}
    if (!hadCfg) {
      try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) G.cfg.calm = true; } catch (e) {}
    }
  }
  function persist() {
    try { localStorage.setItem('pico_inclusion_v1', JSON.stringify({ cfg: G.cfg, done: G.save.done })); } catch (e) {}
  }
  G.markDone = function (n) { if (G.save.done.indexOf(n) < 0) G.save.done.push(n); persist(); };

  G.applyCfg = function () {
    var a = $('#app'), c = G.cfg;
    G.calm = !!c.calm;
    a.classList.toggle('calm', c.calm); a.classList.toggle('big', c.big); a.classList.toggle('hc', c.hc);
    ['master', 'music', 'voice', 'sfx'].forEach(function (k) { window.Snd.set(k, c[k]); });
    var snd = $('#btnSnd');
    if (snd) { snd.innerHTML = c.master ? ICON.soundOn : ICON.soundOff; snd.setAttribute('aria-pressed', c.master ? 'false' : 'true'); snd.setAttribute('aria-label', c.master ? 'DESACTIVAR SONIDO' : 'ACTIVAR SONIDO'); }
    $$('[data-sndlabel]').forEach(function (b) {
      b.innerHTML = (c.master ? ICON.soundOn : ICON.soundOff) + '<span>' + (c.master ? 'DESACTIVAR SONIDO' : 'ACTIVAR SONIDO') + '</span>';
    });
  };
  G.setCfg = function (k, v) { G.cfg[k] = v; G.applyCfg(); persist(); };
  G.toggleSound = function () { G.setCfg('master', !G.cfg.master); };

  /* ---------- escena escalada ---------- */
  function fit() {
    var a = $('#app'), vw = a.clientWidth || window.innerWidth, vh = a.clientHeight || window.innerHeight;
    var s = Math.min(vw / W, vh / H); G.scale = s;
    $('#stage').style.transform = 'translate(' + ((vw - W * s) / 2) + 'px,' + ((vh - H * s) / 2) + 'px) scale(' + s + ')';
  }
  G.fit = fit;
  G.toStage = function (cx, cy) {
    var r = $('#stage').getBoundingClientRect();
    return { x: (cx - r.left) / G.scale, y: (cy - r.top) / G.scale };
  };
  G.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, G.fast ? Math.min(ms, 40) : ms); }); };

  /* ---------- fondos ---------- */
  var BG = { hall: 'hall.jpg', ext_a: 'ext_a.jpg', ext_b: 'ext_b.jpg', ext_c: 'ext_c.jpg', map: 'map.jpg', map_gray: 'map_gray.jpg' };
  var bgFlip = false, bgNow = null;
  G.setBg = function (name, instant) {
    if (name === bgNow) return; bgNow = name;
    var a = $('#bgA'), b = $('#bgB'), on = bgFlip ? a : b, off = bgFlip ? b : a;
    bgFlip = !bgFlip;
    on.style.backgroundImage = 'url(img/bg/' + BG[name] + ')';
    if (instant) { on.style.transition = off.style.transition = 'none'; }
    on.classList.add('on'); off.classList.remove('on');
    if (instant) { void on.offsetWidth; on.style.transition = off.style.transition = ''; }
  };

  /* ---------- globo de PICO ---------- */
  G.showBubble = function (text) {
    var b = $('#bubble');
    if (!text) { b.classList.remove('on'); return; }
    $('#bubbleText').textContent = text; b.classList.add('on');
    b.classList.toggle('sm', text.length > 68 && text.length <= 92);
    b.classList.toggle('xs', text.length > 92);
    $('#sr').textContent = text;
  };
  G.say = function (id, o) {
    o = o || {};
    var text = String((window.VOZ || {})[id] || '').toUpperCase();
    G.showBubble(text);
    if (o.instr) G.instr = id;
    return window.Snd.say(id);
  };
  G.repeat = function () {
    if (!G.instr) return;
    G.showBubble(String(window.VOZ[G.instr] || '').toUpperCase());
    window.Snd.say(G.instr);
    if (G.pico && !G.pico.dead) G.pico.talk(true);
  };

  /* ---------- HUD y progreso ---------- */
  G.hud = function (on) { $('#hud').hidden = !on; if (!on) G.showBubble(null); };
  G.hudParts = function (o) {
    $('#stars').style.display = o.stars === false ? 'none' : '';
    $('#btnRepeat').style.display = o.repeat === false ? 'none' : '';
  };
  function starsHtml(n, total) {
    var s = '';
    for (var i = 0; i < total; i++) s += '<span class="st' + (i < n ? ' full' : '') + '">' + ICON.star + '</span>';
    return s;
  }
  G.setProgress = function (n, total) {
    G.prog = { n: n, total: total };
    var el = $('#stars');
    if (!total) { el.style.display = 'none'; return; }
    el.style.display = ''; el.innerHTML = starsHtml(n, total);
    el.setAttribute('aria-label', 'ESTRELLAS: ' + n + ' DE ' + total);
  };
  G.starPos = function (i) { return { x: 142 + 24 + i * 50, y: 60 }; };
  G.addProgress = function (fromX, fromY) {
    var i = G.prog.n; G.prog.n++;
    var done = function () { G.setProgress(G.prog.n, G.prog.total); var s = $$('#stars .st')[i]; if (s && !G.calm) s.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 450 }); };
    if (fromX == null || G.calm || G.fast) { done(); return; }
    var p = G.starPos(i), f = h('span', 'flystar', ICON.star);
    $('#fxdom').appendChild(f);
    var an = f.animate([{ transform: 'translate(' + (fromX - 30) + 'px,' + (fromY - 30) + 'px) scale(.4)', opacity: 0.2 },
      { transform: 'translate(' + (fromX - 30) + 'px,' + (fromY - 120) + 'px) scale(1.5)', opacity: 1, offset: 0.3 },
      { transform: 'translate(' + (p.x - 30) + 'px,' + (p.y - 30) + 'px) scale(.8)', opacity: 1 }], { duration: 900, easing: 'ease-in-out' });
    an.onfinish = function () { f.remove(); done(); };
    an.oncancel = function () { f.remove(); done(); };
  };

  /* ---------- chispas y confeti ---------- */
  var COLORS = ['#FFC933', '#FF6B6B', '#4CC36B', '#3BA7FF', '#B28BFF', '#FF9F43', '#2EC4C6'];
  G.sparkle = function (x, y, n) {
    if (G.calm || G.fast) return;
    n = n || 9;
    for (var i = 0; i < n; i++) {
      var s = h('span', 'spark', ICON.star); s.style.color = COLORS[i % COLORS.length];
      $('#fxdom').appendChild(s);
      var ang = (Math.PI * 2 * i) / n + rnd(-0.3, 0.3), d = rnd(70, 150);
      var an = s.animate([{ transform: 'translate(' + (x - 16) + 'px,' + (y - 16) + 'px) scale(.2) rotate(0)', opacity: 1 },
        { transform: 'translate(' + (x - 16 + Math.cos(ang) * d) + 'px,' + (y - 16 + Math.sin(ang) * d) + 'px) scale(1) rotate(160deg)', opacity: 0 }],
        { duration: rnd(650, 950), easing: 'cubic-bezier(.2,.7,.3,1)' });
      (function (el) { an.onfinish = function () { el.remove(); }; })(s);
    }
  };
  var parts = [], fxOn = false, fxT = 0;
  G.confetti = function (o) {
    if (G.calm || G.fast) return;
    o = o || {};
    var n = o.n || 110;
    for (var i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(-500, -20), vx: rnd(-25, 25), vy: rnd(90, 210), r: rnd(0, 6), vr: rnd(-3, 3), sz: rnd(10, 22), c: COLORS[i % COLORS.length], star: i % 4 === 0, ph: rnd(0, 6), t: 0 });
    if (!fxOn) { fxOn = true; fxT = Date.now(); requestAnimationFrame(stepFx); }
  };
  function stepFx() {
    var cv = $('#fx'), c = cv.getContext('2d'), now = Date.now(), dt = Math.min(0.05, (now - fxT) / 1000); fxT = now;
    c.clearRect(0, 0, W, H);
    parts = parts.filter(function (p) {
      p.t += dt; p.y += p.vy * dt; p.x += (p.vx + Math.sin(p.t * 2.5 + p.ph) * 40) * dt; p.r += p.vr * dt;
      if (p.y > H + 40) return false;
      c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.globalAlpha = 0.95;
      if (p.star) {
        c.beginPath();
        for (var k = 0; k < 10; k++) { var rad = k % 2 ? p.sz * 0.45 : p.sz; var a = Math.PI * k / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
        c.closePath(); c.fill();
      } else c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2);
      c.restore();
      return true;
    });
    if (parts.length) requestAnimationFrame(stepFx); else { fxOn = false; c.clearRect(0, 0, W, H); }
  }

  /* ---------- control de ejecución de cada pantalla/nivel ---------- */
  G.newRun = function () {
    if (G.run) { G.run.dead = true; G.run.cleanups.forEach(function (f) { try { f(); } catch (e) {} }); }
    window.Snd.stopVoice();
    var c = { dead: false, cleanups: [] };
    c.a = function (p) { return Promise.resolve(p).then(function (r) { if (c.dead) throw CANCEL; return r; }); };
    c.sleep = function (ms) { return c.a(G.sleep(ms)); };
    c.say = function (id, o) { return c.a(G.say(id, o)); };
    c.on = function (el, ev, fn, opt) { el.addEventListener(ev, fn, opt); c.cleanups.push(function () { el.removeEventListener(ev, fn, opt); }); };
    G.run = c; return c;
  };
  G.mkPico = function (o) {
    var p = new window.Pico($('#scene'), o); p.idle(); G.picos.push(p); G.pico = p; return p;
  };
  G.clear = function () {
    G.picos.forEach(function (p) { p.remove(); }); G.picos = []; G.pico = null;
    $('#scene').innerHTML = ''; $('#deck').innerHTML = ''; $('#fxdom').innerHTML = '';
    $('#world').style.transform = ''; $('#world').style.transition = '';
    $$('.ghost').forEach(function (g) { g.remove(); });
    G.instr = null; window.Snd.stopVoice(); G.showBubble(null);
  };
  G.cover = function (on) {
    $('#curtain').classList.toggle('on', on);
    return new Promise(function (r) { setTimeout(r, G.fast ? 20 : 380); });
  };
  G.go = function (target) {
    var ctx = G.newRun();
    G.hideModal();
    return G.cover(true).then(function () {
      if (ctx.dead) return;
      G.clear(); G.cur = target;
      var fn = G.screens[target];
      var out = fn(ctx);
      if (out && out.catch) out.catch(function (e) { if (e !== CANCEL) { G.errors++; console.error(e); } });
      return G.cover(false);
    });
  };

  /* ---------- modales ---------- */
  G.modalOpen = false;
  G.modal = function (node, o) {
    o = o || {};
    var m = $('#modal'); m.innerHTML = '';
    var panel = h('div', 'panel ' + (o.cls || '')); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    if (o.label) panel.setAttribute('aria-label', o.label);
    panel.appendChild(node); m.appendChild(panel); m.hidden = false;
    G.modalOpener = document.activeElement; G.modalOpen = true; G.modalOnClose = o.onClose || null;
    var f = $('[data-autofocus]', panel) || $('button, input', panel); if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 30);
    return panel;
  };
  G.hideModal = function () {
    var m = $('#modal'); if (m.hidden) return;
    m.hidden = true; m.innerHTML = ''; G.modalOpen = false;
    var cb = G.modalOnClose; G.modalOnClose = null;
    if (G.modalOpener && document.contains(G.modalOpener)) { try { G.modalOpener.focus({ preventScroll: true }); } catch (e) {} }
    if (cb) cb();
  };
  G.closeBtn = function () {
    var b = h('button', 'btn btn-white btn-small closebtn', ICON.close + '<span>CERRAR</span>'); b.type = 'button';
    b.addEventListener('click', function () { window.Snd.sfx('click'); G.hideModal(); });
    return b;
  };
  function toggleRow(label, key, hint) {
    var r = h('div', 'trow');
    var b = h('button', 'tog'); b.type = 'button'; b.setAttribute('role', 'switch'); b.dataset.key = key;
    var sync = function () { var on = !!G.cfg[key]; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.innerHTML = '<span class="knob"></span><span class="tv">' + (on ? 'SÍ' : 'NO') + '</span>'; };
    sync();
    b.addEventListener('click', function () { G.setCfg(key, !G.cfg[key]); window.Snd.sfx('click'); sync(); });
    r.appendChild(h('div', 'tl', '<b>' + label + '</b>' + (hint ? '<small>' + hint + '</small>' : '')));
    r.appendChild(b); return r;
  }
  G.accessibility = function () {
    var box = h('div', 'acc'); box.appendChild(h('h2', '', ICON.access + '<span>ACCESIBILIDAD</span>'));
    var list = h('div', 'tlist');
    list.appendChild(toggleRow('TEXTO GRANDE', 'big'));
    list.appendChild(toggleRow('ALTO CONTRASTE', 'hc'));
    list.appendChild(toggleRow('MENOS ANIMACIONES', 'calm', 'SIN CONFETI NI SALTOS'));
    list.appendChild(toggleRow('VOCES DE PICO', 'voice'));
    list.appendChild(toggleRow('MÚSICA', 'music'));
    list.appendChild(toggleRow('EFECTOS DE SONIDO', 'sfx'));
    box.appendChild(list);
    var row = h('div', 'btnrow');
    var fs = h('button', 'btn btn-blue btn-small', '<span>PANTALLA COMPLETA</span>'); fs.type = 'button';
    fs.addEventListener('click', function () { G.fullscreen(); });
    row.appendChild(fs); row.appendChild(G.closeBtn());
    box.appendChild(row);
    box.appendChild(h('p', 'note', 'TECLADO: TAB PARA MOVERSE · ENTER O ESPACIO PARA ELEGIR · FLECHAS ENTRE TARJETAS · ESC PARA EL MENÚ · R PARA ESCUCHAR OTRA VEZ'));
    G.modal(box, { cls: 'wide', label: 'ACCESIBILIDAD' });
  };
  G.fullscreen = function () {
    try {
      var d = document, el = $('#app');
      if (d.fullscreenElement) d.exitFullscreen();
      else if (el.requestFullscreen) { var p = el.requestFullscreen(); if (p && p.catch) p.catch(function () {}); }
    } catch (e) {}
  };
  G.howTo = function () {
    var box = h('div', 'how'); box.appendChild(h('h2', '', ICON.how + '<span>CÓMO JUGAR</span>'));
    var st = h('div', 'steps');
    st.innerHTML =
      '<div class="step"><div class="ill"><div class="mini card"><img src="img/picto/patio.webp" alt=""><span class="lbl">PATIO</span></div><svg class="hand" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 4v26l7-6 5 12 7-3-5-11 10-1z" fill="#fff" stroke="#1E3A5F" stroke-width="3.5" stroke-linejoin="round"/></svg></div><b>1. TOCÁ LA IMAGEN</b></div>' +
      '<div class="step"><div class="ill"><div class="mini card sel"><img src="img/picto/aula.webp" alt=""><span class="lbl">AULA</span></div><svg class="arrow" viewBox="0 0 120 40" aria-hidden="true"><path d="M4 20h98m-22-16 22 16-22 16" fill="none" stroke="#FF8A00" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="minidoor"></div></div><b>2. ARRASTRALA A LA PUERTA O TOCÁ LA PUERTA</b></div>' +
      '<div class="step"><div class="ill"><div class="roundico big">' + ICON.repeat + '</div></div><b>3. TOCÁ EL PARLANTE PARA ESCUCHAR OTRA VEZ</b></div>';
    box.appendChild(st);
    box.appendChild(h('p', 'note', '¡NO PASA NADA SI TE EQUIVOCÁS! PODÉS INTENTAR TODAS LAS VECES QUE QUIERAS.'));
    var row = h('div', 'btnrow'); var ok = h('button', 'btn btn-go', '<span>¡ENTENDIDO!</span>'); ok.type = 'button'; ok.dataset.autofocus = '1';
    ok.addEventListener('click', function () { window.Snd.sfx('click'); window.Snd.stopVoice(); G.hideModal(); });
    row.appendChild(ok); box.appendChild(row);
    G.modal(box, { cls: 'wide', label: 'CÓMO JUGAR', onClose: function () { window.Snd.stopVoice(); } });
    window.Snd.say('como');
  };
  G.credits = function () {
    var box = h('div', 'cred'); box.appendChild(h('h2', '', '<span>CRÉDITOS</span>'));
    box.appendChild(h('div', 'ctext',
      '<p><b>PICTOGRAMAS:</b> ARASAAC (arasaac.org).<br>AUTOR: SERGIO PALAO. PROCEDENCIA: ARASAAC. PROPIEDAD: GOBIERNO DE ARAGÓN. LICENCIA: CC BY-NC-SA.</p>' +
      '<p><b>PERSONAJE Y JUEGO:</b> PICO, ILUSTRACIONES, ANIMACIONES Y PROGRAMACIÓN CREADOS PARA EL MES DE LA INCLUSIÓN (OCTUBRE).</p>' +
      '<p><b>VOZ:</b> VOZ SINTÉTICA (IA) GENERADA CON ELEVENLABS, EN ESPAÑOL ARGENTINO.<br><b>MÚSICA Y EFECTOS:</b> SINTETIZADOS CON CÓDIGO PARA ESTE JUEGO.<br><b>TIPOGRAFÍA:</b> POPPINS (SIL OPEN FONT LICENSE).</p>' +
      '<p><b>PRIVACIDAD:</b> SIN CUENTAS, SIN PUBLICIDAD Y SIN DATOS PERSONALES. SOLO SE GUARDAN EN ESTE NAVEGADOR EL AVANCE Y LAS OPCIONES DE ACCESIBILIDAD.</p>' +
      '<p><b>USO:</b> SOLO EDUCATIVO Y NO COMERCIAL.</p>'));
    var row = h('div', 'btnrow'); row.appendChild(G.closeBtn()); box.appendChild(row);
    G.modal(box, { cls: 'wide', label: 'CRÉDITOS' });
  };
  var TITLES = ['¿DÓNDE ESTÁ PICO?', '¡CADA CARTEL A SU LUGAR!', 'EL PICTOGRAMA PERDIDO', 'ACOMPAÑAMOS A PICO', '¡MISIÓN INCLUSIVA!'];
  G.levelTitles = TITLES;
  var TILEIMG = ['img/picto/bano.webp', 'img/ui/door.webp', 'img/ui/clue_patio.webp', 'img/bg/map.jpg', 'img/ui/clue_entrada.webp'];
  G.missions = function () {
    var box = h('div', 'mis'); box.appendChild(h('h2', '', ICON.star + '<span>MISIONES</span>'));
    var grid = h('div', 'tiles');
    TITLES.forEach(function (t, i) {
      var b = h('button', 'tile' + (G.save.done.indexOf(i + 1) >= 0 ? ' done' : '')); b.type = 'button';
      b.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="timg" style="background-image:url(' + TILEIMG[i] + ')"></span><span class="tt">' + t + '</span>' +
        (G.save.done.indexOf(i + 1) >= 0 ? '<span class="chk">' + ICON.star + '</span>' : '');
      b.addEventListener('click', function () { window.Snd.sfx('click'); G.hideModal(); G.go(i + 1); });
      grid.appendChild(b);
    });
    box.appendChild(grid);
    var row = h('div', 'btnrow'); row.appendChild(G.closeBtn()); box.appendChild(row);
    G.modal(box, { cls: 'wide', label: 'MISIONES' });
  };
  G.menu = function () {
    if (G.modalOpen) return;
    var box = h('div', 'menu'); box.appendChild(h('h2', '', '<span>MENÚ</span>'));
    var col = h('div', 'mcol');
    function mk(cls, ic, txt, fn, af) { var b = h('button', 'btn ' + cls, ic + '<span>' + txt + '</span>'); b.type = 'button'; if (af) b.dataset.autofocus = '1'; b.addEventListener('click', function () { window.Snd.sfx('click'); fn(); }); col.appendChild(b); return b; }
    mk('btn-go', ICON.play, 'SEGUIR JUGANDO', function () { G.hideModal(); }, true);
    mk('btn-sun', ICON.star, 'MISIONES', function () { G.hideModal(); G.missions(); });
    mk('btn-blue', ICON.access, 'ACCESIBILIDAD', function () { G.hideModal(); G.accessibility(); });
    mk('btn-white', ICON.home, 'VOLVER AL INICIO', function () { G.hideModal(); G.go('title'); });
    box.appendChild(col);
    G.modal(box, { cls: 'narrow', label: 'MENÚ' });
  };

  /* ---------- tarjetas, filas y elección simple ---------- */
  G.card = function (key, w, lf) {
    var b = h('button', 'card'); b.type = 'button'; b.dataset.key = key;
    b.style.setProperty('--cw', w + 'px'); b.style.setProperty('--lf', (lf || 30) + 'px');
    b.setAttribute('aria-label', PIC[key].label);
    b.innerHTML = '<img src="img/picto/' + key + '.webp" alt=""><span class="lbl">' + PIC[key].label + '</span>';
    return b;
  };
  G.row = function (css, cls) {
    var r = h('div', 'row ' + (cls || '')); for (var k in css) r.style[k] = css[k];
    $('#deck').appendChild(r); return r;
  };
  G.cardsIn = function (cards) {
    cards.forEach(function (c, i) { c.style.animationDelay = (i * 0.08) + 's'; c.classList.add('in'); });
    window.Snd.sfx('whoosh', 0.8);
  };
  G.choice = function (root, ctx) {
    var res = null, queued = null;
    var fn = function (e) {
      var b = e.target.closest('.card');
      if (!b || b.classList.contains('lock') || root.classList.contains('busy')) return;
      if (res) { var r = res; res = null; r(b); }
      else { queued = b; window.Snd.stopVoice(); }   /* tocó durante la ayuda: se atiende enseguida */
    };
    root.addEventListener('click', fn);
    if (ctx) ctx.cleanups.push(function () { root.removeEventListener('click', fn); });
    return {
      next: function () {
        if (queued && !queued.classList.contains('lock')) { var q = queued; queued = null; return Promise.resolve(q); }
        queued = null;
        return new Promise(function (r) { res = r; });
      },
      queued: function () { return !!queued; }
    };
  };

  /* ---------- arrastrar o seleccionar → soltar en un objetivo ---------- */
  G.matcher = function (ctx, cards, targets, onSelect) {
    var pending = null, sel = null, drag = null, suppress = false, queued = null;
    function setSel(c, via) {
      if (sel) sel.classList.remove('sel');
      sel = c; if (c) c.classList.add('sel');
      targets.forEach(function (t) { t.classList.toggle('ready', !!c); });
      if (c && onSelect) onSelect(c, via);
    }
    function attempt(card, target, via) {
      setSel(null);
      if (!pending) { queued = { card: card, target: target, via: via }; window.Snd.stopVoice(); return true; }
      var r = pending; pending = null; r({ card: card, target: target, via: via }); return true;
    }
    function overTarget(cx, cy) {
      var best = null;
      targets.forEach(function (t) {
        if (t.classList.contains('full')) return;
        var r = t.getBoundingClientRect(), m = 14 * G.scale;
        if (cx >= r.left - m && cx <= r.right + m && cy >= r.top - m && cy <= r.bottom + m) best = t;
      });
      return best;
    }
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        if (suppress || c.classList.contains('gone') || c.classList.contains('lock')) return;
        window.Snd.sfx('click'); setSel(sel === c ? null : c, 'click');
      });
      c.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (c.classList.contains('gone') || c.classList.contains('lock')) return;
        drag = { c: c, id: e.pointerId, x0: e.clientX, y0: e.clientY, on: false, ghost: null };
      });
    });
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 12 * G.scale) return;
        drag.on = true; setSel(drag.c, 'drag');
        var g = drag.c.cloneNode(true); g.classList.add('ghost'); g.classList.remove('sel', 'in', 'hint');
        g.style.animation = 'none'; g.removeAttribute('id'); $('#stage').appendChild(g); drag.ghost = g;
        drag.w = drag.c.offsetWidth; drag.h = drag.c.offsetHeight;
        drag.c.classList.add('drag-src'); window.Snd.sfx('pop', 0.7);
      }
      var p = G.toStage(e.clientX, e.clientY);
      drag.ghost.style.left = (p.x - drag.w / 2) + 'px'; drag.ghost.style.top = (p.y - drag.h / 2) + 'px';
      var t = overTarget(e.clientX, e.clientY);
      targets.forEach(function (x) { x.classList.toggle('hover', x === t); });
      e.preventDefault();
    }
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      if (!d.on) return;
      suppress = true; setTimeout(function () { suppress = false; }, 60);
      var t = e.type === 'pointercancel' ? null : overTarget(e.clientX, e.clientY);
      targets.forEach(function (x) { x.classList.remove('hover'); });
      d.c.classList.remove('drag-src');
      if (d.ghost) d.ghost.remove();
      if (t && attempt(d.c, t, 'drag')) return;
      if (t) { setSel(null); return; }
      setSel(null);
      /* soltó en cualquier lado: la tarjeta vuelve sola */
      d.c.animate([{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 250 });
    }
    ctx.on(document, 'pointermove', move, { passive: false });
    ctx.on(document, 'pointerup', up);
    ctx.on(document, 'pointercancel', up);
    targets.forEach(function (t) {
      t.addEventListener('click', function () {
        if (t.classList.contains('full')) return;
        if (sel) { attempt(sel, t, 'click'); }
        else { window.Snd.sfx('soft'); cards.forEach(function (c) { if (!c.classList.contains('gone')) c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 450 }); }); }
      });
    });
    return {
      next: function () {
        if (queued) { var q = queued; queued = null; return Promise.resolve(q); }
        return new Promise(function (r) { pending = r; });
      },
      clear: function () { setSel(null); }
    };
  };

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'Escape') {
      if (G.modalOpen) { G.hideModal(); e.preventDefault(); }
      else if (!$('#hud').hidden) { G.menu(); e.preventDefault(); }
      return;
    }
    if (k === 'Tab' && G.modalOpen) {
      var f = $$('#modal button, #modal input').filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (f.length) {
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { f[f.length - 1].focus({ preventScroll: true }); e.preventDefault(); }
        else if (!e.shiftKey && i === f.length - 1) { f[0].focus({ preventScroll: true }); e.preventDefault(); }
      }
      return;
    }
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if ((k === 'r' || k === 'R') && tag !== 'INPUT' && !G.modalOpen && !$('#hud').hidden) { G.repeat(); return; }
    if ((k === 'f' || k === 'F') && tag !== 'INPUT') { G.fullscreen(); return; }
    if (k === 'ArrowRight' || k === 'ArrowLeft') {
      var cur = document.activeElement, grp = cur && cur.closest && cur.closest('.row, .doors, .tiles');
      if (!grp) return;
      var items = $$('button:not([disabled]):not(.gone)', grp).filter(function (x) { return x.offsetParent !== null; });
      var ix = items.indexOf(cur); if (ix < 0) return;
      var nx = items[(ix + (k === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
      if (nx) { nx.focus({ preventScroll: true }); e.preventDefault(); }
    }
  });

  /* ---------- inicio ---------- */
  function boot() {
    loadSave();
    var q = location.search || '';
    if (/[?&]fast/.test(q)) { G.fast = true; G.speedScale = 8; window.Snd.fast = true; }
    fit(); window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    G.applyCfg();
    $('#btnMenu').addEventListener('click', function () { window.Snd.sfx('click'); G.menu(); });
    $('#btnSnd').addEventListener('click', function () { G.toggleSound(); });
    $('#btnAcc').addEventListener('click', function () { window.Snd.sfx('click'); G.accessibility(); });
    $('#btnRepeat').addEventListener('click', function () { window.Snd.sfx('click'); G.repeat(); });
    window.Snd.onSpeak(function (on) { if (G.pico && !G.pico.dead) G.pico.talk(on); });
    var gate = $('#gateBtn');
    gate.addEventListener('click', function () {
      window.Snd.sfx('click'); $('#gate').classList.add('off');
      setTimeout(function () { $('#gate').hidden = true; }, 500);
      G.started = true;
      window.Snd.music('calm');
      if (G.screens.titleStart) G.screens.titleStart();
    });
    G.go('title');
    try {
      if ('serviceWorker' in navigator && /^https?:/.test(location.protocol) && !window.PICO_PREVIEW) navigator.serviceWorker.register('sw.js').catch(function () {});
    } catch (e) {}
  }
  G.boot = function () { if (G.booted) return; G.booted = true; boot(); };
  G.booted = false;
})();
