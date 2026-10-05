/* boot */
(function () {
  var S = window.SDRA;
  function hasSavedUI() { return !!S.load(); }
  function start() {
    var loaded = S.load();
    if (loaded) { try { S.setRngState(loaded.rngState || loaded.seed); } catch (e) {} }
    else {
      /* fresh in-memory career so the shell renders; nothing is persisted until New career */
      loaded = S.newState({ seed: (Date.now() & 0x7fffffff) });
      for (var i = 0; i < 6; i++) S.spawnAccount(loaded, true);
      S.setRngState(loaded.seed);
    }
    S.UI.init(loaded);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  S.UI.hasSaved = hasSavedUI;
})();