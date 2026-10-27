// Original native-grid reconstruction from visual reference. No source-image sampling or resizing.
// node tools/art/draw-taiko-grid.mjs [--from-grid]
// Needs sharp for PNG encoding only (or RPS_SHARP_PATH pointing to its package).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.RPS_SHARP_PATH || 'sharp');
const root = new URL('../../', import.meta.url);
const folder = new URL('art/experiments/taiko-grid-v3/', root);
mkdirSync(folder, { recursive: true });
const W = 64;
const H = 80;
// One character per actual pixel. Dots are transparent. No interpolated colours.
const palette = {
  A: '#101526',
  B: '#222d43',
  C: '#3c4960',
  D: '#a94c26',
  E: '#df8738',
  F: '#fbb34e',
  G: '#ffda80',
  H: '#620f23',
  I: '#8f1427',
  J: '#be1b2b',
  K: '#e62b32',
  L: '#f44d3b',
  M: '#a85213',
  N: '#ee9917',
  O: '#ffd03d',
  P: '#737c78',
  Q: '#abb0a0',
  R: '#dedec8',
  S: '#fff6de',
};
let grid = Array.from({ length: H }, () => Array(W).fill('.'));
const px = (x, y, colour) => {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('Fractional pixel');
  if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = colour;
};
const rect = (x, y, w, h, c) => {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
};
// Explicit polygon vertices live on the native grid. Fill by pixel centre; never anti-alias.
const poly = (points, c, outline = false) => {
  const pixels = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[j];
        if (ay > y + 0.5 !== by > y + 0.5 && x + 0.5 < ((bx - ax) * (y + 0.5 - ay)) / (by - ay) + ax)
          inside = !inside;
      }
      if (inside) pixels.push([x, y]);
    }
  if (outline)
    for (const [x, y] of pixels) {
      px(x - 1, y, 'A');
      px(x + 1, y, 'A');
      px(x, y - 1, 'A');
      px(x, y + 1, 'A');
    }
  for (const [x, y] of pixels) px(x, y, c);
};

if (process.argv.includes('--from-grid')) {
  grid = readFileSync(new URL('pixels.txt', folder), 'utf8')
    .trimEnd()
    .split(/\r?\n/)
    .map((row) => [...row]);
} else {
  // Headband tails behind the shoulder, two broad orange ribbons.
  poly(
    [
      [28, 10],
      [21, 11],
      [16, 10],
      [9, 11],
      [7, 14],
      [10, 15],
      [16, 13],
      [21, 14],
      [27, 13],
    ],
    'N',
    true,
  );
  poly(
    [
      [27, 12],
      [21, 16],
      [16, 17],
      [11, 19],
      [10, 17],
      [15, 15],
      [21, 14],
    ],
    'N',
    true,
  );
  poly(
    [
      [9, 12],
      [16, 11],
      [19, 12],
      [15, 13],
      [10, 14],
    ],
    'O',
  );
  poly(
    [
      [14, 17],
      [21, 15],
      [24, 14],
      [20, 17],
      [15, 18],
    ],
    'O',
  );
  // Far arm: exposed upper arm and raised forearm. The front fist points to the right.
  poly(
    [
      [36, 22],
      [41, 23],
      [43, 28],
      [44, 32],
      [47, 29],
      [50, 26],
      [53, 27],
      [51, 33],
      [47, 37],
      [43, 38],
      [39, 35],
      [37, 30],
    ],
    'F',
    true,
  );
  poly(
    [
      [39, 24],
      [41, 27],
      [41, 31],
      [44, 34],
      [46, 33],
      [44, 36],
      [41, 35],
      [39, 31],
    ],
    'E',
  );
  poly(
    [
      [44, 32],
      [48, 29],
      [51, 28],
      [53, 30],
      [51, 34],
      [47, 37],
      [44, 36],
    ],
    'R',
    true,
  );
  poly(
    [
      [45, 33],
      [49, 30],
      [51, 30],
      [50, 32],
      [47, 35],
      [45, 35],
    ],
    'S',
  );
  poly(
    [
      [46, 36],
      [49, 33],
      [52, 30],
      [52, 32],
      [49, 36],
    ],
    'Q',
  );
  px(47, 33, 'P');
  px(48, 34, 'P');
  px(49, 31, 'Q');
  poly(
    [
      [49, 25],
      [51, 23],
      [54, 24],
      [56, 27],
      [55, 30],
      [52, 30],
      [49, 28],
    ],
    'F',
    true,
  );
  rect(51, 24, 2, 2, 'G');
  rect(54, 27, 2, 2, 'E');
  px(52, 27, 'D');
  // Neck and red torso, ending at the belt. Broad folds replace fine fabric detail.
  poly(
    [
      [30, 17],
      [37, 17],
      [36, 24],
      [31, 26],
      [28, 23],
    ],
    'F',
    true,
  );
  poly(
    [
      [32, 18],
      [36, 18],
      [35, 23],
      [32, 22],
    ],
    'D',
  );
  poly(
    [
      [26, 19],
      [30, 20],
      [33, 24],
      [36, 21],
      [39, 25],
      [39, 34],
      [37, 41],
      [25, 42],
      [22, 34],
      [21, 24],
    ],
    'J',
    true,
  );
  poly(
    [
      [24, 21],
      [27, 22],
      [29, 27],
      [27, 33],
      [27, 40],
      [24, 40],
      [22, 32],
    ],
    'I',
  );
  poly(
    [
      [28, 21],
      [32, 24],
      [32, 28],
      [29, 26],
    ],
    'K',
  );
  poly(
    [
      [36, 25],
      [38, 28],
      [37, 34],
      [35, 39],
      [29, 40],
      [33, 36],
    ],
    'I',
  );
  poly(
    [
      [28, 33],
      [33, 31],
      [37, 30],
      [36, 34],
      [31, 37],
      [28, 37],
    ],
    'H',
  );
  // Two gold frog fasteners, each deliberately just a few pixels.
  rect(31, 25, 5, 1, 'O');
  rect(31, 24, 1, 3, 'N');
  rect(35, 24, 1, 2, 'N');
  rect(31, 29, 4, 1, 'O');
  rect(31, 28, 1, 3, 'N');
  // Near upper arm folds across chest; wrapped forearm rises to the central fist.
  poly(
    [
      [20, 23],
      [24, 24],
      [26, 28],
      [25, 33],
      [27, 34],
      [30, 31],
      [33, 28],
      [36, 29],
      [35, 33],
      [31, 37],
      [27, 40],
      [23, 38],
      [20, 34],
      [18, 29],
    ],
    'F',
    true,
  );
  poly(
    [
      [20, 25],
      [22, 24],
      [24, 25],
      [24, 28],
      [21, 29],
      [19, 28],
    ],
    'G',
  );
  poly(
    [
      [19, 30],
      [22, 31],
      [23, 34],
      [26, 36],
      [28, 35],
      [27, 38],
      [24, 37],
      [21, 35],
    ],
    'E',
  );
  px(23, 30, 'D');
  px(24, 31, 'E');
  poly(
    [
      [24, 35],
      [27, 34],
      [33, 29],
      [36, 29],
      [36, 32],
      [32, 36],
      [28, 39],
      [25, 38],
    ],
    'R',
    true,
  );
  poly(
    [
      [26, 35],
      [29, 33],
      [34, 29],
      [35, 30],
      [32, 33],
      [28, 36],
      [26, 37],
    ],
    'S',
  );
  poly(
    [
      [27, 38],
      [31, 35],
      [35, 31],
      [35, 33],
      [31, 37],
      [28, 39],
    ],
    'Q',
  );
  // Short wrap bands, constrained to the forearm's surface.
  poly(
    [
      [27, 35],
      [28, 34],
      [30, 36],
      [29, 37],
    ],
    'Q',
  );
  poly(
    [
      [30, 32],
      [31, 31],
      [33, 33],
      [32, 34],
    ],
    'Q',
  );
  poly(
    [
      [33, 30],
      [34, 29],
      [36, 31],
      [35, 32],
    ],
    'P',
  );
  poly(
    [
      [34, 27],
      [36, 25],
      [38, 26],
      [39, 28],
      [38, 30],
      [36, 31],
      [34, 30],
    ],
    'F',
    true,
  );
  rect(35, 26, 2, 2, 'G');
  px(38, 28, 'E');
  px(36, 29, 'D');
  // Baggy trousers: rear leg slopes left; forward leg bends right at the knee.
  poly(
    [
      [26, 41],
      [33, 43],
      [32, 49],
      [27, 55],
      [23, 61],
      [15, 63],
      [12, 60],
      [18, 54],
      [22, 48],
    ],
    'J',
    true,
  );
  poly(
    [
      [24, 46],
      [27, 45],
      [27, 50],
      [21, 57],
      [17, 60],
      [14, 60],
      [20, 53],
    ],
    'K',
  );
  poly(
    [
      [31, 44],
      [31, 48],
      [26, 54],
      [21, 61],
      [18, 62],
      [22, 56],
      [25, 50],
    ],
    'I',
  );
  poly(
    [
      [33, 41],
      [39, 42],
      [43, 47],
      [48, 52],
      [49, 57],
      [46, 63],
      [40, 62],
      [39, 57],
      [35, 53],
      [30, 49],
    ],
    'J',
    true,
  );
  poly(
    [
      [36, 44],
      [39, 45],
      [43, 49],
      [46, 52],
      [46, 55],
      [42, 53],
      [38, 49],
    ],
    'K',
  );
  poly(
    [
      [33, 46],
      [36, 48],
      [41, 53],
      [45, 54],
      [47, 53],
      [47, 56],
      [43, 56],
      [39, 53],
    ],
    'H',
  );
  poly(
    [
      [42, 58],
      [47, 57],
      [46, 61],
      [42, 62],
      [40, 60],
    ],
    'I',
  );
  poly(
    [
      [15, 61],
      [22, 60],
      [22, 63],
      [17, 65],
      [13, 63],
    ],
    'I',
    true,
  );
  poly(
    [
      [40, 61],
      [46, 60],
      [48, 63],
      [43, 65],
      [40, 64],
    ],
    'I',
    true,
  );
  // Belt knot and two sash tails, in front of trousers.
  poly(
    [
      [25, 40],
      [37, 40],
      [38, 42],
      [26, 43],
      [24, 42],
    ],
    'N',
    true,
  );
  rect(28, 40, 8, 1, 'O');
  rect(27, 42, 9, 1, 'M');
  poly(
    [
      [25, 42],
      [28, 43],
      [24, 49],
      [20, 52],
      [17, 52],
      [19, 49],
      [22, 47],
    ],
    'N',
    true,
  );
  poly(
    [
      [24, 44],
      [25, 44],
      [22, 49],
      [19, 51],
      [20, 49],
    ],
    'O',
  );
  poly(
    [
      [27, 43],
      [29, 44],
      [28, 53],
      [26, 57],
      [23, 54],
      [25, 48],
    ],
    'N',
    true,
  );
  poly(
    [
      [27, 45],
      [28, 45],
      [27, 52],
      [25, 55],
      [25, 51],
    ],
    'O',
  );
  // White shin wraps; both feet share baseline y76.
  poly(
    [
      [15, 64],
      [21, 64],
      [19, 69],
      [17, 73],
      [11, 73],
      [12, 69],
    ],
    'R',
    true,
  );
  poly(
    [
      [15, 65],
      [18, 65],
      [16, 70],
      [14, 72],
      [12, 72],
    ],
    'S',
  );
  poly(
    [
      [17, 67],
      [20, 66],
      [19, 68],
      [16, 69],
    ],
    'Q',
  );
  poly(
    [
      [13, 70],
      [17, 69],
      [17, 71],
      [12, 72],
    ],
    'P',
  );
  poly(
    [
      [42, 65],
      [47, 64],
      [47, 69],
      [50, 73],
      [44, 74],
      [41, 71],
    ],
    'R',
    true,
  );
  poly(
    [
      [44, 65],
      [46, 65],
      [45, 69],
      [48, 72],
      [45, 73],
      [43, 70],
    ],
    'S',
  );
  poly(
    [
      [42, 67],
      [46, 67],
      [46, 68],
      [43, 69],
    ],
    'Q',
  );
  poly(
    [
      [44, 71],
      [48, 70],
      [49, 72],
      [45, 73],
    ],
    'P',
  );
  poly(
    [
      [10, 72],
      [16, 72],
      [18, 74],
      [22, 74],
      [22, 76],
      [7, 76],
      [7, 74],
    ],
    'F',
    true,
  );
  poly(
    [
      [43, 73],
      [49, 72],
      [51, 74],
      [57, 74],
      [58, 76],
      [42, 76],
    ],
    'F',
    true,
  );
  rect(7, 76, 16, 1, 'M');
  rect(42, 76, 17, 1, 'M');
  poly(
    [
      [10, 72],
      [15, 72],
      [18, 74],
      [16, 75],
      [12, 74],
      [8, 75],
    ],
    'B',
  );
  poly(
    [
      [43, 73],
      [46, 72],
      [50, 74],
      [48, 75],
      [44, 74],
    ],
    'B',
  );
  rect(9, 74, 2, 1, 'G');
  rect(13, 74, 2, 1, 'G');
  rect(51, 74, 3, 1, 'G');
  // Face and swept hair, drawn last so the jaw reads over the collar.
  poly(
    [
      [31, 9],
      [38, 9],
      [41, 12],
      [41, 15],
      [43, 16],
      [41, 17],
      [40, 20],
      [37, 22],
      [33, 20],
      [30, 17],
      [29, 13],
    ],
    'F',
    true,
  );
  poly(
    [
      [32, 11],
      [36, 10],
      [39, 12],
      [39, 15],
      [41, 16],
      [39, 17],
      [39, 19],
      [36, 20],
      [33, 18],
    ],
    'G',
  );
  poly(
    [
      [30, 12],
      [32, 12],
      [32, 16],
      [34, 19],
      [33, 20],
      [30, 17],
    ],
    'E',
  );
  rect(31, 13, 2, 3, 'F');
  px(32, 14, 'D');
  // Angular goatee and a single clear eye.
  poly(
    [
      [34, 18],
      [36, 19],
      [39, 19],
      [40, 18],
      [40, 21],
      [37, 23],
      [34, 21],
    ],
    'B',
  );
  rect(37, 20, 2, 1, 'F');
  px(39, 19, 'G');
  rect(37, 12, 4, 1, 'A');
  rect(38, 13, 3, 2, 'S');
  rect(40, 13, 1, 2, 'A');
  px(41, 16, 'E');
  rect(39, 18, 2, 1, 'D');
  poly(
    [
      [27, 9],
      [28, 6],
      [30, 5],
      [30, 3],
      [33, 4],
      [34, 2],
      [36, 4],
      [39, 3],
      [40, 5],
      [43, 5],
      [42, 8],
      [44, 8],
      [42, 11],
      [38, 10],
      [35, 9],
      [32, 11],
    ],
    'B',
    true,
  );
  poly(
    [
      [29, 7],
      [32, 5],
      [35, 5],
      [34, 6],
      [38, 6],
      [40, 8],
      [36, 7],
      [34, 8],
      [31, 8],
    ],
    'C',
  );
  poly(
    [
      [29, 9],
      [35, 8],
      [39, 9],
      [41, 9],
      [41, 11],
      [36, 10],
      [31, 12],
      [28, 12],
    ],
    'N',
    true,
  );
  poly(
    [
      [29, 9],
      [35, 9],
      [36, 10],
      [30, 11],
    ],
    'O',
  );
  rect(33, 11, 2, 3, 'A');
  px(34, 10, 'B');
  rect(37, 12, 3, 1, 'A');
  px(38, 13, 'S');
  px(39, 13, 'A');
  px(39, 14, 'A');
}

if (grid.length !== H || grid.some((row) => row.length !== W)) throw new Error('Grid must be 64x80');
const rgba = Buffer.alloc(W * H * 4);
const used = new Set();
let minY = H;
let maxY = -1;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const c = grid[y][x];
    if (c === '.') continue;
    if (!palette[c]) throw new Error(`Unknown colour ${c}`);
    const rgb = parseInt(palette[c].slice(1), 16);
    const i = (y * W + x) * 4;
    rgba[i] = rgb >> 16;
    rgba[i + 1] = (rgb >> 8) & 255;
    rgba[i + 2] = rgb & 255;
    rgba[i + 3] = 255;
    used.add(c);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
const output = fileURLToPath(new URL('apps/game/public/assets/experiments/taiko-grid-v3.png', root));
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .png()
  .toFile(output);
// Verify encoding round-trip: the PNG delivered to Phaser contains precisely our authored pixels.
const decoded = await sharp(output).ensureAlpha().raw().toBuffer();
if (!decoded.equals(rgba)) throw new Error('PNG changed authored pixels');
writeFileSync(new URL('pixels.txt', folder), grid.map((row) => row.join('')).join('\n') + '\n');
writeFileSync(new URL('palette.json', folder), JSON.stringify(palette, null, 2) + '\n');
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .resize(W * 6, H * 6, { kernel: 'nearest' })
  .png()
  .toFile(fileURLToPath(new URL('sprite-6x.png', folder)));
console.log(
  JSON.stringify({
    output,
    frame: [W, H],
    figureHeight: maxY - minY + 1,
    minY,
    maxY,
    colours: used.size,
    pixelRoundTrip: 'identical',
  }),
);
