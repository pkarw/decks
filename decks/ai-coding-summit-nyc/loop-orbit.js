// Conference edition: a rotating torus with agents circulating in closed loops.
// Loaded outside slide markup because the DC runtime extracts inline scripts.
(() => {
  'use strict';
  const mounted = new WeakSet();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Exact official mark geometry: open-mercato/cezar, docs/brand/cezar-mark-white.svg.
  // Extrude each filled polygon so the C, laurel and dots keep their proportions.
  const mark = [
    '354.6,217.3 511.0,307.6 421.0,359.6 354.6,321.2 267.9,371.2 267.9,471.3 444.6,573.3 354.6,625.3 177.9,523.3 177.9,319.3',
    '177.9,284.6 354.6,182.6 354.6,78.7 177.9,180.7',
    '354.6,372.3 397.0,396.8 397.0,445.8 354.6,470.3 312.1,445.8 312.1,396.8',
    '483.7,372.3 526.1,396.8 526.1,445.8 483.7,470.3 441.2,445.8 441.2,396.8',
  ].map(polygon => polygon.split(' ').map(pair => {
    const [x, y] = pair.split(',').map(Number);
    return [(x - 352) * .33, (y - 352) * .33];
  }));

  function mount(canvas) {
    if (mounted.has(canvas)) return;
    mounted.add(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const slide = canvas.closest('section');
    let width = 1920, height = 1080, frame = 0, started = 0;
    let elapsed = 0, lastTick = 0;
    const tau = Math.PI * 2;

    function drawMark(time) {
      const scale = Math.min(width / 1920, height / 1080);
      const yaw = .3 + Math.sin(time * .55) * .48;
      const pitch = -.1 + Math.sin(time * .4) * .12;
      const bob = Math.sin(time * .7) * 3;
      function rotate([x, y, z]) {
        const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
        const rz = -x * Math.sin(yaw) + z * Math.cos(yaw);
        return [rx, y * Math.cos(pitch) - rz * Math.sin(pitch),
          y * Math.sin(pitch) + rz * Math.cos(pitch)];
      }
      function projectMark([x, y, z]) {
        const depth = 850 / (850 + z);
        return [width * .79 + x * depth * scale,
          height * .49 + (y * depth + bob) * scale];
      }
      const faces = [];
      function face(points, normal, side = false) {
        const n = rotate(normal);
        if (n[2] >= 0) return; // Cull surfaces facing away from the audience.
        const vertices = points.map(rotate);
        const light = Math.max(0, -n[0] * .4 - n[1] * .45 - n[2] * .8);
        const shade = Math.round(side ? 65 + light * 105 : 211 + light * 40);
        faces.push({vertices, depth: vertices.reduce((sum, p) => sum + p[2], 0) / vertices.length,
          color: side ? `rgb(${shade},${shade + 3},${Math.round(shade * .68)})`
            : `rgb(${shade},${shade},${shade})`});
      }
      for (const polygon of mark) {
        const winding = Math.sign(polygon.reduce((area, p, i) => {
          const next = polygon[(i + 1) % polygon.length];
          return area + p[0] * next[1] - next[0] * p[1];
        }, 0));
        const front = polygon.map(([x, y]) => [x, y, -13]);
        const back = polygon.map(([x, y]) => [x, y, 13]);
        face(front, [0, 0, -1]);
        face(back, [0, 0, 1]);
        for (let i = 0; i < polygon.length; i++) {
          const next = (i + 1) % polygon.length;
          const dx = polygon[next][0] - polygon[i][0];
          const dy = polygon[next][1] - polygon[i][1];
          const length = Math.hypot(dx, dy);
          face([front[i], back[i], back[next], front[next]],
            [winding * dy / length, -winding * dx / length, 0], true);
        }
      }
      faces.sort((a, b) => b.depth - a.depth);
      for (const {vertices, color} of faces) {
        ctx.beginPath();
        vertices.forEach((vertex, i) => {
          const [x, y] = projectMark(vertex);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    function project(a, b, time) {
      const radius = 248 + 88 * Math.cos(b);
      let x = radius * Math.cos(a);
      let y = radius * Math.sin(a);
      let z = 88 * Math.sin(b);
      const turn = .42 + Math.sin(time * .17) * .25;
      const tx = x * Math.cos(turn) + z * Math.sin(turn);
      z = -x * Math.sin(turn) + z * Math.cos(turn);
      x = tx;
      const tilt = .86;
      const ty = y * Math.cos(tilt) - z * Math.sin(tilt);
      z = y * Math.sin(tilt) + z * Math.cos(tilt);
      y = ty;
      const twist = -.48;
      const rx = x * Math.cos(twist) - y * Math.sin(twist);
      y = x * Math.sin(twist) + y * Math.cos(twist);
      const depth = 1100 / (1100 + z);
      const scale = Math.min(width / 1920, height / 1080);
      return {x: width * .79 + rx * depth * scale,
        y: height * .49 + y * depth * scale, z, scale};
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(width * .79, height * .49, 0,
        width * .79, height * .49, width * .25);
      glow.addColorStop(0, 'rgba(250,255,5,.07)');
      glow.addColorStop(1, 'rgba(250,255,5,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      function ring(fixed, cross) {
        ctx.beginPath();
        let totalDepth = 0;
        for (let step = 0; step <= 144; step++) {
          const angle = step / 144 * tau;
          const point = project(cross ? fixed : angle,
            cross ? angle : fixed, time);
          totalDepth += point.z;
          if (step) ctx.lineTo(point.x, point.y);
          else ctx.moveTo(point.x, point.y);
        }
        const alpha = cross ? .09 : .18 + (1 - totalDepth / 145 / 400) * .1;
        ctx.strokeStyle = `rgba(250,255,5,${alpha})`;
        ctx.lineWidth = (cross ? .7 : 1.1) * width / 1920;
        ctx.stroke();
      }
      for (let i = 0; i < 20; i++) ring(i / 20 * tau, true);
      for (let i = 0; i < 16; i++) ring(i / 16 * tau, false);

      for (let i = 0; i < 12; i++) {
        const band = i / 12 * tau;
        const lead = time * (.28 + (i % 3) * .035) + i * 1.7;
        // Short luminous trails make the direction of circulation visible.
        for (let tail = 18; tail >= 0; tail--) {
          const p = project(lead - tail * .019, band, time);
          const alpha = (1 - tail / 19) * .9;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (tail ? 1.7 : 3.1) * p.scale, 0, tau);
          ctx.fillStyle = `rgba(250,255,5,${alpha})`;
          ctx.shadowColor = '#FAFF05';
          ctx.shadowBlur = tail ? 0 : 18 * p.scale;
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      drawMark(time);
    }

    function visible() {
      return canvas.isConnected && slide?.hasAttribute('data-deck-active') && !document.hidden;
    }
    function tick(now) {
      frame = 0;
      if (!visible() || motion.matches) return;
      // Limit to 30fps and accumulate only visible time, avoiding jumps on resume.
      if (now - lastTick >= 1000 / 30) {
        elapsed += started ? Math.min((now - started) / 1000, .1) : 0;
        started = now;
        lastTick = now;
        draw(elapsed);
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      started = 0;
      draw(elapsed);
      if (visible() && !motion.matches) frame = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(() => {
      width = canvas.clientWidth || 1920;
      height = canvas.clientHeight || 1080;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sync();
    });
    resize.observe(canvas);
    document.addEventListener('slidechange', sync);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    sync();
  }

  function scan() {
    document.querySelectorAll('canvas[data-loop-orbit]').forEach(mount);
  }
  scan();
  new MutationObserver(scan).observe(document.documentElement, {childList: true, subtree: true});
})();
