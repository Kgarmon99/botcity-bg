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
REAL.roads.forEach(r=>road(r.name,{hwy:19,major:13,street:7.5,square:7.5}[r.kind]||8,r.pts,r.kind));
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
 {id:'botlife', name:'BotLife', game:true, x:LMR.botlife[0]+Math.sin(REAL.grid.ga)*9, z:LMR.botlife[1]+Math.cos(REAL.grid.ga)*9, url:'https://the-come-up-phi.vercel.app/', col:'#00E676', blurb:'The open-world MoneyBot life sim. Jobs, rent, a phone, and your whole money story.'},
 {id:'botbank', name:'BotBank', game:true, x:LMR.botbank[0], z:LMR.botbank[1], url:'https://botbank-five.vercel.app', col:'#3B82F6', sponsor:'Presented by American Bank & Trust', blurb:'Run a bank: deposits, loans, interest and the occasional bank run.'},
 {id:'botpark', name:'BotPark Tower', game:true, x:LMR.botpark[0], z:LMR.botpark[1], url:'https://botstudio-rho.vercel.app', col:'#A855F7', blurb:'Build a startup from one desk to a whole tower. Games, web, AI and cyber clients.'},
 {id:'botu', name:'BotU at the Hill', game:true, x:LMR.botu[0], z:LMR.botu[1], url:'https://botu-theta.vercel.app', col:'#EF4444', blurb:'College money life: FAFSA, loans, budgets, and picking a major that pays off.'},
 {id:'fyp', name:'Junior Achievement · Find Your Path', game:true, x:LMR.fyp[0], z:LMR.fyp[1], url:'https://find-your-path-beta.vercel.app', col:'#22C55E', blurb:'Explore Kentucky careers and colleges with Junior Achievement of South Central Kentucky.'},
 {id:'botmotors', name:'Bot City Motors', game:true, x:LMR.botmotors[0], z:LMR.botmotors[1], url:'https://kgarmon99.github.io/botmotors/', col:'#F59E0B', blurb:'Buy your first car without getting played. Then run the dealership yourself.'},
 {id:'tycoon', name:'Greenwood Bot Mall', game:true, x:LMR.tycoon[0], z:LMR.tycoon[1], url:'https://kgarmon99.github.io/bot-tycoon/', col:'#EC4899', blurb:'Bot Tycoon: build a money empire one business at a time.'},
 {id:'botmarket', name:'BotMarket', game:true, x:LMR.botmarket[0], z:LMR.botmarket[1], url:'https://botmarket-kappa.vercel.app', col:'#10B981', blurb:'Run a grocery store: pricing, suppliers, waste, competition, profit.'},
 {id:'botfactory', name:'BotFactory', game:true, x:LMR.botfactory[0], z:LMR.botfactory[1], url:'https://kgarmon99.github.io/botfactory/', col:'#F97316', blurb:'Build the line, beat the bottleneck, and grow a factory huge.'},
 {id:'capitol', name:'Capitol Arts Center', x:LMR.capitol[0], z:LMR.capitol[1], r:7, kind:'capitol'},
 {id:'courthouse', name:'Warren County Courthouse', x:LMR.courthouse[0], z:LMR.courthouse[1], r:8, kind:'courthouse'},
 {id:'justice', name:'Warren County Justice Center', x:LMR.justice[0], z:LMR.justice[1], r:8, kind:'justice'},
 {id:'stadium', name:'L.T. Smith Stadium', x:LMR.stadium[0], z:LMR.stadium[1], r:18, kind:'stadium'},
 {id:'hobson', name:'Riverview at Hobson Grove', x:LMR.hobson[0], z:LMR.hobson[1], r:14, kind:'mansion'},
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
const NIGHT={value:0};
/* procedural facades by world position: brick courses, window frames + sills, and windows that light up at night */
function windowMat(opts={}){ const m=new THREE.MeshStandardMaterial({color:'#ffffff', roughness:.8, metalness:.04}); const wx=(opts.wx||2.6).toFixed(2), wy=(opts.wy||3.4).toFixed(2);
  m.onBeforeCompile=s=>{ s.uniforms.uNight=NIGHT;
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP; varying vec3 vWN;').replace('#include <project_vertex>','#include <project_vertex>\n#ifdef USE_INSTANCING\n vWP=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz; vWN=normalize(mat3(modelMatrix*instanceMatrix)*objectNormal);\n#else\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz; vWN=normalize(mat3(modelMatrix)*objectNormal);\n#endif');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight; varying vec3 vWP; varying vec3 vWN; float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);} float gWin=0.; float gLit=0.;')
     .replace('#include <color_fragment>',`#include <color_fragment>
      if(abs(vWN.y)<.5){ float u=abs(vWN.x)>.5?vWP.z:vWP.x; vec2 cell=vec2(floor(u/${wx}),floor(vWP.y/${wy})); vec2 f=vec2(fract(u/${wx}),fract(vWP.y/${wy}));
        float win=step(.22,f.x)*step(f.x,.78)*step(.28,f.y)*step(f.y,.82); float frame=step(.17,f.x)*step(f.x,.83)*step(.22,f.y)*step(f.y,.87)-win;
        float lit=hsh(cell+floor(vWP.xz*.05)); vec3 glass=mix(vec3(.10,.15,.24),vec3(.52,.66,.8),lit*.55+.15*f.y);
        float course=step(.9,fract(vWP.y*2.85))*.08+step(.94,fract(u*1.4+floor(vWP.y*2.85)*.5))*.05;
        diffuseColor.rgb*=1.0-course; diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.91,.86),frame*.8); diffuseColor.rgb=mix(diffuseColor.rgb,glass,win*.9);
        diffuseColor.rgb*=1.0-.25*step(f.y,.06); gWin=win; gLit=step(.42,lit); }
      else if(vWN.y>.5){ diffuseColor.rgb*=.7; }`)
     .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(1.0,.78,.45)*gWin*gLit*uNight*1.15;`); };
  return m; }
const INST=[];
function instBoxes(list,m,cast=true){ const im=new THREE.InstancedMesh(BOX,m,list.length), o=new THREE.Object3D(), c=new THREE.Color(); list.forEach((b,i)=>{ o.position.set(b.x,b.y+b.h/2,b.z); o.rotation.set(0,b.ry||0,0); o.scale.set(b.w,b.h,b.d); o.updateMatrix(); im.setMatrixAt(i,o.matrix); im.setColorAt(i,c.set(b.c)); }); im.castShadow=cast; im.receiveShadow=true; scene.add(im); INST.push(im); return im; }

function buildBuildings(){ const occ=new Set(), cell=4; const free=(x,z,w,d)=>{ for(let i=Math.floor((x-w/2)/cell);i<=Math.floor((x+w/2)/cell);i++) for(let j=Math.floor((z-d/2)/cell);j<=Math.floor((z+d/2)/cell);j++) if(occ.has(i+','+j)) return false; return true; };
  const take=(x,z,w,d)=>{ for(let i=Math.floor((x-w/2)/cell);i<=Math.floor((x+w/2)/cell);i++) for(let j=Math.floor((z-d/2)/cell);j<=Math.floor((z+d/2)/cell);j++) occ.add(i+','+j); };
  const brick=['#9A4A3A','#B5654B','#C9A27E','#8C5A44','#D8C3A5','#A3553F','#7D8B94','#C7B299','#E2D3BF','#6E7F8A'], shop=['#F1E6D2','#DCE7E9','#F3D9C6','#E8E2F2','#D8EBD9'], house=['#F5EFE6','#E3ECF2','#F2E1C9','#DDE8D5','#EBD8D8','#E9E4F5','#C9D6DF'];
  const B=[], HB=[], RF=[], LOTS=[], aw2=['#DC2626','#2563EB','#F59E0B','#16A34A','#7C3AED','#DB2777','#0891B2'];
  const tryPlace=(x,z,w,d,h,col,kind)=>{ if(isKept(x,z,Math.max(w,d)/2+2)) return false; const nr=nearRoad(x,z); if(nr.d<Math.max(w,d)/2+1.5) return false; if(riverD(x,z)<36) return false; if(!free(x,z,w+2,d+2)) return false;
    const s=nr.s, ry=s?Math.atan2(s.dx,s.dz):0; take(x,z,w+2,d+2); const y=H(x,z)-.6;
    if(kind==='house'){ HB.push({x,y,z,w,h,d,ry,c:col}); RF.push({x,y:y+h,z,w:w+.8,h:h*.5,d:d+.8,ry,c:pick(['#7C4A3A','#4B5563','#6B4F3A','#374151','#8B3A3A'])}); }
    else B.push({x,y,z,w,h,d,ry,c:col});
    const r=Math.max(w,d)/2*.92; addCol(x-r,z-r,x+r,z+r); return true; };
  /* frontage: walk every road and line it with buildings */
  SEGS.forEach(s=>{ const kind=s.r.kind, down=(x,z)=>Math.abs(x)<160&&Math.abs(z)<160; if(kind==='hwy') return;
    for(let u=4;u<s.L-4;u+=kind==='res'?13:9){ for(const side of [-1,1]){ const px=s.x0+s.dx*u, pz=s.z0+s.dz*u, nx=-s.dz*side, nz=s.dx*side;
      if(kind==='res'){ const off=s.r.w/2+6, w=rand(6,8), d=rand(6,8); tryPlace(px+nx*off,pz+nz*off,w,d,rand(4,5.5),pick(house),'house'); continue; }
      if(down(px,pz)){ const w=rand(7,11), d=rand(8,12), off=s.r.w/2+2.6+d/2; tryPlace(px+nx*off,pz+nz*off,w,d,(Math.random()<.85?rand(7,14):rand(15,22))*(Math.hypot(px,pz)<60?1.1:1),pick(brick)); }
      else if(kind==='major'&&Math.random()<.55){ const w=rand(12,24), d=rand(12,20), off=s.r.w/2+11+d/2; if(tryPlace(px+nx*off,pz+nz*off,w,d,rand(5,9),pick(shop))) LOTS.push({x:px+nx*(s.r.w/2+5.5),z:pz+nz*(s.r.w/2+5.5),w:w+2,d:9,ry:Math.atan2(s.dx,s.dz),c:pick(aw2)}); } } } });
  /* extra houses scattered off the grid edges */
  for(let i=0;i<2600;i++){ const x=rand(-560,560), z=rand(-560,560); const nr=nearRoad(x,z); if(nr.d>6&&nr.d<20&&!(Math.abs(x)<160&&Math.abs(z)<160)) tryPlace(x,z,rand(6,8),rand(6,8),rand(4,5.5),pick(house),'house'); }
  instBoxes(B,windowMat()); instBoxes(HB,windowMat({wx:3.2,wy:4.6}));
  /* parking lots with painted bays + tall pylon signs for the strip-mall look */
  const lotTex=canvasTex(256,128,(g,w,h)=>{ g.fillStyle='#3A3F48'; g.fillRect(0,0,w,h); g.strokeStyle='#E5E7EB'; g.lineWidth=3; for(let x=8;x<w;x+=24){ g.beginPath(); g.moveTo(x,6); g.lineTo(x,52); g.moveTo(x,76); g.lineTo(x,122); g.stroke(); } });
  const lotM=new THREE.MeshStandardMaterial({map:lotTex,roughness:.9,polygonOffset:true,polygonOffsetFactor:-1}), LG=new THREE.PlaneGeometry(1,1); LG.rotateX(-Math.PI/2);
  const lots=new THREE.InstancedMesh(LG,lotM,LOTS.length), o2=new THREE.Object3D(); LOTS.forEach((l,i)=>{ o2.position.set(l.x,roadY(l.x,l.z)+.05,l.z); o2.rotation.set(0,l.ry,0); o2.scale.set(l.d,1,l.w); o2.updateMatrix(); lots.setMatrixAt(i,o2.matrix); }); lots.receiveShadow=true; scene.add(lots);
  const PY=[], PS=[]; LOTS.forEach((l,i)=>{ if(i%2) return; const x=l.x+Math.sin(l.ry)*l.w*.45, z=l.z+Math.cos(l.ry)*l.w*.45; PY.push({x,y:roadY(x,z),z,w:.4,h:7,d:.4,c:'#475569'}); PS.push({x,y:roadY(x,z)+7,z,w:3.4,h:2.2,d:.4,ry:l.ry+Math.PI/2,c:l.c}); });
  instBoxes(PY,mat('#ffffff',{metalness:.5,roughness:.4})); W.pylons=instBoxes(PS,mat('#ffffff',{emissive:'#ffffff',emissiveIntensity:.15,roughness:.4}));
  /* contact shadows: a soft dark footprint under every building (cheap ambient occlusion) */
  const aoTex=canvasTex(64,64,(g)=>{ const r=g.createRadialGradient(32,32,8,32,32,32); r.addColorStop(0,'rgba(0,0,0,.55)'); r.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); });
  const all=B.concat(HB), ao=new THREE.InstancedMesh(LG,new THREE.MeshBasicMaterial({map:aoTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}),all.length); all.forEach((b,i)=>{ o2.position.set(b.x,b.y+.68,b.z); o2.rotation.set(0,b.ry,0); o2.scale.set(b.d+5,1,b.w+5); o2.updateMatrix(); ao.setMatrixAt(i,o2.matrix); }); scene.add(ao);
  /* storefront name boards around the square */
  const SHOPS=['Bot Brew Coffee','Hilltopper Books','Circuit Diner','Fountain Sq Records','Byte Burger','Coin & Co Bank','Gear Up Bikes','Pixel Pizza','Volt Vintage','Bot Boutique','Main Ave Market','Copper Kettle'];
  B.filter(b=>Math.hypot(b.x,b.z)<75&&b.h<16).slice(0,18).forEach((b,i)=>{ const fx=Math.sin(b.ry), fz=Math.cos(b.ry), sg=(nearRoad(b.x+fx*b.d,b.z+fz*b.d).d<nearRoad(b.x-fx*b.d,b.z-fz*b.d).d)?1:-1; const m=sign(scene,[{t:SHOPS[i%SHOPS.length],size:54,color:'#FFFFFF'}],b.w*.62,.9,b.x+fx*sg*(b.d/2+.08),b.y+4.6,b.z+fz*sg*(b.d/2+.08),{bg:pick(aw2),r:8,w:640,h:96,glow:.35}); m.rotation.y=b.ry+(sg<0?Math.PI:0); });
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

function buildTrees(){ const T=[], cell=new Set(); for(let i=0;i<5200&&T.length<(MOBILE?1100:2400);i++){ const x=rand(-590,590), z=rand(-590,590); const hill=Math.hypot(x-HILL.x,z-HILL.z)<70, bank=(()=>{ const d=riverD(x,z); return d<55&&d>19; })(), park=false;
    const down=Math.abs(x)<150&&Math.abs(z)<150; if(down&&!park&&Math.random()<.85) continue; if(!(hill||bank||park)&&Math.random()<.45) continue;
    const nr=nearRoad(x,z); if(nr.d<3) continue; const k=Math.floor(x/3)+','+Math.floor(z/3); if(cell.has(k)) continue; if(COL.get(Math.floor(x/CC)+','+Math.floor(z/CC))?.some(b=>x>b.x0-1&&x<b.x1+1&&z>b.z0-1&&z<b.z1+1)) continue; cell.add(k);
    if(LANDMARKS.some(l=>l.game&&Math.hypot(x-l.x,z-l.z)<16)) continue; T.push({x,z,y:H(x,z),s:rand(.8,1.5)}); }
  const trunk=new THREE.InstancedMesh(CYL,mat('#6B4B34'),T.length), crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mat('#ffffff',{roughness:.9, flatShading:true}),T.length), o=new THREE.Object3D(), c=new THREE.Color();
  T.forEach((t,i)=>{ o.position.set(t.x,t.y+1.4*t.s,t.z); o.rotation.set(0,0,0); o.scale.set(.32*t.s,2.8*t.s,.32*t.s); o.updateMatrix(); trunk.setMatrixAt(i,o.matrix);
    o.position.set(t.x,t.y+3.9*t.s,t.z); o.rotation.set(0,i,0); o.scale.set(2.1*t.s,2.4*t.s,2.1*t.s); o.updateMatrix(); crown.setMatrixAt(i,o.matrix); crown.setColorAt(i,c.set(Math.random()<.28?pick(['#D97706','#EA580C','#B91C1C','#CA8A04','#F59E0B']):pick(['#3F8F3A','#4CA145','#5BAE4C','#367A35','#6BB85A']))); });
  trunk.castShadow=crown.castShadow=true; scene.add(trunk,crown);
  /* conifers on the hill and river banks */
  const C=T.filter((t,i)=>i%5===0), cone=new THREE.InstancedMesh(new THREE.ConeGeometry(1.6,5,7),mat('#2F6B3A',{flatShading:true}),C.length); C.forEach((t,i)=>{ o.position.set(t.x+3,t.y+2.6*t.s,t.z+2); o.rotation.set(0,i,0); o.scale.setScalar(t.s); o.updateMatrix(); cone.setMatrixAt(i,o.matrix); }); cone.castShadow=true; scene.add(cone);
  /* hedges and bushes along downtown sidewalks */
  const BU=[]; SEGS.forEach(sg=>{ if(sg.r.kind!=='street') return; for(let u=6;u<sg.L;u+=9){ const side=(u/9|0)%2?1:-1, x=sg.x0+sg.dx*u-sg.dz*side*(sg.r.w/2+2.6), z=sg.z0+sg.dz*u+sg.dx*side*(sg.r.w/2+2.6); if(H(x,z)<-.4||COL.get(Math.floor(x/CC)+','+Math.floor(z/CC))?.some(b=>x>b.x0-.5&&x<b.x1+.5&&z>b.z0-.5&&z<b.z1+.5)) continue; BU.push({x,z,y:roadY(x,z),s:rand(.5,.9)}); } });
  const bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),mat('#ffffff',{flatShading:true,roughness:.9}),BU.length); BU.forEach((b,i)=>{ o.position.set(b.x,b.y+b.s*.6,b.z); o.rotation.set(0,i,0); o.scale.set(b.s*1.3,b.s,b.s*1.3); o.updateMatrix(); bush.setMatrixAt(i,o.matrix); bush.setColorAt(i,c.set(pick(['#3F7D3A','#4A8F3F','#5C9E48','#8BAA3C']))); }); bush.castShadow=true; scene.add(bush); }

function buildExtras(){ const zeb=mat('#F8FAFC',{roughness:.8, polygonOffset:true, polygonOffsetFactor:-4});
  const XI=REAL.grid.xs, GA=REAL.grid.ga; XI.forEach(([x,z])=>{ if(nearRoad(x,z).d>-2) return; const cw=new THREE.Group(); cw.position.set(x,0,z); cw.rotation.y=GA; scene.add(cw); for(const [ox,oz,v] of [[0,-7,0],[0,7,0],[-7,0,1],[7,0,1]]) for(let i=-1;i<=1;i++){ const m=new THREE.Mesh(BOX,zeb); m.scale.set(v?3.4:.7,.04,v?.7:3.4); m.position.set(ox+(v?0:i*1.4),roadY(x,z)+.14,oz+(v?i*1.4:0)); cw.add(m); } });
  /* green street-name signs at the start of every named road */
  const pole=mat('#475569'); ROADS.filter(r=>r.kind!=='res'&&r.kind!=='square').forEach(r=>{ [0,r.pts.length-2].forEach(i=>{ const [x0,z0]=r.pts[i],[x1,z1]=r.pts[i+1], L=Math.hypot(x1-x0,z1-z0); const t=i?1-8/L:8/L, x=x0+(x1-x0)*t+(z1-z0)/L*(r.w/2+1.5), z=z0+(z1-z0)*t-(x1-x0)/L*(r.w/2+1.5); if(H(x,z)<-.5) return;
    const g=new THREE.Group(); g.position.set(x,roadY(x,z),z); g.rotation.y=Math.atan2(x1-x0,z1-z0)+Math.PI/2; scene.add(g); cy(g,.08,4.2,0,0,0,pole); sign(g,[{t:r.name,size:58,color:'#FFFFFF'}],Math.min(5.2,1.2+r.name.length*.26),.62,0,4.2,0,{bg:r.kind==='hwy'?'#1D4ED8':'#15803D',r:8,w:640,h:96}); }); });
  /* clouds */
  const cm=mat('#FFFFFF',{roughness:1,emissive:'#F1F5F9',emissiveIntensity:.4}); for(let i=0;i<16;i++){ const c=new THREE.Group(); for(let k=0;k<5;k++){ const b=new THREE.Mesh(SPH,cm); b.scale.set(rand(10,18),rand(4,7),rand(8,12)); b.position.set(k*10-20,rand(-2,2),rand(-5,5)); c.add(b); } c.position.set(rand(-600,600),rand(120,170),rand(-600,600)); scene.add(c); const v=rand(1,2.5); W.anim.push(()=>{ c.position.x+=v*.016; if(c.position.x>700) c.position.x=-700; }); }
}
function buildLights(){ const L=[]; SEGS.forEach(s=>{ if(s.r.kind==='res'||s.r.kind==='hwy') return; for(let u=10;u<s.L;u+=28){ const side=(u/28|0)%2?1:-1, x=s.x0+s.dx*u-s.dz*side*(s.r.w/2+1.6), z=s.z0+s.dz*u+s.dx*side*(s.r.w/2+1.6); if(H(x,z)<-.5) continue; L.push({x,z,y:roadY(x,z)}); } });
  const pole=new THREE.InstancedMesh(CYL,mat('#3F4A59',{metalness:.5,roughness:.4}),L.length), head=new THREE.InstancedMesh(BOX,mat('#FEF3C7',{emissive:'#FDE68A',emissiveIntensity:.6}),L.length), o=new THREE.Object3D();
  W.lamps=L; L.forEach((p,i)=>{ o.position.set(p.x,p.y+3,p.z); o.scale.set(.12,6,.12); o.updateMatrix(); pole.setMatrixAt(i,o.matrix); o.position.set(p.x,p.y+6,p.z); o.scale.set(.6,.2,.6); o.updateMatrix(); head.setMatrixAt(i,o.matrix); }); scene.add(pole,head); W.lampHead=head; }

/* ---------- Fountain Square Park: the hero of downtown ---------- */
function buildSquare(){ const GA=REAL.grid.ga, y0=H(0,0)-.05, g=new THREE.Group(); g.position.set(0,y0,0); g.rotation.y=GA; scene.add(g); W.fountain=g; W.squareLamps=[];
  const hx=6.3, hz=12.8, stone=mat('#DDD6C8',{roughness:.55}), iron=mat('#24352B',{metalness:.55,roughness:.4}), gold=mat('#D4A017',{metalness:.7,roughness:.25,emissive:'#7A5A00',emissiveIntensity:.2});
  const brickTex=canvasTex(128,128,(c,w,h)=>{ c.fillStyle='#B0604A'; c.fillRect(0,0,w,h); for(let i=0;i<220;i++){ c.fillStyle=`rgba(${120+Math.random()*60|0},${50+Math.random()*30|0},${40+Math.random()*20|0},.35)`; c.fillRect(Math.random()*w,Math.random()*h,14,7); }
    c.strokeStyle='#E8D6C4'; c.lineWidth=2; for(let y=0;y<h;y+=16){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); for(let x=(y/16%2)*16;x<w;x+=32){ c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+16); c.stroke(); } } },true); brickTex.repeat.set(5,2);
  const brickM=new THREE.MeshStandardMaterial({map:brickTex,roughness:.9});
  const box=(w,h,d,x,y,z,m,ry=0)=>{ const e=new THREE.Mesh(BOX,m); e.scale.set(w,h,d); e.position.set(x,y+h/2,z); e.rotation.y=ry; e.castShadow=true; e.receiveShadow=true; g.add(e); return e; };
  /* lawn, brick walks (diagonals, perimeter, plaza) */
  box(hx*2,.32,hz*2,0,0,0,mat('#5A9A42',{roughness:1}));
  const da=Math.atan2(hz,hx); [da,-da].forEach(r=>box(2*Math.hypot(hx,hz)-1,.36,1.6,0,0,0,brickM,r));
  [[0,hz-.7,hx*2,1.4],[0,-hz+.7,hx*2,1.4],[hx-.7,0,1.4,hz*2],[-hx+.7,0,1.4,hz*2]].forEach(([x,z,w,d])=>box(w,.36,d,x,0,z,brickM));
  const plaza=new THREE.Mesh(new THREE.CylinderGeometry(5.3,5.3,.38,48),brickM); plaza.position.y=.19; plaza.receiveShadow=true; g.add(plaza);
  /* the fountain: octagonal basin, two cast-iron tiers with falling water, golden statue on top */
  const basin=new THREE.Mesh(new THREE.CylinderGeometry(3.7,3.95,.95,8),stone); basin.position.y=.82; basin.castShadow=true; g.add(basin);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(3.72,.14,6,8),stone); rim.rotation.x=Math.PI/2; rim.rotation.z=Math.PI/8; rim.position.y=1.3; g.add(rim);
  const wm=new THREE.MeshStandardMaterial({color:'#3E9AD6',roughness:.04,metalness:.35,envMap:W.env||null,transparent:true,opacity:.92}); const pool=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,.08,8),wm); pool.position.y=1.33; g.add(pool);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8, f=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),gold); f.position.set(Math.cos(a)*3.72,1.5,Math.sin(a)*3.72); g.add(f); }
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.45,.75,2.6,12),iron); ped.position.y=2.4; g.add(ped);
  const sheet=new THREE.MeshBasicMaterial({color:'#CFE8FF',transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false});
  [[2.1,3.75,.5,2.45],[1.25,5.35,.38,1.5]].forEach(([r,y,h,fall])=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.35,h,16),iron); b.position.y=y; b.castShadow=true; g.add(b);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(r,.07,6,24),gold); lip.rotation.x=Math.PI/2; lip.position.y=y+h/2; g.add(lip);
    const w=new THREE.Mesh(new THREE.CylinderGeometry(r*1.02,r*1.18,fall,24,1,true),sheet); w.position.y=y+h/2-fall/2; g.add(w); W.anim.push(t=>{ w.material.opacity=.22+Math.sin(t*6)*.05; }); });
  const col2=new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,1.4,10),iron); col2.position.y=4.6; g.add(col2);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,.5,10),gold); plinth.position.y=5.8; g.add(plinth);
  W.statueSpot={g, y:6.05};
  const sp=[], sm=new THREE.MeshBasicMaterial({color:'#E0F2FE',transparent:true,opacity:.75}), sg=new THREE.SphereGeometry(.09,6,4); for(let i=0;i<90;i++){ const m=new THREE.Mesh(sg,sm); g.add(m); sp.push({m,t:Math.random()*1.2,a:Math.random()*7,tier:i%3}); }
  W.anim.push(t=>{ sp.forEach(p=>{ const k=((t+p.t)%1.2)/1.2; if(p.tier===0){ const r=1.3+k*1.9; p.m.position.set(Math.cos(p.a)*r,6.4+k*1.2-k*k*6.4,Math.sin(p.a)*r); } else { const r=(p.tier===1?2.15:1.3)+k*.35; p.m.position.set(Math.cos(p.a)*r,(p.tier===1?3.9:5.5)-k*k*(p.tier===1?2.6:1.6),Math.sin(p.a)*r); } }); });
  addCol(-4,-4,4,4);
  /* flower beds ringing the plaza */
  const FL=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.28,0),mat('#ffffff',{flatShading:true}),160), o=new THREE.Object3D(), c=new THREE.Color(); let n=0;
  for(let i=0;i<96;i++){ const a=i/96*Math.PI*2, r=4.45+(i%2)*.35; o.position.set(Math.cos(a)*r,.45,Math.sin(a)*r); o.scale.setScalar(rand(.8,1.3)); o.updateMatrix(); FL.setMatrixAt(n,o.matrix); FL.setColorAt(n++,c.set(pick(['#E11D48','#F59E0B','#A855F7','#F472B6','#FDE047','#FFFFFF']))); }
  [[0,9.6],[0,-9.6],[0,7.4],[0,-7.4]].forEach(([x,z])=>{ for(let i=0;i<16;i++){ o.position.set(x+(x?rand(-.5,.5):rand(-1.6,1.6)),.45,z+(z?rand(-.5,.5):rand(-1.6,1.6))); o.scale.setScalar(rand(.8,1.2)); o.updateMatrix(); FL.setMatrixAt(n,o.matrix); FL.setColorAt(n++,c.set(pick(['#DC2626','#FBBF24','#7C3AED','#EC4899']))); } });
  FL.count=n; g.add(FL);
  [[0,9.6],[0,-9.6],[0,7.4],[0,-7.4]].forEach(([x,z])=>box(3.8,.22,1.4,x,.32,z,mat('#5B3A29')));
  /* four big shade trees + smaller ones along the walks */
  const leaf=['#3E8E3A','#4E9E40','#3A7F36','#D97706'];
  [[-4.3,-11,.6],[4.3,-11,.56],[4.3,11,.62],[-4.3,11,.58],[-4.8,-4.8,.38],[4.8,4.8,.38],[4.8,-4.8,.38],[-4.8,4.8,.38]].forEach(([x,z,s],i)=>{ box(.5*s,4.2*s,.5*s,x,.3,z,mat('#5B4130'));
    const lm=mat(leaf[i%4],{flatShading:true,roughness:.9}); [[0,5.2,0,2.4],[1.1,4.6,.4,1.7],[-1,4.7,-.5,1.8],[.2,6.1,-.2,1.6]].forEach(([dx,dy,dz,r])=>{ const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),lm); cr.position.set(x+dx*s,dy*s,z+dz*s); cr.castShadow=true; g.add(cr); }); });
  /* benches facing the fountain */
  const wood=mat('#8B5A2B',{roughness:.8});
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8, r=5.8, b=new THREE.Group(); b.position.set(Math.cos(a)*r,.36,Math.sin(a)*r); b.rotation.y=-a-Math.PI/2; g.add(b);
    bx(b,2.2,.14,.6,0,.55,0,wood); bx(b,2.2,.5,.1,0,.75,-.28,wood); [-.9,.9].forEach(x=>bx(b,.1,.6,.6,x,0,0,iron)); }
  /* Victorian lampposts with globe lights + green banners */
  const globe=mat('#FFF7E0',{emissive:'#FFD58A',emissiveIntensity:.5}); W.squareGlobes=globe;
  [[-hx+.3,-hz+2.4],[-hx+2.4,-hz+.3],[hx-.3,-hz+2.4],[hx-2.4,-hz+.3],[hx-.3,hz-2.4],[hx-2.4,hz-.3],[-hx+.3,hz-2.4],[-hx+2.4,hz-.3],[0,hz-.3],[0,-hz+.3],[hx-.3,0],[-hx+.3,0],[hx-.3,hz/2],[-hx+.3,-hz/2]].forEach(([x,z],i)=>{
    const l=new THREE.Group(); l.position.set(x,.36,z); g.add(l); cy(l,.22,.6,0,0,0,iron); cy(l,.09,3.6,0,.6,0,iron); bx(l,1.2,.08,.08,0,3.9,0,iron);
    [-.55,.55].forEach(dx=>{ const gl=new THREE.Mesh(new THREE.SphereGeometry(.26,14,10),globe); gl.position.set(dx,4.15,0); l.add(gl); });
    const wp=new THREE.Vector3(x,.36+4.2,z).applyMatrix4(new THREE.Matrix4().makeRotationY(GA)); W.squareLamps.push({x:wp.x,y:y0+wp.y-6,z:wp.z});
    if(i>=8){ const bn=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.6,1,6),new THREE.MeshStandardMaterial({map:textTex([{t:'FOUNTAIN',size:34,color:'#FFFFFF'},{t:'SQUARE',size:34,color:'#FDE68A'}],{bg:i%2?'#14532D':'#1E3A8A',w:128,h:256,r:6}),side:THREE.DoubleSide})); bn.position.set(.45,2.9,0); l.add(bn);
      const P=bn.geometry.attributes.position, base=P.array.slice(); W.anim.push(t=>{ for(let v=0;v<P.count;v++) P.setZ(v,Math.sin(t*3+base[v*3+1]*2+i)*.06); P.needsUpdate=true; }); } });
  /* low iron fence with openings where the walks meet the corners */
  const posts=[]; for(let s=-1;s<=1;s+=2){ for(let t=-hx+2.2;t<=hx-2.2;t+=1.1) posts.push([t,s*(hz-.05)]); for(let t=-hz+2.2;t<=hz-2.2;t+=1.1) posts.push([s*(hx-.05),t]); }
  const PI=new THREE.InstancedMesh(BOX,iron,posts.length); posts.forEach(([x,z],i)=>{ o.position.set(x,.75,z); o.scale.set(.08,.8,.08); o.rotation.set(0,0,0); o.updateMatrix(); PI.setMatrixAt(i,o.matrix); }); g.add(PI);
  [-1,1].forEach(s=>{ [1.05,.6].forEach(y=>{ box(hx*2-4.4,.06,.06,0,y,s*(hz-.05),iron); box(.06,.06,hz*2-4.4,s*(hx-.05),y,0,iron); }); });
  /* the State St clock on the corner */
  const clk=new THREE.Group(); clk.position.set(hx+1.7,.1,hz+1.7); g.add(clk); cy(clk,.35,.5,0,0,0,iron); cy(clk,.13,4.2,0,.5,0,iron);
  const face=new THREE.MeshStandardMaterial({map:canvasTex(128,128,(c,w,h)=>{ c.fillStyle='#FFFDF5'; c.beginPath(); c.arc(64,64,62,0,7); c.fill(); c.strokeStyle='#111'; c.lineWidth=5; c.stroke(); for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; c.lineWidth=i%3?2:5; c.beginPath(); c.moveTo(64+Math.cos(a)*48,64+Math.sin(a)*48); c.lineTo(64+Math.cos(a)*56,64+Math.sin(a)*56); c.stroke(); } c.lineWidth=5; c.beginPath(); c.moveTo(64,64); c.lineTo(64,28); c.stroke(); c.lineWidth=3; c.beginPath(); c.moveTo(64,64); c.lineTo(94,70); c.stroke(); }),emissive:'#FFF3C4',emissiveIntensity:.15});
  const head=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.3,1.3),[face,face,iron,iron,face,face]); head.position.y=5.3; clk.add(head); const cap=new THREE.Mesh(new THREE.ConeGeometry(.9,.8,4),iron); cap.rotation.y=Math.PI/4; cap.position.y=6.35; clk.add(cap);
  /* café tables with striped umbrellas outside the shops + parked cars around the square */
  const umb=['#DC2626','#15803D','#1D4ED8','#F59E0B'];
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([sx,sz],k)=>{ for(let i=-1;i<=1;i+=2){ const x=sx?sx*(REAL.grid.hx+5):i*5, z=sz?sz*(REAL.grid.hz+5):i*6; const tb=new THREE.Group(); tb.position.set(x,.15,z); g.add(tb);
    cy(tb,.6,.08,0,.75,0,mat('#F8FAFC')); cy(tb,.06,.75,0,0,0,iron); cy(tb,.04,2.2,0,.8,0,iron); const u=new THREE.Mesh(new THREE.ConeGeometry(1.3,.55,8),mat(umb[k],{flatShading:true})); u.position.y=3.1; tb.add(u);
    [[.9,0],[-.9,0]].forEach(([dx,dz])=>bx(tb,.4,.5,.4,dx,0,dz,mat('#334155'))); } });
  W.squareCars=[]; [[REAL.grid.hx+1.7,-6,0],[REAL.grid.hx+1.7,7,0],[-REAL.grid.hx-1.7,4,Math.PI],[-REAL.grid.hx-1.7,-9,Math.PI],[-6,REAL.grid.hz+1.7,Math.PI/2],[5,-REAL.grid.hz-1.7,-Math.PI/2]].forEach(([x,z,ry],i)=>{ const cc=makeCar({id:'park'+i,style:pick(['sedan','hatch','ev','coupe']),color:pick(['#DC2626','#F8FAFC','#1E3A8A','#F59E0B','#334155','#0EA5E9','#16A34A'])}); cc.position.set(x,.1,z); cc.rotation.y=ry; g.add(cc); W.squareCars.push(cc); });
  /* food truck parked at the curb */
  const t=new THREE.Group(); t.position.set(-4,.1,-REAL.grid.hz-1.7); g.add(t); bx(t,5.4,2.6,2.4,0,.5,0,mat('#F97316')); bx(t,1.6,1.8,2.3,3.3,.5,0,mat('#FDBA74')); bx(t,2.6,1.1,.08,-.6,1.5,1.21,mat('#1F2937'));
  [-1.6,1.8].forEach(x=>[-1.2,1.2].forEach(z=>{ const w=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.3,12),mat('#111827')); w.rotation.x=Math.PI/2; w.position.set(x,.45,z); t.add(w); })); sign(t,[{t:'🍔 BOT EATS',size:70,color:'#FFFFFF'}],3.6,.8,0,3.6,1.25,{bg:'#B91C1C',r:10});
  g.updateMatrixWorld(true); const tw=new THREE.Vector3(); t.getWorldPosition(tw); W.truck={x:tw.x,z:tw.z};
}

function buildCivic(){ const GA=REAL.grid.ga, brick=mat('#A0523D'), cream=mat('#EDE5D4'), white=mat('#F8FAFC'), slate=mat('#475569'), glass=GLASS;
  const face=(l,ry)=>{ const g=grp(l,ry); return g; }, toRoad=(l)=>{ const nr=nearRoad(l.x,l.z); return nr.s?Math.atan2(nr.px-l.x,nr.pz-l.z):0; };
  /* Capitol Arts Center: 1920s theater with a tall vertical marquee */
  { const l=L$('capitol'), g=face(l,toRoad(l)); bx(g,9,11,12,0,0,-1,mat('#C9A27E')); bx(g,9.4,.8,12.4,0,11,-1,mat('#8B5E3C')); bx(g,7,.5,2.6,0,4.2,5.6,mat('#1F2937'));
    const mq=sign(g,[{t:'CAPITOL',size:80,color:'#FDE68A'}],1.6,6,0,8,5.2,{bg:'#7F1D1D',r:8,w:160,h:640,glow:.9}); mq.rotation.y=Math.PI/2; sign(g,[{t:'NOW SHOWING · BOT CITY NIGHTS',size:44,color:'#111827'}],6.6,.9,0,4.95,6.95,{bg:'#FEF3C7',r:6,glow:.4}); colBox(l,10,10); }
  /* Warren County Courthouse: columns + dome */
  { const l=L$('courthouse'), g=face(l,toRoad(l)); bx(g,16,9,12,0,0,0,cream); bx(g,16.6,1,12.6,0,9,0,white); for(let i=-2;i<=2;i++) cy(g,.6,8,i*3,0,6.6,white); bx(g,15,.6,2.6,0,0,6.8,mat('#D1D5DB'));
    cy(g,3,3,0,10,0,white); const d=new THREE.Mesh(new THREE.SphereGeometry(3.2,24,12,0,Math.PI*2,0,Math.PI/2),mat('#6B8F71',{metalness:.3,roughness:.5})); d.position.y=13; g.add(d); cy(g,.12,2,0,16,0,mat('#D4A017',{metalness:.7}));
    sign(g,[{t:'WARREN COUNTY COURTHOUSE',size:48,color:'#1F2937'}],10,.9,0,9.5,6.35,{bg:'#F8FAFC',r:4}); colBox(l,16,12); }
  /* Justice Center: modern stone + glass */
  { const l=L$('justice'), g=face(l,toRoad(l)); bx(g,18,13,14,0,0,0,mat('#D6D3D1')); bx(g,7,13,.4,-4,0,7.1,glass); bx(g,18.4,.8,14.4,0,13,0,mat('#A8A29E')); sign(g,[{t:'JUSTICE CENTER',size:56,color:'#1F2937'}],7,1,5,4,7.15,{bg:'#E7E5E4',r:4}); colBox(l,18,14); }
  /* L.T. Smith Stadium: WKU football */
  { const l=L$('stadium'), g=grp(l,GA); const f=new THREE.Mesh(BOX,mat('#3F8F3A')); f.scale.set(22,.2,38); f.position.y=.1; g.add(f); for(let z=-15;z<=15;z+=5){ const ln=new THREE.Mesh(BOX,white); ln.scale.set(22,.05,.25); ln.position.set(0,.23,z); g.add(ln); }
    [-1,1].forEach(s=>{ for(let k=0;k<5;k++) bx(g,4,1.4+k*1.5,40,s*(13+k*1.8),0,0,mat(k%2?'#B91C1C':'#E5E7EB')); bx(g,3,7,10,s*21.5,7,0,mat('#1F2937')); });
    [[-12,-21],[12,-21],[-12,21],[12,21]].forEach(([x,z])=>{ cy(g,.35,22,x,0,z,slate); bx(g,4,2.4,1,x,21,z,mat('#F8FAFC',{emissive:'#FFFFFF',emissiveIntensity:.5})); });
    sign(g,[{t:'L.T. SMITH STADIUM',size:60,color:'#FFFFFF'}],10,1.4,0,10,-20,{bg:'#B91C1C',r:6}); addCol(l.x-22,l.z-22,l.x+22,l.z+22); }
  /* Riverview at Hobson Grove: Italianate mansion in the park */
  { const l=L$('hobson'), g=grp(l,toRoad(l)); bx(g,12,8,10,0,0,0,mat('#9C4A35')); bx(g,12.8,.6,10.8,0,8,0,white); const rf=new THREE.Mesh(new THREE.ConeGeometry(8.6,3,4),slate); rf.rotation.y=Math.PI/4; rf.scale.set(1,1,.85); rf.position.y=10.1; g.add(rf);
    bx(g,3.6,14,3.6,4.4,0,3.2,mat('#9C4A35')); const tr=new THREE.Mesh(new THREE.ConeGeometry(2.8,2.6,4),slate); tr.rotation.y=Math.PI/4; tr.position.set(4.4,15.3,3.2); g.add(tr);
    bx(g,6,.4,2.4,-2,3,6.2,white); [-4.6,.6].forEach(x=>cy(g,.18,3,x,0,7,white)); sign(g,[{t:'Riverview at Hobson Grove',size:48,color:'#FFFFFF'}],7,1,0,1.6,9.5,{bg:'#14532D',r:6}); colBox(l,13,11); }
}
/* ---------- landmarks, hand built ---------- */
function L$(id){ return LANDMARKS.find(l=>l.id===id); }
function grp(l,ry=0){ const g=new THREE.Group(); g.position.set(l.x,H(l.x,l.z)-.2,l.z); g.rotation.y=ry; scene.add(g); l.g=g; return g; }
function colBox(l,w,d){ addCol(l.x-w/2,l.z-d/2,l.x+w/2,l.z+d/2); }
function buildLandmarks(){ const brick=mat('#A0523D'), cream=mat('#EFE6D6'), slate=mat('#475569'), glass=GLASS, white=mat('#F8FAFC'), gold=mat('#D4A017',{metalness:.6,roughness:.3}), green=mat('#2F6B3A');
  buildSquare(); buildCivic();
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
