/* ===================== Bot City: Bowling Green · look & life ===================== */
const TOD={ day:{top:'#3E8ED0',mid:'#93CDEF',bot:'#E8F4FA',sun:'#FFF4E0',si:1.6,sd:[60,110,40],hemi:.55,hs:'#E0F2FE',hg:'#4B5563',fog:'#CFE6F3',exp:.92,night:0},
  golden:{top:'#2B5A9C',mid:'#F4A261',bot:'#FFDDA6',sun:'#FFB060',si:2.1,sd:[150,38,60],hemi:.42,hs:'#FFD2A8',hg:'#4B3A3A',fog:'#E8B98C',exp:.98,night:.25},
  night:{top:'#03081A',mid:'#0B1733',bot:'#1E2D52',sun:'#9DB4FF',si:.32,sd:[-60,90,-40],hemi:.2,hs:'#3B4C7A',hg:'#0B1020',fog:'#0C162B',exp:1.05,night:1} };
const FX={tod:'golden', k:1, from:null, to:null, skies:{}, quality:MOBILE?'low':'high'};
const glowTex=canvasTex(64,64,(g)=>{ const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.35,'rgba(255,255,255,.45)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); });

function fxInit(){ Object.entries(TOD).forEach(([k,t])=>FX.skies[k]=canvasTex(4,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,t.top); gr.addColorStop(.6,t.mid); gr.addColorStop(1,t.bot); g.fillStyle=gr; g.fillRect(0,0,w,h); }));
  Object.assign(sun.shadow.camera,{left:-80,right:80,top:80,bottom:-80,far:320}); sun.shadow.camera.updateProjectionMatrix();
  /* sun disc + stars */
  FX.disc=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:'#FFE3A8',transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending})); FX.disc.scale.setScalar(160); scene.add(FX.disc);
  const sp=[]; for(let i=0;i<900;i++){ const a=Math.random()*Math.PI*2, e=Math.random()*.9+.08, r=1100; sp.push(Math.cos(a)*Math.cos(e)*r, Math.sin(e)*r, Math.sin(a)*Math.cos(e)*r); }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); FX.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:'#FFFFFF',size:2.2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false})); scene.add(FX.stars);
  /* street-lamp glow + light pools (visible at dusk and night) */
  const L=(W.lamps||[]).concat(W.squareLamps||[]), gp=[]; L.forEach(p=>gp.push(p.x,p.y+6,p.z)); const gg=new THREE.BufferGeometry(); gg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));
  FX.lampGlow=new THREE.Points(gg,new THREE.PointsMaterial({map:glowTex,color:'#FFD27A',size:7,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending})); scene.add(FX.lampGlow);
  const PG=new THREE.PlaneGeometry(1,1); PG.rotateX(-Math.PI/2); FX.pools=new THREE.InstancedMesh(PG,new THREE.MeshBasicMaterial({map:glowTex,color:'#FFC873',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-6}),L.length);
  const o=new THREE.Object3D(); L.forEach((p,i)=>{ o.position.set(p.x,p.y+.2,p.z); o.scale.set(13,1,13); o.updateMatrix(); FX.pools.setMatrixAt(i,o.matrix); }); scene.add(FX.pools);
  /* clean intersections: plain asphalt over crossing lane lines on the downtown grid */
  const GA=REAL.grid.ga, patch=new THREE.MeshStandardMaterial({color:'#30343C',roughness:.88,polygonOffset:true,polygonOffsetFactor:-3}); const P2=new THREE.PlaneGeometry(1,1); P2.rotateX(-Math.PI/2); const XS=REAL.grid.xs.filter(([x,z])=>nearRoad(x,z).d<-2);
  const ip=new THREE.InstancedMesh(P2,patch,XS.length); XS.forEach(([x,z],i)=>{ o.position.set(x,roadY(x,z)+.125,z); o.rotation.set(0,GA,0); o.scale.set(7.4,1,7.4); o.updateMatrix(); ip.setMatrixAt(i,o.matrix); }); ip.receiveShadow=true; scene.add(ip);
  /* water that moves */
  if(W.water){ W.water.material.onBeforeCompile=s=>{ s.uniforms.uT=FX.uT={value:0}; s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP2;').replace('#include <project_vertex>','#include <project_vertex>\nvWP2=(modelMatrix*vec4(transformed,1.0)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT; varying vec3 vWP2;').replace('#include <color_fragment>','#include <color_fragment>\nfloat rp=sin(vWP2.x*.35+uT*1.3)*sin(vWP2.z*.42-uT*1.1)+sin((vWP2.x+vWP2.z)*.9+uT*2.2)*.4; diffuseColor.rgb+=vec3(.08,.12,.14)*rp;'); }; W.water.material.needsUpdate=true; }
  if(W.statueSpot){ const st=makeRig(GLTF.crowd, mat('#D4A017',{metalness:.75,roughness:.25,emissive:'#6B4E00',emissiveIntensity:.25}), 1.7,'y'); st.root.position.y=W.statueSpot.y; W.statueSpot.g.add(st.root); rigPlay(st,'UpPoint'); W.statue=st; }
  billboards(); birds(); drones(); portalSparks(); setTOD('golden',true); setQuality(FX.quality); }

/* ---------- MoneyVerse billboards along the highways ---------- */
function billboards(){ const ads=[['BotBank','Save first. Then buy.','#1D4ED8'],['BotU','Learn it before you earn it','#B91C1C'],['BotFactory','Kentucky-made. Bot-built.','#EA580C'],['BotMotors','Don\'t get played at the lot','#F59E0B'],['BotMarket','Price it right','#059669'],['Find Your Path','Kentucky careers start here','#15803D'],['BotPark','Build the startup','#7C3AED'],['Bot Tycoon','Build the empire','#BE185D']];
  const spots=[]; ROADS.filter(r=>r.kind==='hwy'||r.name==='Scottsville Rd'||r.name==='Louisville Rd'||r.name==='Nashville Rd').forEach(r=>{ for(let i=1;i<r.pts.length-1;i+=2){ const [x0,z0]=r.pts[i],[x1,z1]=r.pts[i+1]; const L=Math.hypot(x1-x0,z1-z0)||1, nx=-(z1-z0)/L, nz=(x1-x0)/L, x=x0+nx*(r.w/2+9), z=z0+nz*(r.w/2+9); if(isKept(x,z,4)||riverD(x,z)<24) continue; spots.push({x,z,ry:Math.atan2(nx,nz)}); } });
  spots.filter((_,i)=>i%2===0).slice(0,12).forEach((s,i)=>{ const [t,sub,col]=ads[i%ads.length], g=new THREE.Group(); g.position.set(s.x,H(s.x,s.z),s.z); g.rotation.y=s.ry+Math.PI; scene.add(g);
    [-3.5,3.5].forEach(x=>cy(g,.22,8,x,0,0,mat('#475569',{metalness:.6}))); bx(g,14,6,.4,0,8,-.25,mat('#1E293B')); sign(g,[{t,size:120,color:'#FFFFFF'},{t:sub,size:52,weight:700,color:'#FFFFFFCC'}],13.4,5.4,0,11,0,{bg:col,r:18,w:1024,h:400,glow:.25});
    bx(g,14,.3,1,0,14.2,.3,mat('#E5E7EB')); addCol(s.x-1,s.z-1,s.x+1,s.z+1); }); }

/* ---------- birds over the square, the hill and the river ---------- */
function birds(){ FX.birds=[]; const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.4, -1.1,0,-.2, 0,0,-.3, 0,0,.4, 1.1,0,-.2, 0,0,-.3],3)); geo.computeVertexNormals(); const m=new THREE.MeshBasicMaterial({color:'#1F2937',side:THREE.DoubleSide});
  [[0,0,60],[HILL.x,HILL.z,50],[LMR.bridge[0],LMR.bridge[1],70]].forEach(([cx,cz,r],f)=>{ for(let i=0;i<7;i++){ const b=new THREE.Mesh(geo,m); b.scale.setScalar(.9); scene.add(b); FX.birds.push({b,cx,cz,r:r+i*2.2,a:i*.18+f*2,h:34+Math.random()*8,s:.18+f*.03,ph:Math.random()*7}); } }); }
/* ---------- delivery drones with blinking lights ---------- */
function drones(){ FX.drones=[]; const stops=LANDMARKS.filter(l=>l.game).map(l=>[l.x,l.z]);
  for(let i=0;i<5;i++){ const g=new THREE.Group(); bx(g,1.4,.35,1.4,0,0,0,mat('#F8FAFC',{roughness:.3})); const rotors=[]; [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([x,z])=>{ bx(g,1.1,.08,.12,x*.9,.1,z*.9,mat('#94A3B8')); const r=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.04,12),new THREE.MeshBasicMaterial({color:'#CBD5E1',transparent:true,opacity:.5})); r.position.set(x*.9,.3,z*.9); g.add(r); rotors.push(r); });
    const led=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:'#00E676'})); led.scale.setScalar(.16); led.position.y=-.25; g.add(led); const box=new THREE.Mesh(BOX,mat('#F97316')); box.scale.set(.7,.6,.7); box.position.y=-.7; g.add(box); scene.add(g);
    const a=stops[i%stops.length], b=stops[(i*3+2)%stops.length]; FX.drones.push({g,led,a,b,t:Math.random(),v:.05+Math.random()*.03}); } }
/* ---------- sparkles rising from every MoneyVerse door ---------- */
function portalSparks(){ FX.sparks=[]; (G.portals||[]).forEach(p=>{ const n=26, pos=new Float32Array(n*3), ph=[]; for(let i=0;i<n;i++){ ph.push(Math.random()); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); const pts=new THREE.Points(g,new THREE.PointsMaterial({map:glowTex,color:p.l.col,size:1.1,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); scene.add(pts); FX.sparks.push({p,pts,ph,y:H(p.x,p.z)}); }); }

/* ---------- time of day ---------- */
const lerpC=(a,b,k)=>new THREE.Color(a).lerp(new THREE.Color(b),k);
function setTOD(name,instant){ FX.from=Object.assign({},FX.cur||TOD[name]); FX.to=TOD[name]; FX.tod=name; FX.k=instant?1:0; FX.sky=name; if(instant) applyTOD(1);
  const b=document.getElementById('btnTod'); if(b) b.textContent={day:'☀️ Day',golden:'🌇 Golden hour',night:'🌙 Night'}[name]; }
function applyTOD(k){ const a=FX.from, b=FX.to, e=k*k*(3-2*k), L=(x,y)=>x+(y-x)*e;
  FX.cur={top:b.top,mid:b.mid,bot:b.bot,sun:'#'+lerpC(a.sun,b.sun,e).getHexString(),si:L(a.si,b.si),sd:a.sd.map((v,i)=>L(v,b.sd[i])),hemi:L(a.hemi,b.hemi),hs:'#'+lerpC(a.hs,b.hs,e).getHexString(),hg:'#'+lerpC(a.hg,b.hg,e).getHexString(),fog:'#'+lerpC(a.fog,b.fog,e).getHexString(),exp:L(a.exp,b.exp),night:L(a.night,b.night)};
  const c=FX.cur; sun.color.set(c.sun); sun.intensity=c.si; hemi.intensity=c.hemi; hemi.color.set(c.hs); hemi.groundColor.set(c.hg); scene.fog.color.set(c.fog); renderer.toneMappingExposure=c.exp; NIGHT.value=c.night;
  if(k>.5||k===1) scene.background=FX.skies[FX.sky];
  FX.stars.material.opacity=Math.max(0,c.night-.4)*1.4; FX.lampGlow.material.opacity=Math.min(1,c.night*1.3); FX.pools.material.opacity=c.night*.55;
  if(W.lampHead) W.lampHead.material.emissiveIntensity=.4+c.night*3; if(W.squareGlobes) W.squareGlobes.emissiveIntensity=.5+c.night*3.5; FX.disc.material.color.set(c.night>.6?'#C7D2FE':'#FFD9A0'); FX.disc.material.opacity=c.night>.6?.5:.9;
  (G.traf||[]).concat(G.car?[{g:G.car}]:[]).forEach(t=>{ if(t.g.userData.head) t.g.userData.head.emissiveIntensity=.6+c.night*3; }); }
function setQuality(q){ FX.quality=q; const hi=q==='high'; sun.castShadow=hi; renderer.setPixelRatio(Math.min(devicePixelRatio, hi?1.75:1)); renderer.setSize(innerWidth,innerHeight);
  const b=document.getElementById('btnQ'); if(b) b.textContent=hi?'✨ High':'⚡ Fast'; }

/* ---------- per frame ---------- */
function fxTick(dt,t){ if(FX.k<1){ FX.k=Math.min(1,FX.k+dt/2.2); applyTOD(FX.k); }
  const me=G.mode==='drive'?G.c:G.p, sd=FX.cur.sd, l=Math.hypot(...sd); FX.disc.position.set(camera.position.x+sd[0]/l*900,camera.position.y+sd[1]/l*900,camera.position.z+sd[2]/l*900); FX.stars.position.copy(camera.position);
  sun.position.set(me.x+sd[0]*.7,sd[1]*.7+10,me.z+sd[2]*.7); sun.target.position.set(me.x,0,me.z);
  if(FX.uT) FX.uT.value=t; if(W.statue) W.statue.mixer.update(dt);
  FX.birds.forEach(b=>{ b.a+=b.s*dt; const x=b.cx+Math.cos(b.a)*b.r, z=b.cz+Math.sin(b.a)*b.r; b.b.position.set(x,b.h+Math.sin(t*.7+b.ph)*2,z); b.b.rotation.y=-b.a; b.b.scale.y=.9; b.b.children; b.b.rotation.z=Math.sin(t*9+b.ph)*.5; });
  FX.drones.forEach(d=>{ d.t+=d.v*dt; const k=d.t%2, f=k<1?k:2-k, e=f*f*(3-2*f), x=d.a[0]+(d.b[0]-d.a[0])*e, z=d.a[1]+(d.b[1]-d.a[1])*e; d.g.position.set(x,Math.max(H(x,z),0)+28+Math.sin(t+d.v*40)*1.5,z); d.g.rotation.y=Math.atan2(d.b[0]-d.a[0],d.b[1]-d.a[1])+(k<1?0:Math.PI);
    d.g.children.forEach((c,i)=>{ if(c.geometry&&c.geometry.type==='CylinderGeometry') c.rotation.y+=dt*40; }); d.led.material.color.set((t*2%1)<.5?'#00E676':'#064E3B'); });
  FX.sparks.forEach(s=>{ const P=s.pts.geometry.attributes.position; s.ph.forEach((ph,i)=>{ const k=(t*.35+ph)%1, a=ph*40+t*.6; P.setXYZ(i,s.p.x+Math.cos(a)*2.4*(1-k*.4),s.y+.5+k*7,s.p.z+Math.sin(a)*2.4*(1-k*.4)); }); P.needsUpdate=true; s.pts.material.opacity=Math.hypot(s.p.x-me.x,s.p.z-me.z)<160?.9:0; }); }

addEventListener('keydown',e=>{ if(G.modal) return; const k=e.key.toLowerCase(); if(k==='n') setTOD({day:'golden',golden:'night',night:'day'}[FX.tod]); if(k==='q') setQuality(FX.quality==='high'?'low':'high'); });
boot().catch(e=>{ console.error(e); $('#go').textContent='Could not load'; });
