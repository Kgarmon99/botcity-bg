# Converts real Bowling Green coordinates (Mapbox geocoding + driving routes) into game space.
# Fountain Square is the origin; distance from it is gently compressed so the far landmarks fit.
import math, json
LON0, LAT0 = -86.44133, 36.99317
R, L = 520.0, 2000.0
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
roads = [{'name': n, 'kind': k, 'pts': dedupe(line(p))} for n, (k, p) in ROUTES.items()]
# downtown grid, rotated to match the real street grid (avenues run NW-SE, streets NE-SW)
au = (-0.000481*math.cos(math.radians(LAT0))*111320, -0.000539*110540); al = math.hypot(*au); au = (au[0]/al, au[1]/al)
av = (au[1], -au[0])  # perpendicular
if av[0] > 0: av = (-av[0], -av[1])
grid = []
cherry = (( -86.45118-LON0)*math.cos(math.radians(LAT0))*111320, -(36.98737-LAT0)*110540)
names_u = {-2:'Center St',-1:'College St',0:'Fountain Sq',1:'State St',2:'Kentucky St',3:'Adams St',4:'Park St'}
names_v = {-3:'6th Ave',-2:'7th Ave',-1:'Main Ave',1:'Park Row',2:'10th Ave',3:'12th Ave',4:'13th Ave'}
S = 125
for i in range(-3, 5):
    # streets: lines parallel to av? streets run NE-SW => along av direction (perpendicular to avenues)
    pass
def seg(a, b, n=8):
    return [M(a[0]+(b[0]-a[0])*t/n, a[1]+(b[1]-a[1])*t/n) for t in range(n+1)]
def ok(x, z): return math.hypot(x-cherry[0], z-cherry[1]) > 330
for i in range(-3, 6):
    if i == 0: continue
    # avenue i: offset along av, runs along au
    pts = []
    for t in range(-6, 7):
        x = av[0]*i*S + au[0]*t*S; z = av[1]*i*S + au[1]*t*S
        if ok(x, z): pts.append((x, z))
        elif pts: break
    if len(pts) > 1: grid.append({'name': names_v.get(i, f'{i+9}th Ave'), 'kind': 'street', 'pts': dedupe(sum([seg(pts[k], pts[k+1], 3)[ (0 if k == 0 else 1):] for k in range(len(pts)-1)], []))})
for j in range(-4, 6):
    if j == 0: continue
    pts = []
    for t in range(-5, 6):
        x = au[0]*j*S + av[0]*t*S; z = au[1]*j*S + av[1]*t*S
        if ok(x, z): pts.append((x, z))
        elif pts: break
    if len(pts) > 1: grid.append({'name': names_u.get(j, 'Street'), 'kind': 'street', 'pts': dedupe(sum([seg(pts[k], pts[k+1], 3)[(0 if k == 0 else 1):] for k in range(len(pts)-1)], []))})
# Fountain Square ring (≈100 m park)
h = 62
ring = [(au[0]*a*h+av[0]*b*h, au[1]*a*h+av[1]*b*h) for a, b in [(-1,-1),(1,-1),(1,1),(-1,1),(-1,-1)]]
grid.append({'name': 'Fountain Square', 'kind': 'square', 'pts': [M(*p) for p in ring]})
LM = {
 'square': (-86.44133,36.99317), 'botlife': (-86.44133,36.99317), 'ballpark': (-86.44140,36.99658), 'skypac': (-86.43852,36.99629),
 'botu': (-86.45118,36.98737), 'arena': (-86.45763,36.98625), 'med': (-86.43010,36.99599), 'botbank': (-86.43779,36.97895),
 'botpark': (-86.43590,36.99410), 'fyp': (-86.43420,36.98880), 'botmotors': (-86.43080,36.96350), 'tycoon': (-86.42743,36.94844),
 'botmarket': (-86.44630,36.94120), 'cave': (-86.47397,36.95332), 'beech': (-86.40125,37.02545), 'museum': (-86.37500,37.00417),
 'botfactory': (-86.36561,37.00935), 'gas1': (-86.44480,36.98480), 'gas2': (-86.42920,36.95800), 'bridge': (-86.42960,37.01130), 'tower': (-86.45020,36.98800),
}
lm = {k: P(*v) for k, v in LM.items()}
river = dedupe(line([(-86.52,36.990),(-86.49,36.997),(-86.465,37.004),(-86.448,37.0075),(-86.436,37.0085),(-86.4295,37.0118),(-86.422,37.0175),(-86.414,37.0265),(-86.405,37.0315),(-86.395,37.0300),(-86.389,37.0230),(-86.383,37.0175),(-86.37,37.019),(-86.34,37.03)]))
hill = P(-86.4528, 36.9868)
out = 'const REAL='+json.dumps({'roads': roads+grid, 'lm': lm, 'river': river, 'hill': hill, 'au': au, 'av': av})+';\n'
open('/home/claude/botcity-bg/src/realmap.js', 'w').write(out)
print(len(roads), len(grid), lm['botu'], lm['tycoon'], lm['botfactory'], lm['ballpark'], hill, len(out)//1024, 'KB')
