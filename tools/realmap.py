# Converts real Bowling Green coordinates (Mapbox geocoding + driving routes) into game space.
# Fountain Square is the origin; distance from it is gently compressed so the far landmarks fit.
import math, json
LON0, LAT0 = -86.44133, 36.99317
R, L = 600.0, 1200.0
def P(lon, lat):
    x = (lon-LON0)*math.cos(math.radians(LAT0))*111320; z = -(lat-LAT0)*110540
    r = math.hypot(x, z)
    if r < 1e-6: return [0.0, 0.0]
    k = R*(1-math.exp(-r/L))/r
    return [round(x*k, 1), round(z*k, 1)]
def M(x, z): # meters (east, south) from the square → game
    r = math.hypot(x, z); k = R*(1-math.exp(-r/L))/r if r > 1e-6 else 0
    return [round(x*k, 1), round(z*k, 1)]
def line(pts): return [P(a, b) for a, b in pts]
def dedupe(p):
    out = []
    for q in p:
        if not out or math.hypot(q[0]-out[-1][0], q[1]-out[-1][1]) > 1.5: out.append(q)
    return out
ROUTES = {
 'Scottsville Rd': ('major', [(-86.441663,36.987033),(-86.437789,36.978954),(-86.426001,36.952445),(-86.423287,36.945929),(-86.418159,36.934741),(-86.4105,36.922)]),
 'Broadway / 12th Ave': ('street', [(-86.445936,36.990977),(-86.444862,36.989972),(-86.441663,36.987033)]),
 'University Blvd': ('major', [(-86.444671,36.996928),(-86.454851,36.990179),(-86.461424,36.983917),(-86.461941,36.982382),(-86.460601,36.979563),(-86.459627,36.978724),(-86.456789,36.97749)]),
 'Nashville Rd': ('major', [(-86.456789,36.97749),(-86.458348,36.975005),(-86.461483,36.971923),(-86.467529,36.962637),(-86.474325,36.953739),(-86.482,36.942),(-86.492,36.928)]),
 'Kentucky St': ('major', [(-86.443633,36.995921),(-86.439243,36.998888),(-86.437464,36.999584),(-86.432632,37.00261),(-86.433571,37.005081),(-86.433077,37.008664),(-86.432592,37.009475),(-86.429545,37.011334),(-86.422405,37.01393)]),
 'Beech Bend Rd': ('major', [(-86.422405,37.01393),(-86.413612,37.021118),(-86.409916,37.019951),(-86.405538,37.020498),(-86.404213,37.020281),(-86.403488,37.020926),(-86.40254,37.023487),(-86.401067,37.024178)]),
 'Louisville Rd': ('major', [(-86.43332,37.002281),(-86.421583,37.007378),(-86.410666,37.008792),(-86.404853,37.008846),(-86.400096,37.009702),(-86.394149,37.006515),(-86.392202,37.004109),(-86.384232,37.000747),(-86.380265,36.999162)]),
 'Corvette Dr': ('major', [(-86.380265,36.999162),(-86.377388,37.000675),(-86.376719,37.002696),(-86.371463,37.003829),(-86.36787,37.006129),(-86.365799,37.006639)]),
 'Campbell Ln': ('major', [(-86.475443,36.952045),(-86.466264,36.947711),(-86.461301,36.944481),(-86.459567,36.94382),(-86.449295,36.942315),(-86.446386,36.942355),(-86.438297,36.941707),(-86.434409,36.942454),(-86.426852,36.944786)]),
 'I-65': ('hwy', [(-86.445,36.905),(-86.418159,36.934741),(-86.410077,36.94796),(-86.399162,36.962194),(-86.383082,36.991951),(-86.371463,37.003829),(-86.355,37.02),(-86.335,37.04)]),
 'College Heights Blvd': ('street', [(-86.441577,36.993869),(-86.450742,36.987787),(-86.451444,36.988111),(-86.452688,36.988283),(-86.453449,36.987329),(-86.45273,36.986666),(-86.451344,36.987182),(-86.450681,36.986119),(-86.449688,36.986778),(-86.451982,36.988977),(-86.453562,36.988733),(-86.4556,36.986764),(-86.457359,36.985276)]),
}
# real street network + building footprints traced from Mapbox renders of the core (tools/extract.py)
CORE=json.load(open('/home/claude/botcity-bg/tools/bg_core.json'))
lons=[p[0] for r in CORE['roads'] for p in r['pts']]; lats=[p[1] for r in CORE['roads'] for p in r['pts']]
BB=(min(lons)+.0006,min(lats)+.0005,max(lons)-.0006,max(lats)-.0005)
inside=lambda lon,lat: BB[0]<lon<BB[2] and BB[1]<lat<BB[3]
def dens(pts,step=.00015):
    out=[]
    for (a,b),(c,d) in zip(pts,pts[1:]):
        n=max(1,int(math.hypot(c-a,d-b)/step))
        out+= [(a+(c-a)*i/n,b+(d-b)*i/n) for i in range(n)]
    return out+[pts[-1]]
roads=[]
for n,(k,p) in ROUTES.items():
    run=[]
    for q in dens(p)+[None]:
        if q is not None and not inside(*q): run.append(q); continue
        if len(run)>1: roads.append({'name':n,'kind':k,'pts':dedupe(line(run))})
        run=[]
for r in CORE['roads']:
    w=r['w']; k='major' if w>=8 else 'street' if w>=5 else 'res' if w>=3 else None
    if not k: continue
    pts=dedupe([P(*q) for q in r['pts']])
    if len(pts)>1 and sum(math.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(pts,pts[1:]))>3: roads.append({'name':'','kind':k,'pts':pts})
import numpy as np, cv2
bld=[]
for b in CORE['bld']:
    g=[P(*q) for q in b['poly']]
    if len(g)<3: continue
    (cx,cz),(w,d),a=cv2.minAreaRect(np.array(g,np.float32)); area=b['a']*0.91  # m^2 (0.954 m/px)
    if w*d<1.2: continue
    if (b['fill']>.78 and len(g)<=8) or b['a']<140: bld.append([round(cx,1),round(cz,1),round(w,1),round(d,1),round(-math.radians(a),3),round(area)])
    else: bld.append([round(cx,1),round(cz,1),0,0,0,round(area),[c for q in g for c in q]])
core=[P(BB[0],BB[3]),P(BB[2],BB[1])]
# downtown grid from real measurements (Mapbox): College St snapped straight at this bearing,
# streets every ~146 m across (Adams, Kentucky, Center, College, State, Chestnut), avenues at measured positions.
k_=math.cos(math.radians(LAT0))*111320; kl_=110540
C=(-86.441405,36.993986)
sv=((-86.45024+86.437231)*k_,(36.988112-36.996739)*kl_); sl=math.hypot(*sv); su=(sv[0]/sl,sv[1]/sl); an=(-su[1],su[0])
def LL(cross,along):
    e=an[0]*cross+su[0]*along; n=an[1]*cross+su[1]*along
    return (C[0]+e/k_, C[1]+n/kl_)
STREETS=[(-436,'Adams St'),(-291,'Kentucky St'),(-146,'Center St'),(0,'College St'),(146,'State St'),(291,'Chestnut St'),(436,'High St')]
AVES=[(-470,'6th Ave'),(-350,'7th Ave'),(-225,'8th Ave'),(5,'Main Ave'),(100,'Park Row'),(205,'10th Ave'),(365,'11th Ave'),(522,'12th Ave'),(640,'13th Ave'),(760,'14th Ave')]
cherry_ll=(-86.45118,36.98737)
def far_from_hill(ll): return math.hypot((ll[0]-cherry_ll[0])*k_,(ll[1]-cherry_ll[1])*kl_)>330
grid=[]
def addline(name,pts):
    run=[]
    for ll in pts:
        if far_from_hill(ll): run.append(P(*ll))
        else:
            if len(run)>1: grid.append({'name':name,'kind':'street','pts':dedupe(run)})
            run=[]
    if len(run)>1: grid.append({'name':name,'kind':'street','pts':dedupe(run)})
for c,n in STREETS:
    if c==0: continue  # College St comes from the routes (straight, already snapped)
    lo,hi=(-560,900) if abs(c)<300 else (-520,820)
    addline(n,[LL(c,a) for a in range(lo,hi+1,40)])
addline('College St',[LL(0,a) for a in range(-560,560,40)])
for a,n in AVES:
    if a in (5,100): lo,hi=-600,480
    else: lo,hi=-520,460
    addline(n,[LL(c,a) for c in range(lo,hi+1,40)])
ring=[LL(0,5),LL(146,5),LL(146,100),LL(0,100),LL(0,5)]
grid.append({'name':'Fountain Square','kind':'square','pts':[P(*q) for q in ring]})
au=None; av=None
LM = {
 'square': (-86.44133,36.99317), 'botlife': (-86.44133,36.99317), 'capitol': (-86.441,36.99367), 'courthouse': (-86.44283,36.99254), 'justice': (-86.44399,36.99409), 'stadium': (-86.45947,36.98471), 'hobson': (-86.45975,37.01193), 'ballpark': (-86.44140,36.99658), 'skypac': (-86.43852,36.99629),
 'botu': (-86.45118,36.98737), 'arena': (-86.45763,36.98625), 'med': (-86.43010,36.99599), 'botbank': (-86.43779,36.97895),
 'botpark': (-86.43590,36.99410), 'fyp': (-86.43420,36.98880), 'botmotors': (-86.43080,36.96350), 'tycoon': (-86.42743,36.94844),
 'botmarket': (-86.44630,36.94120), 'cave': (-86.47397,36.95332), 'beech': (-86.40125,37.02545), 'museum': (-86.37500,37.00417),
 'botfactory': (-86.36561,37.00935), 'gas1': (-86.44480,36.98480), 'gas2': (-86.42920,36.95800), 'bridge': (-86.42960,37.01130), 'tower': (-86.45020,36.98800),
}
lm = {k: P(*v) for k, v in LM.items()}
river = dedupe(line([(-86.52,36.990),(-86.49,36.997),(-86.465,37.004),(-86.448,37.0075),(-86.436,37.0085),(-86.4295,37.0118),(-86.422,37.0175),(-86.414,37.0265),(-86.405,37.0315),(-86.395,37.0300),(-86.389,37.0230),(-86.383,37.0175),(-86.37,37.019),(-86.34,37.03)]))
hill = P(-86.4528, 36.9868)
A=P(*LL(0,52)); B=P(*LL(146,52)); Cc=P(*LL(73,5)); D=P(*LL(73,100)); ctr=P(*LL(73,52))
GRID={'ga': math.atan2(B[0]-A[0], B[1]-A[1]), 'hx': round(math.hypot(D[0]-Cc[0],D[1]-Cc[1])/2,2), 'hz': round(math.hypot(B[0]-A[0],B[1]-A[1])/2,2), 'ctr': ctr,
 'xs': [P(*LL(c,a)) for c,_ in STREETS for a,_ in AVES]}
out = 'const REAL='+json.dumps({'roads': roads, 'bld': bld, 'core': [min(core[0][0],core[1][0]),min(core[0][1],core[1][1]),max(core[0][0],core[1][0]),max(core[0][1],core[1][1])], 'lm': lm, 'river': river, 'hill': hill, 'grid': GRID})+';\n'
open('/home/claude/botcity-bg/src/realmap.js', 'w').write(out)
print(len(roads), len(grid), lm['botu'], lm['tycoon'], lm['botfactory'], lm['ballpark'], hill, len(out)//1024, 'KB')
