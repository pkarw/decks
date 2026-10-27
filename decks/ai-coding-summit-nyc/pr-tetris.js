// PR Tetris: review, reject, stack, merge into a solid logo, rotate, wipe, repeat.
// Original Open Mercato symbol: https://www.agent.sh/assets/speakers/logos/openMercato.svg.
(() => {
  'use strict';
  const mounted = new WeakSet();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const search = new URLSearchParams(location.search);
  const thumbnail = search.has('_snthumb');
  // Freeze any scene time for visual QA; normal presentations run continuously.
  const requestedTime = search.has('_factoryTime') ? Number(search.get('_factoryTime')) : NaN;
  const captureTime = Number.isFinite(requestedTime) ? Math.max(0, requestedTime) : null;
  const still = () => motion.matches || thumbnail || captureTime !== null;
  const markData = 'M12.758 0.1597C13.151 -0.0553252 13.6251 -0.0521648 14.0182 0.162839L18.8603 2.82154L18.9524 2.88222C19.382 3.20466 19.3502 3.89239 18.8583 4.16186L14.0809 6.78601C13.6536 7.0214 13.3867 7.47451 13.3865 7.96833V13.6174H13.3887L13.3865 13.6216C13.4004 14.3394 14.0008 14.8277 14.6415 14.3927H14.6436L14.6446 14.3938L19.7127 11.6116C19.942 11.4877 20.22 11.4892 20.4489 11.6138L26.3683 14.8626C26.6179 14.9992 26.7731 15.2634 26.7731 15.551V22.5373C26.7731 22.825 26.618 22.7994 26.3683 22.936C22.1488 25.2525 17.9444 27.5953 13.7254 29.9128C13.5159 30.0291 13.2632 30.0291 13.0508 29.9128L0.728938 23.3743C0.281397 23.1477 4.85153e-05 22.6827 0 22.1742V15.8828C0 15.3887 0.266929 14.9348 0.694427 14.6994L5.99988 11.7905C6.42745 11.5552 6.69535 11.1012 6.69535 10.6072V4.25813C6.69536 3.76118 6.96458 3.307 7.39501 3.0716L12.758 0.1597ZM13.717 15.3449C13.2717 15.22 12.7655 15.43 12.7016 15.4579C12.6984 15.4598 12.6952 15.4624 12.6921 15.4642L7.38978 18.3761C6.96227 18.6115 6.6954 19.0645 6.69535 19.5584C6.69535 21.4221 6.68398 25.4195 6.68385 25.467C6.68415 25.6145 6.73302 25.8636 7.02793 26.01C7.26104 26.1242 7.52022 26.011 7.68156 25.9096C7.71153 25.8929 11.4439 23.8123 13.0508 22.9297C13.2603 22.8134 13.513 22.8134 13.7254 22.9297L18.9356 25.7924H18.9378C19.7083 26.2406 20.0809 25.4672 20.0809 25.0547V19.2247C20.0809 18.9372 19.9264 18.6729 19.6771 18.5362L14.6436 15.7718C14.6129 15.7549 14.584 15.7362 14.5568 15.7164C14.4034 15.6264 14.0671 15.4433 13.717 15.3449Z';
  const markPath = new Path2D(markData);
  const mask = document.createElement('canvas').getContext('2d');
  const columns = 18, rows = 20, unit = 18;
  const origin = {x: 1405, y: 466};
  const cells = [];
  const remaining = new Map();
  for (let row = rows - 1; row >= 0; row--) {
    for (let col = 0; col < columns; col++) {
      if (mask.isPointInPath(markPath, (col + .5) * 26.7731 / columns,
        (row + .5) * 30 / rows, 'evenodd')) {
        const cell = {col, row};
        cells.push(cell); remaining.set(`${col},${row}`, cell);
      }
    }
  }
  // Connected, mostly four-cell PR pieces tile the actual logo silhouette.
  const groups = [];
  for (const seed of cells) {
    if (!remaining.has(`${seed.col},${seed.row}`)) continue;
    const group = [seed]; remaining.delete(`${seed.col},${seed.row}`);
    for (let i = 0; i < group.length && group.length < 4; i++) {
      const c = group[i];
      for (const [dx, dy] of [[1,0],[-1,0],[0,-1]]) {
        const key = `${c.col + dx},${c.row + dy}`;
        if (remaining.has(key) && group.length < 4) {
          group.push(remaining.get(key)); remaining.delete(key);
        }
      }
    }
    const minCol = Math.min(...group.map(c => c.col));
    const minRow = Math.min(...group.map(c => c.row));
    groups.push({cells: group.map(c => ({x:(c.col-minCol)*unit,y:(c.row-minRow)*unit})),
      x:origin.x+minCol*unit, y:origin.y+minRow*unit});
  }
  const events = [];
  groups.forEach((group, index) => {
    if (index % 4 === 2) events.push({group, rejected:true});
    events.push({group, rejected:false});
  });
  const interval = .24, scanAt = .53, verdictAt = .88, landedAt = 1.72;
  events.forEach((event, index) => {event.start=index*interval;event.id=index+1;});
  const builtAt = (events.length-1)*interval+landedAt+.3;
  const mergedAt = builtAt+1.8;
  const rotatedAt = mergedAt+6.2;
  const wipeAt = rotatedAt+.6;
  const cycle = wipeAt+1.6;
  const clamp = v => Math.max(0, Math.min(1,v));
  const ease = v => {v=clamp(v);return v*v*(3-2*v);};
  const lerp = (a,b,p) => a+(b-a)*p;

  // Sample the two vector contours, preserving the inner opening for both caps
  // and side walls. Projecting real vertices keeps the full turn three dimensional.
  const contours = markData.split(/(?=M)/).filter(Boolean).map(d => {
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',d);
    const length=path.getTotalLength(), count=Math.max(32,Math.ceil(length*1.7));
    return Array.from({length:count},(_,i)=>{
      const p=path.getPointAtLength(i/count*length);
      return [(p.x-13.38655)*12,(p.y-15)*12];
    });
  });
  const area = contour => contour.reduce((sum,p,i)=>{
    const q=contour[(i+1)%contour.length];return sum+p[0]*q[1]-q[0]*p[1];
  },0);
  const winding = Math.sign(area(contours[0]));

  function mount(canvas) {
    if (mounted.has(canvas)) return;
    mounted.add(canvas);
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    const slide=canvas.closest('section');
    canvas.dataset.sceneTimeline=JSON.stringify({builtAt,mergedAt,rotatedAt,wipeAt,cycle,pieces:events.length});
    let width=1920,height=1080,frame=0,started=0,elapsed=0,lastTick=0;

    function polygon(points,fill,stroke) {
      ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
      if(fill){ctx.fillStyle=fill;ctx.fill();}
      if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.8;ctx.stroke();}
    }
    function block(x,y,color='gold',gap=1.6) {
      const size=unit-gap,depth=4;
      const palette=color==='red'?['#FF6868','#A3293B','#FFB6AE']:
        color==='green'?['#A6F5C2','#387B57','#DCFFE7']:
        ['#E5E7A1','#898F40','#FFFFDB'];
      polygon([[x,y],[x+depth,y-3],[x+size+depth,y-3],[x+size,y]],palette[2]);
      polygon([[x+size,y],[x+size+depth,y-3],[x+size+depth,y+size-3],[x+size,y+size]],palette[1]);
      ctx.fillStyle=palette[0];ctx.fillRect(x,y,size,size);
      ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x+size*.43,y,2,size);
      ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=.7;ctx.strokeRect(x,y,size,size);
    }
    function piece(group,x,y,color,rotation=0,alpha=1) {
      ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(rotation);
      group.cells.forEach(c=>block(c.x,c.y,color));ctx.restore();
    }
    function scanner(t,opacity) {
      if(opacity<=0) return;
      ctx.save();ctx.globalAlpha*=opacity;
      let recent=null;
      for(const event of events){const age=t-event.start;if(age>=scanAt&&age<verdictAt+.19)recent=event;}
      const rejected=recent?.rejected;
      const color=rejected?'#FF626A':recent?'#A6F5C2':'#FAFF05';
      ctx.font='500 18px "Geist Mono",monospace';ctx.fillStyle='#C8CCB4';
      ctx.textAlign='left';ctx.fillText('CODE REVIEW',1268,300);
      ctx.textAlign='right';ctx.font='500 15px "Geist Mono",monospace';ctx.fillStyle=color;
      ctx.fillText(recent?`PR #${String(recent.id).padStart(2,'0')} · ${rejected?'REJECT':'PASS'}`:'SCANNING PRs',1818,300);
      polygon([[1268,324],[1280,314],[1811,314],[1823,324],[1823,391],[1811,401],[1280,401],[1268,391]],
        'rgba(20,25,22,.94)','#626945');
      const beam=ctx.createLinearGradient(0,324,0,394);
      beam.addColorStop(0,'rgba(166,245,194,0)');
      beam.addColorStop(.5,rejected?'rgba(255,75,90,.18)':'rgba(166,245,194,.13)');
      beam.addColorStop(1,'rgba(166,245,194,0)');ctx.fillStyle=beam;ctx.fillRect(1285,325,518,68);
      ctx.shadowColor=color;ctx.shadowBlur=12;ctx.fillStyle=color;
      ctx.fillRect(1285,326+(t*75)%62,518,1.5);ctx.shadowBlur=0;
      for(const x of [1276,1810]){
        ctx.fillStyle='#444B35';ctx.fillRect(x,325,4,66);
        ctx.fillStyle=color;ctx.fillRect(x-1,345,6,20);
      }
      ctx.restore();
    }
    function board(alpha) {
      ctx.save();ctx.globalAlpha*=alpha;
      ctx.strokeStyle='rgba(250,255,5,.055)';ctx.lineWidth=.7;
      for(let col=0;col<=columns;col++){
        const x=origin.x+col*unit;ctx.beginPath();ctx.moveTo(x,origin.y-8);ctx.lineTo(x,origin.y+360);ctx.stroke();
      }
      for(let row=0;row<=rows;row++){
        const y=origin.y+row*unit;ctx.beginPath();ctx.moveTo(origin.x-8,y);ctx.lineTo(origin.x+324,y);ctx.stroke();
      }
      ctx.strokeStyle='rgba(250,255,5,.5)';ctx.beginPath();ctx.moveTo(1388,832);ctx.lineTo(1753,832);ctx.stroke();
      ctx.restore();
    }
    function solidLogo(yaw,merge,alpha=1) {
      if(alpha<=0) return;
      const scale=lerp(1,1.1,merge),cx=lerp(1567,1554,merge),cy=lerp(646,611,merge);
      const pitch=-.1,depth=lerp(4,48,merge);
      function rotate([x,y,z]) {
        const rx=x*Math.cos(yaw)+z*Math.sin(yaw),rz=-x*Math.sin(yaw)+z*Math.cos(yaw);
        return [rx,y*Math.cos(pitch)-rz*Math.sin(pitch),y*Math.sin(pitch)+rz*Math.cos(pitch)];
      }
      function project([x,y,z]){const p=1000/(1000+z);return[cx+x*p*scale,cy+y*p*scale];}
      const faces=[];
      for(let side=-1;side<=1;side+=2){
        const normal=rotate([0,0,side]);
        if(normal[2]<0) faces.push({loops:contours.map(c=>c.map(([x,y])=>rotate([x,y,side*depth/2]))),
          normal,cap:true,z:side*depth/2*Math.cos(yaw)});
      }
      for(const contour of contours){
        for(let i=0;i<contour.length;i++){
          const a=contour[i],b=contour[(i+1)%contour.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
          if(length<.001)continue;
          const normal=rotate([winding*dy/length,-winding*dx/length,0]);
          if(normal[2]>=0)continue;
          const vertices=[[a[0],a[1],-depth/2],[b[0],b[1],-depth/2],[b[0],b[1],depth/2],[a[0],a[1],depth/2]].map(rotate);
          faces.push({loops:[vertices],normal,cap:false,z:vertices.reduce((s,p)=>s+p[2],0)/4});
        }
      }
      ctx.save();ctx.globalAlpha*=alpha;
      // Broad contact shadow plus a softer offset cast shadow give the mark weight.
      const shadow=ctx.createRadialGradient(cx+22,850,8,cx+22,850,210);
      shadow.addColorStop(0,'rgba(0,0,0,.7)');shadow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.save();ctx.translate(0,850);ctx.scale(1,.17);ctx.translate(0,-850);
      ctx.fillStyle=shadow;ctx.fillRect(cx-210,640,440,420);ctx.restore();
      faces.sort((a,b)=>b.z-a.z);
      for(const face of faces){
        ctx.beginPath();
        for(const contour of face.loops){contour.forEach((point,i)=>{const [x,y]=project(point);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();}
        const light=clamp(-face.normal[0]*.45-face.normal[1]*.65-face.normal[2]*.65);
        if(face.cap){
          const shine=ctx.createLinearGradient(cx-160,cy-200,cx+180,cy+220);
          shine.addColorStop(0,'#FFFFFF');shine.addColorStop(.38,'#F7F8DD');shine.addColorStop(.7,'#D3D59A');shine.addColorStop(1,'#FFFFC9');
          ctx.fillStyle=shine;ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=28;ctx.shadowOffsetX=14;ctx.shadowOffsetY=19;
        }else{
          const s=Math.round(49+light*139);ctx.fillStyle=`rgb(${s},${s+7},${Math.round(s*.46)})`;
          ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
        }
        ctx.fill('evenodd');ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
        ctx.lineWidth=face.cap?1.1:.5;ctx.strokeStyle=face.cap?'rgba(255,255,223,.55)':ctx.fillStyle;ctx.stroke();
      }
      ctx.restore();
    }
    function draw(time) {
      ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(width/1920,height/1080);
      const t=captureTime!==null?captureTime%cycle:still()?mergedAt+.35:time%cycle;
      const phase=t<builtAt?'review':t<mergedAt?'merge':t<wipeAt?'rotate':'wipe';
      if(canvas.dataset.animationPhase!==phase)canvas.dataset.animationPhase=phase;
      const merge=ease((t-builtAt)/1.8),turn=ease((t-mergedAt)/6.2);
      const yaw=.1+turn*Math.PI*2;
      const wiping=t>=wipeAt,wp=ease((t-wipeAt)/1.25);
      ctx.beginPath();ctx.rect(1195,190,725,735);ctx.clip();
      const glow=ctx.createRadialGradient(1560,620,20,1560,620,410);
      glow.addColorStop(0,'rgba(250,255,5,.08)');glow.addColorStop(1,'rgba(250,255,5,0)');
      ctx.fillStyle=glow;ctx.fillRect(1195,200,725,725);
      scanner(t,1-ease((t-builtAt)/.65));board(1-merge);
      const piecesAlpha=1-ease((merge-.2)/.7);
      ctx.save();ctx.globalAlpha*=piecesAlpha;
      if(merge>0){ctx.translate(1567-13*merge,646-35*merge);ctx.scale(1+.1*merge,1+.1*merge);ctx.translate(-1567,-646);}
      for(const event of events){
        const age=t-event.start;if(age<0)continue;
        const group=event.group;
        const gx=group.x,gy=group.y;
        if(age<scanAt){
          const p=clamp(age/scanAt);piece(group,gx,lerp(190,342,p*p),'gold');
        }else if(age<verdictAt){
          piece(group,gx,342,event.rejected&&age>scanAt+.17?'red':'gold');
        }else if(event.rejected){
          const p=(age-verdictAt)/.85;
          if(p<1){piece(group,gx+p*375,342-95*Math.sin(p*Math.PI)+170*p*p,'red',p*2.4,1-p*p);
            ctx.fillStyle='#FF7B80';ctx.font='500 14px "Geist Mono",monospace';ctx.textAlign='left';
            ctx.fillText('REJECTED',Math.min(gx+p*340,1810),318+150*p*p);}
        }else if(age<landedAt){
          const p=clamp((age-verdictAt)/(landedAt-verdictAt));
          piece(group,gx,lerp(342,gy,p*p),'green');
          ctx.save();ctx.globalAlpha*=.2*(1-p);piece(group,gx,lerp(342,gy,p*p)-24,'green');ctx.restore();
        }else{
          const bounce=age-landedAt<.17?Math.sin((age-landedAt)/.17*Math.PI)*-3:0;
          group.cells.forEach(c=>block(gx+c.x,gy+c.y+bounce,'gold',lerp(1.6,0,merge)));
        }
      }
      ctx.restore();
      if(merge>0){
        ctx.save();
        if(wiping){ctx.beginPath();ctx.rect(lerp(1210,1915,wp),190,725,735);ctx.clip();}
        solidLogo(yaw,merge,ease((merge-.12)/.72));ctx.restore();
      }
      ctx.save();ctx.globalAlpha*=merge*(1-wp);ctx.textAlign='center';
      ctx.fillStyle='#A6F5C2';ctx.font='500 16px "Geist Mono",monospace';ctx.fillText('✓ MERGED',1554,864);
      ctx.fillStyle='#F3F4DD';ctx.font='500 30px Geist,system-ui,sans-serif';ctx.fillText('Open Mercato',1554,905);ctx.restore();
      if(wiping&&wp<1){
        const x=lerp(1210,1915,wp);
        const edge=ctx.createLinearGradient(x-22,0,x+20,0);edge.addColorStop(0,'rgba(250,255,5,0)');edge.addColorStop(.5,'rgba(250,255,5,.7)');edge.addColorStop(1,'rgba(250,255,5,0)');
        ctx.fillStyle=edge;ctx.fillRect(x-22,385,44,460);
        for(let i=0;i<22;i++){
          const y=430+(i*73%360);ctx.fillStyle=`rgba(250,255,5,${(1-wp)*.65})`;
          ctx.fillRect(x-10-(i*17%55),y+wp*(i%4)*20,3+i%3,3+i%3);
        }
      }
      ctx.restore();
    }

    function visible() {
      return canvas.isConnected && slide?.hasAttribute('data-deck-active') && !document.hidden;
    }
    function tick(now) {
      frame = 0;
      if (!visible() || still()) return;
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
      if (visible() && !still()) frame = requestAnimationFrame(tick);
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
    document.querySelectorAll('canvas[data-pr-tetris]').forEach(mount);
  }
  scan();
  new MutationObserver(scan).observe(document.documentElement, {childList: true, subtree: true});
})();
