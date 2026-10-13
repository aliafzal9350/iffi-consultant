"""Simplify DataV China provinces GeoJSON for a web 3D hero map.

- keeps the 34 province-level regions, drops the South China Sea dash-line feature
  (100000_JD: decorative line boxes, not a province - bad for 3D extrusion)
- Douglas-Peucker simplification + drops tiny islands + 3-decimal rounding
- adds English names and IFFI Global programme counts (from provinces.json)
"""
import json, math, os, sys

SRC, PROV, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
TOL = float(os.environ.get("TOL", "0.035"))        # degrees (~3.5 km)
MIN_AREA = float(os.environ.get("MIN_AREA", "0.04"))  # deg^2 - drop islands smaller than this

EN = {110000: "Beijing", 120000: "Tianjin", 130000: "Hebei", 140000: "Shanxi", 150000: "Inner Mongolia",
      210000: "Liaoning", 220000: "Jilin", 230000: "Heilongjiang", 310000: "Shanghai", 320000: "Jiangsu",
      330000: "Zhejiang", 340000: "Anhui", 350000: "Fujian", 360000: "Jiangxi", 370000: "Shandong",
      410000: "Henan", 420000: "Hubei", 430000: "Hunan", 440000: "Guangdong", 450000: "Guangxi",
      460000: "Hainan", 500000: "Chongqing", 510000: "Sichuan", 520000: "Guizhou", 530000: "Yunnan",
      540000: "Tibet", 610000: "Shaanxi", 620000: "Gansu", 630000: "Qinghai", 640000: "Ningxia",
      650000: "Xinjiang", 710000: "Taiwan", 810000: "Hong Kong", 820000: "Macau"}


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-12
    dmax, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i]
        d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norm if (dx or dy) else math.hypot(x0 - x1, y0 - y1)
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def area(r):
    return abs(sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1))) / 2


def simp_ring(r):
    out = rdp(r, TOL)
    out = [[round(x, 3), round(y, 3)] for x, y in out]
    dedup = [out[0]] + [p for a, p in zip(out, out[1:]) if p != a]
    if dedup[0] != dedup[-1]:
        dedup.append(dedup[0])
    return dedup if len(dedup) >= 4 else None


src = json.load(open(SRC, encoding="utf-8"))
prov = {p["adcode"]: p for p in json.load(open(PROV, encoding="utf-8"))}
feats, before, after = [], 0, 0
for f in src["features"]:
    code = f["properties"].get("adcode")
    if not isinstance(code, int):
        continue                                     # 100000_JD dash-line feature
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    biggest = max(polys, key=lambda p: area(p[0]))
    keep = []
    for poly in polys:
        before += sum(len(r) for r in poly)
        if poly is not biggest and area(poly[0]) < MIN_AREA:
            continue
        rings = [simp_ring(r) for r in poly]
        rings = [r for r in rings if r]
        if rings and len(rings[0]) >= 4:
            keep.append(rings[:1] + [h for h in rings[1:] if area(h) >= MIN_AREA])
    after += sum(len(r) for poly in keep for r in poly)
    pinfo = prov.get(code)
    c = f["properties"].get("centroid") or f["properties"].get("center")
    feats.append({"type": "Feature", "properties": {
        "adcode": code, "name": EN[code], "nameZh": f["properties"]["name"],
        "centroid": [round(c[0], 3), round(c[1], 3)],
        "hasPrograms": bool(pinfo), "programCount": pinfo["programCount"] if pinfo else 0,
    }, "geometry": {"type": "MultiPolygon", "coordinates": keep}})

out = {"type": "FeatureCollection",
       "metadata": {"source": "Alibaba DataV GeoAtlas (geo.datav.aliyun.com/areas_v3/bound/100000_full.json)",
                    "processing": f"Douglas-Peucker tolerance {TOL} deg, islands < {MIN_AREA} deg2 removed, "
                                  "3-decimal rounding, South China Sea dash-line feature removed",
                    "properties": "adcode, name (English), nameZh, centroid [lng,lat], hasPrograms, programCount"},
       "features": feats}
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"features={len(feats)} points {before} -> {after}  size={os.path.getsize(OUT)} bytes")
print("with programmes:", sum(f['properties']['hasPrograms'] for f in feats))
