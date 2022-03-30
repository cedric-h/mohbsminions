import * as v2 from "./vec2.js"
import * as ease from "./ease.js"
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.1";

const lerp = (a, b, t) => (1 - t) * a + t * b;
const nLerp = (a, b, t) => a.map((a, i) => lerp(a, b[i], t));
const toColor = rgb => `rgb(${rgb.join(",")})`;

const newNoise = () => SimplexNoise.prototype.noise2D.bind(new SimplexNoise());
const sizeXNoise = newNoise();
const sizeYNoise = newNoise();
const pushDirNoise = newNoise();
const pushDistNoise = newNoise();

const setDiff = (a, b) => new Set([...a].filter(x => !b.has(x)));

const coordsToSet = coords => new Set(coords.map(({x, y}) => x+","+y));
const coordsFromSet = set => [...set].map(x => (([x, y]) => ({x:+x, y:+y}))(x.split(",")));

const dedupCoords = coords => coordsFromSet(coordsToSet(coords));
const megaHex = n => [...Array(n)].reduce(
  acc => dedupCoords(acc.flatMap(v2.hexNeighbors)),
  v2.hexNeighbors({ x: 0, y: 0 })
);

const map = 
  coordsFromSet(setDiff(
    coordsToSet(megaHex(9)),
    coordsToSet(megaHex(5)),
  ))
  .map(hex => {
    const { x, y } = hex;
    let pos = v2.mulf(v2.axialHexToOffset(hex), 18);
    const r = Math.PI * pushDirNoise(x,y);
    pos = v2.add(pos, v2.mulf(v2.fromRot(r), 10*pushDistNoise(x,y)));
    return {
      pos,
      size: v2.mulf({
        x: 0.7 + 0.3 * (1+sizeXNoise(x, y))/2,
        y: 0.6 + 0.4 * (1+sizeYNoise(x, y))/2,
      }, 32),
      color: toColor(nLerp(
        [112,128,144].map(x => x * 0.9),
        [144,112,128].map(x => x * 0.5),
        (1+sizeYNoise(x,y))/2
      ).map(x => x * (0.3 + 0.7 * (1 - v2.mag(v2.sub(pos, { x: 0, y: 0 })) / 500)))),
    };
  })
  .sort((a, b) => a.pos.y - b.pos.y);
console.log(map);

await new Promise(res => window.onload = res);

/* let's get this party started */
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');


/* these drawing utils'll come in handy */
const circle = (x, y, radius) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2);
  ctx.fill();
}
const ellipse = (x, y, rx, ry) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
  ctx.fill();
}
const minion = pos => {
  let { x, y } = pos;
  ctx.fillStyle = "#90a4ae";
  y += 6 * Math.sin(Date.now() / 150);
  circle(x, y, 10);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#8ca0aa";
    const r = ((i / 3) + Math.sin(Date.now() / 1500)) * Math.PI*2;
    let space, t = Date.now() / 1000 % 2;
    if (t > 1)
      space = ease.inBack(1 - (t - 1));
    else
      space = ease.outBounce(t);

    circle(x + Math.cos(r) * (6 + space*4),
           y + Math.sin(r) * (6 + space*4), 7);
  }
  ctx.fillStyle = "#CDE7F1";
  ellipse(x, y, 7, 4);
  ctx.fillStyle = "#29A0CB";
  const d = v2.mulf(v2.norm(v2.sub(mouse, pos)), 3);
  circle(x + d.x, y + d.y, 3);
}


/* i want fullscreen, goddamnit */
(window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})();

let minions = [
  { pos: { x:  0, y:  0 } },
  { pos: { x: 30, y: 20 } },
  { pos: { x: 60, y: -20 } },
  { pos: { x: -30, y: 20 } },
];


/* yoink what we need out of the browser */
let mouse = { x: 0, y: 0 };
let mousedown = false;
window.onmousedown = () => mousedown = true;
window.onmouseup = () => mousedown = false;
window.onmousemove = ev => {
  mouse.x = ev.pageX - canvas.width/2;
  mouse.y = ev.pageY - canvas.height/2;
};


(function frame() {
  const { width, height } = canvas;
  ctx.fillStyle = "rgb(47, 43, 49)";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width/2, height/2);

  for (const { size, color, pos: { x, y } } of map) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const r = Math.PI * 2 * (i / 6) + Math.PI/4;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(r) * size.x,
                                   y + Math.sin(r) * size.y);
    }
    ctx.fill();
  }

  for (const min of minions) {
    const { mulf, norm, sub, add } = v2;

    if (mousedown)
      min.pos = add(min.pos, mulf(norm(sub(mouse, min.pos)), 3));

    for (const otr of minions) if (otr != min) {
      let delta = v2.sub(otr.pos, min.pos);
      const dist = v2.mag(delta);
      if (dist < 40)
        delta = norm(delta),
        otr.pos = add(otr.pos, mulf(delta, 40 - dist)),
        min.pos = sub(min.pos, mulf(delta, 40 - dist));
    }
    minion(min.pos);
  }
  
  ctx.restore();

  requestAnimationFrame(frame);
})();