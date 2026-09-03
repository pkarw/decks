// Animated dot-wave background, in the spirit of the app.openmercatocloud.com
// login screen. Targets any <canvas data-wave-canvas> on the page; the deck
// runtime strips inline <script> tags out of slide content, so this lives
// here and is loaded like image-slot.js / deck-stage.js via <script src>.
(function () {
  "use strict";

  var SPACING = 30;
  var COLOR = "216,251,99"; // --acc

  function initCanvas(canvas) {
    if (canvas.__waveInit) return;
    canvas.__waveInit = true;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    var reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    var t = 0;

    function frame() {
      if (!w || !h) resize();
      if (w && h) {
        ctx.clearRect(0, 0, w, h);
        var cols = Math.ceil(w / SPACING) + 1;
        var rows = Math.ceil(h / SPACING) + 1;
        for (var i = 0; i < cols; i++) {
          var x = i * SPACING;
          for (var j = 0; j < rows; j++) {
            var y = j * SPACING;
            var wave =
              Math.sin(x * 0.01 + t * 0.55) * Math.cos(y * 0.018 + t * 0.35);
            var dy = wave * 16;
            var lift = Math.max(0, wave);
            var alpha = 0.05 + lift * 0.3;
            var r = 1 + lift * 1.7;
            ctx.beginPath();
            ctx.arc(x, y + dy, r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + COLOR + "," + alpha.toFixed(3) + ")";
            ctx.fill();
          }
        }
      }
      if (!reduceMotion) {
        t += 0.016;
        requestAnimationFrame(frame);
      }
    }
    frame();
  }

  function scan() {
    var canvases = document.querySelectorAll("canvas[data-wave-canvas]");
    for (var i = 0; i < canvases.length; i++) initCanvas(canvases[i]);
  }

  // Slide content streams in asynchronously (dc-runtime template compile),
  // so the canvas may not exist yet at script-load time — observe for it.
  scan();
  var observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
