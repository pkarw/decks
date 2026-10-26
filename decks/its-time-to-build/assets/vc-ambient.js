// A single WebGL surface follows the active VC Demo Day slide.
(() => {
  'use strict';
  // The .dc runtime can execute a helmet script before and after mounting.
  if (window.__vcDemoDayAmbientLoaded) return;
  window.__vcDemoDayAmbientLoaded = true;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const printing = matchMedia('print');
  const canvas = document.createElement('canvas');
  canvas.dataset.deckAmbientCanvas = '';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform float u_cover;

    float glow(float distance, float width) {
      float x = distance / width;
      return exp(-x * x);
    }
    void main() {
      vec2 p = v_uv;
      float t = u_time;
      vec3 pink = vec3(1.0, 0.255, 0.4);
      vec3 violet = vec3(0.39, 0.22, 0.78);
      float colorMix = 0.5 + 0.5 * sin(p.x * 4.0 - t * 0.40);
      vec3 color = mix(pink, violet, colorMix * 0.82);

      // Visible moving light packets follow two gently undulating edge ribbons.
      float top = 0.960 + 0.009 * sin(p.x * 8.0 + t * 0.65);
      float bottom = 0.040 + 0.009 * sin(p.x * 7.0 - t * 0.58);
      float fade = smoothstep(0.01, 0.10, p.x)
                 * (1.0 - smoothstep(0.90, 0.99, p.x));
      float topPacket = glow(p.x - (fract(t * 0.10) * 1.4 - 0.2), 0.13);
      float bottomPacket = glow(p.x - (1.2 - fract(t * 0.085) * 1.4), 0.16);
      float topEdge = glow(p.y - top, 0.0020);
      float bottomEdge = glow(p.y - bottom, 0.0020);
      float topHalo = glow(p.y - top, 0.032);
      float bottomHalo = glow(p.y - bottom, 0.032);
      float alpha = fade * (
          topEdge * (0.18 + topPacket * 0.48)
        + bottomEdge * (0.18 + bottomPacket * 0.48)
        + topHalo * (0.045 + topPacket * 0.15)
        + bottomHalo * (0.045 + bottomPacket * 0.15));

      // Broader moving light is visible beside the cover artwork.
      float ribbonX = 0.78 + 0.14 * sin(p.y * 4.5 + t * 0.38);
      float coverGlow = glow(p.x - ribbonX, 0.15)
                      * smoothstep(0.08, 0.25, p.y)
                      * (1.0 - smoothstep(0.78, 0.96, p.y));
      alpha += u_cover * coverGlow * (0.22 + 0.07 * sin(t * 0.55));
      gl_FragColor = vec4(color, min(alpha, 0.68));
    }
  `;

  let gl;
  let program;
  let timeLocation;
  let coverLocation;
  let active = null;
  let request = null;
  let dirtySize = true;
  let phase = 0;
  let lastPaint = -Infinity;
  let previousStamp = 0;
  let frames = 0;
  let lost = false;

  function state(value) {
    if (canvas.dataset.deckAmbientState !== value) {
      canvas.dataset.deckAmbientState = value;
    }
  }

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error('VC ambient shader failed to compile');
    }
    return result;
  }

  function setup() {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL is unavailable');
    const vertex = shader(gl.VERTEX_SHADER, vertexSource);
    const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('VC ambient shader failed to link');
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    timeLocation = gl.getUniformLocation(program, 'u_time');
    coverLocation = gl.getUniformLocation(program, 'u_cover');
    canvas.hidden = false;
    dirtySize = true;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    // Bound GPU work independently of projector resolution and pixel density.
    const width = Math.max(1, Math.min(1280,
      Math.round(rect.width * Math.min(devicePixelRatio || 1, 1.25))));
    const height = Math.max(1, Math.round(width * rect.height / rect.width));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    dirtySize = false;
    return true;
  }

  function draw() {
    if (!gl || lost || !active) return;
    if (dirtySize && !resize()) return;
    gl.useProgram(program);
    gl.uniform1f(timeLocation, motion.matches ? 0 : phase);
    gl.uniform1f(coverLocation, active.dataset.vcAmbient === 'cover' ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frames += 1;
    // Viewer bookkeeping attributes do not invalidate the thumbnail rail.
    if (frames === 1 || frames % 24 === 0) {
      canvas.dataset.deckAmbientFrames = String(frames);
    }
  }

  function stop() {
    if (request !== null) cancelAnimationFrame(request);
    request = null;
    previousStamp = 0;
  }

  function tick(stamp) {
    request = null;
    if (!active || document.hidden || printing.matches || lost || motion.matches) {
      state('paused');
      return;
    }
    if (stamp - lastPaint >= 1000 / 24) {
      if (previousStamp) phase += Math.min(0.12, (stamp - previousStamp) / 1000);
      previousStamp = stamp;
      lastPaint = stamp;
      draw();
    }
    request = requestAnimationFrame(tick);
  }

  function resume() {
    stop();
    if (!active || !gl || lost) return;
    if (document.hidden || printing.matches) {
      state('paused');
      return;
    }
    draw();
    if (motion.matches) {
      state('static');
    } else {
      state('running');
      lastPaint = -Infinity;
      request = requestAnimationFrame(tick);
    }
  }

  function syncActive() {
    const next = document.querySelector('deck-stage > section[data-deck-active][data-vc-ambient]');
    if (next === active) return;
    stop();
    active = next;
    if (!active) {
      canvas.remove();
      return;
    }
    active.prepend(canvas);
    dirtySize = true;
    if (!gl && !lost) {
      try {
        setup();
      } catch (_) {
        state('unavailable');
        canvas.hidden = true;
        return;
      }
    }
    resume();
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    stop();
    state('unavailable');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    try { setup(); resume(); } catch (_) { state('unavailable'); }
  });
  addEventListener('resize', () => { dirtySize = true; resume(); });
  document.addEventListener('visibilitychange', resume);
  motion.addEventListener('change', resume);
  printing.addEventListener('change', resume);
  document.addEventListener('slidechange', syncActive);
  new MutationObserver(syncActive).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-deck-active'],
  });
  syncActive();
})();
