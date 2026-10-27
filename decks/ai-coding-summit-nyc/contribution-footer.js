// One footer in the stage's scaled canvas, outside the slide slot. Navigation
// changes the target and caption, never the canvas or its running pulse clock.
(() => {
  'use strict';
  const mounted=new WeakSet();
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const thumbnail=new URLSearchParams(location.search).has('_snthumb');
  let instance=0;
  const rows=7,columnsPerStage=6,step=9,cellSize=7;
  const palette=[[57,70,25],[89,108,35],[133,153,49],[188,206,77],[221,231,111]];
  const message='Start with 80% done';
  const font={
    S:['01111','10000','10000','01110','00001','00001','11110'],
    t:['00100','00100','11111','00100','00100','00101','00010'],
    a:['00000','00000','01110','00001','01111','10001','01111'],
    r:['00000','00000','10110','11001','10000','10000','10000'],
    w:['00000','00000','10001','10001','10101','10101','01010'],
    i:['00100','00000','01100','00100','00100','00100','01110'],
    h:['10000','10000','10110','11001','10001','10001','10001'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],
    '0':['01110','10001','10011','10101','11001','10001','01110'],
    '%':['11001','11010','00100','00100','01000','10110','00110'],
    d:['00001','00001','01101','10011','10001','10001','01111'],
    o:['00000','00000','01110','10001','10001','10001','01110'],
    n:['00000','00000','10110','11001','10001','10001','10001'],
    e:['00000','00000','01110','10001','11111','10000','01111'],
    ' ':['000','000','000','000','000','000','000'],
  };
  const clamp=v=>Math.max(0,Math.min(1,v));
  const mix=(a,b,p)=>a+(b-a)*p;

  function mount(stage) {
    const surface=stage.shadowRoot?.querySelector('.canvas');
    if(!surface||mounted.has(stage)||surface.querySelector('[data-contribution-footer]'))return;
    const allSlides=Array.from(stage.children).filter(el=>el.tagName==='SECTION');
    const slides=allSlides.slice(1);
    if(!slides.length)return;
    mounted.add(stage);
    const wrapper=document.createElement('div');
    wrapper.dataset.contributionFooter='';
    wrapper.setAttribute('role','progressbar');
    wrapper.setAttribute('aria-label','Talk progress');
    wrapper.setAttribute('aria-valuemin','0');
    wrapper.setAttribute('aria-valuemax',String(slides.length));
    Object.assign(wrapper.style,{position:'absolute',left:'104px',right:'104px',bottom:'18px',
      height:'96px',zIndex:'4',pointerEvents:'none'});
    const canvas=document.createElement('canvas');
    canvas.dataset.contributionGrid='';
    canvas.dataset.instance=String(++instance);
    canvas.setAttribute('aria-hidden','true');
    Object.assign(canvas.style,{display:'block',width:'100%',height:'100%'});
    wrapper.appendChild(canvas);surface.appendChild(wrapper);
    const style=document.createElement('style');
    style.textContent='@media print{[data-contribution-footer]{display:none!important}}';
    stage.shadowRoot.appendChild(style);
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const fluid=document.createElement('canvas');
    const fluidContext=fluid.getContext('2d');
    let fluidPixels=null;
    const total=slides.length,columns=total*columnsPerStage,totalCells=columns*rows;
    const glyphs=Array.from(message).map(char=>font[char]);
    const textWidth=glyphs.reduce((sum,glyph)=>sum+glyph[0].length+1,0)-1;
    const messageCells=Array.from({length:rows},()=>Array(columns).fill(false));
    let pen=Math.floor((columns-textWidth)/2);
    for(const glyph of glyphs){
      glyph.forEach((line,row)=>Array.from(line).forEach((bit,col)=>{
        if(bit==='1'&&pen+col>=0&&pen+col<columns)messageCells[row][pen+col]=true;
      }));
      pen+=glyph[0].length+1;
    }
    canvas.dataset.message=message;
    let width=1712,height=96,clock=0,last=0,raf=0,current=-1,fill=0,target=0,caption='';
    let reported=-1,begun=false,endingStarted=null,fillRate=27;

    function setStage(index) {
      const cover=index===0;
      wrapper.style.visibility=cover?'hidden':'visible';
      wrapper.setAttribute('aria-hidden',String(cover));
      canvas.dataset.currentSlide=String(index+1);
      if(cover)return;
      current=Math.max(0,Math.min(total-1,index-1));
      caption=slides[current].getAttribute('data-label')||`Slide ${current+1}`;
      if(caption==='Cover')caption='Closing the Agentic Loop';
      target=(current+1)*columnsPerStage*rows;
      if(!begun)fill=current*columnsPerStage*rows;
      fillRate=Math.max(27,Math.abs(target-fill)/1.3);
      if(current!==total-1)endingStarted=null;
      if(motion.matches||thumbnail)fill=target;
      wrapper.setAttribute('aria-valuenow',String(current+1));
      wrapper.setAttribute('aria-valuetext',`Stage ${current+1} of ${total}: ${caption}`);
      canvas.dataset.currentStage=String(current+1);
      canvas.dataset.progressTarget=String(target);
      // A navigation event only changes data; it must not touch RAF or clock.
      draw();
      if(!begun){begun=true;resume();}
    }

    function liquid(time,amount,gridX,gridY,gridWidth) {
      if(amount<=0||!fluidContext)return;
      // Render the metaball field once at a small resolution, then upscale its
      // smooth alpha image. This avoids thousands of shadowed vector contours.
      const resolution=3,w=Math.ceil(gridWidth/resolution),h=Math.ceil((height-gridY+6)/resolution);
      if(fluid.width!==w||fluid.height!==h){fluid.width=w;fluid.height=h;fluidPixels=fluidContext.createImageData(w,h);}
      const balls=Array.from({length:12},(_,i)=>{
        const rx=24+12*Math.sin(time*.6+i*.7)**2,ry=13+7*Math.sin(time*.55+i*1.3)**2;
        return {x:gridX+(i+.5)/12*gridWidth+Math.sin(time*.37+i*1.9)*19,
          y:gridY+43+Math.sin(time*.8+i)*9,rx2:rx*rx,ry2:ry*ry};
      });
      const data=fluidPixels.data;
      for(let row=0;row<h;row++){
        const y=gridY-6+(row+.5)*resolution,shade=clamp(row/(h-1));
        const red=Math.round(mix(234,51,shade)),green=Math.round(mix(249,79,shade)),blue=Math.round(mix(187,41,shade));
        for(let col=0;col<w;col++){
          const x=gridX+(col+.5)/w*gridWidth;
          let value=0;
          for(const ball of balls){const dx=x-ball.x,dy=y-ball.y;value+=1/(dx*dx/ball.rx2+dy*dy/ball.ry2+.05);}
          const index=(row*w+col)*4;
          data[index]=red;data[index+1]=green;data[index+2]=blue;
          data[index+3]=Math.round(clamp((value-.9)*2.6)*255);
        }
      }
      fluidContext.putImageData(fluidPixels,0,0);
      ctx.save();ctx.globalAlpha*=amount;ctx.imageSmoothingEnabled=true;
      ctx.shadowColor='rgba(176,222,111,.45)';ctx.shadowBlur=8;
      ctx.drawImage(fluid,gridX,gridY-6,gridWidth,height-gridY+6);ctx.restore();
    }

    function draw() {
      ctx.clearRect(0,0,width,height);
      const gridWidth=columns*step-2,gridX=width-gridWidth,gridY=25;
      const animation=(motion.matches||thumbnail)?0:clock;
      if(begun&&current===total-1&&fill>=target-.001&&endingStarted===null)endingStarted=clock;
      const melt=endingStarted===null||motion.matches||thumbnail?0:
        clamp((clock-endingStarted-3.3)/2.6);
      canvas.dataset.endingPhase=melt===0?'contributions':melt<1?'melting':'liquid';
      const filled=Math.floor(fill),scanX=gridX+gridWidth-fill/rows*step;
      ctx.strokeStyle='rgba(255,255,255,.075)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,.5);ctx.lineTo(width,.5);ctx.stroke();
      ctx.textAlign='left';ctx.fillStyle='#989D86';
      ctx.font='500 13px "Geist Mono",monospace';
      ctx.fillText(`STAGE ${String(current+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`,0,25);
      ctx.font='500 23px Geist,system-ui,sans-serif';ctx.fillStyle='#E3E7CF';
      let text=caption;
      while(text.length>1&&ctx.measureText(text).width>gridX-52)text=text.slice(0,-2)+'…';
      ctx.fillText(text,0,55);
      ctx.font='400 12px "Geist Mono",monospace';ctx.fillStyle='#6F7957';
      ctx.fillText('CODE REVIEW → MERGED',0,80);

      for(let order=0;order<totalCells;order++) {
        const col=columns-1-Math.floor(order/rows),row=order%rows;
        let x=gridX+col*step,y=gridY+row*step;
        const seed=(col*37+row*61)%101;
        if(order<filled) {
          const letter=messageCells[row][col];
          const base=letter?[220,236,136]:palette[seed%palette.length].map(v=>v*.2);
          // Every filled cell has its own smooth, unsynchronised brightness pulse.
          const pulse=letter ? .86+.14*Math.sin(animation*1.35+seed*1.73):
            .78+.22*Math.sin(animation*(1.15+(seed%7)*.12)+seed*1.73);
          const flash=clamp(1-(fill-order)/14)*.12;
          ctx.fillStyle=`rgb(${base.map(v=>Math.round(Math.min(255,v*pulse+flash*100))).join(',')})`;
        }else {
          const activeBand=Math.floor((totalCells-1-order)/(rows*columnsPerStage))===total-1-current;
          ctx.fillStyle=activeBand?'#1B2114':'#12160F';
        }
        const drip=clamp((melt-(rows-1-row)*.055)/.67);
        ctx.save();ctx.globalAlpha*=1-drip;
        x+=Math.sin(seed+animation)*drip*5;
        y+=drip*(height-y-cellSize)*.7;
        if(drip>0){ctx.beginPath();ctx.roundRect(x,y,cellSize,cellSize,drip*4);ctx.fill();}
        else ctx.fillRect(x,y,cellSize,cellSize);
        ctx.restore();
      }
      liquid(animation,clamp(melt*1.4),gridX,gridY,gridWidth);
      // Stage ticks run in the same right-to-left direction as the fill.
      ctx.textAlign='center';ctx.font='500 10px "Geist Mono",monospace';
      for(let i=0;i<total;i++) {
        const x=gridX+gridWidth-(i+.5)*columnsPerStage*step;
        ctx.save();ctx.globalAlpha*=1-melt;
        ctx.fillStyle=i===current?'#EAF48D':i<current?'#6E8051':'#333B2A';
        ctx.fillText(String(i+1).padStart(2,'0'),x,13);ctx.restore();
      }

      // Incoming PRs travel horizontally to the review point. Rejected ones
      // turn red and arc away; accepted work is represented by the fill frontier.
      const newest=Math.floor(animation/.42);
      let red=false;
      if(!(motion.matches||thumbnail)&&melt<1) {
        for(let id=Math.max(0,newest-3);id<=newest;id++) {
          const age=animation-id*.42,p=age/1.35;if(p<0||p>1)continue;
          const reject=id%6===2&&p>.8;
          let x=mix(width+14,scanX,p),y=gridY+(id%rows)*step;
          if(reject&&p>.88){const e=(p-.88)/.12;x+=e*23;y-=Math.sin(e*Math.PI)*18;}
          ctx.save();ctx.globalAlpha=(reject?1:Math.sin(p*Math.PI)*.85)*(1-melt);
          ctx.fillStyle=reject?'#F86873':'#D9EB9F';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=reject?7:3;
          ctx.fillRect(x,y,6,6);ctx.restore();
          red=red||reject;
        }
      }
      ctx.save();
      const gate=Math.max(gridX-2,Math.min(width-2,scanX));
      ctx.strokeStyle=red?'#F86873':'#CFE69B';
      ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=6;
      ctx.globalAlpha=(.5+.25*Math.sin(animation*2.8))*(1-melt);
      ctx.lineWidth=1.3;ctx.strokeRect(gate-3,gridY-3,6,rows*step-3+6);
      ctx.restore();
      const count=Math.round(fill);
      if(count!==reported){reported=count;canvas.dataset.progressCells=String(count);}
      canvas.dataset.animationSeconds=clock.toFixed(2);
    }

    function tick(now) {
      raf=0;if(!begun||!canvas.isConnected||document.hidden||motion.matches||thumbnail)return;
      if(!last||now-last>=1000/30) {
        const dt=last?Math.min((now-last)/1000,.1):0;last=now;clock+=dt;
        const distance=target-fill;
        fill+=Math.sign(distance)*Math.min(Math.abs(distance),dt*fillRate);
        draw();
      }
      raf=requestAnimationFrame(tick);
    }
    function resume() {
      if(raf)cancelAnimationFrame(raf);raf=0;last=0;
      if(motion.matches||thumbnail)fill=target;
      draw();
      if(begun&&!document.hidden&&!motion.matches&&!thumbnail)raf=requestAnimationFrame(tick);
    }
    new ResizeObserver(()=>{
      width=wrapper.clientWidth||1712;height=96;
      const dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);draw();
    }).observe(wrapper);
    stage.addEventListener('slidechange',event=>setStage(event.detail.index));
    document.addEventListener('visibilitychange',resume);
    motion.addEventListener('change',resume);
    const active=allSlides.findIndex(slide=>slide.hasAttribute('data-deck-active'));
    setStage(active<0?Math.max(0,Number(location.hash.slice(1)||1)-1):active);
    document.fonts.ready.then(draw);resume();
  }
  function scan(){document.querySelectorAll('deck-stage').forEach(mount);}
  scan();
  customElements.whenDefined('deck-stage').then(scan);
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
