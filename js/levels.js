/* PICO · los cinco niveles */
(function () {
  'use strict';
  var G = window.G, Snd = window.Snd, h = G.h, $ = G.$, ICON = G.ICON, PIC = G.PIC, shuffle = G.shuffle;
  var WALK = ['walk_0', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'walk_5', 'walk_6', 'walk_7'];
  var okIdx = 0;
  function okId() { return ['ok1', 'ok2', 'ok3'][okIdx++ % 3]; }
  function center(el) { var r = el.getBoundingClientRect(); return G.toStage(r.left + r.width / 2, r.top + r.height / 2); }
  function restoreBubble() { if (G.instr) G.showBubble(String(window.VOZ[G.instr] || '').toUpperCase()); }
  function shake(el) { if (!G.calm) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(12px)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(0)' }], { duration: 380 }); }
  function lockEl(c, on) { c.classList.toggle('lock', on); c.disabled = !!on && c.classList.contains('gone'); }

  /* PICO señala cada imagen y dice su nombre ("miremos las imágenes otra vez") */
  async function review(ctx, row, cards, ch) {
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (ch && ch.queued()) break;
      if (c.classList.contains('lock') || c.classList.contains('gone')) continue;
      c.classList.add('speak');
      await ctx.say('lbl_' + c.dataset.key);
      c.classList.remove('speak');
      if (!(ch && ch.queued())) await ctx.sleep(120);
    }
    cards.forEach(function (c) { c.classList.remove('speak'); });
    restoreBubble();
  }

  /* respuesta equivocada: sin penalización, con ayuda amable */
  async function gentleWrong(ctx, pico, row, cards, b, tries, answerKey, extra, ch) {
    Snd.sfx('soft'); b.classList.add('tried', 'lock'); shake(b);
    pico.oops(1000);
    await ctx.say('retry');
    await review(ctx, row, cards, ch);
    if (tries >= 2) cards.forEach(function (c) { if (c.dataset.key === answerKey) c.classList.add('hint'); });
    if (extra && !(ch && ch.queued())) await extra();
    pico.idle();
  }

  /* ============ NIVEL 1 · ¿DÓNDE ESTÁ PICO? ============ */
  var L1 = [
    { q: 'q1', key: 'bano', opts: ['bano', 'patio'], bg: 'hall', act: 'squirm' },
    { q: 'q2', key: 'patio', opts: ['patio', 'aula'], bg: 'ext_b', act: 'cheer' },
    { q: 'q3', key: 'aula', opts: ['patio', 'aula', 'bano'], bg: 'hall', act: 'wave' },
    { q: 'q4', key: 'direccion', opts: ['aula', 'direccion', 'patio'], bg: 'hall', act: 'think' },
    { q: 'q5', key: 'edfisica', opts: ['bano', 'patio', 'edfisica'], bg: 'ext_c', act: 'run' },
    { q: 'q6', key: 'secretaria', opts: ['direccion', 'secretaria', 'aula'], bg: 'hall', act: 'point' }
  ];
  G.screens[1] = async function (ctx) {
    G.hud(true); G.hudParts({ stars: true, repeat: true }); G.setProgress(0, L1.length);
    Snd.music('play'); G.setBg(L1[0].bg, true);
    var pico = G.mkPico({ x: -260, y: 930, s: 1.0 });
    await ctx.a(Promise.all([pico.walkTo(420, 930, { speed: 460 }), G.say('l1i')]));
    for (var i = 0; i < L1.length; i++) {
      var s = L1[i], last = i === L1.length - 1;
      if (i > 0) {
        G.setBg(s.bg);
        pico.place(-260, 930, 1, false);
        await ctx.a(pico.walkTo(420, 930, { speed: 520 }));
      }
      var act = ({ squirm: function () { pico.cycle(['crouch', 'idle_smile'], 4); }, cheer: function () { pico.cheer(0); }, wave: function () { pico.wave(0); },
        think: function () { pico.hold('think'); }, run: function () { pico.cycle(WALK, 14); }, point: function () { pico.hold('point_r'); } })[s.act];
      act();
      await ctx.say(s.q, { instr: true });
      pico.idle();
      var opts = shuffle(s.opts);
      var row = G.row({ left: '700px', width: '1160px', top: '500px', height: '440px', gap: '40px' });
      var cards = opts.map(function (k) { return G.card(k, 330, 36); });
      cards.forEach(function (c) { row.appendChild(c); });
      G.cardsIn(cards);
      if (i === 0) cards[0].focus({ preventScroll: true });
      var ch = G.choice(row, ctx), tries = 0, b;
      while (true) {
        b = await ctx.a(ch.next());
        if (b.dataset.key === s.key) break;
        tries++;
        await gentleWrong(ctx, pico, row, cards, b, tries, s.key, null, ch);
      }
      row.classList.add('busy'); b.classList.add('good'); Snd.sfx('ok');
      var cp = center(b); G.sparkle(cp.x, cp.y, 12);
      await ctx.a(Promise.all([pico.jump(), G.say(okId())]));
      G.addProgress(cp.x, cp.y);
      if (!last) {
        row.classList.add('out'); Snd.sfx('door');
        await ctx.a(pico.walkTo(2150, 930, { speed: 640, keep: true }));
        row.remove();
      } else {
        await ctx.sleep(300);
      }
    }
    await G.levelDone(ctx, 1, 'l1d');
  };

  /* ============ NIVEL 2 · ¡CADA CARTEL A SU LUGAR! ============ */
  var DOORS = ['aula', 'bano', 'direccion', 'secretaria', 'patio', 'edfisica'];
  G.screens[2] = async function (ctx) {
    G.hud(true); G.hudParts({ stars: true, repeat: true }); G.setProgress(0, 6);
    Snd.music('play'); G.setBg('hall', true);
    var sc = $('#scene'), wrap = h('div', 'doors'); sc.appendChild(wrap);
    var gap = (1780 - 6 * 241) / 5;
    var doors = DOORS.map(function (k, i) {
      var d = h('button', 'door'); d.type = 'button'; d.dataset.key = k;
      d.style.left = (70 + i * (241 + gap)) + 'px'; d.style.top = '296px';
      d.setAttribute('aria-label', 'PUERTA CON EL DIBUJO DE: ' + PIC[k].label);
      d.innerHTML = '<span class="win"><img src="img/ui/clue_' + k + '.webp" alt=""></span>' +
        '<span class="sign"><img src="img/picto/' + k + '.webp" alt=""><b>' + PIC[k].label + '</b></span>';
      wrap.appendChild(d); return d;
    });
    var pico = G.mkPico({ x: 2150, y: 1050, s: 0.5, flip: true });
    var row = G.row({ left: '0', width: '1920px', top: '836px', height: '240px', gap: '24px' });
    var cards = shuffle(DOORS).map(function (k) { return G.card(k, 180, 20); });
    cards.forEach(function (c) { row.appendChild(c); });
    var told = false, fails = {}, placed = 0, lastRetry = 0;
    var m = G.matcher(ctx, cards, doors, function (c, via) {
      if (via === 'click' && !told) { told = true; G.say('tapdoor'); }
    });
    await ctx.a(Promise.all([pico.walkTo(1760, 1050, { speed: 500 }), G.say('l2i', { instr: true })]));
    pico.look('l');
    G.cardsIn(cards); cards[0].focus({ preventScroll: true });
    while (placed < 6) {
      var r = await ctx.a(m.next());
      var key = r.card.dataset.key;
      if (key === r.target.dataset.key) {
        placed++;
        r.card.classList.add('gone'); r.card.disabled = true; r.card.classList.remove('sel');
        var t = r.target; t.classList.add('full', 'lit'); t.classList.remove('ready');
        Snd.sfx('ok'); Snd.sfx('star', 0.8);
        var cp = center(t); G.sparkle(cp.x, cp.y - 40, 12);
        G.addProgress(cp.x, cp.y);
        setTimeout(function (el) { el.classList.remove('lit'); }, 1500, t);
        pico.pose('cheer_a', 900);
        if (placed % 2 === 1 && placed < 6) await ctx.say(okId());
      } else {
        fails[key] = (fails[key] || 0) + 1;
        Snd.sfx('soft'); shake(r.card); pico.oops(900);
        var now = Date.now();
        if (fails[key] >= 2) {
          var good = doors.filter(function (d) { return d.dataset.key === key; })[0];
          good.classList.add('hintwin'); setTimeout(function (el) { el.classList.remove('hintwin'); }, 2600, good);
        }
        if (now - lastRetry > 7000) {
          lastRetry = now;
          await ctx.say(fails[key] >= 2 ? 'hint' : 'retry');
        }
        pico.look('l');
      }
    }
    pico.idle();
    for (var i = 0; i < doors.length; i++) { doors[i].classList.add('lit'); Snd.sfx('star', 0.7); await ctx.sleep(160); }
    await G.levelDone(ctx, 2, 'l2d');
  };

  /* ============ NIVEL 3 · EL PICTOGRAMA PERDIDO ============ */
  var L3 = [
    { c: 'c1', key: 'patio' }, { c: 'c2', key: 'edfisica' }, { c: 'c3', key: 'biblioteca' },
    { c: 'c4', key: 'entrada' }, { c: 'c5', key: 'aula' }, { c: 'c6', key: 'bano' }
  ];
  G.screens[3] = async function (ctx) {
    G.hud(true); G.hudParts({ stars: true, repeat: true }); G.setProgress(0, L3.length);
    Snd.music('play'); G.setBg('ext_b', true);
    var sc = $('#scene'), xs = [235, 525, 815, 1105, 1395, 1685], boards = {};
    L3.forEach(function (s, i) {
      var b = h('div', 'board');
      b.style.left = (xs[i] - 90) + 'px';
      b.innerHTML = '<div class="bd"><span class="q">?</span><div class="bfill"><img src="img/picto/' + s.key + '.webp" alt=""><b>' + PIC[s.key].label + '</b></div></div><div class="pole"></div>';
      sc.appendChild(b); boards[s.key] = b;
    });
    var clue = h('div', 'cluecard'); clue.style.display = 'none';
    clue.innerHTML = '<img alt="" src=""><span class="lupa"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="6"/><path d="M29 29l13 13" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg></span>';
    sc.appendChild(clue);
    var again = h('button', 'btn btn-sun btn-mid againbtn', ICON.repeat + '<span>ESCUCHAR OTRA VEZ</span>'); again.type = 'button';
    again.style.display = 'none';
    again.addEventListener('click', function () { Snd.sfx('click'); G.repeat(); });
    sc.appendChild(again);
    var pico = G.mkPico({ x: -260, y: 810, s: 0.8 });
    await ctx.a(Promise.all([pico.walkTo(250, 810, { speed: 460 }), G.say('l3i')]));
    pico.wow(900);
    for (var i = 0; i < L3.length; i++) {
      var s = L3[i], others = L3.map(function (x) { return x.key; }).filter(function (k) { return k !== s.key; });
      var n = i < 3 ? 3 : 4;
      var opts = [s.key];
      for (var j = 0; j < n - 1; j++) opts.push(others[(i + j * 2) % others.length]);
      opts = shuffle(opts.filter(function (v, ix, a) { return a.indexOf(v) === ix; }));
      while (opts.length < n) { var extra = others[Math.floor(Math.random() * others.length)]; if (opts.indexOf(extra) < 0) opts.push(extra); }
      G.$$('.board', sc).forEach(function (b) { b.classList.remove('active'); });
      boards[s.key].classList.add('active');
      clue.querySelector('img').src = 'img/ui/clue_' + s.key + '.webp';
      clue.style.display = ''; clue.classList.remove('pop'); void clue.offsetWidth; clue.classList.add('pop');
      again.style.display = '';
      Snd.sfx('whoosh');
      pico.look('u');
      await ctx.say(s.c, { instr: true });
      pico.idle();
      var row = G.row({ left: '0', width: '1920px', top: '776px', height: '300px', gap: '36px' });
      var cards = opts.map(function (k) { return G.card(k, 230, 26); });
      cards.forEach(function (c) { row.appendChild(c); });
      G.cardsIn(cards);
      if (i === 0) cards[0].focus({ preventScroll: true });
      var ch = G.choice(row, ctx), tries = 0, b;
      while (true) {
        b = await ctx.a(ch.next());
        if (b.dataset.key === s.key) break;
        tries++;
        await gentleWrong(ctx, pico, row, cards, b, tries, s.key, async function () { await ctx.say(s.c, { instr: true }); }, ch);
      }
      row.classList.add('busy'); b.classList.add('good'); Snd.sfx('ok');
      var cp = center(b); G.sparkle(cp.x, cp.y, 10);
      var bd = boards[s.key];
      bd.classList.remove('active'); bd.classList.add('filled');
      Snd.sfx('star'); Snd.sfx('pop');
      var bp = center(bd.querySelector('.bd')); G.sparkle(bp.x, bp.y, 14);
      await ctx.a(Promise.all([pico.jump(), G.say(okId())]));
      G.addProgress(bp.x, bp.y);
      row.classList.add('out'); await ctx.sleep(420); row.remove();
    }
    clue.style.display = 'none'; again.style.display = 'none';
    await G.levelDone(ctx, 3, 'l3d');
  };

  /* ============ NIVEL 4 · ACOMPAÑAMOS A PICO ============ */
  var ROUTES = [
    { v: 'r1', steps: ['aula', 'patio'], n: 3 },
    { v: 'r2', steps: ['secretaria', 'direccion'], n: 4 },
    { v: 'r3', steps: ['direccion', 'edfisica', 'patio'], n: 5 }
  ];
  var MAPKEYS = ['aula', 'bano_m', 'bano_v', 'direccion', 'secretaria', 'patio', 'edfisica'];
  function buildMap(sc, interactive, gray) {
    var els = {};
    MAPKEYS.forEach(function (k) {
      var r = window.ROOMS[k], b = r.box;
      var e = h(interactive ? 'button' : 'div', 'mroom' + (gray ? ' gray' : ''));
      if (interactive) e.type = 'button';
      e.dataset.key = k;
      e.style.left = b[0] + 'px'; e.style.top = b[1] + 'px'; e.style.width = (b[2] - b[0]) + 'px'; e.style.height = (b[3] - b[1]) + 'px';
      var clue = k === 'bano_m' ? 'bano_m' : k === 'bano_v' ? 'bano_v' : k;
      e.innerHTML = '<img class="roomcol" src="img/bg/room_' + k + '.webp" alt="">' +
        '<img class="clue" src="img/ui/clue_' + clue + '.webp" alt="">' +
        '<span class="msign"><img src="img/picto/' + k + '.webp" alt=""><b>' + PIC[k].label + '</b></span><span class="dlight"></span>';
      if (interactive) e.setAttribute('aria-label', 'ESPACIO DE LA ESCUELA SIN CARTEL, DIBUJO DE: ' + PIC[k].label);
      sc.appendChild(e); els[k] = e;
    });
    return els;
  }
  var CORR = 448;
  function inside(key) { var r = window.ROOMS[key]; return { x: r.door[0], y: r.door[1] < 430 ? 388 : 585 }; }
  async function moveToRoom(ctx, pico, key, from) {
    var r = window.ROOMS[key], sp = 400;
    if (from) { var fr = window.ROOMS[from]; await ctx.a(pico.walkTo(fr.door[0], CORR, { speed: sp, face: false, keep: true })); }
    await ctx.a(pico.walkTo(r.door[0], CORR, { speed: sp, keep: true }));
    var t = inside(key);
    await ctx.a(pico.walkTo(t.x, t.y, { speed: sp, face: false }));
  }
  function surprise(sc, key) {
    var r = window.ROOMS[key].box, out = [];
    var pick = shuffle([0, 1, 2, 3, 4, 5]).slice(0, key === 'aula' || key === 'edfisica' ? 2 : 1);
    pick.forEach(function (ki, n) {
      var k = h('img', 'kidpop'); k.src = 'img/ui/kid' + ki + '.webp'; k.alt = '';
      var w = Math.min(120, (r[2] - r[0]) * 0.3);
      k.style.width = w + 'px';
      k.style.left = (n === 0 ? r[0] + 26 : r[2] - w - 26) + 'px'; k.style.top = (r[3] - w * 1.64 - 16) + 'px';
      k.style.animationDelay = (n * 0.18) + 's';
      sc.appendChild(k); out.push(k);
    });
    Snd.sfx('pop'); G.sparkle((r[0] + r[2]) / 2, (r[1] + r[3]) / 2, 10);
    return function () { out.forEach(function (k) { k.remove(); }); };
  }
  G.screens[4] = async function (ctx) {
    G.hud(true); G.hudParts({ stars: true, repeat: true }); G.setProgress(0, 7);
    Snd.music('play'); G.setBg('map', true);
    var sc = $('#scene'); buildMap(sc, false, false);
    $$k(sc, '.mroom').forEach(function (e) { e.classList.add('shown'); });
    var pico = G.mkPico({ x: -200, y: CORR, s: 0.42 });
    await ctx.a(Promise.all([pico.walkTo(190, CORR, { speed: 420 }), G.say('l4i')]));
    var slots = h('div', 'slots'); $('#deck').appendChild(slots);
    var cur = null;
    for (var ri = 0; ri < ROUTES.length; ri++) {
      var R = ROUTES[ri];
      if (ri > 0) {
        pico.faceRight(false);
        await ctx.a(pico.walkTo(window.ROOMS[cur].door[0], CORR, { speed: 700, face: false }));
        await ctx.a(pico.walkTo(190, CORR, { speed: 800 }));
        cur = null; pico.faceRight(true);
      }
      slots.innerHTML = ''; var sl = R.steps.map(function (k, i) { var s = h('span', 'slot', '<i>' + (i + 1) + '</i>'); slots.appendChild(s); return s; });
      slots.classList.remove('pop'); void slots.offsetWidth; slots.classList.add('pop');
      pico.look('r');
      await ctx.say(R.v, { instr: true });
      pico.idle();
      var ks = R.steps.filter(function (v, i, a) { return a.indexOf(v) === i; });
      var pool = shuffle(['aula', 'patio', 'secretaria', 'direccion', 'edfisica'].filter(function (k) { return ks.indexOf(k) < 0; }));
      var opts = shuffle(ks.concat(pool.slice(0, R.n - ks.length)));
      var row = G.row({ left: '0', width: '1920px', top: '836px', height: '240px', gap: '24px', paddingLeft: '420px', boxSizing: 'border-box', justifyContent: 'center' });
      var cards = opts.map(function (k) { return G.card(k, 180, 20); });
      cards.forEach(function (c) { row.appendChild(c); });
      G.cardsIn(cards); if (ri === 0) cards[0].focus({ preventScroll: true });
      var ch = G.choice(row, ctx);
      for (var j = 0; j < R.steps.length; j++) {
        var step = R.steps[j], tries = 0, b;
        cards.forEach(function (c) { c.classList.remove('lock', 'tried', 'good', 'hint', 'speak'); });
        while (true) {
          b = await ctx.a(ch.next());
          if (b.dataset.key === step) break;
          tries++;
          await gentleWrong(ctx, pico, row, cards, b, tries, step, null, ch);
        }
        row.classList.add('busy'); b.classList.add('good'); Snd.sfx('ok');
        sl[j].innerHTML = '<img src="img/picto/' + step + '.webp" alt=""><i>' + (j + 1) + '</i>'; sl[j].classList.add('full');
        var cp = center(b); G.sparkle(cp.x, cp.y, 8);
        var vp = G.say('go');
        await moveToRoom(ctx, pico, step, cur); cur = step;
        await ctx.a(vp);
        var clean = surprise(sc, step);
        var rb = window.ROOMS[step].box;
        G.addProgress((rb[0] + rb[2]) / 2, (rb[1] + rb[3]) / 2);
        await ctx.a(Promise.all([pico.jump(70), G.say('arrive')]));
        await ctx.sleep(900); clean();
        row.classList.remove('busy');
      }
      row.classList.add('out'); await ctx.sleep(420); row.remove();
    }
    slots.remove();
    await ctx.a(pico.walkTo(window.ROOMS[cur].door[0], CORR, { speed: 600, face: false }));
    await G.levelDone(ctx, 4, 'l4d');
  };
  function $$k(r, s) { return G.$$(s, r); }

  /* ============ NIVEL 5 · ¡MISIÓN INCLUSIVA! ============ */
  G.screens[5] = async function (ctx) {
    G.hud(true); G.hudParts({ stars: true, repeat: true }); G.setProgress(0, 7);
    Snd.music('play'); G.setBg('map_gray', true);
    var sc = $('#scene'), rooms = buildMap(sc, true, true);
    var roomEls = MAPKEYS.map(function (k) { return rooms[k]; });
    var pico = G.mkPico({ x: -200, y: CORR, s: 0.42 });
    var row = G.row({ left: '0', width: '1920px', top: '836px', height: '240px', gap: '24px' });
    var cards = shuffle(MAPKEYS).map(function (k) { return G.card(k, 180, 20); });
    cards.forEach(function (c) { row.appendChild(c); });
    var told = false, fails = {}, placed = 0, lastRetry = 0;
    var m = G.matcher(ctx, cards, roomEls, function (c, via) { if (via === 'click' && !told) { told = true; G.say('tapdoor'); } });
    await ctx.a(Promise.all([pico.walkTo(960, CORR, { speed: 460 }), G.say('l5i', { instr: true })]));
    G.cardsIn(cards); cards[0].focus({ preventScroll: true });
    while (placed < 7) {
      var r = await ctx.a(m.next());
      var key = r.card.dataset.key;
      if (key === r.target.dataset.key) {
        placed++;
        r.card.classList.add('gone'); r.card.disabled = true; r.card.classList.remove('sel');
        var t = r.target; t.classList.add('full', 'placed'); t.classList.remove('ready', 'gray');
        t.disabled = true;
        Snd.sfx('ok'); Snd.sfx('star', 0.8);
        var cp = center(t); G.sparkle(cp.x, cp.y, 14); G.addProgress(cp.x, cp.y);
        var dx = window.ROOMS[key].door[0];
        (async function (dx) { try { await ctx.a(pico.walkTo(dx, CORR, { speed: 760 })); await ctx.a(pico.cheer(900)); } catch (e) { if (e !== G.CANCEL) throw e; } })(dx);
        if (placed === 3 || placed === 6) await ctx.say(okId());
      } else {
        fails[key] = (fails[key] || 0) + 1;
        Snd.sfx('soft'); shake(r.card); pico.oops(900);
        if (fails[key] >= 2) {
          var good = rooms[key]; good.classList.add('hintroom'); setTimeout(function (el) { el.classList.remove('hintroom'); }, 2600, good);
        }
        var now = Date.now();
        if (now - lastRetry > 7000) { lastRetry = now; await ctx.say('retry'); restoreBubble(); }
      }
    }
    row.classList.add('out');
    await ctx.sleep(400);
    /* la cámara se aleja y muestra toda la escuela señalizada */
    var w = $('#world'); Snd.music('win');
    if (!G.calm && !G.fast) {
      w.style.transformOrigin = '960px 450px'; w.style.transition = 'none'; w.style.transform = 'scale(1.5)'; void w.offsetWidth;
      w.style.transition = 'transform 2.8s cubic-bezier(.4,0,.2,1)'; w.style.transform = 'scale(1)';
    }
    await ctx.a(pico.walkTo(960, CORR, { speed: 700 }));
    for (var i = 0; i < roomEls.length; i++) { roomEls[i].classList.add('wave'); Snd.sfx('star', 0.7); await ctx.sleep(220); }
    await G.levelDone(ctx, 5, 'l5d');
  };
})();
