import sys, json, numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC = '/home/claude/farm/src/'
OUT = '/home/claude/farm/out/'
# per image: (bg kind, translucent mode, group dilation radius, min area)
CFG = {
 '02': ('g', 0, 10, 300), '03': ('g', 1, 40, 2000), '04': ('g', 0, 10, 300),
 '05': ('g', 0, 28, 300), '06': ('g', 0, 28, 300), '07': ('g', 0, 28, 300),
 '08': ('g', 1, 40, 2000), '09': ('m', 0, 10, 300), '10': ('m', 0, 3, 300),
 '11': ('m', 0, 8, 300), '12': ('m', 0, 6, 200), '13': ('m', 0, 20, 2000),
 '14': ('g', 0, 30, 2000), '15': ('g', 0, 30, 2000),
}

def border_bg(a):
    b = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    return np.median(b, 0)

def key(n):
    kind, trans, rad, minA = CFG[n]
    a = np.array(Image.open(SRC + n + '.png').convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if kind == 'g':
        # greenness: how much green dominates
        sc = g - np.maximum(r, b)
        bg = (sc > 150) & (g > 180)
        soft = (sc > 95) & (g > 150)
    else:
        sc = np.minimum(r, b) - g  # magenta: r,b high, g low
        bg = (sc > 100) & (r > 180)
        soft = (sc > 60) & (r > 140)
    alpha = np.ones(r.shape)
    rgb = a.copy()
    if trans:
        # film over green bg: bright green pixels become white film with partial alpha
        film = (g > 170) & (g - np.maximum(r, b) > 25)
        lift = np.minimum(r, b)  # bg has ~15, white film ~235
        fa = np.clip((lift - 20) / (225 - 20), 0, 1) * 0.85
        fa = np.where(bg, 0, np.maximum(fa, 0.18))
        alpha = np.where(film, fa, 1.0)
        W = np.array([236, 244, 240.])
        for c in range(3):
            rgb[..., c] = np.where(film, W[c] * 0.9 + a[..., c] * 0.1 * (c != 1) + (c == 1) * W[1] * 0.1, a[..., c])
        alpha = np.where(bg & ~film, 0, alpha)
    else:
        alpha[bg] = 0
        # edge clean: soft-bg pixels touching bg are removed (2 passes)
        for _ in range(2):
            near = nd.binary_dilation(alpha == 0, iterations=1)
            kill = near & soft & (alpha > 0)
            alpha[kill] = 0
        # despill remaining edge ring
        ring = nd.binary_dilation(alpha == 0, iterations=1) & (alpha > 0)
        if kind == 'g':
            gg = np.minimum(g, np.maximum(r, b) + 35)
            rgb[..., 1] = np.where(ring, gg, g)
        else:
            if n != '13':
                pocket = (b > g + 40) & (r > g + 40) & (r > 110)
                alpha[pocket] = 0
            ring3 = nd.binary_dilation(alpha == 0, iterations=3) & (alpha > 0)
            spill = ring3 & (b > g + 20) & (r > g + 20)
            hard = ring3 & (b > g + 45) & (r > g + 45)
            alpha[hard] = 0
            tint = (b > g + 12) & (r > g + 12) & (alpha > 0)
            if n == '13':
                tint &= ring3
            lum = 0.3 * r + 0.59 * g + 0.11 * b
            for c, f in enumerate((1.18, 0.95, 0.72)):
                rgb[..., c] = np.where(tint, lum * f, rgb[..., c])
    # remove specks
    solid = alpha > 0.05
    lab, k = nd.label(solid)
    sizes = nd.sum(solid, lab, range(1, k + 1))
    for i, s in enumerate(sizes):
        if s < 12:
            alpha[lab == i + 1] = 0
    solid = alpha > 0.05
    if n in ('05','06','07'):
        lab = np.zeros(solid.shape, int)
        for ci,(x0c,x1c) in enumerate([(0,280),(280,545),(545,830),(830,solid.shape[1])]):
            lab[:, x0c:x1c] = ci+1
        lab[~nd.binary_dilation(solid, iterations=3)] = 0
    else:
        grp = nd.binary_dilation(solid, iterations=rad)
        lab, k = nd.label(grp)
    objs = []
    for i, sl in enumerate(nd.find_objects(lab)):
        m = (lab[sl] == i + 1) & solid[sl]
        if m.sum() < minA:
            continue
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min() + sl[0].start, ys.max() + sl[0].start + 1, xs.min() + sl[1].start, xs.max() + sl[1].start + 1
        sub = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        mm = (lab[y0:y1, x0:x1] == i + 1)
        sub[..., :3] = np.clip(rgb[y0:y1, x0:x1], 0, 255)
        sub[..., 3] = (alpha[y0:y1, x0:x1] * 255 * mm).astype(np.uint8)
        objs.append((y0, x0, sub))
    # reading order: rows then x
    objs.sort(key=(lambda o: o[1]) if n in ('05','06','07') else (lambda o: (round(o[0] / 180), o[1])))
    names = []
    for j, (y0, x0, sub) in enumerate(objs):
        nm = f'{n}_{j}.png'
        Image.fromarray(sub).save(OUT + nm)
        names.append((nm, sub.shape[1], sub.shape[0], x0, y0))
    return names

if __name__ == '__main__':
    res = {}
    for n in (sys.argv[1:] or CFG):
        res[n] = key(n)
        print(n, [(x[0], x[1], x[2]) for x in res[n]])
