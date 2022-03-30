/* psst hey kid want some vector math? */
export const mulf = ({ x, y }, f) => ({ x: x * f, y: y * f });
export const divf = ({ x, y }, f) => ({ x: x / f, y: y / f });
export const addf = ({ x, y }, f) => ({ x: x + f, y: y + f });
export const subf = ({ x, y }, f) => ({ x: x - f, y: y - f });

export const mul = (a, b) => ({ x: a.x * b.x, y: a.y * b.y });
export const div = (a, b) => ({ x: a.x / b.x, y: a.y / b.y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });

export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const mag = (a) => Math.sqrt(dot(a, a));
export const norm = (a) => divf(a, mag(a) || 1);

export const fromRot = r => ({ x: Math.cos(r), y: Math.sin(r) });

export const axialHexToOffset = ({x, y}) => ({
  x: Math.sqrt(3) * x + (Math.sqrt(3) / 2) * y,
  y: (3 / 2) * y,
});

export const hexNeighbors = (() => {
  const offsets = [
    { x: +1, y: +0 },
    { x: +1, y: -1 },
    { x: +0, y: -1 },
    { x: -1, y: +0 },
    { x: -1, y: +1 },
    { x: +0, y: +1 },
  ];
  return p => offsets.map(o => add(o, p));
})();
