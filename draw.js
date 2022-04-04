import * as ease from "./ease.js"
import * as v2 from "./vec2.js"

let ctx;
export const init = newCtx => ctx = newCtx;

export const circle = (x, y, radius) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2);
  ctx.fill();
}
export const ellipse = (x, y, rx, ry) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
  ctx.fill();
}
export const hex = (x, y, size, rot=0, hp=1) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let r = Math.PI * 2 * (i / 6) + Math.PI/4 + rot;
    const damage = hp < 1 && i/6 > hp/3;
    const mhp = damage ? ease.outExpo(hp) : 1;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(r) * size.x * mhp,
                                 y + Math.sin(r) * size.y      );
    // if (damage) {
    //   const hpr = Math.PI * (2/6) * (1 - hp);
    //   ctx.lineTo(x + Math.cos(r + hpr/2) * size.x * hp,
    //              y + Math.sin(r + hpr/2) * size.y * hp);
    //   ctx.lineTo(x + Math.cos(r + hpr  ) * size.x,
    //              y + Math.sin(r + hpr  ) * size.y);
    // }
  }
  ctx.fill();
}
export const minion = ({ pos, lookAt, smackProg }) => {
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
    
    if (smackProg) space = 1 - smackProg;

    circle(x + Math.cos(r) * (6 + space*4),
           y + Math.sin(r) * (6 + space*4), 7);
  }
  ctx.fillStyle = "#CDE7F1";
  ellipse(x, y, 7, 4);
  ctx.fillStyle = "#29A0CB";
  const d = v2.mulf(v2.norm(v2.sub(lookAt, pos)), 3);
  circle(x + d.x, y + d.y, 3);
}
