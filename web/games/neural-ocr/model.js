export const SIZE = 16;
export const HIDDEN = 24;
export const CLASSES = 10;

export function normalize(source, width, height) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (source[y * width + x] > .05) {
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  const result = new Float64Array(256);
  if (right < left) return result;
  const w = right - left + 1, h = bottom - top + 1;
  const scale = 12 / Math.max(w, h);
  const ox = (16 - w * scale) / 2, oy = (16 - h * scale) / 2;
  // Area sampling preserves thin strokes when a large drawing becomes sixteen pixels.
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const value = source[y * width + x];
    if (!value) continue;
    const x0 = ox + (x - left) * scale, y0 = oy + (y - top) * scale;
    const x1 = x0 + scale, y1 = y0 + scale;
    for (let ty = Math.floor(y0); ty < Math.ceil(y1); ty++) {
      for (let tx = Math.floor(x0); tx < Math.ceil(x1); tx++) {
        if (tx < 0 || tx > 15 || ty < 0 || ty > 15) continue;
        const area = Math.max(0, Math.min(tx + 1, x1) - Math.max(tx, x0)) *
          Math.max(0, Math.min(ty + 1, y1) - Math.max(ty, y0));
        result[ty * 16 + tx] += value * area;
      }
    }
  }
  return result.map(v => Math.min(1, v));
}

const STROKES = [
  [[[8,2],[4,3],[2,7],[2,12],[5,15],[9,15],[12,12],[13,7],[11,3],[8,2]]],
  [[[4,6],[8,2],[8,15]],[[4,15],[12,15]]],
  [[[2,5],[4,2],[9,2],[12,4],[12,7],[2,15],[13,15]]],
  [[[2,3],[7,2],[12,4],[11,7],[7,8],[11,9],[13,12],[10,15],[5,15],[2,13]]],
  [[[10,15],[10,2],[2,11],[14,11]]],
  [[[12,2],[3,2],[3,8],[8,7],[12,9],[13,12],[10,15],[5,15],[2,13]]],
  [[[12,3],[8,2],[4,5],[2,10],[3,14],[7,15],[11,14],[13,11],[11,8],[7,8],[3,10]]],
  [[[2,2],[13,2],[8,9],[6,15]]],
  [[[7,8],[3,6],[3,3],[7,2],[11,3],[12,6],[7,8],[2,11],[3,14],[7,15],[12,14],[13,11],[7,8]]],
  [[[12,8],[8,9],[4,8],[2,5],[4,2],[8,2],[12,4],[12,10],[9,14],[5,15]]]
];

export function makeSamples() {
  const samples = [];
  for (let label = 0; label < 10; label++) for (let variant = 0; variant < 5; variant++) {
    const raster = new Float64Array(64 * 64);
    const tilt = (variant - 2) * .075;
    const strokes = STROKES[label].map(stroke => stroke.map(([x, y], i) => [
      (x + tilt * (y - 8) + Math.sin(i * 2 + variant) * .24 * variant) * 3.3 + 5,
      (y + Math.cos(i + variant) * .18 * variant) * 3.3 + 3
    ]));
    const radius = 2.1 + variant * .22;
    for (const stroke of strokes) for (let i = 1; i < stroke.length; i++) {
      const [ax, ay] = stroke[i - 1], [bx, by] = stroke[i];
      const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length));
        const distance = Math.hypot(x - ax - t * dx, y - ay - t * dy);
        raster[y * 64 + x] = Math.max(raster[y * 64 + x], Math.max(0, Math.min(1, radius + .5 - distance)));
      }
    }
    samples.push({label, pixels: normalize(raster, 64, 64)});
  }
  return samples;
}

export class Network {
  constructor(seed = 42) {
    let state = seed >>> 0;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    this.w1 = Float64Array.from({length: 256 * 24}, () => (random() * 2 - 1) * Math.sqrt(6 / 280));
    this.w2 = Float64Array.from({length: 24 * 10}, () => (random() * 2 - 1) * Math.sqrt(6 / 34));
    this.b1 = new Float64Array(24);
    this.b2 = new Float64Array(10);
  }

  forward(pixels) {
    const hidden = new Float64Array(24), probabilities = new Float64Array(10);
    for (let h = 0; h < 24; h++) {
      let sum = this.b1[h];
      for (let i = 0; i < 256; i++) sum += pixels[i] * this.w1[h * 256 + i];
      hidden[h] = 1 / (1 + Math.exp(-sum));
    }
    for (let o = 0; o < 10; o++) {
      let sum = this.b2[o];
      for (let h = 0; h < 24; h++) sum += hidden[h] * this.w2[o * 24 + h];
      probabilities[o] = sum;
    }
    const max = Math.max(...probabilities);
    let total = 0;
    for (let o = 0; o < 10; o++) total += probabilities[o] = Math.exp(probabilities[o] - max);
    for (let o = 0; o < 10; o++) probabilities[o] /= total;
    return {hidden, probabilities};
  }

  train(pixels, label, rate = .12) {
    const {hidden, probabilities} = this.forward(pixels);
    const loss = -Math.log(Math.max(1e-15, probabilities[label]));
    const dh = new Float64Array(24);
    for (let o = 0; o < 10; o++) {
      const delta = probabilities[o] - (o === label ? 1 : 0);
      for (let h = 0; h < 24; h++) {
        dh[h] += delta * this.w2[o * 24 + h];
        this.w2[o * 24 + h] -= rate * delta * hidden[h];
      }
      this.b2[o] -= rate * delta;
    }
    for (let h = 0; h < 24; h++) {
      const delta = dh[h] * hidden[h] * (1 - hidden[h]);
      for (let i = 0; i < 256; i++) this.w1[h * 256 + i] -= rate * delta * pixels[i];
      this.b1[h] -= rate * delta;
    }
    return loss;
  }
}
