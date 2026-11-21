/* ===================== Bot City: Bowling Green · play ===================== */
const G={t:0, mode:'walk', keys:new Set(), cash:40, savings:0, fuel:1, coins:0, job:null, gps:null, near:null, modal:false, yaw:0};
const fmt=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:0});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
let AC=null; const audio=()=>{ if(!AC) try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} };
function tone(f,d=.12,type='triangle',v=.04){ if(!AC) return; const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain(); o.type=type; o.frequency.value=f; g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(v,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+d+.02); }
const sfx={coin:()=>{ tone(1320,.07,'square',.02); setTimeout(()=>tone(1760,.1,'square',.018),60); }, good:()=>{ tone(660,.12); tone(990,.18); }, bad:()=>tone(160,.25,'sawtooth',.03), door:()=>tone(520,.15,'sine',.05)};
function toast(h,t=''){ const e=document.createElement('div'); e.className='toast '+t; e.innerHTML=h; $('#toasts').appendChild(e); while($('#toasts').children.length>2) $('#toasts').firstChild.remove(); setTimeout(()=>{ e.style.opacity=0; setTimeout(()=>e.remove(),400); },3600); }
function modal(h){ $('#mc').innerHTML=h; $('#modal').hidden=false; G.modal=true; return $('#mc'); }
function closeModal(){ $('#modal').hidden=true; G.modal=false; }

/* ---------- boot ---------- */
async function boot(){ initThree(); setupMaterials(); $('#tLogo').src=MB_ASSETS.logo; buildCity();
  GLTF.crowd=await parseGLB(MB_ASSETS.crowd);
  G.you=makeRig(GLTF.crowd, MB.you, 1.9,'g'); G.you.root.add(blob(1)); scene.add(G.you.root); const sp0=new THREE.Vector3(0,0,7.5), cp0=new THREE.Vector3(REAL.grid.hx+1.7,0,-14); W.fountain.localToWorld(sp0); W.fountain.localToWorld(cp0); G.p={x:sp0.x,z:sp0.z};
  G.car=makeCar({id:'mine',style:'hatch',color:'#00C853'}); scene.add(G.car); const ga=W.fountain.rotation.y; G.c={x:cp0.x,z:cp0.z,h:ga,v:0,vh:ga}; placeCar(G.car,G.c);
  portals(); traffic(); peds(); coins(); mapCanvas(); fxInit();
  $('#go').disabled=false; $('#go').textContent='Explore Bowling Green';
  $('#go').onclick=()=>{ audio(); $('#title').hidden=true; $('#hud').hidden=false; $('#mini').hidden=false; $('#hSpd').hidden=false; toast('Welcome to <b>Bowling Green</b>! Walk to the glowing rings to enter MoneyVerse games.'); setTimeout(()=>toast('Your car is parked right here. Press <b>E</b> next to it to drive.'),4000); };
  loop(); }

/* ---------- input ---------- */
addEventListener('keydown',e=>{ const k=e.key.toLowerCase(); G.keys.add(k); if(G.modal){ if(k==='escape') closeModal(); return; }
  if(k==='e') act(); if(k==='m') bigMap(); if(k==='j') jobBoard(); if(['arrowup','arrowdown',' '].includes(k)) e.preventDefault(); });
addEventListener('keyup',e=>G.keys.delete(e.key.toLowerCase()));
let drag=null; $('#gl').addEventListener('pointerdown',e=>drag=e.clientX); addEventListener('pointerup',()=>drag=null); addEventListener('pointermove',e=>{ if(drag!=null){ G.yaw-=(e.clientX-drag)*.006; drag=e.clientX; } });
$$('#pads button').forEach(b=>{ const k=b.dataset.k; b.onpointerdown=e=>{ e.preventDefault(); G.keys.add(k); if(k==='e') act(); }; b.onpointerup=b.onpointerleave=()=>G.keys.delete(k); });
const K=(...a)=>a.some(k=>G.keys.has(k));

/* ---------- portals: doors into the MoneyVerse ---------- */
function portals(){ G.portals=LANDMARKS.filter(l=>l.game).map(l=>{ const ang=l.g?l.g.rotation.y:0; let x=l.x, z=l.z; if(l.id!=='botlife'){ const off=l.id==='botu'?13:l.id==='botfactory'?20:l.id==='tycoon'?20:14; x+=Math.sin(ang)*off; z+=Math.cos(ang)*off; }
  const nr=nearRoad(x,z); const y=H(x,z); const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.22,10,40),new THREE.MeshStandardMaterial({color:l.col,emissive:l.col,emissiveIntensity:1.4})); ring.position.set(x,y+2.6,z); ring.rotation.y=ang; scene.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(2,2,60,20,1,true),new THREE.MeshBasicMaterial({color:l.col,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide})); beam.position.set(x,y+30,z); scene.add(beam);
  const tag=sign(scene,[{t:l.name,size:56,color:'#FFFFFF'}],6,1.1,x,y+5.6,z,{bg:l.col,r:18,w:768,h:144}); return {l,x,z,ring,beam,tag}; }); }
function act(){ if(G.near==='car'){ G.mode=G.mode==='drive'?'walk':'drive'; if(G.mode==='walk'){ G.p.x=G.c.x-Math.cos(G.c.h)*2.6; G.p.z=G.c.z+Math.sin(G.c.h)*2.6; } sfx.door(); return; }
  if(G.near&&G.near.l) openPortal(G.near.l); else if(G.near==='truck') jobBoard(); else if(G.near==='atm') atm(); else if(G.near&&G.near.gas) gas(); }
function openPortal(l){ modal(`<div class="eye">MoneyVerse door</div><h2>${l.name}</h2>${l.sponsor?`<div class="spon">${l.sponsor}</div>`:''}<p>${l.blurb}</p>
  <div class="row"><button class="btn" onclick="closeModal()">Keep exploring</button><a class="btn pri" href="${l.url}" target="_blank" rel="noopener">Play ${l.name.split(' ·')[0]} ↗</a></div>`); sfx.door(); }

/* ---------- jobs: Bot Eats deliveries ---------- */
const DROPS=()=>LANDMARKS.filter(l=>!['square','river','botlife'].includes(l.id));
function jobBoard(){ if(G.job) return modal(`<h2>Delivery in progress</h2><p>Take the order to <b>${G.job.to.name}</b>. Follow the GPS arrow.</p><div class="row"><button class="btn" id="jq">Cancel job</button><button class="btn pri" onclick="closeModal()">Back to driving</button></div>`).querySelector('#jq').onclick=()=>{ endJob(false); closeModal(); };
  const offers=[0,1,2].map(()=>{ const to=pick(DROPS()), d=Math.hypot(to.x,to.z); return {to, pay:Math.round(6+d*.045), time:Math.round(35+d*.17)}; });
  const m=modal(`<div class="eye">Bot Eats · food truck on Fountain Square</div><h2>Pick a delivery</h2><p>Gig work pays per trip. Faster = bigger tip. <b>Nobody withholds taxes for you</b>, so smart drivers set aside about 15%.</p>
   <div class="jobs">${offers.map((o,i)=>`<button class="btn" data-j="${i}"><b>${o.to.name}</b><span>${fmt(o.pay)} + tip · ${o.time}s</span></button>`).join('')}</div>`);
  m.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{ const o=offers[+b.dataset.j]; G.job=Object.assign({left:o.time},o); G.gps={x:o.to.x,z:o.to.z,name:o.to.name}; closeModal(); sfx.good(); toast('🍔 Order picked up! Deliver to <b>'+o.to.name+'</b>.'); }); }
function endJob(done){ const j=G.job; G.job=null; G.gps=null; if(!done){ toast('Job canceled.','bad'); return; } const tip=Math.max(0,Math.round(j.left/j.time*j.pay*.6)), total=j.pay+tip; G.cash+=total; G.jobs=(G.jobs||0)+1; sfx.good();
  toast(`✅ Delivered! <b>+${fmt(total)}</b> (${fmt(j.pay)} pay + ${fmt(tip)} tip)`,'good'); if(G.jobs===1) setTimeout(()=>toast('💡 Set aside ~15% for taxes, then save some at the <b>BotBank ATM</b> downtown.'),3800); }
function atm(){ const m=modal(`<div class="eye">BotBank ATM · presented by American Bank & Trust</div><h2>Wallet ${fmt(G.cash)} · Savings ${fmt(G.savings)}</h2><p>Savings earn interest every minute you play (a sped-up 4% a year). Cash in your wallet earns nothing.</p>
  <div class="row"><button class="btn" id="dAll">Deposit all</button><button class="btn" id="dHalf">Deposit half</button><button class="btn" id="wd">Withdraw $20</button></div>`);
  m.querySelector('#dAll').onclick=()=>{ G.savings+=G.cash; G.cash=0; sfx.coin(); atm(); }; m.querySelector('#dHalf').onclick=()=>{ const h=Math.floor(G.cash/2); G.savings+=h; G.cash-=h; sfx.coin(); atm(); }; m.querySelector('#wd').onclick=()=>{ const w=Math.min(20,G.savings); G.savings-=w; G.cash+=w; atm(); }; }
function gas(){ const need=Math.round((1-G.fuel)*40); if(need<1) return toast('Tank is already full.'); const pay=Math.min(need,G.cash); if(pay<1) return toast('No cash for gas! Deliver food or hit the ATM.','bad'); G.cash-=pay; G.fuel=Math.min(1,G.fuel+pay/40); sfx.coin(); toast(`⛽ Filled up: ${fmt(pay)}. Gas is a real cost of owning a car.`); }

/* ---------- traffic + people ---------- */
function traffic(){ G.traf=[]; const roads=ROADS.filter(r=>r.kind==='major'||r.kind==='street'||r.kind==='hwy'); for(let i=0;i<(MOBILE?16:36);i++){ const r=pick(roads), g=makeCar({id:'t'+i,style:pick(['sedan','hatch','ev','truck','sedan']),color:pick(['#F59E0B','#3B82F6','#E11D48','#F8FAFC','#334155','#A855F7','#0EA5E9'])}); scene.add(g);
  G.traf.push({g,r,seg:Math.floor(Math.random()*(r.pts.length-1)),u:0,dir:Math.random()<.5?1:-1,v:r.kind==='hwy'?rand(22,28):rand(9,13)}); } }
function trafTick(dt){ G.traf.forEach(t=>{ const P=t.r.pts; let a=P[t.seg], b=P[t.seg+1]; const L=Math.hypot(b[0]-a[0],b[1]-a[1]); let vv=t.v; const me=G.mode==='drive'?G.c:G.p;
    const dx0=(b[0]-a[0])/L*t.dir, dz0=(b[1]-a[1])/L*t.dir, gx=me.x-t.g.position.x, gz=me.z-t.g.position.z, ahead=gx*dx0+gz*dz0; if(ahead>0&&ahead<9&&Math.abs(gx*dz0-gz*dx0)<3) vv=0;
    t.u+=vv*dt*t.dir/L; if(t.u>1){ if(t.seg<P.length-2){ t.seg++; t.u=0; } else { t.dir=-1; t.u=1; } } if(t.u<0){ if(t.seg>0){ t.seg--; t.u=1; } else { t.dir=1; t.u=0; } }
    a=P[t.seg]; b=P[t.seg+1]; const L2=Math.hypot(b[0]-a[0],b[1]-a[1]), dx=(b[0]-a[0])/L2, dz=(b[1]-a[1])/L2, lane=t.r.w/4*t.dir, x=a[0]+(b[0]-a[0])*t.u-dz*lane, z=a[1]+(b[1]-a[1])*t.u+dx*lane;
    t.g.position.set(x,roadY(x,z),z); t.g.rotation.y=Math.atan2(dx*t.dir,dz*t.dir); t.g.userData.wheels.forEach(w=>w.children.forEach(m=>m.rotation.y+=vv*dt/t.g.userData.r)); }); }
function peds(){ G.peds=[]; const spots=[[0,0,14],[LMR.botu[0],LMR.botu[1]+8,30],[LMR.ballpark[0]+14,LMR.ballpark[1],14],[LMR.tycoon[0],LMR.tycoon[1]+24,26],[20,30,40],[-30,-20,40]]; for(let i=0;i<(MOBILE?12:30);i++){ const [cx,cz,r]=pick(spots), rig=makeRig(GLTF.crowd,mat(pick(['#FCA5A5','#93C5FD','#FDE68A','#C4B5FD','#A7F3D0','#FDBA74','#F9A8D4','#E2E8F0']),{roughness:.3}),rand(1.6,2),pick(['g','y']));
  rig.root.add(blob(1)); scene.add(rig.root); const o={rig,cx,cz,r,x:cx+rand(-r,r),z:cz+rand(-r,r),tx:0,tz:0,w:0}; o.tx=o.x; o.tz=o.z; G.peds.push(o); } }
function pedTick(dt){ G.peds.forEach(o=>{ const dx=o.tx-o.x, dz=o.tz-o.z, d=Math.hypot(dx,dz); if(d<.3){ o.w-=dt; if(o.w<0){ o.tx=o.cx+rand(-o.r,o.r); o.tz=o.cz+rand(-o.r,o.r); o.w=rand(1,5); } } else { const p={x:o.x+dx/d*1.4*dt,z:o.z+dz/d*1.4*dt}; if(collide(p,.6)){ o.tx=o.x; o.tz=o.z; } o.x=p.x; o.z=p.z; o.rig.root.rotation.y=Math.atan2(dx,dz); }
  o.rig.root.position.set(o.x,H(o.x,o.z)+(d>.3?Math.abs(Math.sin(G.t*8+o.cx))*.06:0),o.z); if(Math.hypot(o.x-G.p.x,o.z-G.p.z)<80) o.rig.mixer.update(dt); }); }

/* ---------- collectible coins ---------- */
function coins(){ G.coinList=[]; const geo=new THREE.CylinderGeometry(.7,.7,.16,22); for(let i=0;i<60;i++){ const s=pick(SEGS.filter(s=>s.r.kind!=='hwy')), u=rand(0,s.L), x=s.x0+s.dx*u, z=s.z0+s.dz*u; const m=new THREE.Mesh(geo,MB.coin); m.rotation.x=Math.PI/2; m.position.set(x,roadY(x,z)+1.4,z); scene.add(m); G.coinList.push(m); } }
function coinTick(dt){ const me=G.mode==='drive'?G.c:G.p; G.coinList.forEach(m=>{ if(!m.visible) return; m.rotation.z+=dt*3; if(Math.hypot(m.position.x-me.x,m.position.z-me.z)<2.2){ m.visible=false; G.coins++; G.cash+=5; sfx.coin(); if(G.coins%10===0) toast(`🪙 ${G.coins}/60 MoneyBot coins found!`,'good'); } }); }

/* ---------- movement ---------- */
function placeCar(g,c){ g.position.set(c.x,roadY(c.x,c.z)-.02,c.z); g.rotation.y=c.h; }
function walkTick(dt){ const sp=K('shift')?11:6, f=(K('w','arrowup','gas')?1:0)-(K('s','arrowdown','brake')?1:0), s=(K('d','arrowright','right')?1:0)-(K('a','arrowleft','left')?1:0);
  const r=G.you.root; if(f||s){ const ang=G.yaw+Math.atan2(-s,f)*1, mv=Math.min(1,Math.hypot(f,s)); const p={x:G.p.x+Math.sin(ang)*sp*mv*dt,z:G.p.z+Math.cos(ang)*sp*mv*dt}; collide(p,.7); G.p.x=clamp(p.x,-600,600); G.p.z=clamp(p.z,-600,600); r.rotation.y=ang; rigPlay(G.you,'Idle'); }
  r.visible=true; r.position.set(G.p.x,H(G.p.x,G.p.z)+((f||s)?Math.abs(Math.sin(G.t*10))*.08:0),G.p.z); G.you.mixer.update(dt);
  camFollow(G.p.x,H(G.p.x,G.p.z)+1.6,G.p.z,G.yaw,9,4.6,dt); }
function driveTick(dt){ const c=G.c, gas=K('w','arrowup','gas')&&G.fuel>0?1:0, brk=K('s','arrowdown','brake')?1:0, st=(K('a','arrowleft','left')?1:0)-(K('d','arrowright','right')?1:0), top=K('shift')?34:26;
  if(gas) c.v+=14*dt*(1-Math.max(0,c.v)/top); if(brk) c.v-=(c.v>0?24:8)*dt; c.v-=c.v*.25*dt+(gas||brk?0:Math.sign(c.v)*2*dt); c.v=clamp(c.v,-8,top);
  const on=nearRoad(c.x,c.z).d<1; if(!on) c.v*=1-dt*.9; G.fuel=Math.max(0,G.fuel-Math.abs(c.v)*dt*.00055); if(G.fuel<=0&&!G.fuelWarn){ G.fuelWarn=1; toast('⛽ Out of gas! Walk to a Bot Gas station (E) or press E to get out.','bad'); } if(G.fuel>0) G.fuelWarn=0;
  c.h+=st*1.8*Math.min(1,Math.abs(c.v)/6)*(1-.35*Math.abs(c.v)/34)*Math.sign(c.v||1)*dt; let dh=Math.atan2(Math.sin(c.h-c.vh),Math.cos(c.h-c.vh)); c.vh+=dh*Math.min(1,dt*5);
  const p={x:c.x+Math.sin(c.vh)*c.v*dt, z:c.z+Math.cos(c.vh)*c.v*dt}; if(collide(p,1.6)){ c.v*=.4; if(Math.abs(c.v)>4) sfx.bad(); } G.traf.forEach(t=>{ if(Math.hypot(t.g.position.x-p.x,t.g.position.z-p.z)<2.6){ c.v*=-.3; const d=Math.hypot(p.x-t.g.position.x,p.z-t.g.position.z)||1; p.x=t.g.position.x+(p.x-t.g.position.x)/d*2.6; p.z=t.g.position.z+(p.z-t.g.position.z)/d*2.6; } });
  c.x=clamp(p.x,-600,600); c.z=clamp(p.z,-600,600); placeCar(G.car,c); G.car.userData.wheels.forEach((w,i)=>{ w.children.forEach(m=>m.rotation.y+=c.v*dt/G.car.userData.r); if(i<2) w.rotation.y=st*.4; }); G.car.userData.tail.emissiveIntensity=brk?3:.5;
  G.you.root.visible=false; G.p.x=c.x; G.p.z=c.z; G.yaw=lerpAng(G.yaw,c.vh,dt*3);
  camFollow(c.x,roadY(c.x,c.z)+1.2,c.z,G.yaw,11+Math.abs(c.v)*.12,4.4,dt); }
const lerpAng=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*Math.min(1,k);
function camFollow(x,y,z,yaw,dist,hgt,dt){ const tx=x-Math.sin(yaw)*dist, tz=z-Math.cos(yaw)*dist, ty=Math.max(y+hgt,H(tx,tz)+2); const k=Math.min(1,dt*5); camera.position.x+=(tx-camera.position.x)*k; camera.position.y+=(ty-camera.position.y)*k; camera.position.z+=(tz-camera.position.z)*k; camera.lookAt(x,y+1,z);
 }

/* ---------- what's nearby ---------- */
function nearTick(){ const me=G.mode==='drive'?G.c:G.p; let n=null, label='';
  if(G.mode==='walk'&&Math.hypot(G.c.x-me.x,G.c.z-me.z)<4){ n='car'; label='Drive your car'; } if(G.mode==='drive'){ n='car'; label='Get out'; }
  for(const P of G.portals){ const d=Math.hypot(P.x-me.x,P.z-me.z); if(d<(G.mode==='drive'?6:4.5)){ n=P; label='Enter '+P.l.name; } }
  if(Math.hypot(me.x-W.truck.x,me.z-W.truck.z)<6&&G.mode==='walk'){ n='truck'; label='Bot Eats jobs'; } const atmL=LANDMARKS.find(l=>l.id==='botbank'); if(Math.hypot(me.x-(atmL.x),me.z-(atmL.z-13))<5&&G.mode==='walk'){ n='atm'; label='BotBank ATM'; }
  LANDMARKS.filter(l=>l.kind==='gas').forEach(l=>{ if(Math.hypot(me.x-l.x,me.z-l.z)<10){ n={gas:l}; label='Fill up the tank'; } });
  G.near=n; const pr=$('#prompt'); pr.hidden=!n||G.modal; if(n) pr.innerHTML=`<kbd>E</kbd> ${label}`;
  if(G.job&&Math.hypot(me.x-G.job.to.x,me.z-G.job.to.z)<16) endJob(true); }
function where(){ const me=G.mode==='drive'?G.c:G.p; let best=null; LANDMARKS.forEach(l=>{ const d=Math.hypot(l.x-me.x,l.z-me.z); if(!best||d<best.d) best={d,l}; }); const nr=nearRoad(me.x,me.z); return best.d<40?best.l.name:(nr.s&&nr.d<12?nr.s.r.name.replace(/^(NE|E|W|S|SW) .*/,'Neighborhood'):'Bowling Green'); }

/* ---------- maps ---------- */
let MAP=null; const MS=1240, MPX=600;
function mapCanvas(){ const c=document.createElement('canvas'); c.width=c.height=MPX; const g=c.getContext('2d'), s=MPX/MS, X=x=>(x+620)*s, Z=z=>(z+620)*s; g.fillStyle='#7FB069'; g.fillRect(0,0,MPX,MPX);
  g.strokeStyle='#4A90C2'; g.lineWidth=34*s; g.beginPath(); RIV.forEach(([x,z],i)=>i?g.lineTo(X(x),Z(z)):g.moveTo(X(x),Z(z))); g.stroke();
  g.fillStyle='rgba(80,140,60,.6)'; g.beginPath(); g.arc(X(HILL.x),Z(HILL.z),60*s,0,7); g.fill();
  g.lineCap='round'; ROADS.forEach(r=>{ g.strokeStyle=r.kind==='hwy'?'#F59E0B':r.kind==='major'?'#FDE68A':'#F1F5F9'; g.lineWidth=Math.max(2,r.w*s*1.2); g.beginPath(); r.pts.forEach(([x,z],i)=>i?g.lineTo(X(x),Z(z)):g.moveTo(X(x),Z(z))); g.stroke(); });
  MAP={c,X,Z,s}; }
function drawMini(){ const cv=$('#mini'), g=cv.getContext('2d'), me=G.mode==='drive'?G.c:G.p, R=110, sz=cv.width, k=sz/(R*2)/MAP.s;
  g.save(); g.clearRect(0,0,sz,sz); g.beginPath(); g.arc(sz/2,sz/2,sz/2,0,7); g.clip(); g.drawImage(MAP.c,MAP.X(me.x-R),MAP.Z(me.z-R),R*2*MAP.s,R*2*MAP.s,0,0,sz,sz);
  const P=(x,z)=>[(x-me.x)/(R*2)*sz+sz/2,(z-me.z)/(R*2)*sz+sz/2]; G.portals.forEach(p=>{ const [x,y]=P(p.x,p.z); g.fillStyle=p.l.col; g.beginPath(); g.arc(clamp(x,6,sz-6),clamp(y,6,sz-6),5,0,7); g.fill(); g.strokeStyle='#fff'; g.lineWidth=1.5; g.stroke(); });
  if(G.gps){ const [x,y]=P(G.gps.x,G.gps.z); g.fillStyle='#EF4444'; g.beginPath(); g.arc(clamp(x,7,sz-7),clamp(y,7,sz-7),7,0,7); g.fill(); }
  const h=G.mode==='drive'?G.c.vh:G.you.root.rotation.y; g.translate(sz/2,sz/2); g.rotate(-h+Math.PI); g.fillStyle='#0B1220'; g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-9); g.lineTo(7,8); g.lineTo(0,4); g.lineTo(-7,8); g.closePath(); g.fill(); g.stroke(); g.restore(); }
function bigMap(){ if(G.modal) return closeModal(); const m=modal(`<div class="eye">Bowling Green · click a place to set your GPS</div><div class="bigmap"><canvas id="bm" width="${MPX}" height="${MPX}"></canvas></div><div class="row"><button class="btn pri" onclick="closeModal()">Close (M)</button></div>`);
  const cv=m.querySelector('#bm'), g=cv.getContext('2d'); g.drawImage(MAP.c,0,0); g.font='700 13px Inter,system-ui,sans-serif'; g.textAlign='center';
  LANDMARKS.filter(l=>!['river'].includes(l.id)).forEach(l=>{ const x=MAP.X(l.x), y=MAP.Z(l.z); g.fillStyle=l.col||'#0B1220'; g.beginPath(); g.arc(x,y,l.game?7:4,0,7); g.fill(); g.strokeStyle='#fff'; g.lineWidth=2; g.stroke(); g.fillStyle='#0B1220'; g.fillText(l.name.replace(' · Find Your Path',''),x,y-11); });
  const me=G.mode==='drive'?G.c:G.p; g.fillStyle='#EF4444'; g.beginPath(); g.arc(MAP.X(me.x),MAP.Z(me.z),7,0,7); g.fill(); g.fillStyle='#0B1220'; g.fillText('You',MAP.X(me.x),MAP.Z(me.z)+20);
  cv.onclick=e=>{ const r=cv.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*MS-620, z=(e.clientY-r.top)/r.height*MS-620; let best=null; LANDMARKS.forEach(l=>{ const d=Math.hypot(l.x-x,l.z-z); if(!best||d<best.d) best={d,l}; }); G.gps={x:best.l.x,z:best.l.z,name:best.l.name}; closeModal(); toast('📍 GPS set: <b>'+best.l.name+'</b>'); }; }

/* ---------- frame ---------- */
let saveT=0;
function loop(){ requestAnimationFrame(loop); const dt=Math.min(.05,clock.getDelta()); G.t+=dt;
  if(!G.modal&&$('#title').hidden){ G.mode==='drive'?driveTick(dt):walkTick(dt); nearTick(); coinTick(dt); if(G.job){ G.job.left-=dt; if(G.job.left<=0){ toast('⏰ Too slow, the customer canceled. No pay.','bad'); G.job=null; G.gps=null; } } }
  else if(!$('#title').hidden){ const a=G.t*.05; camera.position.set(Math.cos(a)*190,95,Math.sin(a)*190); camera.lookAt(0,0,0); }
  trafTick(dt); pedTick(dt); fxTick(dt,G.t); W.anim.forEach(f=>f(G.t)); G.portals&&G.portals.forEach(p=>{ p.ring.rotation.y+=dt; p.tag.lookAt(camera.position.x,p.tag.position.y,camera.position.z); });
  if(W.racers) W.racers.forEach(r=>{ r.a+=r.v*dt; r.c.position.set(Math.cos(r.a)*31*1.3,.2,Math.sin(r.a)*31); r.c.rotation.y=-r.a+Math.PI; });
  G.savings*=1+.04/525600*dt*60*60; /* sped up: one real minute ≈ one month */
  if($('#hud')&&!$('#hud').hidden){ $('#hCash').textContent=fmt(G.cash); $('#hSave').textContent=fmt(G.savings); $('#hCoins').textContent=G.coins+'/60'; $('#hFuel').style.width=(G.fuel*100)+'%'; $('#hWhere').textContent=where();
    $('#hSpd').textContent=G.mode==='drive'?Math.round(Math.abs(G.c.v)*2.2)+' mph':''; drawMini();
    if(G.gps){ const me=G.mode==='drive'?G.c:G.p, d=Math.hypot(G.gps.x-me.x,G.gps.z-me.z); $('#hGps').hidden=false; $('#hGps').innerHTML=`📍 ${G.gps.name} · ${Math.round(d*4)} m${G.job?' · ⏱ '+Math.ceil(G.job.left)+'s':''}`; } else $('#hGps').hidden=true; }
  renderer.render(scene,camera); }
