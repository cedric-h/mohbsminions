import * as v2 from "./vec2.js"
import * as hex from "./hex.js"
import * as draw from "./draw.js"
import * as ease from "./ease.js"
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.1";

const lerp = (a, b, t) => (1 - t) * a + t * b;
const nLerp = (a, b, t) => a.map((a, i) => lerp(a, b[i], t));
const toColor = rgb => `rgb(${rgb.join(",")})`;

const getOr = (map, k, deflt) => map.set(k, map.get(k) ?? deflt).get(k);

const newNoise = () => SimplexNoise.prototype.noise2D.bind(new SimplexNoise());
const sizeXNoise = newNoise();
const sizeYNoise = newNoise();
const pushDirNoise = newNoise();
const pushDistNoise = newNoise();

const setDiff = (a, b) => new Set([...a].filter(x => !b.has(x)));

const coordsToSet = coords => new Set(coords.map(v2.toStr));
const coordsFromSet = set => [...set].map(v2.fromStr);

const dedupCoords = coords => coordsFromSet(coordsToSet(coords));
const megaHex = n => [...Array(n)].reduce(
  acc => dedupCoords(acc.flatMap(hex.neighbors)),
  hex.neighbors({ x: 0, y: 0 })
);

const map = new Map(
  coordsFromSet(setDiff(
    coordsToSet(megaHex(14)),
    coordsToSet(megaHex(5)),
  ).add("0,0"))
  .map(hexPos => {
    const { x, y } = hexPos;
    let pos = hex.axialToOffset(hexPos);
    const r = Math.PI * pushDirNoise(x,y);
    pos = v2.add(pos, v2.mulf(v2.fromRot(r), 10*pushDistNoise(x,y)));
    return {
      pos,
      hexPos,
      hp: 1.0,
      size: v2.mulf({
        x: 0.7 + 0.3 * (1+sizeXNoise(x, y))/2,
        y: 0.6 + 0.4 * (1+sizeYNoise(x, y))/2,
      }, 32),
      color: nLerp(
        [112,128,144].map(x => x * 0.9),
        [144,112,128].map(x => x * 0.5),
        (1+sizeYNoise(x,y))/2
      ),
    };
  })
  .sort((a, b) => a.pos.y - b.pos.y)
  .map(x => [v2.toStr(x.hexPos), x])
);
const mapAt = hex => map.get(v2.toStr(hex));

let foundTiles = new Set(["0,0"]);
const tileFound = hex => foundTiles.has(v2.toStr(hex));

let mapLight = new Map([["0,0", 1]]);
const lightAt = hex => mapLight.get(v2.toStr(hex)) ?? 0;
const tickLight = () => {
  /* let's discover us some tiles! */
  const nextFoundTiles = new Set(foundTiles);
  const findTile = hex => nextFoundTiles.add(v2.toStr(hex));
  for (const k of foundTiles) {
    const hp = v2.fromStr(k);

    for (const nhp of hex.neighbors(hp))
      if (!tileFound(nhp) && !mapAt(nhp)) {
        findTile(nhp);
      }
  }
  foundTiles = nextFoundTiles;


  const next = new Map();
  const hasNext = hex => next.has(v2.toStr(hex));
  const setNext = (hex, n) => next.set(v2.toStr(hex), n);

  const calcLightAt = hp => {
    if (hex.neighbors(hp).some(tileFound))
      return 1;
    else
      return 0.603 * Math.max(...hex.neighbors(hp).map(lightAt));
  }

  for (const k of mapLight.keys()) {
    const hp = v2.fromStr(k);

    const light = calcLightAt(hp);
    setNext(hp, light);
    if (light > 0.1)
      for (const nhp of hex.neighbors(hp))
        if (!hasNext(nhp))
          setNext(nhp, calcLightAt(nhp));
  }
  mapLight = next;
}

const openNeighbor = h => hex.neighbors(h).some(x => tileFound(x));
const canDestroyHex = h => mapAt(h) && openNeighbor(h);


await new Promise(res => window.onload = res);


/* let's get this party started */
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');
draw.init(ctx);

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
  { pos: { x:  30, y: 20 } },
  { pos: { x: -60, y: -20 } },
  { pos: { x: -60, y: 20 } },
];
let attacks = new Map();


/* yoink what we need out of the browser */
let mouse = { x: 0, y: 0 };
let mouseHex = { x: 0, y: 0 };
let mouseAction = "none"; /* none | smash | move */
const updateMousePos = ev => {
  mouse.x = ev.pageX - canvas.width/2;
  mouse.y = ev.pageY - canvas.height/2;
  mouseHex = hex.offsetToAxial(mouse);
};
window.onmousedown = ev => {
  updateMousePos(ev);

  if (mapAt(mouseHex))
    mouseAction = "smash";
  else
    mouseAction = "move";
};
window.onmouseup = () => mouseAction = "none";
window.onmousemove = updateMousePos;


/* update loops */
setInterval(tickLight, 100);

requestAnimationFrame(function frame(now) {
  const { width, height } = canvas;
  ctx.fillStyle = "rgb(47, 43, 49)";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width/2, height/2);

  for (const [, rock] of map) {
    let { size, hexPos, color, pos, hp } = rock;
    let c = color;
    if (v2.eq(hexPos, mouseHex)) {
      let interval = 0.01, intensity = 0.3;
      if (mouseAction != "none")
        interval *= 0.5, intensity -= 0.1;

      let t = intensity + 0.1 * Math.sin(Date.now() * interval);
      c = nLerp(c, [200, 200, 0], t);
    }
    ctx.fillStyle = toColor(nLerp([47, 43, 49], c, lightAt(hexPos)));

    let rot = 0;
    const { smackT, smackDir } = rock;
    if (smackT && now > smackT) {
      const SMACK_DURATION = 400;
      const afterSmack = Math.min(SMACK_DURATION, now - smackT);
      const prog = afterSmack / SMACK_DURATION;
      let t = ease.inBack(1 - prog);
      rot += 0.52 * t;
      t = ease.outBounce(1 - prog);
      pos = v2.sub(pos, v2.mulf(smackDir, 5 * t));
    }
    draw.hex(pos.x, pos.y, size, rot, hp);
  }

  const { dist, mulf, norm, sub, add } = v2;

  let smashSpots = [];
  const smashSpotsAssigned = new Map(); /* minion -> attack start */
  /* attack end -> (minions targeting)[] */
  const smashSpotsAssignedTargets = new Map();
  if (mouseAction == "smash") {
    let visited = new Set([v2.toStr(mouseHex)]);
    if (canDestroyHex(mouseHex)) while (smashSpots.length == 0) {
      const knownBeforeSearch = visited.size;

      /* rocks that should get destroyed */
      let nextVisited = new Set();
      for (const vStr of visited) {
        const vHex = v2.fromStr(vStr);
        const vOff = hex.axialToOffset(vHex);

        /* adjacent (hopefully empty) spaces from which to strike */
        for (const nHex of hex.neighbors(vHex)) {
          const nStr = v2.toStr(nHex);
          if (visited.has(nStr)) continue;

          const nOff = hex.axialToOffset(nHex);
          const nPos = add(vOff, mulf(norm(sub(nOff, vOff)), 60));

          const redundant = smashSpots
            .concat(...smashSpotsAssigned.values())
            .some(s => dist(s, nPos) < 30);
          if (redundant) continue;

          const occupied = minions.find(m => dist(m.pos, nPos) < 25);
          if (occupied) {
            smashSpotsAssigned.set(occupied, nPos);
            getOr(smashSpotsAssignedTargets, vStr, []).push(occupied);
          } else if (tileFound(nHex))
            smashSpots.push(nPos);

          if (canDestroyHex(nHex))
            nextVisited.add(nStr);
        }
      }

      visited = nextVisited;
      if (knownBeforeSearch == visited.size) break;
    }
  }

  for (const [target, poised] of smashSpotsAssignedTargets) {
    if (poised.some(p => p.attack)) continue;

    const attacker = poised.sort(_ => 0.5 - Math.random())[0];
    if (attacker) {
      const ATTACK_DURATION = 1000;
      const endPos = hex.axialToOffset(v2.fromStr(target));
      map.get(target).smackT = now + ATTACK_DURATION * 0.35;
      setTimeout(() => {
        if (!map.has(target)) return;
        map.get(target).hp -= 0.3;
        if (map.get(target).hp < 0)
          map.delete(target);
      }, ATTACK_DURATION * 0.35);
      map.get(target).smackDir = norm(sub(attacker.pos, endPos));
      attacker.attack = {
        startT: now,
        endT: now + ATTACK_DURATION,
        endPos
      };
    }
  }

  for (const min of minions) {

    let lookAt = mouse;
    if (mouseAction != "none") {
      let target;
      if (mouseAction == "move") target = mouse;
      if (mouseAction == "smash" && smashSpots.length && !min.attack) {
        if (!(target = smashSpotsAssigned.get(min)))
          target = smashSpots.reduce(
            (a, x) => (dist(x, min.pos) < dist(a, min.pos)) ? x : a
          );
      }

      if (target) {
        const d = sub(target, min.pos);
        const speed = Math.min(3, v2.mag(d));
        min.pos = add(min.pos, mulf(norm(d), speed));
        lookAt = target;
      }
    }

    /* minion vs. minion physics */
    for (const otr of minions) if (otr != min) {
      let delta = sub(otr.pos, min.pos);
      const dist = v2.mag(delta);
      if (dist < 40)
        delta = norm(delta),
        otr.pos = add(otr.pos, mulf(delta, 40 - dist)),
        min.pos = sub(min.pos, mulf(delta, 40 - dist));
    }

    /* minion vs. tilemap physics */
    const hp = hex.offsetToAxial(min.pos);
    for (const nhp of hex.neighbors(hp)) if (mapAt(nhp)) {
      const pos = hex.axialToOffset(nhp);
      
      let delta = sub(pos, min.pos);
      const dist = v2.mag(delta);
      if (dist < 40)
        min.pos = sub(min.pos, mulf(norm(delta), 40 - dist));
    }

    let pos = min.pos;
    if (min.attack) {
      const { startT, endT, endPos } = min.attack;

      if (now > endT)
        min.attack = undefined;
      else {
        let t = (now - startT) / (endT - startT);
        if (t < 0.5)
          t = ease.inOutElastic(t * 2);
        else
          t = 1.0 - ease.inBack(2 * (t - 0.5));
        pos = v2.lerp(pos, endPos, t);
      }
    }
    draw.minion({ pos, lookAt });
    // ctx.fillStyle = "cyan";
    // draw.circle(min.pos.x, min.pos.y, 2);
  }

  ctx.fillStyle = "blue";
  for (const {x, y} of smashSpots)
    draw.hex(x, y, { x: 5, y: 5 });

  ctx.restore();

  requestAnimationFrame(frame);
})
