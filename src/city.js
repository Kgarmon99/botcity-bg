/* ===================== Bot City: Bowling Green · the map =====================
   x = east, z = south (north is -z). 1 unit ≈ 4 m. Hand-laid from real geography:
   Fountain Square downtown at the origin, WKU on its hill to the southwest, the Barren River
   to the north, Scottsville Road running southeast, I-65 on the east side. */

const HILL={x:REAL.hill[0], z:REAL.hill[1], r:46, h:22};
const RIV=REAL.river; function riverD(x,z){ let b=1e9; for(let i=0;i<RIV.length-1;i++){ const [x0,z0]=RIV[i],[x1,z1]=RIV[i+1], dx=x1-x0, dz=z1-z0, l2=dx*dx+dz*dz, t=Math.max(0,Math.min(1,((x-x0)*dx+(z-z0)*dz)/l2)); b=Math.min(b,Math.hypot(x-x0-dx*t,z-z0-dz*t)); } return b; }
const LMR=REAL.lm, WARP=(xm,zm)=>{ const r=Math.hypot(xm,zm); if(r<1e-6) return [0,0]; const k=520*(1-Math.exp(-r/2000))/r; return [xm*k,zm*k]; };
function H(x,z){ let y=HILL.h*Math.exp(-((x-HILL.x)**2+(z-HILL.z)**2)/(2*HILL.r*HILL.r));
  y+=1.1*Math.sin(x/70)*Math.cos(z/90)*(Math.abs(x)<160&&Math.abs(z)<160?.2:1);
  const dr=riverD(x,z); if(dr<30) y-=(1-dr/30)**2*5;
  y+=7*Math.exp(-((x-LMR.cave[0])**2+(z-LMR.cave[1]+8)**2)/(2*16*16));
  return y; }

/* ---------- roads (polylines) ---------- */
const ROADS=[];
const road=(name,w,pts,kind='street')=>ROADS.push({name,w,pts,kind});
REAL.roads.forEach(r=>road(r.name,{hwy:19,major:13,street:8.5,square:9}[r.kind]||9,r.pts,r.kind));
/* neighborhoods: small street grids (meters from the square, warped like the real map) */
[[1300,650,.5],[1900,1500,.2],[-1700,1300,.9],[-1300,-150,.1],[700,1900,.7],[2700,900,.3],[-700,2600,.4],[1400,-1000,.6],[-2300,300,.2],[3200,2200,.5],[-2600,2200,.8],[300,-1700,.3]].forEach(([cx,cz,rot],n)=>{
  const ux=Math.cos(rot), uz=Math.sin(rot), S=120, K=4;
  for(let a=0;a<2;a++) for(let i=-K/2;i<=K/2;i++){ const pts=[]; for(let t=-K/2;t<=K/2;t+=.5){ const xm=cx+(a?ux*t*S-uz*i*S:ux*i*S-uz*t*S), zm=cz+(a?uz*t*S+ux*i*S:uz*i*S+ux*t*S), [x,z]=WARP(xm,zm); if(riverD(x,z)<22||Math.hypot(x-HILL.x,z-HILL.z)<40){ if(pts.length>1) road('Res '+n,7.5,pts.slice(),'res'); pts.length=0; continue; } pts.push([x,z]); } if(pts.length>1) road('Res '+n,7.5,pts,'res'); } });
/* segments for fast distance queries */
const SEGS=[]; ROADS.forEach((r,ri)=>{ for(let i=0;i<r.pts.length-1;i++){ const [x0,z0]=r.pts[i],[x1,z1]=r.pts[i+1], L=Math.hypot(x1-x0,z1-z0); SEGS.push({r, ri, x0,z0,x1,z1,L,dx:(x1-x0)/L,dz:(z1-z0)/L}); } });
const SG=new Map(), SGC=40; SEGS.forEach(s=>{ const ax=Math.floor((Math.min(s.x0,s.x1)-12)/SGC), bx=Math.floor((Math.max(s.x0,s.x1)+12)/SGC), az=Math.floor((Math.min(s.z0,s.z1)-12)/SGC), bz=Math.floor((Math.max(s.z0,s.z1)+12)/SGC); for(let i=ax;i<=bx;i++) for(let j=az;j<=bz;j++){ const k=i+','+j; if(!SG.has(k)) SG.set(k,[]); SG.get(k).push(s); } });
function nearRoad(x,z){ const k=Math.floor(x/SGC)+','+Math.floor(z/SGC), L=SG.get(k); let best={d:1e9,s:null,u:0}; if(!L) return best; for(const s of L){ const u=clamp((x-s.x0)*s.dx+(z-s.z0)*s.dz,0,s.L), px=s.x0+s.dx*u, pz=s.z0+s.dz*u, d=Math.hypot(x-px,z-pz)-s.r.w/2; if(d<best.d) best={d,s,u,px,pz}; } return best; }
const roadY=(x,z)=>Math.max(H(x,z),-.35)+.06;

/* ---------- landmarks + game doors ---------- */
const LANDMARKS=[
 {id:'square', name:'Fountain Square Park', x:LMR.square[0], z:LMR.square[1], r:13, kind:'park'},
 {id:'botlife', name:'BotLife', game:true, x:LMR.botlife[0], z:LMR.botlife[1]+9, url:'https://the-come-up-phi.vercel.app/', col:'#00E676', blurb:'The open-world MoneyBot life sim. Jobs, rent, a phone, and your whole money story.'},
 {id:'botbank', name:'BotBank', game:true, x:LMR.botbank[0], z:LMR.botbank[1], url:'https://botbank-five.vercel.app', col:'#3B82F6', sponsor:'Presented by American Bank & Trust', blurb:'Run a bank: deposits, loans, interest and the occasional bank run.'},
 {id:'botpark', name:'BotPark Tower', game:true, x:LMR.botpark[0], z:LMR.botpark[1], url:'https://botstudio-rho.vercel.app', col:'#A855F7', blurb:'Build a startup from one desk to a whole tower. Games, web, AI and cyber clients.'},
 {id:'botu', name:'BotU at the Hill', game:true, x:LMR.botu[0], z:LMR.botu[1], url:'https://botu-theta.vercel.app', col:'#EF4444', blurb:'College money life: FAFSA, loans, budgets, and picking a major that pays off.'},
 {id:'fyp', name:'Junior Achievement · Find Your Path', game:true, x:LMR.fyp[0], z:LMR.fyp[1], url:'https://find-your-path-beta.vercel.app', col:'#22C55E', blurb:'Explore Kentucky careers and colleges with Junior Achievement of South Central Kentucky.'},
 {id:'botmotors', name:'Bot City Motors', game:true, x:LMR.botmotors[0], z:LMR.botmotors[1], url:'https://kgarmon99.github.io/botmotors/', col:'#F59E0B', blurb:'Buy your first car without getting played. Then run the dealership yourself.'},
 {id:'tycoon', name:'Greenwood Bot Mall', game:true, x:LMR.tycoon[0], z:LMR.tycoon[1], url:'https://kgarmon99.github.io/bot-tycoon/', col:'#EC4899', blurb:'Bot Tycoon: build a money empire one business at a time.'},
 {id:'botmarket', name:'BotMarket', game:true, x:LMR.botmarket[0], z:LMR.botmarket[1], url:'https://botmarket-kappa.vercel.app', col:'#10B981', blurb:'Run a grocery store: pricing, suppliers, waste, competition, profit.'},
 {id:'botfactory', name:'BotFactory', game:true, x:LMR.botfactory[0], z:LMR.botfactory[1], url:'https://kgarmon99.github.io/botfactory/', col:'#F97316', blurb:'Build the line, beat the bottleneck, and grow a factory huge.'},
 {id:'museum', name:'National Bot-Car Museum', x:LMR.museum[0], z:LMR.museum[1], kind:'museum'},
 {id:'ballpark', name:'Bot Rods Ballpark', x:LMR.ballpark[0], z:LMR.ballpark[1], kind:'ballpark'},
 {id:'skypac', name:'SKyPAC', x:LMR.skypac[0], z:LMR.skypac[1], kind:'skypac'},
 {id:'cave', name:'Lost River Cave', x:LMR.cave[0], z:LMR.cave[1], kind:'cave'},
 {id:'beech', name:'Beech Bend Raceway', x:LMR.beech[0], z:LMR.beech[1], kind:'raceway'},
 {id:'med', name:'Med Center', x:LMR.med[0], z:LMR.med[1], kind:'hospital'},
 {id:'river', name:'Barren River', x:LMR.bridge[0], z:LMR.bridge[1], kind:'bridge'},
 {id:'gas1', name:'Bot Gas · Downtown', x:LMR.gas1[0], z:LMR.gas1[1], kind:'gas'},
 {id:'gas2', name:'Bot Gas · Scottsville Rd', x:LMR.gas2[0], z:LMR.gas2[1], kind:'gas'},
];
const keepOut=[]; /* areas generators must leave empty */
LANDMARKS.forEach(l=>keepOut.push({x:l.x,z:l.z,r:l.r||(l.game?22:20)}));
keepOut.push({x:HILL.x,z:HILL.z,r:44},{x:LMR.botfactory[0],z:LMR.botfactory[1],r:50},{x:LMR.tycoon[0],z:LMR.tycoon[1],r:40},{x:LMR.beech[0],z:LMR.beech[1],r:52},{x:LMR.arena[0],z:LMR.arena[1],r:22},{x:LMR.tower[0],z:LMR.tower[1],r:8});
const isKept=(x,z,pad=0)=>keepOut.some(k=>Math.hypot(x-k.x,z-k.z)<k.r+pad);

/* ---------- colliders (axis-aligned boxes, spatial hashed) ---------- */
const COL=new Map(), CC=24;
function addCol(x0,z0,x1,z1){ const b={x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1)}; for(let i=Math.floor(b.x0/CC);i<=Math.floor(b.x1/CC);i++) for(let j=Math.floor(b.z0/CC);j<=Math.floor(b.z1/CC);j++){ const k=i+','+j; if(!COL.has(k)) COL.set(k,[]); COL.get(k).push(b); } }
function collide(p,rad){ const L=COL.get(Math.floor(p.x/CC)+','+Math.floor(p.z/CC)); let hit=false; if(!L) return false;
  for(const b of L){ const cx=clamp(p.x,b.x0,b.x1), cz=clamp(p.z,b.z0,b.z1), dx=p.x-cx, dz=p.z-cz, d=Math.hypot(dx,dz); if(d<rad){ hit=true; if(d>1e-4){ p.x=cx+dx/d*rad; p.z=cz+dz/d*rad; } else { const ox=Math.min(p.x-b.x0,b.x1-p.x), oz=Math.min(p.z-b.z0,b.z1-p.z); if(ox<oz) p.x=(p.x-b.x0<b.x1-p.x)?b.x0-rad:b.x1+rad; else p.z=(p.z-b.z0<b.z1-p.z)?b.z0-rad:b.z1+rad; } } } return hit; }

/* ---------- textures ---------- */
function canvasTex(w,h,draw,rep){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
const ROADTEX=()=>canvasTex(256,512,(g,w,h)=>{ g.fillStyle='#30343C'; g.fillRect(0,0,w,h); for(let i=0;i<2500;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*.06})`; g.fillRect(Math.random()*w,Math.random()*h,2,2); }
  g.fillStyle='#E5E7EB'; g.fillRect(8,0,6,h); g.fillRect(w-14,0,6,h); g.fillStyle='#FBBF24'; g.fillRect(w/2-7,0,5,h*.55); g.fillRect(w/2+2,0,5,h*.55); },true);

/* ---------- build everything ---------- */
function buildCity(){
  /* sky + fog */
  scene.background=canvasTex(4,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#3E8ED0'); gr.addColorStop(.55,'#93CDEF'); gr.addColorStop(1,'#E8F4FA'); g.fillStyle=gr; g.fillRect(0,0,w,h); });
  scene.fog=new THREE.Fog('#CFE6F3',220,700); camera.far=1500; camera.updateProjectionMatrix();
  /* ground */
  const G=new THREE.PlaneGeometry(1240,1240,300,300); G.rotateX(-Math.PI/2); const pos=G.attributes.position, colr=[]; const c=new THREE.Color();
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i), z=pos.getZ(i), y=H(x,z); pos.setY(i,y); const n=Math.sin(x*.07)*Math.cos(z*.05)*.5+.5, down=Math.abs(x)<150&&Math.abs(z)<150, bank=riverD(x,z)<34;
    c.set(bank?'#7A9B57':down?'#86A86A':'#6FA34F').lerp(new THREE.Color('#8DBE5A'),n*.45); if(y>8) c.lerp(new THREE.Color('#5E9644'),.3); c.convertSRGBToLinear(); colr.push(c.r,c.g,c.b); }
  G.setAttribute('color',new THREE.Float32BufferAttribute(colr,3)); G.computeVertexNormals();
  const ground=new THREE.Mesh(G,new THREE.MeshStandardMaterial({vertexColors:true, roughness:.95})); ground.receiveShadow=true; scene.add(ground);
  /* river */
  const rv=[], ri=[]; let k=0; const RP=[]; for(let i=0;i<RIV.length-1;i++){ const [x0,z0]=RIV[i],[x1,z1]=RIV[i+1], n=Math.max(1,Math.ceil(Math.hypot(x1-x0,z1-z0)/6)); for(let j=0;j<n;j++) RP.push([x0+(x1-x0)*j/n,z0+(z1-z0)*j/n]); } RP.push(RIV[RIV.length-1]);
  RP.forEach((p,i)=>{ const a=RP[Math.max(0,i-1)], b=RP[Math.min(RP.length-1,i+1)]; let dx=b[0]-a[0], dz=b[1]-a[1]; const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; rv.push(p[0]-dz*17,-1.25,p[1]+dx*17, p[0]+dz*17,-1.25,p[1]-dx*17); if(i){ const q=2*i; ri.push(q-2,q,q-1, q-1,q,q+1); } });
  const RG=new THREE.BufferGeometry(); RG.setAttribute('position',new THREE.Float32BufferAttribute(rv,3)); RG.setIndex(ri); RG.computeVertexNormals();
  const water=new THREE.Mesh(RG,new THREE.MeshStandardMaterial({color:'#2F7FB5', roughness:.12, metalness:.3, transparent:true, opacity:.9, envMap:W.env||null})); scene.add(water); W.water=water;
  buildRoads(); buildLandmarks(); buildBuildings(); buildTrees(); buildLights(); buildExtras();
}
function ribbon(pts,w,y0,stepLen,out){ const P=[]; for(let i=0;i<pts.length-1;i++){ const [x0,z0]=pts[i],[x1,z1]=pts[i+1], L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.ceil(L/stepLen)); for(let j=0;j<n;j++){ const t=j/n; P.push([x0+(x1-x0)*t, z0+(z1-z0)*t]); } } P.push(pts[pts.length-1]);
  let dist=0; const base=out.pos.length/3;
  P.forEach((p,i)=>{ const a=P[Math.max(0,i-1)], b=P[Math.min(P.length-1,i+1)]; let dx=b[0]-a[0], dz=b[1]-a[1]; const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; if(i) dist+=Math.hypot(p[0]-P[i-1][0],p[1]-P[i-1][1]);
    const nx=-dz*w/2, nz=dx*w/2, yl=roadY(p[0]+nx,p[1]+nz)+y0, yr=roadY(p[0]-nx,p[1]-nz)+y0, ym=0; out.pos.push(p[0]+nx,yl+.12,p[1]+nz, p[0]-nx,yr+.12,p[1]-nz); out.uv.push(0,dist/22, 1,dist/22);
    if(i){ const q=base+2*i; out.idx.push(q-2,q,q-1, q-1,q,q+1); } });
  return P; }
function buildRoads(){ const tex=ROADTEX(), side={pos:[],uv:[],idx:[]}, top={pos:[],uv:[],idx:[]}, bridges=[];
  ROADS.forEach((r,i)=>{ if(r.kind!=='hwy'&&r.kind!=='res') ribbon(r.pts,r.w+4,-.03,5,side); const P=ribbon(r.pts,r.w,.004*(i%7),5,top); P.forEach(p=>{ if(H(p[0],p[1])<-.6) bridges.push([p[0],p[1],r.w]); }); });
  const mk=(d,m)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(d.pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(d.uv,2)); g.setIndex(d.idx); g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(d.pos.length).map((v,i)=>i%3===1?1:0),3)); const m2=new THREE.Mesh(g,m); m2.receiveShadow=true; scene.add(m2); return m2; };
  mk(side,new THREE.MeshStandardMaterial({color:'#C9CED6', roughness:.9}));
  mk(top,new THREE.MeshStandardMaterial({map:tex, roughness:.85, polygonOffset:true, polygonOffsetFactor:-2}));
  /* bridge piers + rails */
  const pier=mat('#9CA3AF'); bridges.forEach(([x,z,w],i)=>{ if(i%3) return; const y=roadY(x,z); const m=new THREE.Mesh(BOX,pier); m.scale.set(2,y+3,2); m.position.set(x,(y-3)/2,z); scene.add(m); });
}

/* procedural windows on any box: by world position, so instanced boxes of any size look right */
function windowMat(opts={}){ const m=new THREE.MeshStandardMaterial({color:'#ffffff', roughness:.75, metalness:.05});
  m.onBeforeCompile=s=>{ s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP; varying vec3 vWN;').replace('#include <project_vertex>','#include <project_vertex>\n#ifdef USE_INSTANCING\n vWP=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz; vWN=normalize(mat3(modelMatrix*instanceMatrix)*objectNormal);\n#else\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz; vWN=normalize(mat3(modelMatrix)*objectNormal);\n#endif');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP; varying vec3 vWN; float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}')
     .replace('#include <color_fragment>',`#include <color_fragment>
      if(abs(vWN.y)<.5){ float u=abs(vWN.x)>.5?vWP.z:vWP.x; vec2 cell=vec2(floor(u/${(opts.wx||2.6).toFixed(2)}),floor(vWP.y/${(opts.wy||3.4).toFixed(2)}));
        vec2 f=vec2(fract(u/${(opts.wx||2.6).toFixed(2)}),fract(vWP.y/${(opts.wy||3.4).toFixed(2)}));
        float win=step(.2,f.x)*step(f.x,.8)*step(.25,f.y)*step(f.y,.8);
        float lit=hsh(cell+floor(vWP.xz*.05)); vec3 glass=mix(vec3(.12,.18,.27),vec3(.55,.68,.8),lit*.6);
        diffuseColor.rgb=mix(diffuseColor.rgb,glass,win*.88);
        diffuseColor.rgb*=1.0-.18*step(f.y,.08); }
      else if(vWN.y>.5){ diffuseColor.rgb*=.72; }`); };
  return m; }
const INST=[];
function instBoxes(list,m,cast=true){ const im=new THREE.InstancedMesh(BOX,m,list.length), o=new THREE.Object3D(), c=new THREE.Color(); list.forEach((b,i)=>{ o.position.set(b.x,b.y+b.h/2,b.z); o.rotation.set(0,b.ry||0,0); o.scale.set(b.w,b.h,b.d); o.updateMatrix(); im.setMatrixAt(i,o.matrix); im.setColorAt(i,c.set(b.c)); }); im.castShadow=cast; im.receiveShadow=true; scene.add(im); INST.push(im); return im; }

function buildBuildings(){ const occ=new Set(), cell=4; const free=(x,z,w,d)=>{ for(let i=Math.floor((x-w/2)/cell);i<=Math.floor((x+w/2)/cell);i++) for(let j=Math.floor((z-d/2)/cell);j<=Math.floor((z+d/2)/cell);j++) if(occ.has(i+','+j)) return false; return true; };
  const take=(x,z,w,d)=>{ for(let i=Math.floor((x-w/2)/cell);i<=Math.floor((x+w/2)/cell);i++) for(let j=Math.floor((z-d/2)/cell);j<=Math.floor((z+d/2)/cell);j++) occ.add(i+','+j); };
  const brick=['#9A4A3A','#B5654B','#C9A27E','#8C5A44','#D8C3A5','#A3553F','#7D8B94','#C7B299','#E2D3BF','#6E7F8A'], shop=['#F1E6D2','#DCE7E9','#F3D9C6','#E8E2F2','#D8EBD9'], house=['#F5EFE6','#E3ECF2','#F2E1C9','#DDE8D5','#EBD8D8','#E9E4F5','#C9D6DF'];
  const B=[], HB=[], RF=[];
  const tryPlace=(x,z,w,d,h,col,kind)=>{ if(isKept(x,z,Math.max(w,d)/2+2)) return false; const nr=nearRoad(x,z); if(nr.d<Math.max(w,d)/2+1.5) return false; if(riverD(x,z)<36) return false; if(!free(x,z,w+2,d+2)) return false;
    const s=nr.s, ry=s?Math.atan2(s.dx,s.dz):0; take(x,z,w+2,d+2); const y=H(x,z)-.6;
    if(kind==='house'){ HB.push({x,y,z,w,h,d,ry,c:col}); RF.push({x,y:y+h,z,w:w+.8,h:h*.5,d:d+.8,ry,c:pick(['#7C4A3A','#4B5563','#6B4F3A','#374151','#8B3A3A'])}); }
    else B.push({x,y,z,w,h,d,ry,c:col});
    const r=Math.max(w,d)/2*.92; addCol(x-r,z-r,x+r,z+r); return true; };
  /* frontage: walk every road and line it with buildings */
  SEGS.forEach(s=>{ const kind=s.r.kind, down=(x,z)=>Math.abs(x)<160&&Math.abs(z)<160; if(kind==='hwy') return;
    for(let u=4;u<s.L-4;u+=kind==='res'?13:9){ for(const side of [-1,1]){ const px=s.x0+s.dx*u, pz=s.z0+s.dz*u, nx=-s.dz*side, nz=s.dx*side;
      if(kind==='res'){ const off=s.r.w/2+6, w=rand(6,8), d=rand(6,8); tryPlace(px+nx*off,pz+nz*off,w,d,rand(4,5.5),pick(house),'house'); continue; }
      if(down(px,pz)){ const w=rand(7,11), d=rand(8,12), off=s.r.w/2+2.6+d/2; tryPlace(px+nx*off,pz+nz*off,w,d,rand(7,19)*(Math.hypot(px,pz)<70?1.25:1),pick(brick)); }
      else if(kind==='major'&&Math.random()<.55){ const w=rand(12,24), d=rand(12,20), off=s.r.w/2+9+d/2; tryPlace(px+nx*off,pz+nz*off,w,d,rand(5,9),pick(shop)); } } } });
  /* extra houses scattered off the grid edges */
  for(let i=0;i<2600;i++){ const x=rand(-560,560), z=rand(-560,560); const nr=nearRoad(x,z); if(nr.d>6&&nr.d<20&&!(Math.abs(x)<160&&Math.abs(z)<160)) tryPlace(x,z,rand(6,8),rand(6,8),rand(4,5.5),pick(house),'house'); }
  instBoxes(B,windowMat()); instBoxes(HB,windowMat({wx:3.2,wy:4.6}));
  /* details that sell it: cornices, shop awnings, storefront glass, rooftop units, water towers */
  const CN=[], AW=[], SF=[], RU=[]; const aw=['#B91C1C','#15803D','#1D4ED8','#B45309','#7C3AED','#0F766E','#BE185D'];
  B.forEach(b=>{ CN.push({x:b.x,y:b.y+b.h,z:b.z,w:b.w+.7,h:.7,d:b.d+.7,ry:b.ry,c:'#E7E0D3'});
    const fx=Math.sin(b.ry), fz=Math.cos(b.ry), sgn=(nearRoad(b.x+fx*b.d,b.z+fz*b.d).d<nearRoad(b.x-fx*b.d,b.z-fz*b.d).d)?1:-1;
    if(b.h<24&&Math.abs(b.x)<170&&Math.abs(b.z)<170){ AW.push({x:b.x+fx*sgn*(b.d/2+.9),y:b.y+3.6,z:b.z+fz*sgn*(b.d/2+.9),w:b.w*.8,h:.35,d:1.8,ry:b.ry,c:pick(aw)}); SF.push({x:b.x+fx*sgn*(b.d/2+.02),y:b.y+.6,z:b.z+fz*sgn*(b.d/2+.02),w:b.w*.7,h:2.8,d:.1,ry:b.ry,c:'#FDE9B5'}); }
    for(let k=0;k<(b.w*b.d>80?2:1);k++) RU.push({x:b.x+rand(-b.w/4,b.w/4),y:b.y+b.h+.7,z:b.z+rand(-b.d/4,b.d/4),w:rand(1.4,2.4),h:rand(.9,1.4),d:rand(1.4,2.4),ry:b.ry,c:'#9CA3AF'}); });
  instBoxes(CN,mat('#ffffff',{roughness:.6}),false); instBoxes(AW,mat('#ffffff',{roughness:.7})); instBoxes(SF,mat('#ffffff',{emissive:'#FDE68A',emissiveIntensity:.35,roughness:.2}),false); instBoxes(RU,mat('#ffffff',{metalness:.4,roughness:.5}));
  const towers=B.filter(b=>b.h>13).slice(0,14); towers.forEach(b=>{ const g=new THREE.Group(); g.position.set(b.x,b.y+b.h+.7,b.z); scene.add(g); [-1,1].forEach(i=>[-1,1].forEach(j=>cy(g,.1,2.4,i*.9,0,j*.9,mat('#4B3A2A')))); const tk=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,2.4,14),mat('#8B5E3C')); tk.position.y=3.6; g.add(tk); const top=new THREE.Mesh(new THREE.ConeGeometry(1.6,1.2,14),mat('#5B4636')); top.position.y=5.4; g.add(top); });
  const prism=new THREE.BufferGeometry(); prism.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,-.5, .5,-.5,-.5, 0,.5,-.5, -.5,-.5,.5, .5,-.5,.5, 0,.5,.5],3)); prism.setIndex([0,2,1, 3,4,5, 0,3,5, 0,5,2, 1,2,5, 1,5,4, 0,1,4, 0,4,3]); prism.computeVertexNormals();
  const rim=new THREE.InstancedMesh(prism,mat('#ffffff',{roughness:.8, flatShading:true}),RF.length), o=new THREE.Object3D(), c=new THREE.Color(); RF.forEach((b,i)=>{ o.position.set(b.x,b.y+b.h/2,b.z); o.rotation.set(0,b.ry,0); o.scale.set(b.w,b.h,b.d); o.updateMatrix(); rim.setMatrixAt(i,o.matrix); rim.setColorAt(i,c.set(b.c)); }); rim.castShadow=true; scene.add(rim);
  W.stats={buildings:B.length, houses:HB.length}; }

function buildTrees(){ const T=[], cell=new Set(); for(let i=0;i<5200&&T.length<(MOBILE?1100:2400);i++){ const x=rand(-590,590), z=rand(-590,590); const hill=Math.hypot(x-HILL.x,z-HILL.z)<70, bank=(()=>{ const d=riverD(x,z); return d<55&&d>19; })(), park=Math.hypot(x,z)<11.5&&Math.hypot(x,z)>8;
    const down=Math.abs(x)<150&&Math.abs(z)<150; if(down&&!park&&Math.random()<.85) continue; if(!(hill||bank||park)&&Math.random()<.45) continue;
    const nr=nearRoad(x,z); if(nr.d<3) continue; const k=Math.floor(x/3)+','+Math.floor(z/3); if(cell.has(k)) continue; if(COL.get(Math.floor(x/CC)+','+Math.floor(z/CC))?.some(b=>x>b.x0-1&&x<b.x1+1&&z>b.z0-1&&z<b.z1+1)) continue; cell.add(k);
    if(LANDMARKS.some(l=>l.game&&Math.hypot(x-l.x,z-l.z)<16)) continue; T.push({x,z,y:H(x,z),s:rand(.8,1.5)}); }
  const trunk=new THREE.InstancedMesh(CYL,mat('#6B4B34'),T.length), crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mat('#ffffff',{roughness:.9, flatShading:true}),T.length), o=new THREE.Object3D(), c=new THREE.Color();
  T.forEach((t,i)=>{ o.position.set(t.x,t.y+1.4*t.s,t.z); o.rotation.set(0,0,0); o.scale.set(.32*t.s,2.8*t.s,.32*t.s); o.updateMatrix(); trunk.setMatrixAt(i,o.matrix);
    o.position.set(t.x,t.y+3.9*t.s,t.z); o.rotation.set(0,i,0); o.scale.set(2.1*t.s,2.4*t.s,2.1*t.s); o.updateMatrix(); crown.setMatrixAt(i,o.matrix); crown.setColorAt(i,c.set(pick(['#3F8F3A','#4CA145','#5BAE4C','#367A35','#6BB85A']))); });
  trunk.castShadow=crown.castShadow=true; scene.add(trunk,crown); }

function buildExtras(){ const zeb=mat('#F8FAFC',{roughness:.8, polygonOffset:true, polygonOffsetFactor:-4});
  const XI=[]; for(let i=-3;i<=5;i++) for(let j=-4;j<=5;j++){ const [x,z]=WARP(REAL.av[0]*i*125+REAL.au[0]*j*125, REAL.av[1]*i*125+REAL.au[1]*j*125); XI.push([x,z]); } const GA=Math.atan2(REAL.au[0],REAL.au[1]); XI.forEach(([x,z])=>{ if(nearRoad(x,z).d>-2) return; const cw=new THREE.Group(); cw.position.set(x,0,z); cw.rotation.y=GA; scene.add(cw); for(const [ox,oz,v] of [[0,-7,0],[0,7,0],[-7,0,1],[7,0,1]]) for(let i=-1;i<=1;i++){ const m=new THREE.Mesh(BOX,zeb); m.scale.set(v?3.4:.7,.04,v?.7:3.4); m.position.set(ox+(v?0:i*1.4),roadY(x,z)+.14,oz+(v?i*1.4:0)); cw.add(m); } });
  /* green street-name signs at the start of every named road */
  const pole=mat('#475569'); ROADS.filter(r=>r.kind!=='res'&&r.kind!=='square').forEach(r=>{ [0,r.pts.length-2].forEach(i=>{ const [x0,z0]=r.pts[i],[x1,z1]=r.pts[i+1], L=Math.hypot(x1-x0,z1-z0); const t=i?1-8/L:8/L, x=x0+(x1-x0)*t+(z1-z0)/L*(r.w/2+1.5), z=z0+(z1-z0)*t-(x1-x0)/L*(r.w/2+1.5); if(H(x,z)<-.5) return;
    const g=new THREE.Group(); g.position.set(x,roadY(x,z),z); g.rotation.y=Math.atan2(x1-x0,z1-z0)+Math.PI/2; scene.add(g); cy(g,.08,4.2,0,0,0,pole); sign(g,[{t:r.name,size:58,color:'#FFFFFF'}],Math.min(5.2,1.2+r.name.length*.26),.62,0,4.2,0,{bg:r.kind==='hwy'?'#1D4ED8':'#15803D',r:8,w:640,h:96}); }); });
  /* clouds */
  const cm=mat('#FFFFFF',{roughness:1,emissive:'#F1F5F9',emissiveIntensity:.4}); for(let i=0;i<16;i++){ const c=new THREE.Group(); for(let k=0;k<5;k++){ const b=new THREE.Mesh(SPH,cm); b.scale.set(rand(10,18),rand(4,7),rand(8,12)); b.position.set(k*10-20,rand(-2,2),rand(-5,5)); c.add(b); } c.position.set(rand(-600,600),rand(120,170),rand(-600,600)); scene.add(c); const v=rand(1,2.5); W.anim.push(()=>{ c.position.x+=v*.016; if(c.position.x>700) c.position.x=-700; }); }
  /* fountain spray */
  const sp=[], sm=new THREE.MeshBasicMaterial({color:'#DBEAFE',transparent:true,opacity:.7}), sg=new THREE.SphereGeometry(.12,6,4); for(let i=0;i<70;i++){ const m=new THREE.Mesh(sg,sm); scene.add(m); sp.push({m,t:Math.random()*1.4,a:Math.random()*7}); }
  const fy=H(0,0)+5.6; W.anim.push(t=>{ sp.forEach(p=>{ const k=((t+p.t)%1.4)/1.4, r=k*3.4; p.m.position.set(Math.cos(p.a)*r,fy+k*3.2-k*k*5.2,Math.sin(p.a)*r); }); });
  /* flags around the square */
  [[-10,-10],[10,-10],[10,10],[-10,10]].forEach(([x,z],i)=>{ const g=new THREE.Group(); g.position.set(x,H(x,z),z); scene.add(g); cy(g,.08,9,0,0,0,mat('#E5E7EB',{metalness:.6})); const f=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.6,8,1),new THREE.MeshStandardMaterial({color:i%2?'#1E3A8A':'#00C853',side:THREE.DoubleSide})); f.position.set(1.35,8.1,0); g.add(f); const P=f.geometry.attributes.position, base=P.array.slice();
    W.anim.push(t=>{ for(let v=0;v<P.count;v++){ const x=base[v*3]; P.setZ(v,Math.sin(t*4+x*2+i)*.18*(x+1.3)); } P.needsUpdate=true; }); });
}
function buildLights(){ const L=[]; SEGS.forEach(s=>{ if(s.r.kind==='res'||s.r.kind==='hwy') return; for(let u=10;u<s.L;u+=28){ const side=(u/28|0)%2?1:-1, x=s.x0+s.dx*u-s.dz*side*(s.r.w/2+1.6), z=s.z0+s.dz*u+s.dx*side*(s.r.w/2+1.6); if(H(x,z)<-.5) continue; L.push({x,z,y:roadY(x,z)}); } });
  const pole=new THREE.InstancedMesh(CYL,mat('#3F4A59',{metalness:.5,roughness:.4}),L.length), head=new THREE.InstancedMesh(BOX,mat('#FEF3C7',{emissive:'#FDE68A',emissiveIntensity:.6}),L.length), o=new THREE.Object3D();
  L.forEach((p,i)=>{ o.position.set(p.x,p.y+3,p.z); o.scale.set(.12,6,.12); o.updateMatrix(); pole.setMatrixAt(i,o.matrix); o.position.set(p.x,p.y+6,p.z); o.scale.set(.6,.2,.6); o.updateMatrix(); head.setMatrixAt(i,o.matrix); }); scene.add(pole,head); }

/* ---------- landmarks, hand built ---------- */
function L$(id){ return LANDMARKS.find(l=>l.id===id); }
function grp(l,ry=0){ const g=new THREE.Group(); g.position.set(l.x,H(l.x,l.z)-.2,l.z); g.rotation.y=ry; scene.add(g); l.g=g; return g; }
function colBox(l,w,d){ addCol(l.x-w/2,l.z-d/2,l.x+w/2,l.z+d/2); }
function buildLandmarks(){ const brick=mat('#A0523D'), cream=mat('#EFE6D6'), slate=mat('#475569'), glass=GLASS, white=mat('#F8FAFC'), gold=mat('#D4A017',{metalness:.6,roughness:.3}), green=mat('#2F6B3A');
  /* Fountain Square: park, fountain, gazebo */
  { const g=grp(L$('square')); const lawn=new THREE.Mesh(new THREE.CylinderGeometry(12.5,12.5,.3,48),mat('#5FA548')); lawn.position.y=.1; lawn.receiveShadow=true; g.add(lawn);
    const path=mat('#D6D3CB'); [0,Math.PI/2].forEach(r=>{ const p=new THREE.Mesh(BOX,path); p.scale.set(25,.34,2.4); p.rotation.y=r; p.position.y=.12; g.add(p); });
    const basin=new THREE.Mesh(new THREE.CylinderGeometry(6,6.4,1,40),mat('#BFC5CC')); basin.position.y=.5; g.add(basin); const pool=new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.5,.2,40),new THREE.MeshStandardMaterial({color:'#3B9AD9',roughness:.1,metalness:.3})); pool.position.y=1; g.add(pool);
    cy(g,.6,4,0,1,0,mat('#9CA3AF')); const bowl=new THREE.Mesh(new THREE.CylinderGeometry(2.2,.8,.8,24),mat('#BFC5CC')); bowl.position.y=4.2; g.add(bowl); const statue=new THREE.Mesh(SPH,MB.coin); statue.scale.setScalar(.9); statue.position.y=5.6; g.add(statue);
    W.fountain=g; colBox({x:0,z:0},12,12);
    const tr={x:7,z:-9}; W.truck=tr; const t=new THREE.Group(); t.position.set(tr.x,H(tr.x,tr.z),tr.z); t.rotation.y=.6; scene.add(t); bx(t,5.4,2.6,2.4,0,.5,0,mat('#F97316')); bx(t,1.6,1.8,2.3,3.3,.5,0,mat('#FDBA74')); [-1.6,1.8].forEach(x=>[-1.2,1.2].forEach(z=>{ const w=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.3,12),mat('#111827')); w.rotation.x=Math.PI/2; w.position.set(x,.45,z); t.add(w); })); sign(t,[{t:'🍔 BOT EATS',size:70,color:'#FFFFFF'}],3.6,.8,0,3.6,1.25,{bg:'#B91C1C',r:10}); }
  /* BotBank: columned bank on the square */
  { const l=L$('botbank'), g=grp(l,Math.PI); bx(g,26,14,18,0,0,0,cream); bx(g,28,1.4,20,0,14,0,white); const tri=new THREE.Mesh(new THREE.CylinderGeometry(15,15,20,3,1),white); tri.rotation.z=Math.PI/2; tri.scale.set(.25,1,1); tri.position.set(0,16,0); g.add(tri);
    for(let i=-3;i<=3;i++) cy(g,.8,12,i*3.6,0,10.4,white); bx(g,26,.8,4,0,0,10.6,mat('#D1D5DB')); sign(g,[{t:'BotBank',size:96,color:'#FFFFFF'}],12,2.4,0,13,11.2,{bg:'#1D4ED8',r:16}); sign(g,[{t:'presented by American Bank & Trust',size:40,color:'#1E3A8A'}],12,1.1,0,11.3,11.2,{bg:'#E0E7FF',r:10}); colBox(l,26,18); }
  /* BotPark tower: glass startup tower */
  { const l=L$('botpark'), g=grp(l); bx(g,16,6,16,0,0,0,slate); bx(g,14,44,14,0,6,0,glass); bx(g,14.4,.8,14.4,0,22,0,mat('#A855F7',{emissive:'#7C3AED',emissiveIntensity:.6})); bx(g,14.4,.8,14.4,0,36,0,mat('#A855F7',{emissive:'#7C3AED',emissiveIntensity:.6})); sign(g,[{t:'BotPark',size:90,color:'#FFFFFF'}],10,2.2,0,47,7.1,{bg:'#6D28D9',r:14,glow:.5}); colBox(l,16,16); }
  /* WKU hilltop: Cherry Hall + cupola, bell tower, arena */
  { const l=L$('botu'), g=grp(l); bx(g,30,12,14,0,0,0,brick); for(let i=-3;i<=3;i++) cy(g,.7,10,i*3.4,0,7.6,white); bx(g,30,1.2,16,0,12,0,white); const tri=new THREE.Mesh(new THREE.CylinderGeometry(9,9,16,3,1),white); tri.rotation.z=Math.PI/2; tri.scale.set(.22,1,1); tri.position.set(0,14,0); tri.rotation.y=Math.PI/2; g.add(tri);
    cy(g,2.4,5,0,15,0,white); const dome=new THREE.Mesh(new THREE.SphereGeometry(2.6,24,12,0,Math.PI*2,0,Math.PI/2),gold); dome.position.y=20; g.add(dome); cy(g,.15,3,0,22.4,0,gold);
    sign(g,[{t:'BotU',size:96,color:'#FFFFFF'},{t:'on the Hill',size:44,color:'#FECACA'}],8,2.6,0,9.5,7.2,{bg:'#B91C1C',r:14}); colBox(l,30,14);
    const tw={x:LMR.tower[0],z:LMR.tower[1]}, t=new THREE.Group(); t.position.set(tw.x,H(tw.x,tw.z)-.2,tw.z); scene.add(t); bx(t,5,26,5,0,0,0,brick); bx(t,5.6,4,5.6,0,26,0,white); const sp=new THREE.Mesh(new THREE.ConeGeometry(3.4,6,4),slate); sp.rotation.y=Math.PI/4; sp.position.y=33; t.add(sp); addCol(tw.x-3,tw.z-3,tw.x+3,tw.z+3);
    const ar={x:LMR.arena[0],z:LMR.arena[1]}, a=new THREE.Group(); a.position.set(ar.x,H(ar.x,ar.z)-.5,ar.z); scene.add(a); const arena=new THREE.Mesh(new THREE.CylinderGeometry(18,20,10,32),mat('#C8CDD3')); arena.position.y=5; a.add(arena); const ring=new THREE.Mesh(new THREE.CylinderGeometry(18.2,18.2,2,32,1,true),mat('#B91C1C')); ring.position.y=8; a.add(ring); addCol(ar.x-18,ar.z-18,ar.x+18,ar.z+18);
    sign(a,[{t:'BOT ARENA',size:80,color:'#FFFFFF'}],12,2,0,8,18.4,{bg:'#B91C1C',r:10}); }
  /* Ballpark */
  { const l=L$('ballpark'), g=grp(l); g.scale.setScalar(.7); const field=new THREE.Mesh(new THREE.CircleGeometry(26,40,Math.PI*.25,Math.PI*.5),mat('#4C9A3F')); field.rotation.x=-Math.PI/2; field.position.y=.15; g.add(field);
    const dirt=new THREE.Mesh(new THREE.CircleGeometry(9,24,Math.PI*.25,Math.PI*.5),mat('#B7793E')); dirt.rotation.x=-Math.PI/2; dirt.position.y=.2; g.add(dirt);
    for(let a=0;a<6;a++){ const s=new THREE.Mesh(BOX,mat(a%2?'#1E3A8A':'#DC2626')); const ang=Math.PI*.25+a/5*Math.PI*.5; s.scale.set(10,5+a%2,4); s.position.set(Math.cos(ang)*-0+Math.sin(ang)*0,2.5,0); s.position.set(Math.cos(ang)*-30*-1,2.5,-Math.sin(ang)*30*-1); s.lookAt(0,2.5,0); g.add(s); }
    [[-28,-28],[28,-28]].forEach(([x,z])=>{ cy(g,.4,22,x,0,z,mat('#94A3B8')); bx(g,5,3,1,x,21,z,mat('#F8FAFC',{emissive:'#FFFFFF',emissiveIntensity:.4})); });
    sign(g,[{t:'BOT RODS',size:90,color:'#FFFFFF'},{t:'BALLPARK',size:50,color:'#FDE68A'}],10,3.2,0,6,8,{bg:'#B91C1C',r:14}); }
  /* SKyPAC */
  { const l=L$('skypac'), g=grp(l,-Math.PI/2); bx(g,24,12,18,0,0,0,mat('#D9D2C3')); bx(g,18,16,4,0,0,9.5,glass); bx(g,26,1,20,0,12,0,mat('#8B7D6B')); sign(g,[{t:'SKyPAC',size:90,color:'#0B1220'}],8,1.8,0,13.4,11.7,{bg:'#F5F0E6',r:10}); colBox(l,22,22); }
  /* JA building */
  { const l=L$('fyp'), g=grp(l,-Math.PI*.75); bx(g,22,10,14,0,0,0,mat('#E8EEF2')); bx(g,22.4,1,14.4,0,10,0,mat('#16A34A')); sign(g,[{t:'Junior Achievement',size:64,color:'#FFFFFF'},{t:'of South Central Kentucky',size:40,color:'#DCFCE7'}],12,2.6,0,7.6,7.1,{bg:'#15803D',r:12}); colBox(l,20,20); }
  /* BotMotors lot */
  { const l=L$('botmotors'), g=grp(l,-Math.PI*.75); const lot=new THREE.Mesh(BOX,mat('#3A3F48')); lot.scale.set(36,.2,24); lot.position.y=.1; g.add(lot); bx(g,14,7,8,0,0,-14,mat('#F8FAFC')); bx(g,13,5,.3,0,1,-9.9,glass);
    sign(g,[{t:'BOT CITY MOTORS',size:70,color:'#0B1220'}],12,1.8,0,8.6,-9.6,{bg:'#FBBF24',r:10}); W.dealerCars=[]; ['sedan','hatch','coupe','truck','ev'].forEach((st,i)=>{ const c=makeCar({id:'d'+i,style:st,color:['#DC2626','#2563EB','#F59E0B','#16A34A','#F8FAFC'][i]}); c.position.set(-12+i*6,.2,2); c.rotation.y=Math.PI; g.add(c); });
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,6,10),mat('#EF4444')); tube.position.set(16,3,8); g.add(tube); W.anim.push(t=>{ tube.rotation.z=Math.sin(t*5)*.4; }); colBox({x:l.x,z:l.z},14,14); }
  /* Mall */
  { const l=L$('tycoon'), g=grp(l); bx(g,60,10,34,0,0,-8,mat('#E7E2DA')); bx(g,16,14,6,0,0,10,glass); const lot=new THREE.Mesh(BOX,mat('#3A3F48')); lot.scale.set(66,.2,22); lot.position.set(0,.1,24); g.add(lot);
    sign(g,[{t:'Greenwood Bot Mall',size:70,color:'#FFFFFF'}],18,2.4,0,11.4,13.2,{bg:'#BE185D',r:12}); sign(g,[{t:'Bot Tycoon inside',size:44,color:'#831843'}],8,1,0,5,13.2,{bg:'#FCE7F3',r:8}); addCol(l.x-30,l.z-25,l.x+30,l.z+9); }
  /* BotMarket grocery */
  { const l=L$('botmarket'), g=grp(l,-Math.PI*.75); bx(g,30,9,20,0,0,-8,mat('#F0FDF4')); bx(g,30.6,1,20.6,0,9,-8,mat('#059669')); bx(g,10,6,.3,0,0,2.2,glass); sign(g,[{t:'BotMarket',size:96,color:'#FFFFFF'}],12,2.4,0,8,2.6,{bg:'#059669',r:14}); colBox({x:l.x,z:l.z-4},24,24); }
  /* BotFactory + museum by I-65 */
  { const l=L$('botfactory'), g=grp(l); bx(g,70,16,44,0,0,-10,mat('#CBD5E1')); for(let i=-3;i<=3;i++){ const r=new THREE.Mesh(new THREE.CylinderGeometry(3,3,44,12,1,false,0,Math.PI),mat('#94A3B8')); r.rotation.x=Math.PI/2; r.position.set(i*10,16,-10); g.add(r); }
    [[-26,18],[-18,22]].forEach(([x,h])=>cy(g,1.6,h+16,x,0,-28,mat('#64748B'))); sign(g,[{t:'BotFactory',size:96,color:'#FFFFFF'},{t:'Kentucky-made',size:44,color:'#FFEDD5'}],16,3.4,0,11,12.2,{bg:'#EA580C',r:14}); addCol(l.x-35,l.z-32,l.x+35,l.z+12);
    W.smoke=[[-26,34],[-18,38]].map(([x,h])=>({x:l.x+x,y:H(l.x,l.z)+h,z:l.z-28})); }
  { const l=L$('museum'), g=grp(l); const base=new THREE.Mesh(new THREE.CylinderGeometry(20,22,8,40),mat('#F3F4F6')); base.position.y=4; g.add(base); const cone=new THREE.Mesh(new THREE.ConeGeometry(14,22,40),mat('#FACC15',{metalness:.3,roughness:.4})); cone.position.y=19; g.add(cone);
    const spire=new THREE.Mesh(new THREE.CylinderGeometry(.6,1.2,30,12),mat('#DC2626')); spire.position.set(10,15,0); spire.rotation.z=-.35; g.add(spire); sign(g,[{t:'National Bot-Car Museum',size:56,color:'#0B1220'}],14,1.6,0,6,22.2,{bg:'#FEF9C3',r:10}); addCol(l.x-21,l.z-21,l.x+21,l.z+21); }
  /* Lost River Cave */
  { const l=L$('cave'), g=grp(l); const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(14,1),mat('#8A8173',{flatShading:true,roughness:1})); rock.scale.set(1.3,.7,1); rock.position.set(0,2,-6); g.add(rock);
    const mouth=new THREE.Mesh(new THREE.CircleGeometry(5,24,0,Math.PI),mat('#0B0F14')); mouth.position.set(0,1,8.1); g.add(mouth); const pool=new THREE.Mesh(new THREE.CircleGeometry(9,32),new THREE.MeshStandardMaterial({color:'#2B7A9B',roughness:.1})); pool.rotation.x=-Math.PI/2; pool.position.set(0,.4,13); g.add(pool);
    const boat=new THREE.Mesh(BOX,mat('#B45309')); boat.scale.set(2,.6,5); boat.position.set(1,.7,13); g.add(boat); W.anim.push(t=>{ boat.position.x=Math.sin(t*.4)*4; boat.rotation.y=Math.cos(t*.4)*.3; });
    sign(g,[{t:'Lost River Cave',size:70,color:'#FFFFFF'}],8,1.4,9,3,10,{bg:'#3F2D1D',r:10}); addCol(l.x-16,l.z-18,l.x+16,l.z+4); }
  /* Beech Bend raceway */
  { const l=L$('beech'), g=grp(l); const track=new THREE.Mesh(new THREE.RingGeometry(26,36,48),mat('#2F3338')); track.rotation.x=-Math.PI/2; track.scale.set(1.3,1,1); track.position.y=.15; g.add(track);
    for(let i=0;i<10;i++){ const s=new THREE.Mesh(BOX,mat(i%2?'#F8FAFC':'#DC2626')); s.scale.set(4,.3,1); const a=i/10*Math.PI*2; s.position.set(Math.cos(a)*36*1.3,.4,Math.sin(a)*36); s.rotation.y=-a; g.add(s); }
    sign(g,[{t:'Beech Bend Raceway',size:70,color:'#FFFFFF'}],14,2,0,6,-40,{bg:'#111827',r:10}); cy(g,.3,6,-7,0,-40,slate); cy(g,.3,6,7,0,-40,slate);
    W.racers=[0,1,2].map(i=>{ const c=makeCar({id:'r'+i,style:'coupe',color:['#EF4444','#3B82F6','#FACC15'][i]}); g.add(c); return {c,a:i*2,v:.55+i*.06}; }); }
  /* hospital */
  { const l=L$('med'), g=grp(l); bx(g,26,22,18,0,0,0,mat('#E5E7EB')); bx(g,8,26,8,9,0,0,mat('#E5E7EB')); sign(g,[{t:'✚ Med Center',size:70,color:'#FFFFFF'}],10,1.8,0,19,9.2,{bg:'#0EA5E9',r:10}); colBox(l,26,18); }
  /* gas stations */
  ['gas1','gas2'].forEach(id=>{ const l=L$(id), g=grp(l); bx(g,16,.5,10,0,5.5,0,mat('#F8FAFC')); [-5,0,5].forEach(x=>{ cy(g,.25,5.5,x,0,-3,mat('#CBD5E1')); bx(g,1,1.6,.8,x,0,1.5,mat('#16A34A')); }); bx(g,10,5,7,0,0,-12,mat('#E5E7EB'));
    sign(g,[{t:'⛽ BOT GAS',size:80,color:'#FFFFFF'}],8,1.6,0,7.2,5.1,{bg:'#16A34A',r:10}); addCol(l.x-5,l.z-16,l.x+5,l.z-8); });
  /* city welcome sign */
  { const g=new THREE.Group(); const x=LMR.bridge[0]-14,z=LMR.bridge[1]+22; g.position.set(x,roadY(x,z),z); g.rotation.y=Math.PI*.8; scene.add(g); [-5,5].forEach(s=>cy(g,.3,5,s,0,0,slate)); sign(g,[{t:'Welcome to',size:44,color:'#14532D'},{t:'BOWLING GREEN',size:84,color:'#14532D'},{t:'a MoneyBot city',size:40,color:'#166534'}],12,4,0,5,0,{bg:'#F0FDF4',r:14,w:768,h:256}); }
}
