/* ===================== BotMotors · 3D world ===================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const MOBILE = matchMedia('(pointer:coarse)').matches || /CrOS/.test(navigator.userAgent) && innerWidth<900;
let renderer, scene, camera, sun, hemi, clock=new THREE.Clock();
const GLTF={}, MB={}, W={cars:[], lotCars:new Map(), cones:[], traffic:[], anim:[], colliders:[]};
const BOX=new THREE.BoxGeometry(1,1,1), SPH=new THREE.SphereGeometry(1,16,12), CYL=new THREE.CylinderGeometry(1,1,1,20);
const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.7, metalness:0},o));
function bx(g,w,h,d,x,y,z,m,cast=true){ const e=new THREE.Mesh(BOX,m); e.scale.set(w,h,d); e.position.set(x,y+h/2,z); e.castShadow=cast; e.receiveShadow=true; g.add(e); return e; }
function cy(g,r,h,x,y,z,m,cast=true){ const e=new THREE.Mesh(CYL,m); e.scale.set(r,h,r); e.position.set(x,y+h/2,z); e.castShadow=cast; g.add(e); return e; }

/* ---------- MoneyBot rigs (shared assets from the other MoneyVerse games) ---------- */
function parseGLB(b64){ const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer; return new Promise((res,rej)=>new THREE.GLTFLoader().parse(bin,'',res,rej)); }
function setupMaterials(){
  MB.face=mat('#05070D',{roughness:.18, metalness:.1}); MB.coin=mat('#FBBF24',{roughness:.35, metalness:.45, emissive:'#F59E0B', emissiveIntensity:.25});
  MB.hero=mat('#F8FAFC',{roughness:.24, metalness:.05}); MB.you=mat('#BBF7D0',{roughness:.3}); MB.slick=mat('#FCA5A5',{roughness:.25, metalness:.25}); MB.mech=mat('#FDBA74',{roughness:.4}); MB.cu=mat('#93C5FD',{roughness:.3});
  MB.eye={g:mat('#16A34A',{emissive:'#22C55E', emissiveIntensity:1, roughness:.6}), y:mat('#D97706',{emissive:'#F59E0B', emissiveIntensity:1, roughness:.6}), r:mat('#B91C1C',{emissive:'#EF4444', emissiveIntensity:1.1, roughness:.6})};
}
function makeRig(gltf, body, height, eye){
  const model=THREE.SkeletonUtils.clone(gltf.scene), eyes=[];
  model.traverse(o=>{ if(!o.isMesh) return; o.frustumCulled=false; o.castShadow=true; const n=(o.material&&o.material.name)||'';
    if(n==='Silver') o.material=body; else if(n==='eyes'){ o.material=MB.eye[eye||'g']; eyes.push(o); } else if(n==='Face'||n==='Hat') o.material=MB.face; else if(n==='Coin') o.material=MB.coin; });
  const holder=new THREE.Group(); holder.add(model); const mixer=new THREE.AnimationMixer(model), acts={};
  gltf.animations.forEach(c=>acts[c.name]=mixer.clipAction(c)); acts.Idle.play(); mixer.update(Math.random()*1.5);
  const box=new THREE.Box3().setFromObject(model), s=height/(box.max.y-box.min.y); model.position.y=-box.min.y; holder.scale.setScalar(s);
  const rig={root:holder, model, mixer, acts, eyes, cur:'Idle'}; mixer.addEventListener('finished',()=>rigPlay(rig,'Idle')); return rig;
}
function rigPlay(rig,name,once){ const a=rig.acts[name]; if(!a||rig.cur===name&&!once) return; const p=rig.acts[rig.cur]; a.reset(); a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat, once?1:Infinity); a.play(); if(p&&p!==a) p.crossFadeTo(a,.25,false); rig.cur=name; }
let blobTex=null;
function blob(s=1){ if(!blobTex){ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(0,0,0,.45)'); r.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); blobTex=new THREE.CanvasTexture(c); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1), new THREE.MeshBasicMaterial({map:blobTex, transparent:true, depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=.02; m.scale.set(s,s,1); return m; }

/* ---------- text textures ---------- */
function textTex(lines, o={}){ const w=o.w||512, h=o.h||128, c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d');
  if(o.bg){ g.fillStyle=o.bg; if(o.r){ g.beginPath(); g.roundRect(0,0,w,h,o.r); g.fill(); } else g.fillRect(0,0,w,h); }
  if(o.border){ g.strokeStyle=o.border; g.lineWidth=o.bw||8; g.beginPath(); g.roundRect(o.bw/2||4,o.bw/2||4,w-(o.bw||8),h-(o.bw||8),o.r||0); g.stroke(); }
  (Array.isArray(lines)?lines:[lines]).forEach((L,i,arr)=>{ const sz=(L.size||o.size||64); g.font=`${L.weight||o.weight||800} ${sz}px ${o.font||'Inter, system-ui, sans-serif'}`; g.fillStyle=L.color||o.color||'#fff'; g.textAlign='center'; g.textBaseline='middle';
    let t=L.t||L; while(g.measureText(t).width>w*.92 && sz>10){ g.font=`${L.weight||o.weight||800} ${--L.size||(o.size=sz-2)}px ${o.font||'Inter, system-ui, sans-serif'}`; break; }
    g.fillText(L.t||L, w/2, h*(arr.length===1?.53:(i+.6)/arr.length)); });
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t; }
function sign(g, lines, w, h, x, y, z, o={}){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshStandardMaterial({map:textTex(lines,Object.assign({w:Math.round(512*Math.max(1,w/h/4)),h:128},o)), emissive:'#fff', emissiveIntensity:o.glow||0, emissiveMap:null, roughness:.6, transparent:!!o.transparent})); if(o.glow) m.material.emissiveMap=m.material.map; m.position.set(x,y,z); if(o.ry) m.rotation.y=o.ry; g.add(m); return m; }

/* ---------- the car builder ---------- */
const STYLES={
  sedan:{L:4.5, W:1.82, low:[[-2.2,.34],[-2.25,.78],[-2.0,.98],[2.0,.92],[2.25,.62],[2.2,.34]], cab:[[-1.55,.97],[-1.05,1.42],[.55,1.42],[1.2,.95]]},
  hatch:{L:3.95,W:1.75, low:[[-1.95,.34],[-2.0,.98],[1.75,.92],[1.98,.6],[1.92,.34]], cab:[[-1.98,.97],[-1.8,1.47],[.35,1.5],[.98,.95]]},
  coupe:{L:4.6, W:1.88, low:[[-2.3,.32],[-2.35,.74],[-2.05,.9],[2.05,.84],[2.32,.56],[2.27,.3]], cab:[[-1.4,.89],[-.6,1.27],[.35,1.29],[1.15,.85]]},
  ev:   {L:4.4, W:1.85, low:[[-2.15,.34],[-2.2,.82],[-1.9,.98],[2.0,.88],[2.22,.55],[2.17,.34]], cab:[[-1.75,.97],[-.85,1.46],[.5,1.46],[1.4,.9]]},
  truck:{L:5.5, W:2.0,  low:[[-2.75,.48],[-2.75,1.1],[2.55,1.16],[2.75,.82],[2.7,.48]], cab:[[-.45,1.1],[-.45,1.92],[.95,1.92],[1.6,1.12]]}
};
function profileGeo(pts, depth, bevel){ const s=new THREE.Shape(); pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y)); s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth, bevelEnabled:true, bevelThickness:bevel, bevelSize:bevel, bevelSegments:3, curveSegments:6}); g.translate(0,0,-depth/2); g.computeVertexNormals(); return g; }
const GLASS=new THREE.MeshStandardMaterial({color:'#0B1220', roughness:.08, metalness:.6, envMapIntensity:1});
const PLATE=new THREE.MeshStandardMaterial({color:'#F8FAFC',roughness:.5}), SEAM=mat('#000',{roughness:1,transparent:true,opacity:.35}), ARCH=new THREE.TorusGeometry(1,.06,6,16,Math.PI);
const TIRE=mat('#111318',{roughness:.85}), RIM=mat('#CBD5E1',{metalness:.85, roughness:.25}), CHROME=mat('#E2E8F0',{metalness:.9, roughness:.18}), BLACK=mat('#0F172A',{roughness:.5});
function makeCar(spec){
  const S=STYLES[spec.style], g=new THREE.Group(), body=new THREE.Group(); g.add(body);
  const paint=new THREE.MeshPhysicalMaterial({color:spec.color, metalness:.12, roughness:.38, clearcoat:MOBILE?0:.8, clearcoatRoughness:.15, envMap:W.env||null, envMapIntensity:.3});
  if(spec.id==='rattler'){ paint.roughness=.75; paint.metalness=.1; paint.clearcoat=0; }
  const low=new THREE.Mesh(profileGeo(S.low,S.W-.12,.06),paint); low.castShadow=true; body.add(low);
  const cab=new THREE.Mesh(profileGeo(S.cab,S.W*.84,.05),GLASS); cab.castShadow=true; body.add(cab);
  /* painted roof + pillars over the glass */
  const ys=S.cab.map(p=>p[1]), top=Math.max(...ys), roofPts=S.cab.filter(p=>p[1]>top-.05);
  const rx0=Math.min(...roofPts.map(p=>p[0])), rx1=Math.max(...roofPts.map(p=>p[0]));
  const roof=new THREE.Mesh(BOX,paint); roof.scale.set(rx1-rx0+.12,.07,S.W*.86); roof.position.set((rx0+rx1)/2,top+.03,0); roof.castShadow=true; body.add(roof);
  const bp=new THREE.Mesh(BOX,paint); bp.scale.set(.1,top-S.cab[0][1]+.02,S.W*.86); const a=S.cab[1], b=S.cab[0]; bp.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,0); bp.rotation.z=Math.atan2(a[1]-b[1],a[0]-b[0])-Math.PI/2; body.add(bp);
  if(spec.style==='truck'){ const bed=new THREE.Mesh(BOX,BLACK); bed.scale.set(2.9,.05,S.W-.3); bed.position.set(-1.25,1.14,0); body.add(bed); [[-1.25,S.W/2-.1],[-1.25,-S.W/2+.1]].forEach(([x,z])=>{ const w=new THREE.Mesh(BOX,paint); w.scale.set(2.95,.28,.08); w.position.set(x,1.25,z); body.add(w); }); const tg=new THREE.Mesh(BOX,paint); tg.scale.set(.08,.28,S.W-.2); tg.position.set(-2.72,1.25,0); body.add(tg); }
  /* lights, grille, mirrors */
  const wx=S.L/2-(spec.style==='truck'?.95:.78), r=spec.style==='truck'?.44:.36;
  const front=S.low.reduce((m,p)=>p[0]>m[0]?p:m), back=S.low.reduce((m,p)=>p[0]<m[0]?p:m);
  const hl=mat('#FFFBEB',{emissive:'#FFF7D6', emissiveIntensity:.6, roughness:.2}), tl=mat('#7F1D1D',{emissive:'#EF4444', emissiveIntensity:.5, roughness:.3});
  [-1,1].forEach(s=>{ const h=new THREE.Mesh(BOX,hl); h.scale.set(.08,.12,.42); h.position.set(front[0]-.05,.66,s*(S.W/2-.32)); body.add(h);
    const t=new THREE.Mesh(BOX,tl); t.scale.set(.08,.12,.38); t.position.set(back[0]+.04,.76,s*(S.W/2-.3)); body.add(t);
    const mr=new THREE.Mesh(BOX,paint); mr.scale.set(.18,.12,.14); mr.position.set(S.cab[S.cab.length-1][0]-.12,S.cab[0][1]+.08,s*(S.W/2+.06)); body.add(mr); });
  if(spec.style==='ev'){ const lb=new THREE.Mesh(BOX,hl); lb.scale.set(.06,.05,S.W-.4); lb.position.set(front[0]-.03,.78,0); body.add(lb); }
  else { const gr=new THREE.Mesh(BOX,spec.style==='truck'?CHROME:BLACK); gr.scale.set(.06,spec.style==='truck'?.36:.18,S.W*.42); gr.position.set(front[0]-.02,spec.style==='truck'?.72:.5,0); body.add(gr); }
  /* wheels */
  const wheels=[];
  [[wx,1],[wx,-1],[-wx,1],[-wx,-1]].forEach(([x,s])=>{ const w=new THREE.Group(); const t=new THREE.Mesh(CYL,TIRE); t.scale.set(r,.26,r); t.rotation.x=Math.PI/2; t.castShadow=true; w.add(t); const rim=new THREE.Mesh(CYL,RIM); rim.scale.set(r*.62,.27,r*.62); rim.rotation.x=Math.PI/2; w.add(rim);
    w.position.set(x,r,s*(S.W/2-.1)); body.add(w); wheels.push(w); });
  /* bumpers, skirts, plates, door seams */
  const by=spec.style==='truck'?.5:.3;
  [front[0]+.02, back[0]-.02].forEach((x,i)=>{ const b=new THREE.Mesh(BOX,BLACK); b.scale.set(.16,.2,S.W-.1); b.position.set(x,by+.06,0); body.add(b);
    const pl=new THREE.Mesh(BOX,PLATE); pl.scale.set(.03,.17,.52); pl.position.set(x+(i?-.09:.09),by+.3,0); body.add(pl); });
  [-1,1].forEach(s=>{ const k=new THREE.Mesh(BOX,BLACK); k.scale.set(S.L*.62,.1,.06); k.position.set(0,by+.04,s*(S.W/2-.03)); body.add(k);
    const sm=new THREE.Mesh(BOX,SEAM); sm.scale.set(.02,.5,.02); sm.position.set(spec.style==='truck'?.2:-.15,.58+(spec.style==='truck'?.2:0),s*(S.W/2-.05)); body.add(sm);
    [wx,-wx].forEach(x=>{ const arch=new THREE.Mesh(ARCH,BLACK); arch.scale.set(r*1.18,r*1.18,1); arch.position.set(x,r,s*(S.W/2-.06)); body.add(arch); }); });
  if(spec.id==='rattler'){ const rust=mat('#7C2D12',{roughness:1}); [[.6,.5,1],[-1.2,.42,-1],[1.3,.7,-1]].forEach(([x,y,s])=>{ const p=new THREE.Mesh(BOX,rust); p.scale.set(.5,.22,.02); p.position.set(x,y,s*(S.W/2-.03)); body.add(p); }); }
  body.rotation.y=-Math.PI/2;    /* length runs along +z, front at +z */
  const sh=blob(1); sh.scale.set(S.W+.9,S.L+.9,1); g.add(sh);
  g.userData={spec, wheels, paint, len:S.L, wid:S.W, r, tail:tl, head:hl}; return g;
}

/* ---------- world: lot, showroom, city loop ---------- */
function initThree(){
  renderer=new THREE.WebGLRenderer({canvas:$('#gl'), antialias:!MOBILE, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE?1.25:1.75)); renderer.setSize(innerWidth,innerHeight); renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.92;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(50, innerWidth/innerHeight, .1, 600);
  hemi=new THREE.HemisphereLight('#E0F2FE','#4B5563',.55); scene.add(hemi);
  sun=new THREE.DirectionalLight('#FFF4E0',1.6); sun.position.set(30,50,25); sun.castShadow=true; const sz=MOBILE?1024:2048; sun.shadow.mapSize.set(sz,sz); Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:150}); sun.shadow.bias=-.0004; scene.add(sun); scene.add(sun.target);
  const pm=new THREE.PMREMGenerator(renderer); const env=new THREE.Scene(); env.background=new THREE.Color('#BFDBFE'); const l1=new THREE.Mesh(new THREE.PlaneGeometry(40,10),new THREE.MeshBasicMaterial({color:'#FFFFFF'})); l1.position.set(0,12,-10); l1.lookAt(0,0,0); env.add(l1); W.env=pm.fromScene(env,.04).texture; GLASS.envMap=W.env;
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
}
