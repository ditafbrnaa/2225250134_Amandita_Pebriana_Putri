// Geometri Diagram Venn 2 himpunan.
// Setiap daerah digambar sebagai <path> TERPISAH agar bisa diklik & dianimasikan sendiri.
// Mask daerah: 0 = luar, 1 = A saja, 2 = B saja, 3 = A ∩ B.

/**
 * Titik potong dua lingkaran (pusat sejajar horizontal maupun tidak).
 * @returns {{top:{x:number,y:number}, bottom:{x:number,y:number}} | null}
 */
export function circleIntersections(c1, c2) {
  const dx = c2.cx - c1.cx;
  const dy = c2.cy - c1.cy;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d >= c1.r + c2.r || d <= Math.abs(c1.r - c2.r)) return null;
  const a = (c1.r ** 2 - c2.r ** 2 + d ** 2) / (2 * d);
  const h = Math.sqrt(c1.r ** 2 - a ** 2);
  const mx = c1.cx + (a * dx) / d;
  const my = c1.cy + (a * dy) / d;
  const p1 = { x: mx + (h * dy) / d, y: my - (h * dx) / d };
  const p2 = { x: mx - (h * dy) / d, y: my + (h * dx) / d };
  return p1.y <= p2.y ? { top: p1, bottom: p2 } : { top: p2, bottom: p1 };
}

const f = (n) => Number(n.toFixed(2));

/**
 * Membuat tata letak lengkap Diagram Venn 2 himpunan.
 * Arah busur SVG (sweep=1 → searah jarum jam di layar) sudah diverifikasi secara visual.
 */
export function twoSetLayout({ width = 400, height = 280, r = 90, distance = 100, pad = 10 } = {}) {
  const cy = height / 2;
  const A = { cx: width / 2 - distance / 2, cy, r };
  const B = { cx: width / 2 + distance / 2, cy, r };
  const universe = { x: pad, y: pad, w: width - pad * 2, h: height - pad * 2 };
  const pts = circleIntersections(A, B);
  if (!pts) throw new Error('Lingkaran A dan B harus beririsan.');
  const { top: P, bottom: Q } = pts;

  // Apakah busur A yang menghadap ke kanan (ke arah B) adalah busur besar?
  const largeARight = A.cx > P.x ? 1 : 0;
  const largeBLeft = B.cx < P.x ? 1 : 0;
  const M = `M${f(P.x)},${f(P.y)}`;
  const toQ = `${f(Q.x)},${f(Q.y)}`;
  const toP = `${f(P.x)},${f(P.y)}`;

  const lens = `${M} A${r},${r} 0 ${largeARight},1 ${toQ} A${r},${r} 0 ${largeBLeft},1 ${toP} Z`;
  const aOnly = `${M} A${r},${r} 0 ${1 - largeARight},0 ${toQ} A${r},${r} 0 ${largeBLeft},1 ${toP} Z`;
  const bOnly = `${M} A${r},${r} 0 ${1 - largeBLeft},1 ${toQ} A${r},${r} 0 ${largeARight},0 ${toP} Z`;
  const union = `${M} A${r},${r} 0 ${1 - largeARight},0 ${toQ} A${r},${r} 0 ${1 - largeBLeft},0 ${toP} Z`;
  const rect = `M${universe.x},${universe.y} H${universe.x + universe.w} V${universe.y + universe.h} H${universe.x} Z`;
  const outside = `${rect} ${union}`; // dipakai dengan fill-rule="evenodd"

  return {
    width,
    height,
    universe,
    circles: { A, B },
    intersections: { top: P, bottom: Q },
    paths: { 0: outside, 1: aOnly, 2: bOnly, 3: lens },
    unionPath: union,
    labelPos: {
      0: { x: universe.x + 34, y: universe.y + universe.h - 18 },
      1: { x: f(A.cx - r / 2), y: cy },
      2: { x: f(B.cx + r / 2), y: cy },
      3: { x: f(P.x), y: cy },
    },
    setLabelPos: {
      A: { x: A.cx - r * 0.55, y: cy - r - 4 },
      B: { x: B.cx + r * 0.55, y: cy - r - 4 },
      S: { x: universe.x + 14, y: universe.y + 20 },
    },
  };
}

/** Mask daerah tempat sebuah titik berada. */
export function pointMask(layout, x, y) {
  const { A, B } = layout.circles;
  const inA = Math.hypot(x - A.cx, y - A.cy) < A.r;
  const inB = Math.hypot(x - B.cx, y - B.cy) < B.r;
  return (inA ? 1 : 0) | (inB ? 2 : 0);
}

/**
 * Titik-titik slot untuk menaruh token anggota di dalam sebuah daerah,
 * diurutkan dari yang paling dekat dengan label daerah.
 */
export function regionSlots(layout, mask, { spacing = 26, margin = 13 } = {}) {
  const { A, B } = layout.circles;
  const { universe } = layout;
  const center = layout.labelPos[mask];
  const slots = [];
  for (let y = universe.y + margin + 6; y <= universe.y + universe.h - margin; y += spacing) {
    for (let x = universe.x + margin + 6; x <= universe.x + universe.w - margin; x += spacing) {
      if (pointMask(layout, x, y) !== mask) continue;
      const dA = Math.abs(Math.hypot(x - A.cx, y - A.cy) - A.r);
      const dB = Math.abs(Math.hypot(x - B.cx, y - B.cy) - B.r);
      if (dA < margin || dB < margin) continue;
      // Jangan menimpa label angka/daerah.
      if (Math.hypot(x - center.x, y - center.y) < 14) continue;
      slots.push({ x, y, d: Math.hypot(x - center.x, y - center.y) });
    }
  }
  return slots.sort((p, q) => p.d - q.d).map(({ x, y }) => ({ x, y }));
}
