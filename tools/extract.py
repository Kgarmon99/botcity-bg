# Builds a z16 mosaic from Mapbox light-style renders, then extracts building footprints and the street network.
import glob, math, json, numpy as np, cv2
from skimage.morphology import skeletonize
Z=16; WS=512*2**Z
def g(lon,lat): s=math.sin(math.radians(lat)); return ((lon+180)/360*WS, (0.5-math.log((1+s)/(1-s))/(4*math.pi))*WS)
def ll(px,py): lon=px/WS*360-180; n=math.pi-2*math.pi*py/WS; return lon, math.degrees(math.atan(math.sinh(n)))
T=[]
for f in glob.glob('tools/tiles/*.png'):
    lon,lat=map(float,f.split('/')[-1][:-4].split('_')); cx,cy=g(lon,lat); T.append((cv2.imread(f)[:,:,::-1],cx-512,cy-512))
X0=int(min(t[1] for t in T)); Y0=int(min(t[2] for t in T)); X1=int(max(t[1] for t in T))+1024; Y1=int(max(t[2] for t in T))+1024
M=np.zeros((Y1-Y0,X1-X0,3),np.uint8)
for im,x,y in T:
    ox,oy=int(round(x))-X0,int(round(y))-Y0; m=30
    M[oy+m:oy+1024-m,ox+m:ox+1024-m]=im[m:1024-m,m:1024-m]
cv2.imwrite('/tmp/claude-0/-home-claude/a255b9b4-47f0-569a-8be7-518fe1fd78e8/scratchpad/mosaic.png',M[:,:,::-1])
r,gg,b=[M[:,:,i].astype(int) for i in range(3)]
valid=(r+gg+b)>0
bld=((r>=229)&(r<=234)&(abs(r-gg)<=1)&(b-r<=1)&(r-b<=1)&valid).astype(np.uint8)
bld=cv2.dilate(bld,np.ones((2,2),np.uint8))
bld=cv2.morphologyEx(bld,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
road=((r>=252)&(gg>=252)&(b>=252)).astype(np.uint8)
road=cv2.morphologyEx(road,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
# buildings
out={'bld':[],'roads':[]}
cs,_=cv2.findContours(bld,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
for c in cs:
    a=cv2.contourArea(c)
    if a<28: continue
    (cx,cy),(w,h),ang=cv2.minAreaRect(c); fill=a/max(1,w*h)
    poly=cv2.approxPolyDP(c,1.2,True)[:,0,:]
    out['bld'].append({'a':round(a),'fill':round(fill,2),'rect':[*ll(cx+X0,cy+Y0),round(w,1),round(h,1),round(ang,1)],'poly':[ll(x+X0,y+Y0) for x,y in poly]})
# streets: keep only white areas at least ~4px wide, skeletonize, trace
dt=cv2.distanceTransform(road,cv2.DIST_L2,3)
core=road
sk=skeletonize(core>0)
sk=sk.astype(np.uint8)
K=cv2.filter2D(sk,-1,np.ones((3,3),np.float32),borderType=cv2.BORDER_CONSTANT)*sk  # neighbours+1
node=((K>=4)&(sk>0)).astype(np.uint8)          # junction pixels
nodeD=cv2.dilate(node,np.ones((3,3),np.uint8))
chains=(sk>0)&(nodeD==0)
n,lab=cv2.connectedComponents(chains.astype(np.uint8),connectivity=8)
nl,nlab,nst,ncen=cv2.connectedComponentsWithStats(nodeD,connectivity=8)
ys,xs=np.nonzero(lab); byl={}
for y,x in zip(ys,xs): byl.setdefault(lab[y,x],[]).append((y,x))
def order(px):
    S=set(px); nbc=lambda p:[(p[0]+a,p[1]+b) for a in (-1,0,1) for b in (-1,0,1) if (a or b) and (p[0]+a,p[1]+b) in S]
    ends=[p for p in px if len(nbc(p))<=1] or [px[0]]; path=[ends[0]]; seen={ends[0]}
    while True:
        nx=[q for q in nbc(path[-1]) if q not in seen]
        if not nx: break
        path.append(nx[0]); seen.add(nx[0])
    return path
def attach(p):
    y,x=p; best=None
    for a in range(-4,5):
        for b in range(-4,5):
            yy,xx=y+a,x+b
            if 0<=yy<nlab.shape[0] and 0<=xx<nlab.shape[1] and nlab[yy,xx]>0:
                d=a*a+b*b
                if best is None or d<best[0]: best=(d,nlab[yy,xx])
    return None if best is None else (ncen[best[1]][1],ncen[best[1]][0])
for k,px in byl.items():
    p=order(px)
    if len(p)<10: continue
    a=attach(p[0]); b=attach(p[-1])
    seq=[(y,x) for y,x in p]
    if a: seq=[a]+seq
    if b: seq=seq+[b]
    arr=np.array([[x,y] for y,x in seq],np.float32).reshape(-1,1,2); sm=cv2.approxPolyDP(arr,1.5,False)[:,0,:]
    wid=float(np.median([dt[y,x] for y,x in p]))*2
    out['roads'].append({'w':round(wid,1),'pts':[ll(float(x)+X0,float(y)+Y0) for x,y in sm]})
json.dump(out,open('tools/bg_core.json','w'))
print(len(out['bld']),'buildings',len(out['roads']),'road pieces', 'mpp',156543.03*math.cos(math.radians(36.99))/2**Z/2)
import collections; print(collections.Counter(int(r['w']) for r in out['roads']))
