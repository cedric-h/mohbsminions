/* psst hey kid want some vector math? VECTOR, COMMITTING CRIMES, with DIRECTION and MAGNITUDE! OH YEAH! */
export const mulf = ({ x, y }, f) => ({ x: x * f, y: y * f });
export const divf = ({ x, y }, f) => ({ x: x / f, y: y / f });
export const addf = ({ x, y }, f) => ({ x: x + f, y: y + f });
export const subf = ({ x, y }, f) => ({ x: x - f, y: y - f });

export const eq = (a, b) => a.x == b.x && a.y == b.y;

export const mul = (a, b) => ({ x: a.x * b.x, y: a.y * b.y });
export const div = (a, b) => ({ x: a.x / b.x, y: a.y / b.y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });

export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const mag = (a) => Math.sqrt(dot(a, a));
export const norm = (a) => divf(a, mag(a) || 1);

export const dist = (a, b) => mag(sub(a, b));
export const lerp = (a, b, t) => add(mulf(a, 1 - t), mulf(b, t));

export const toStr = ({ x, y }) => x+","+y;
export const fromStr = str => {
  const [x, y] = str.split(",").map(n => +n);
  return { x, y };
};

export const fromRot = r => ({ x: Math.cos(r), y: Math.sin(r) });
