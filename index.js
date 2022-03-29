import * as v2 from "./vec2.js"
import * as ease from "./ease.js"

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
