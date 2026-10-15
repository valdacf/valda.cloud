export function decodeFP8(code) {
  const magnitude = code & 127, exponent = magnitude >> 3, fraction = magnitude & 7;
  if (magnitude === 127) return NaN;
  const value = exponent === 0 ? fraction / 512 : (1 + fraction / 8) * 2 ** (exponent - 7);
  return code & 128 ? -value : value;
}

const levels = Float64Array.from({length:127}, (_, code) => decodeFP8(code));

export function encodeFP8(value) {
  if (Number.isNaN(value)) return 127;
  const sign = value < 0 || Object.is(value, -0) ? 128 : 0;
  const magnitude = Math.abs(value);
  if (magnitude >= 448) return sign | 126;
  let low = 0, high = 126;
  while (low + 1 < high) {
    const mid = (low + high) >> 1;
    if (levels[mid] <= magnitude) low = mid;
    else high = mid;
  }
  const lowerDistance = magnitude - levels[low], upperDistance = levels[high] - magnitude;
  // E4M3 rounds halfway values to an encoding with an even least-significant bit.
  const code = lowerDistance < upperDistance || (lowerDistance === upperDistance && low % 2 === 0) ? low : high;
  return sign | code;
}

export function quantizeNetwork(source) {
  const snapshot = Object.create(Object.getPrototypeOf(source));
  for (const key of ['w1', 'w2', 'b1', 'b2']) {
    snapshot[key] = source[key].map(value => decodeFP8(encodeFP8(value)));
  }
  return snapshot;
}
