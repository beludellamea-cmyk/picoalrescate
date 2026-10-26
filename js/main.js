/* PICO · arranque */
(function () {
  'use strict';
  var G = window.G;
  function ini() {
    G.$('#btnMenu').innerHTML = G.ICON.home;
    G.$('#btnAcc').innerHTML = G.ICON.access;
    G.$('#btnRepeat').innerHTML = G.ICON.repeat;
    G.boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ini); else ini();
})();
