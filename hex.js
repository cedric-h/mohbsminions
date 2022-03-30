import * as v2 from "./vec2.js"

const GRID_SIZE = 18;

export const axialToOffset = ({x, y}) => ({
  x: GRID_SIZE * (Math.sqrt(3) * x + (Math.sqrt(3) / 2) * y),
  y: GRID_SIZE * ((3 / 2) * y),
});

export const neighbors = (() => {
  const offsets = [
    { x: +1, y: +0 },
    { x: +1, y: -1 },
    { x: +0, y: -1 },
    { x: -1, y: +0 },
    { x: -1, y: +1 },
    { x: +0, y: +1 },
  ];
  return p => offsets.map(o => v2.add(o, p));
})();

/* shamlessly stolen from redblob's hex writeup */
export const offsetToAxial = (point, size) => {
  const cubeToAxial = ({ q, r }) => ({ q, r });
  const axialToCube = ({ q, r }) => ({ q, r, s: -q-r });
  const cubeRound = frac => {
      let q = Math.round(frac.q)
      let r = Math.round(frac.r)
      let s = Math.round(frac.s)

      let q_diff = Math.abs(q - frac.q)
      let r_diff = Math.abs(r - frac.r)
      let s_diff = Math.abs(s - frac.s)

      if (q_diff > r_diff && q_diff > s_diff)
          q = -r-s;
      else if (r_diff > s_diff)
          r = -q-s
      else
          s = -q-r;

      return { q, r, s }
  }
  const axialRound = hex => cubeToAxial(cubeRound(axialToCube(hex)));

  const { q, r } = axialRound({
    q: (Math.sqrt(3)/3 * point.x  -  1/3 * point.y) / GRID_SIZE,
    r: (                             2/3 * point.y) / GRID_SIZE
  });
  return { x: q, y: r };
}
