// Moving cartons on a conveyor assemble the official Open Mercato symbol.
// Mark geometry comes from https://www.agent.sh/assets/speakers/logos/openMercato.svg.
// No graphics dependencies; pause off-slide and render a completed logo for reduced motion.
(() => {
  'use strict';
  const mounted = new WeakSet();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Match the shared viewer's thumbnail capture mode with a finished, static frame.
  const thumbnail = new URLSearchParams(location.search).has('_snthumb');
  const markPath = new Path2D('M12.758 0.1597C13.151 -0.0553252 13.6251 -0.0521648 14.0182 0.162839L18.8603 2.82154L18.9524 2.88222C19.382 3.20466 19.3502 3.89239 18.8583 4.16186L14.0809 6.78601C13.6536 7.0214 13.3867 7.47451 13.3865 7.96833V13.6174H13.3887L13.3865 13.6216C13.4004 14.3394 14.0008 14.8277 14.6415 14.3927H14.6436L14.6446 14.3938L19.7127 11.6116C19.942 11.4877 20.22 11.4892 20.4489 11.6138L26.3683 14.8626C26.6179 14.9992 26.7731 15.2634 26.7731 15.551V22.5373C26.7731 22.825 26.618 22.7994 26.3683 22.936C22.1488 25.2525 17.9444 27.5953 13.7254 29.9128C13.5159 30.0291 13.2632 30.0291 13.0508 29.9128L0.728938 23.3743C0.281397 23.1477 4.85153e-05 22.6827 0 22.1742V15.8828C0 15.3887 0.266929 14.9348 0.694427 14.6994L5.99988 11.7905C6.42745 11.5552 6.69535 11.1012 6.69535 10.6072V4.25813C6.69536 3.76118 6.96458 3.307 7.39501 3.0716L12.758 0.1597ZM13.717 15.3449C13.2717 15.22 12.7655 15.43 12.7016 15.4579C12.6984 15.4598 12.6952 15.4624 12.6921 15.4642L7.38978 18.3761C6.96227 18.6115 6.6954 19.0645 6.69535 19.5584C6.69535 21.4221 6.68398 25.4195 6.68385 25.467C6.68415 25.6145 6.73302 25.8636 7.02793 26.01C7.26104 26.1242 7.52022 26.011 7.68156 25.9096C7.71153 25.8929 11.4439 23.8123 13.0508 22.9297C13.2603 22.8134 13.513 22.8134 13.7254 22.9297L18.9356 25.7924H18.9378C19.7083 26.2406 20.0809 25.4672 20.0809 25.0547V19.2247C20.0809 18.9372 19.9264 18.6729 19.6771 18.5362L14.6436 15.7718C14.6129 15.7549 14.584 15.7362 14.5568 15.7164C14.4034 15.6264 14.0671 15.4433 13.717 15.3449Z');
  const mask = document.createElement('canvas').getContext('2d');
  const columns = 18, rows = 20;
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (mask.isPointInPath(markPath, (col + .5) * 26.7731 / columns,
        (row + .5) * 30 / rows, 'evenodd')) cells.push({col, row});
    }
  }
  cells.sort((a, b) => b.row - a.row || a.col - b.col);

  function mount(canvas) {
    if (mounted.has(canvas)) return;
    mounted.add(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const slide = canvas.closest('section');
    let width = 1920, height = 1080, frame = 0, started = 0;
    let elapsed = 0, lastTick = 0;
    const travel = 1.35, lift = .72, interval = .095;
    const assembledAt = (cells.length - 1) * interval + travel + lift;
    const cycle = assembledAt + 4.5;
    const ease = x => x * x * (3 - 2 * x);

    function polygon(points, fill, stroke) {
      ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {ctx.strokeStyle = stroke; ctx.lineWidth = .8; ctx.stroke();}
    }

    function carton(x, y, size, settled) {
      const depth = size * .28;
      const top = depth * .64;
      polygon([[x, y], [x + depth, y - top], [x + size + depth, y - top], [x + size, y]],
        settled ? '#FFFFCE' : '#F1DA9C', '#11130D');
      polygon([[x + size, y], [x + size + depth, y - top],
        [x + size + depth, y + size - top], [x + size, y + size]],
        settled ? '#999B51' : '#927746', '#11130D');
      ctx.fillStyle = settled ? '#DADD9C' : '#D0AD6B';
      ctx.fillRect(x, y, size, size);
      // Packing tape wraps across the top and front of every carton.
      const tape = Math.max(1, size * .12);
      polygon([[x + size * .5 - tape / 2, y], [x + size * .5 + depth - tape / 2, y - top],
        [x + size * .5 + depth + tape / 2, y - top], [x + size * .5 + tape / 2, y]], '#F8EFC2');
      ctx.fillStyle = settled ? 'rgba(255,255,230,.25)' : '#E7CA8D';
      ctx.fillRect(x + size * .5 - tape / 2, y, tape, size);
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.lineWidth = .7;
      ctx.strokeRect(x, y, size, size);
      if (!settled) {
        ctx.fillStyle = '#F4ECD6';
        ctx.fillRect(x + size * .65, y + size * .61, size * .26, size * .21);
        ctx.fillStyle = '#4C4939';
        for (let i = 0; i < 4; i++) ctx.fillRect(x + size * (.68 + i * .055), y + size * .65, 1, size * .12);
      }
    }

    function conveyor(time) {
      // A shallow perspective makes the transport surface and carton volume legible.
      polygon([[1190, 772], [1222, 744], [1882, 744], [1850, 772]], '#22251B', '#727747');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(1190, 772); ctx.lineTo(1222, 744); ctx.lineTo(1882, 744); ctx.lineTo(1850, 772); ctx.closePath();
      ctx.clip();
      const offset = (time * 85) % 32;
      ctx.strokeStyle = '#606442'; ctx.lineWidth = 1;
      for (let x = 1170 - offset; x < 1910; x += 32) {
        ctx.beginPath();ctx.moveTo(x, 772);ctx.lineTo(x + 32, 744);ctx.stroke();
      }
      ctx.restore();
      polygon([[1190, 772], [1850, 772], [1850, 808], [1190, 808]], '#171A12', '#4B5035');
      ctx.fillStyle = '#FAFF05';ctx.fillRect(1190, 776, 660, 3);
      ctx.fillStyle = '#282C1D';
      ctx.fillRect(1225, 808, 16, 52);ctx.fillRect(1790, 808, 16, 52);
      ctx.fillStyle = '#484D2E';ctx.fillRect(1212, 856, 42, 5);ctx.fillRect(1777, 856, 42, 5);
      for (const x of [1208, 1832]) {
        ctx.beginPath();ctx.arc(x, 792, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#333924';ctx.fill();ctx.strokeStyle = '#999F59';ctx.stroke();
        ctx.beginPath();ctx.moveTo(x - Math.cos(time * 2) * 7, 792 - Math.sin(time * 2) * 7);
        ctx.lineTo(x + Math.cos(time * 2) * 7, 792 + Math.sin(time * 2) * 7);ctx.stroke();
      }
      // Quiet assembly guide connects the incoming belt to the completed emblem.
      ctx.setLineDash([3, 9]);ctx.strokeStyle = 'rgba(250,255,5,.15)';
      ctx.beginPath();ctx.moveTo(1270, 721);ctx.lineTo(1270, 280);ctx.lineTo(1345, 280);ctx.stroke();
      ctx.setLineDash([]);
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.scale(width / 1920, height / 1080);
      const t = (motion.matches || thumbnail) ? assembledAt + 1 : (time + assembledAt * .78) % cycle;
      const fade = t > cycle - 1.2 ? 1 - ease((t - cycle + 1.2) / 1.2) : 1;
      const glow = ctx.createRadialGradient(1560, 535, 10, 1560, 535, 450);
      glow.addColorStop(0, 'rgba(250,255,5,.075)');glow.addColorStop(1, 'rgba(250,255,5,0)');
      ctx.fillStyle = glow;ctx.fillRect(1130, 150, 790, 760);
      conveyor((motion.matches || thumbnail) ? 0 : time);
      if (t > assembledAt) {
        // Keep the factory moving while its finished mark is on display.
        for (let i = 0; i < 6; i++) {
          const x = 1198 + ((i * 108 - ((motion.matches || thumbnail) ? 0 : time * 85)) % 648 + 648) % 648;
          carton(x, 737, 29, false);
        }
      }
      const moving = [];
      ctx.globalAlpha = fade;
      for (let i = 0; i < cells.length; i++) {
        const age = t - i * interval;
        if (age < 0) continue;
        const x = 1405 + cells[i].col * 18;
        const y = 270 + cells[i].row * 18;
        if (age >= travel + lift) {
          // Settle into the packing grid with a tiny, damped placement bounce.
          const since = age - travel - lift;
          const bounce = since < .3 && !(motion.matches || thumbnail) ? Math.sin(since / .3 * Math.PI) * -3 : 0;
          carton(x, y + bounce, 16.5, true);
        } else if (age < travel) {
          moving.push({x: 1860 - (1860 - 1268) * age / travel, y: 737, size: 29});
        } else {
          const p = ease((age - travel) / lift);
          moving.push({x: 1268 + (x - 1268) * p,
            y: 737 + (y - 737) * p - Math.sin(p * Math.PI) * 100,
            size: 29 + (16.5 - 29) * p});
        }
      }
      moving.sort((a, b) => a.y - b.y).forEach(box => carton(box.x, box.y, box.size, false));
      // A short verification sweep marks the completed factory output.
      if (t > assembledAt && t < assembledAt + 1.2) {
        const scan = (t - assembledAt) / 1.2;
        const scanY = 260 + scan * 380;
        const light = ctx.createLinearGradient(1390, 0, 1750, 0);
        light.addColorStop(0, 'rgba(250,255,5,0)');light.addColorStop(.5, 'rgba(250,255,5,.7)');light.addColorStop(1, 'rgba(250,255,5,0)');
        ctx.fillStyle = light;ctx.fillRect(1390, scanY, 360, 2);
      }
      ctx.globalAlpha = fade * Math.min(1, Math.max(0, (t - assembledAt + 1) / 1));
      ctx.textAlign = 'center';ctx.fillStyle = '#EEEECF';ctx.font = '500 31px Geist, system-ui, sans-serif';
      ctx.fillText('Open Mercato', 1568, 688);
      ctx.restore();
    }

    function visible() {
      return canvas.isConnected && slide?.hasAttribute('data-deck-active') && !document.hidden;
    }
    function tick(now) {
      frame = 0;
      if (!visible() || (motion.matches || thumbnail)) return;
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
      if (visible() && !(motion.matches || thumbnail)) frame = requestAnimationFrame(tick);
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
    document.querySelectorAll('canvas[data-factory-conveyor]').forEach(mount);
  }
  scan();
  new MutationObserver(scan).observe(document.documentElement, {childList: true, subtree: true});
})();
