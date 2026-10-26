/* PICO · pantallas: inicio, historia, final, diploma y cierre de nivel */
(function () {
  'use strict';
  var G = window.G, Snd = window.Snd, h = G.h, $ = G.$, ICON = G.ICON;

  function btn(cls, inner, fn, af) {
    var b = h('button', 'btn ' + cls, inner); b.type = 'button';
    if (af) b.dataset.autofocus = '1';
    b.addEventListener('click', function () { Snd.sfx('click'); fn(b); });
    return b;
  }

  /* ---------- INICIO ---------- */
  G.screens.title = function (ctx) {
    G.hud(false); G.setBg('ext_a', true); G.setProgress(0, 0);
    Snd.music(G.started ? 'calm' : null);
    var sc = $('#scene');
    sc.appendChild(h('div', 'clouds'));
    sc.appendChild(h('div', 'titlecard',
      '<div class="ctxpill">OCTUBRE · MES DE LA INCLUSIÓN</div>' +
      '<h1><span class="tp">PICO:</span> ¡RESCATEMOS LAS SEÑALES DE LA ESCUELA!</h1>' +
      '<p class="sub">UNA MISIÓN INCLUSIVA PARA PRIMER GRADO</p>'));
    var ctl = h('div', 'titlectl');
    var play = btn('btn-go btn-huge', ICON.play + '<span>JUGAR</span>', function () { G.go('story'); });
    play.id = 'btnPlay';
    var row = h('div', 'titlerow');
    row.appendChild(btn('btn-sun btn-mid', ICON.how + '<span>CÓMO JUGAR</span>', function () { G.howTo(); }));
    row.appendChild(btn('btn-blue btn-mid', ICON.access + '<span>ACCESIBILIDAD</span>', function () { G.accessibility(); }));
    var snd = btn('btn-white btn-mid', '', function () { G.toggleSound(); });
    snd.setAttribute('data-sndlabel', '1'); row.appendChild(snd);
    ctl.appendChild(play); ctl.appendChild(row); sc.appendChild(ctl);
    var chips = h('div', 'chips');
    chips.appendChild(btn('btn-white btn-chip', ICON.star + '<span>MISIONES</span>', function () { G.missions(); }));
    chips.appendChild(btn('btn-white btn-chip', '<span>CRÉDITOS</span>', function () { G.credits(); }));
    sc.appendChild(chips);
    G.applyCfg();
    var pico = G.mkPico({ x: -260, y: 1040, s: 1.0 });
    var gate = $('#gate');
    if (!G.started) { gate.hidden = false; gate.classList.remove('off'); setTimeout(function () { var b = $('#gateBtn'); if (b) b.focus({ preventScroll: true }); }, 60); }
    else { gate.hidden = true; return G.screens.titleStart(); }
  };

  G.screens.titleStart = function () {
    var ctx = G.run; if (G.cur !== 'title' || !ctx || ctx.dead) return;
    var pico = G.pico;
    return (async function () {
      try {
        await ctx.a(pico.walkTo(330, 1040, { speed: 380 }));
        pico.faceRight(true); pico.wave(0);
        await ctx.say('hi', { instr: true });
        pico.idle();
      } catch (e) { if (e !== G.CANCEL) throw e; }
    })();
  };

  /* ---------- HISTORIA ---------- */
  G.screens.story = async function (ctx) {
    G.hud(true); G.hudParts({ stars: false }); G.setProgress(0, 0); G.setBg('ext_a', true); Snd.music('calm');
    var sc = $('#scene');
    sc.appendChild(h('div', 'clouds'));
    var spots = [[1080, 300], [1330, 240], [1580, 320], [1230, 470], [1500, 520]];
    spots.forEach(function (p, i) {
      var b = h('div', 'ghostboard', '<span>?</span>'); b.style.left = p[0] + 'px'; b.style.top = p[1] + 'px'; b.style.animationDelay = (i * 0.35) + 's';
      sc.appendChild(b);
    });
    var pico = G.mkPico({ x: -260, y: 1020, s: 1.2 });
    var skip = btn('btn-white btn-chip skipbtn', '<span>SALTAR</span>' + ICON.play, function () { G.go(1); });
    $('#deck').appendChild(skip);
    await ctx.a(pico.walkTo(520, 1020, { speed: 420 }));
    pico.faceRight(true);
    pico.wave(0);
    await ctx.say('story', { instr: true });
    pico.idle();
    await ctx.sleep(300);
    var ban = h('div', 'mission', '<div class="ribbon">¡UNA ESCUELA, MUCHAS FORMAS DE COMUNICARNOS!</div>');
    sc.appendChild(ban);
    Snd.sfx('star'); G.sparkle(960, 380, 14);
    G.confetti({ n: 40 });
    pico.cheer(0);
    await ctx.say('mision', { instr: true });
    pico.idle();
    skip.remove();
    var go = btn('btn-go btn-huge vamos', '<span>¡VAMOS!</span>' + ICON.play, function () { G.go(1); }, true);
    $('#deck').appendChild(go); go.focus({ preventScroll: true });
    Snd.sfx('whoosh');
  };

  /* ---------- CIERRE DE NIVEL ---------- */
  G.levelDone = async function (ctx, n, vid, opts) {
    opts = opts || {};
    G.markDone(n);
    G.setProgress(G.prog.total, G.prog.total);
    var rows = G.$$('#deck .row'); rows.forEach(function (r) { r.classList.add('out'); });
    var sc = $('#scene');
    var medal = h('div', 'medal', '<span class="ms">' + ICON.star + '</span><b>¡MISIÓN ' + n + ' CUMPLIDA!</b>');
    $('#deck').appendChild(medal);
    Snd.sfx('win'); G.confetti(); G.sparkle(960, 230, 14);
    var p = opts.pico || G.pico;
    if (p) p.cheer(0);
    await ctx.say(vid);
    if (p) p.idle();
    await ctx.sleep(500);
    var bar = h('div', 'endbar');
    var res;
    var wait = new Promise(function (r) { res = r; });
    bar.appendChild(btn('btn-white btn-big', ICON.again + '<span>REPETIR</span>', function () { res('again'); }));
    bar.appendChild(btn('btn-go btn-big', '<span>' + (n === 5 ? 'FINAL' : 'SEGUIR') + '</span>' + ICON.play, function () { res('next'); }, true));
    $('#deck').appendChild(bar);
    var again = bar.firstChild, next = bar.lastChild;
    next.focus({ preventScroll: true });
    var act = await ctx.a(wait);
    G.go(act === 'again' ? n : (n === 5 ? 'final' : n + 1));
  };

  /* ---------- FINAL ---------- */
  G.screens.final = async function (ctx) {
    G.hud(true); G.hudParts({ stars: false }); G.setProgress(0, 0); G.setBg('ext_c', true); Snd.music('win');
    var sc = $('#scene');
    sc.appendChild(h('div', 'clouds'));
    var fc = h('div', 'fcard', '<h1>¡MISIÓN CUMPLIDA!</h1><p>¡AHORA NUESTRA ESCUELA SE COMUNICA CON IMÁGENES!</p>');
    sc.appendChild(fc);
    sc.appendChild(h('div', 'garland', '<svg viewBox="0 0 1300 80" aria-hidden="true"><path d="M0 12 Q650 78 1300 12" fill="none" stroke="#8A5A2B" stroke-width="6" stroke-linecap="round"/></svg>'));
    var keys = ['aula', 'direccion', 'secretaria', 'bano_m', 'bano_v', 'patio', 'edfisica'];
    var signs = keys.map(function (k, i) {
      var s = h('div', 'sgn', '<img src="img/picto/' + k + '.webp" alt=""><span>' + G.PIC[k].label + '</span>');
      var left = 600 + i * 176, xc = left + 75 - 560, t = xc / 1300;
      var yRel = 12 * (1 - t) * (1 - t) + 156 * t * (1 - t) + 12 * t * t;
      s.style.left = left + 'px'; s.style.top = (470 + yRel + 4) + 'px'; s.style.opacity = 0;
      sc.appendChild(s); return s;
    });
    var pico = G.mkPico({ x: -260, y: 1040, s: 1.1 });
    G.applyCfg();
    Snd.sfx('cheer'); G.confetti({ n: 70 });
    var showSigns = (async function () {
      for (var i = 0; i < signs.length; i++) {
        await ctx.sleep(350);
        signs[i].style.opacity = 1; signs[i].classList.add('swing'); Snd.sfx('pop', 0.8);
        var r = signs[i].getBoundingClientRect(), p = G.toStage(r.left + r.width / 2, r.top + r.height / 2);
        G.sparkle(p.x, p.y, 6);
      }
    })();
    await ctx.a(pico.walkTo(300, 1040, { speed: 420 }));
    pico.faceRight(true);
    pico.wave(0);
    await ctx.say('fin', { instr: true });
    pico.idle();
    await ctx.a(showSigns);
    var inv = h('div', 'invite', '<h2>¡AHORA NOS TOCA A NOSOTROS!</h2><p>RECONOZCAMOS, RECORRAMOS Y SEÑALICEMOS LOS ESPACIOS DE NUESTRA ESCUELA CON LAS FICHAS IMPRESAS.</p>');
    sc.appendChild(inv);
    Snd.sfx('star'); G.sparkle(1240, 840, 12);
    var bar = h('div', 'finalbar');
    bar.appendChild(btn('btn-go btn-mid', ICON.again + '<span>VOLVER A JUGAR</span>', function () { G.go(1); }, true));
    bar.appendChild(btn('btn-sun btn-mid', ICON.star + '<span>MI DIPLOMA</span>', function () { G.diploma(); }));
    bar.appendChild(btn('btn-white btn-mid', '<span>MISIONES</span>', function () { G.missions(); }));
    bar.appendChild(btn('btn-white btn-mid', ICON.home + '<span>INICIO</span>', function () { G.go('title'); }));
    $('#deck').appendChild(bar);
    bar.firstChild.focus({ preventScroll: true });
  };

  /* ---------- DIPLOMA ---------- */
  function dipHtml(name) {
    var stars = '';
    for (var i = 1; i <= 5; i++) stars += '<span class="ds' + (G.save.done.indexOf(i) >= 0 ? ' on' : '') + '">' + ICON.star + '</span>';
    return '<div class="dip-in">' +
      '<div class="dip-top">OCTUBRE · MES DE LA INCLUSIÓN</div>' +
      '<div class="dip-word">DIPLOMA</div>' +
      '<h1>EXPLORADOR DE LA INCLUSIÓN</h1>' +
      '<div class="dip-to">SE LE OTORGA A</div>' +
      '<div class="dip-name">' + (name ? name.replace(/[<>&"]/g, '') : '&nbsp;') + '</div>' +
      '<p>POR AYUDAR A PICO A RECUPERAR LAS SEÑALES DE LA ESCUELA Y APRENDER A RECONOCER PICTOGRAMAS.<br>¡UNA ESCUELA, MUCHAS FORMAS DE COMUNICARNOS!</p>' +
      '<div class="dip-stars">' + stars + '</div>' +
      '<div class="dip-foot"><span>FECHA:<i></i></span><span>SEÑO:<i></i></span></div>' +
      '<img class="dip-pico" src="img/pico/cheer_a.webp" alt="">' +
      '<small>PICTOGRAMAS: ARASAAC (ARASAAC.ORG). AUTOR: SERGIO PALAO. PROCEDENCIA: ARASAAC. PROPIEDAD: GOBIERNO DE ARAGÓN. LICENCIA: CC BY-NC-SA.</small>' +
      '</div>';
  }
  G.diploma = function () {
    var box = h('div', 'dipbox');
    var dip = h('div', 'diploma'); dip.id = 'dip'; dip.innerHTML = dipHtml('');
    box.appendChild(dip);
    var ctl = h('div', 'dipctl');
    var lab = h('label', 'dipname', '<span>MI NOMBRE:</span>');
    var inp = h('input'); inp.type = 'text'; inp.maxLength = 40; inp.placeholder = 'ESCRIBÍ TU NOMBRE'; inp.autocomplete = 'off'; inp.id = 'dipName';
    inp.dataset.autofocus = '1';
    inp.addEventListener('input', function () { dip.innerHTML = dipHtml(inp.value.toUpperCase()); });
    lab.appendChild(inp); ctl.appendChild(lab);
    if (window.PICO_PREVIEW) {
      ctl.appendChild(h('span', 'dipnote', 'PARA IMPRIMIRLO: DESCARGÁ EL JUEGO (VER INSTRUCCIONES) Y USÁ EL BOTÓN IMPRIMIR.'));
    } else {
      ctl.appendChild(btn('btn-go btn-small', ICON.print + '<span>IMPRIMIR</span>', function () {
        var pa = $('#printArea'); pa.innerHTML = '<div class="diploma">' + dipHtml(inp.value.toUpperCase()) + '</div>';
        try { window.print(); } catch (e) {}
      }));
    }
    ctl.appendChild(G.closeBtn());
    box.appendChild(ctl);
    G.modal(box, { cls: 'dipmodal', label: 'DIPLOMA', onClose: function () { Snd.stopVoice(); } });
    Snd.sfx('win'); G.confetti({ n: 60 });
    Snd.say('diploma');
  };
})();
