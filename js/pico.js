/* PICO · el personaje animado (cuadros pre-renderizados del personaje original) */
(function () {
  'use strict';
  var BASE = 'img/pico/';
  var NAMES = ['idle_smile', 'idle_open', 'idle_blink', 'idle_lookl', 'idle_lookr', 'idle_up',
    'walk_0', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'walk_5', 'walk_6', 'walk_7',
    'crouch', 'jump_up', 'cheer_a', 'cheer_b', 'cheer_c', 'wow', 'point_r', 'point_r_open',
    'point_dr', 'point_dr_open', 'wave_a', 'wave_b', 'wave_a_open', 'think', 'think_open', 'oops'];
  var OPEN = { idle_smile: 'idle_open', idle_blink: 'idle_open', idle_lookl: 'idle_open', idle_lookr: 'idle_open',
    idle_up: 'idle_open', point_r: 'point_r_open', point_dr: 'point_dr_open', think: 'think_open',
    wave_a: 'wave_a_open', wave_b: 'wave_a_open' };
  var WALK = ['walk_0', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'walk_5', 'walk_6', 'walk_7'];
  var cache = {};
  NAMES.forEach(function (n) { var i = new Image(); i.src = BASE + n + '.webp'; cache[n] = i; });

  function calm() { return !!(window.G && window.G.calm); }
  function sleep(ms) { return window.G ? window.G.sleep(ms) : new Promise(function (r) { setTimeout(r, ms); }); }

  function Pico(parent, o) {
    o = o || {};
    this.el = document.createElement('div');
    this.el.className = 'pico';
    this.el.innerHTML = '<div class="psh"></div><img class="psp" alt="" draggable="false">';
    parent.appendChild(this.el);
    this.img = this.el.querySelector('img');
    this.x = o.x == null ? 960 : o.x; this.y = o.y == null ? 900 : o.y;
    this.s = o.s || 1; this.flip = !!o.flip;
    this.mode = 'idle'; this.cur = 'idle_smile'; this.shown = '';
    this.talking = false; this.mouth = false; this.mt = 0;
    this.frames = []; this.fi = 0; this.fps = 8; this.ft = 0;
    this.blinkAt = null; this.idleUntil = 0; this.mtok = 0; this.dead = false;
    this.bob = null;
    this.apply(); this.render();
    var self = this;
    this.timer = setInterval(function () { self.tick(Date.now()); }, 40);
  }
  var P = Pico.prototype;

  P.apply = function () {
    this.el.style.left = (this.x - 197) + 'px';
    this.el.style.top = (this.y - 375) + 'px';
    this.el.style.transform = 'scale(' + (this.flip ? -this.s : this.s) + ',' + this.s + ')';
  };
  P.place = function (x, y, s, flip) {
    if (x != null) this.x = x; if (y != null) this.y = y;
    if (s != null) this.s = s; if (flip != null) this.flip = flip;
    this.apply();
  };
  P.faceRight = function (r) { this.flip = !r; this.apply(); };
  P.render = function () {
    var n = this.cur;
    if (this.talking && this.mouth && OPEN[n]) n = OPEN[n];
    if (n !== this.shown) { this.shown = n; this.img.src = BASE + n + '.webp'; }
    this.dirty = false;
  };
  P.talk = function (on) { this.talking = !!on; if (!on) { this.mouth = false; this.dirty = true; } };
  P.tick = function (now) {
    if (this.dead) return;
    if (this.talking && now - this.mt > 150) { this.mt = now; this.mouth = !this.mouth; this.dirty = true; }
    if (this.mode === 'cycle') {
      if (now - this.ft >= 1000 / this.fps) {
        this.ft = now; this.fi = (this.fi + 1) % this.frames.length;
        this.cur = this.frames[this.fi]; this.dirty = true;
      }
    } else if (this.mode === 'idle') {
      if (this.blinkAt == null) this.blinkAt = now + 1800 + Math.random() * 2500;
      if (this.cur === 'idle_smile' && now > this.blinkAt) {
        this.cur = 'idle_blink'; this.idleUntil = now + 130; this.dirty = true;
      } else if (this.cur !== 'idle_smile' && now > this.idleUntil) {
        this.cur = 'idle_smile'; this.dirty = true; this.blinkAt = now + 1800 + Math.random() * 3000;
        if (Math.random() < 0.25) {
          this.cur = ['idle_lookl', 'idle_lookr', 'idle_up'][Math.floor(Math.random() * 3)];
          this.idleUntil = now + 900;
        }
      }
    }
    if (this.dirty) this.render();
  };
  P.stopBob = function () { if (this.bob) { try { this.bob.cancel(); } catch (e) {} this.bob = null; } };
  P.idle = function () {
    this.mtok++; this.stopBob();
    this.mode = 'idle'; this.cur = 'idle_smile'; this.blinkAt = null; this.dirty = true;
    this.el.classList.add('breathe');
  };
  P.hold = function (name) {
    this.stopBob(); this.mode = 'hold'; this.cur = name; this.dirty = true;
    this.el.classList.remove('breathe');
  };
  P.cycle = function (frames, fps) {
    this.stopBob(); this.mode = 'cycle'; this.frames = frames; this.fi = 0; this.fps = fps || 8;
    this.cur = frames[0]; this.ft = Date.now(); this.dirty = true;
    this.el.classList.remove('breathe');
  };
  P.look = function (dir) { this.hold(dir === 'l' ? 'idle_lookl' : dir === 'r' ? 'idle_lookr' : 'idle_up'); };

  /* camina hasta (x,y): devuelve una promesa (true si llegó) */
  P.walkTo = function (x, y, o) {
    var self = this; o = o || {};
    if (y == null) y = this.y;
    var sp = o.speed || 430;
    var x0 = this.x, y0 = this.y, dist = Math.hypot(x - x0, y - y0);
    if (dist < 2) return Promise.resolve(true);
    if (o.face !== false && Math.abs(x - x0) > 3) { this.flip = x < x0; this.apply(); }
    var t = ++this.mtok;
    if (calm() || (window.Snd && window.Snd.fast)) {
      this.place(x, y);
      this.hold('idle_smile');
      return sleep(220).then(function () { if (t === self.mtok) self.idle(); return t === self.mtok; });
    }
    this.cycle(WALK, 12);
    var dur = dist / sp * 1000 / (window.G ? window.G.speedScale || 1 : 1), t0 = Date.now(), lastStep = 0;
    return new Promise(function (resolve) {
      var done = false;
      function fin(ok) {
        if (done) return; done = true;
        if (ok) { self.place(x, y); if (!o.keep) self.idle(); }
        resolve(ok);
      }
      var guard = setTimeout(function () { fin(t === self.mtok); }, dur + 600);
      (function frame() {
        if (done) return;
        if (t !== self.mtok || self.dead) { clearTimeout(guard); fin(false); return; }
        var p = Math.min(1, (Date.now() - t0) / dur), e = 0.5 - 0.5 * Math.cos(Math.PI * p);
        self.x = x0 + (x - x0) * e; self.y = y0 + (y - y0) * e; self.apply();
        if (Date.now() - lastStep > 330) { lastStep = Date.now(); if (window.Snd) window.Snd.sfx('step', 0.45); }
        if (p >= 1) { clearTimeout(guard); fin(true); } else requestAnimationFrame(frame);
      })();
    });
  };

  P.jump = function (h) {
    var self = this; h = h || 150;
    var t = ++this.mtok;
    if (window.Snd) window.Snd.sfx('boing');
    if (calm()) { this.hold('cheer_a'); return sleep(700).then(function () { if (t === self.mtok) self.idle(); return t === self.mtok; }); }
    this.hold('crouch');
    return sleep(110).then(function () {
      if (t !== self.mtok) return false;
      self.hold('jump_up');
      var an = self.img.animate([
        { transform: 'translateY(0)', easing: 'cubic-bezier(.2,.7,.4,1)' },
        { transform: 'translateY(' + (-h) + 'px)', offset: 0.48, easing: 'cubic-bezier(.6,0,.8,.4)' },
        { transform: 'translateY(0)' }], { duration: 640 });
      return an.finished.catch(function () {}).then(function () {
        if (t !== self.mtok) return false;
        self.hold('crouch');
        return sleep(90).then(function () { if (t !== self.mtok) return false; self.idle(); return true; });
      });
    });
  };

  /* festeja con saltitos suaves; ms=0 → hasta el próximo comando */
  P.cheer = function (ms) {
    var self = this, t = ++this.mtok;
    if (calm()) { this.hold('cheer_a'); }
    else {
      this.cycle(['cheer_a', 'cheer_b', 'cheer_c', 'cheer_b'], 5);
      this.bob = this.img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-20px)' }, { transform: 'translateY(0)' }],
        { duration: 560, iterations: Infinity, easing: 'ease-in-out' });
    }
    if (!ms) return Promise.resolve(true);
    return sleep(ms).then(function () { if (t === self.mtok) self.idle(); return t === self.mtok; });
  };
  P.pose = function (name, ms) {
    var self = this, t = ++this.mtok; this.hold(name);
    if (!ms) return Promise.resolve(true);
    return sleep(ms).then(function () { if (t === self.mtok) self.idle(); return t === self.mtok; });
  };
  P.wow = function (ms) { return this.pose('wow', ms || 1000); };
  P.oops = function (ms) {
    var self = this;
    var p = this.pose('oops', ms || 1100);
    if (!calm()) this.img.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0)' }], { duration: 600 });
    return p;
  };
  P.think = function (ms) { return this.pose('think', ms || 1200); };
  P.wave = function (ms) {
    var self = this, t = ++this.mtok;
    if (calm()) this.hold('wave_a'); else this.cycle(['wave_a', 'wave_b'], 4);
    if (!ms) return Promise.resolve(true);
    return sleep(ms).then(function () { if (t === self.mtok) self.idle(); return t === self.mtok; });
  };
  P.point = function (dir, ms) { return this.pose(dir === 'dr' ? 'point_dr' : 'point_r', ms); };
  P.show = function (v) { this.el.style.display = v === false ? 'none' : ''; };
  P.remove = function () {
    this.dead = true; clearInterval(this.timer); this.mtok++; this.stopBob();
    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
  };

  window.Pico = Pico;
})();
