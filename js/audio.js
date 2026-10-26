/* PICO · audio: voces (MP3 + respaldo es-AR del navegador), efectos y música con "ducking" */
(function () {
  'use strict';
  var S = { master: true, music: true, voice: true, sfx: true };
  var musicEl = null, musicName = null, duck = 1;
  var vEl = null, vTimer = null, vRes = null, speaking = false, ttsOn = false;
  var listeners = [];
  var MUSIC_VOL = 0.24;

  function eff() { return S.master && S.music ? MUSIC_VOL * duck : 0; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function applyMusic() { if (musicEl) musicEl.volume = clamp(eff() * (musicEl._fade == null ? 1 : musicEl._fade)); }
  function emit(v) { listeners.forEach(function (f) { try { f(v); } catch (e) {} }); }

  function ramp(a, to, ms, done) {
    var from = a._fade == null ? 1 : a._fade, t0 = Date.now();
    (function step() {
      var k = Math.min(1, (Date.now() - t0) / ms);
      a._fade = from + (to - from) * k;
      a.volume = clamp(eff() * a._fade);
      if (k < 1) setTimeout(step, 40); else if (done) done();
    })();
  }

  function endVoice(ok) {
    if (vTimer) { clearTimeout(vTimer); vTimer = null; }
    if (vEl) { try { vEl.onended = vEl.onerror = null; vEl.pause(); } catch (e) {} vEl = null; }
    if (ttsOn) { try { window.speechSynthesis.cancel(); } catch (e) {} ttsOn = false; }
    if (speaking) { speaking = false; duck = 1; applyMusic(); emit(false); }
    var r = vRes; vRes = null; if (r) r(ok);
  }

  function pickVoice() {
    try {
      var vs = window.speechSynthesis.getVoices() || [];
      var order = ['es-AR', 'es-419', 'es-MX', 'es-US', 'es-UY', 'es-CL', 'es-ES'];
      for (var i = 0; i < order.length; i++) {
        for (var j = 0; j < vs.length; j++) if (vs[j].lang && vs[j].lang.replace('_', '-') === order[i]) return vs[j];
      }
      for (var k = 0; k < vs.length; k++) if (vs[k].lang && vs[k].lang.toLowerCase().indexOf('es') === 0) return vs[k];
    } catch (e) {}
    return null;
  }

  var Snd = {
    S: S,
    fast: false,
    onSpeak: function (fn) { listeners.push(fn); },
    isSpeaking: function () { return speaking; },
    state: function () { return { music: musicName, musicPlaying: !!(musicEl && !musicEl.paused), musicVol: musicEl ? musicEl.volume : 0, speaking: speaking, tts: ttsOn }; },
    sfx: function (name, vol) {
      if (!S.master || !S.sfx || Snd.fast) return;
      try {
        var a = new Audio('audio/sfx/' + name + '.mp3');
        a.volume = clamp(0.6 * (vol == null ? 1 : vol) * (speaking ? 0.45 : 1));
        var p = a.play(); if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    },
    music: function (name) {
      if (name === musicName) { applyMusic(); return; }
      var old = musicEl; musicName = name;
      if (old) { ramp(old, 0, 700, function () { try { old.pause(); } catch (e) {} }); }
      if (!name || Snd.fast) { musicEl = null; return; }
      var a = new Audio('audio/music/' + name + '.mp3');
      a.loop = true; a._fade = 0; a.volume = 0; musicEl = a;
      var p = a.play();
      if (p && p.then) p.then(function () { ramp(a, 1, 900); }).catch(function () { a._fade = 1; });
      else ramp(a, 1, 900);
    },
    resume: function () {
      if (musicEl && musicEl.paused && S.master && S.music && !Snd.fast) {
        var a = musicEl, p = a.play();
        if (p && p.then) p.then(function () { ramp(a, 1, 600); }).catch(function () {});
      }
    },
    refresh: function () { applyMusic(); },
    set: function (k, v) {
      S[k] = v;
      if ((k === 'master' || k === 'voice') && !v) endVoice(false);
      applyMusic();
      if ((k === 'master' || k === 'music') && v) Snd.resume();
    },
    stopVoice: function () { endVoice(false); },
    say: function (id) {
      endVoice(false);
      var text = (window.VOZ || {})[id] || '';
      return new Promise(function (resolve) {
        vRes = resolve;
        var alive = function () { return vRes === resolve; };
        speaking = true; duck = 0.28; applyMusic(); emit(true);
        var readMs = 900 + text.length * 48;
        var timer = function (ms) { vTimer = setTimeout(function () { if (alive()) endVoice(true); }, ms || readMs); };
        if (Snd.fast) { timer(120); return; }
        if (!S.master || !S.voice) { timer(); return; }
        var ttsDone = false;
        var tts = function () {
          if (!alive() || ttsDone) return;
          ttsDone = true;
          if (vEl) { try { vEl.onended = vEl.onerror = null; vEl.pause(); } catch (e) {} vEl = null; }
          if (vTimer) { clearTimeout(vTimer); vTimer = null; }
          if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) { timer(); return; }
          try {
            var u = new window.SpeechSynthesisUtterance(text), v = pickVoice();
            if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-AR';
            u.rate = 0.95; u.pitch = 1.15; ttsOn = true;
            u.onend = function () { if (alive()) endVoice(true); };
            u.onerror = function () { if (alive()) endVoice(true); };
            window.speechSynthesis.speak(u);
            timer(readMs * 2 + 3000);
          } catch (e) { timer(); }
        };
        var a = new Audio('audio/voz/' + id + '.mp3'); vEl = a; a.volume = 1;
        var arm = function () {
          if (!alive()) return;
          if (vTimer) clearTimeout(vTimer);
          var d = isFinite(a.duration) && a.duration > 0 ? a.duration : 12;
          vTimer = setTimeout(function () { if (alive()) endVoice(true); }, d * 1000 + 2500);
        };
        a.onended = function () { if (alive()) endVoice(true); };
        a.onerror = tts;
        a.addEventListener('loadedmetadata', arm);
        var p = a.play();
        if (p && p.then) p.then(arm).catch(function (err) {
          if (!alive()) return;
          tts();
        });
      });
    }
  };
  window.Snd = Snd;
  document.addEventListener('pointerdown', function () { Snd.resume(); }, true);
  document.addEventListener('visibilitychange', function () {
    if (!musicEl) return;
    if (document.hidden) { try { musicEl.pause(); } catch (e) {} } else Snd.resume();
  });
  try { if (window.speechSynthesis) window.speechSynthesis.getVoices(); } catch (e) {}
})();
