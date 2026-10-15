import {Network, makeSamples, normalize} from './model.js';

const $ = id => document.getElementById(id);
const samples = makeSamples();
const MAX_STEPS = 100 * samples.length;
let net = new Network(), steps = 0, running = false, timer = 0;
let selected = 0, input = samples[0].pixels, target = 0, hasInput = true;
let history = [], selectedNeuron = 0, lastSlowStep = 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const graph = $('network').getContext('2d');
const draw = $('draw'), pen = draw.getContext('2d', {willReadFrequently: true});
let pointer = null, lastPoint = null, drawFrame = 0;
const sampleButtons = [], scoreElements = [];

function pixelsToCanvas(canvas, pixels, signed = false) {
  const context = canvas.getContext('2d'), cell = canvas.width / 16;
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 256; i++) {
    const v = pixels[i], strength = signed ? Math.min(1, Math.abs(v) * 1.4) : v;
    const color = signed && v < 0 ? [236, 146, 175] : [154, 236, 195];
    context.fillStyle = `rgb(${color.map((c, j) => Math.round([16, 26, 35][j] + (c - [16, 26, 35][j]) * strength)).join(',')})`;
    context.fillRect((i % 16) * cell, Math.floor(i / 16) * cell, cell, cell);
  }
}

for (let label = 0; label < 10; label++) {
  const column = document.createElement('div'); column.className = 'sample-column';
  const title = document.createElement('span'); title.textContent = label; column.append(title);
  for (let variant = 0; variant < 5; variant++) {
    const index = label * 5 + variant, button = document.createElement('button');
    button.type = 'button'; button.className = 'sample-button';
    button.setAttribute('aria-label', `Číslice ${label}, varianta ${variant + 1}`);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    canvas.setAttribute('aria-hidden', 'true'); pixelsToCanvas(canvas, samples[index].pixels);
    button.append(canvas); column.append(button); sampleButtons.push(button);
    button.addEventListener('click', () => { pause(); chooseSample(index); render(); });
  }
  $('samples').append(column);
  const score = document.createElement('div'); score.className = 'score';
  const track = document.createElement('div'); track.className = 'bar-track';
  const bar = document.createElement('div'); bar.className = 'bar'; track.append(bar);
  const digit = document.createElement('span'); digit.textContent = label;
  const value = document.createElement('small'); value.textContent = '—';
  score.append(track, digit, value); $('scores').append(score);
  scoreElements.push({score, bar, value});
}
for (let h = 0; h < 24; h++) {
  const option = document.createElement('option'); option.value = h; option.textContent = `Neuron ${h + 1}`;
  $('neuron').append(option);
}
$('neuron').addEventListener('change', () => { selectedNeuron = Number($('neuron').value); render(); });

function chooseSample(index) {
  selected = index; input = samples[index].pixels; target = samples[index].label; hasInput = true;
  $('input-name').textContent = `Vzor: číslice ${target}`;
}

function line(ax, ay, bx, by, weight, activity, emphasize = false) {
  const alpha = Math.min(.75, .04 + Math.abs(weight) * .18 + activity * .1);
  graph.strokeStyle = weight >= 0 ? `rgba(154,236,195,${alpha})` : `rgba(236,146,175,${alpha})`;
  graph.lineWidth = emphasize ? 1 + Math.min(2, Math.abs(weight)) : .45 + Math.min(1.5, Math.abs(weight) * .7);
  graph.beginPath(); graph.moveTo(ax, ay); graph.lineTo(bx, by); graph.stroke();
}

function renderNetwork(output) {
  graph.clearRect(0, 0, 900, 390);
  const hiddenPoint = h => ({x: 450 + (h % 2) * 65, y: 28 + Math.floor(h / 2) * 30});
  const inputPoint = i => ({x: 20 + (i % 16) * 13, y: 88 + Math.floor(i / 16) * 13});
  for (let h = 0; h < 24; h++) {
    const end = hiddenPoint(h);
    for (let k = 0; k < 5; k++) {
      const i = (h * 31 + k * 53) % 256, start = inputPoint(i);
      line(start.x + 6, start.y + 6, end.x, end.y, net.w1[h * 256 + i], input[i], h === selectedNeuron);
    }
    for (let o = 0; o < 10; o++) {
      if (h !== selectedNeuron && h % 3 !== 0) continue;
      line(end.x, end.y, 810, 33 + o * 36, net.w2[o * 24 + h], output.hidden[h], h === selectedNeuron);
    }
  }
  for (let i = 0; i < 256; i++) {
    const p = inputPoint(i), v = input[i];
    graph.fillStyle = `rgb(${28 + v * 126},${43 + v * 193},${53 + v * 142})`;
    graph.fillRect(p.x, p.y, 11, 11);
  }
  for (let h = 0; h < 24; h++) {
    const p = hiddenPoint(h), v = output.hidden[h];
    graph.beginPath(); graph.arc(p.x, p.y, 10, 0, Math.PI * 2);
    graph.fillStyle = `rgb(${26 + v * 128},${49 + v * 187},${49 + v * 146})`; graph.fill();
    graph.strokeStyle = h === selectedNeuron ? '#f2f8ef' : '#597d73';
    graph.lineWidth = h === selectedNeuron ? 2 : 1; graph.stroke();
  }
  graph.font = '14px monospace'; graph.textAlign = 'center'; graph.textBaseline = 'middle';
  for (let o = 0; o < 10; o++) {
    const p = hasInput ? output.probabilities[o] : 0, y = 33 + o * 36;
    graph.beginPath(); graph.arc(810, y, 14, 0, Math.PI * 2);
    graph.fillStyle = `rgb(${25 + p * 129},${45 + p * 191},${48 + p * 147})`; graph.fill();
    graph.strokeStyle = '#55766b'; graph.lineWidth = 1; graph.stroke();
    graph.fillStyle = p > .5 ? '#123629' : '#d2e4dd'; graph.fillText(o, 810, y);
    graph.fillStyle = '#a6babf'; graph.textAlign = 'left';
    graph.fillText(hasInput ? `${Math.round(p * 100)}%` : '—', 838, y); graph.textAlign = 'center';
  }
  pixelsToCanvas($('weights'), net.w1.subarray(selectedNeuron * 256, (selectedNeuron + 1) * 256), true);
  $('neuron-value').textContent = `Aktivace: ${output.hidden[selectedNeuron].toFixed(3)} · bias: ${net.b1[selectedNeuron].toFixed(3)}`;
}

function render() {
  const output = net.forward(input), probabilities = output.probabilities;
  const best = probabilities.indexOf(Math.max(...probabilities));
  renderNetwork(output);
  $('steps').textContent = steps;
  $('epochs').textContent = Math.floor(steps / 50);
  const finished = steps >= MAX_STEPS;
  $('status').textContent = finished ? 'Dokončeno · 100 průchodů' : running ? 'Síť se učí…' : steps ? 'Pozastaveno' : 'Nenatrénováno';
  $('train').textContent = finished ? 'Naučeno' : running ? 'Pozastavit' : 'Nauč se';
  $('train').disabled = finished;
  $('step').disabled = running || finished;
  $('result-source').textContent = target === null ? 'TIP SÍTĚ · TVOJE KRESBA' : `TIP SÍTĚ · VZOR ${target}`;
  $('prediction').textContent = hasInput ? best : '—';
  $('prediction-note').textContent = !hasInput ? 'Nakresli číslici nebo vyber vzor z učebnice.' :
    !steps ? 'Zatím náhodný tip. Síť ještě neviděla žádný učební příklad.' :
    target === null ? `Nejsilnější skóre: ${Math.round(probabilities[best] * 100)} %. Zkus i jiný rukopis.` :
    `Správně je ${target}. ${best === target ? 'Tentokrát se trefila.' : 'Zatím se netrefila.'} Skóre tipu: ${Math.round(probabilities[best] * 100)} %.`;
  $('sample-loss').textContent = target === null || !hasInput ? 'Vlastní kresba · bez hodnocení' :
    `Chyba vzoru: ${(-Math.log(Math.max(1e-15, probabilities[target]))).toFixed(3)}`;
  scoreElements.forEach(({score, bar, value}, i) => {
    score.classList.toggle('winner', hasInput && i === best);
    bar.style.height = `${hasInput ? probabilities[i] * 100 : 0}%`;
    value.textContent = hasInput ? `${Math.round(probabilities[i] * 100)}%` : '—';
  });
  sampleButtons.forEach((button, i) => {
    button.classList.toggle('active', selected === i);
    button.setAttribute('aria-pressed', selected === i ? 'true' : 'false');
  });
}

function metrics() {
  let correct = 0, loss = 0;
  for (const sample of samples) {
    const p = net.forward(sample.pixels).probabilities;
    correct += p.indexOf(Math.max(...p)) === sample.label ? 1 : 0;
    loss -= Math.log(Math.max(1e-15, p[sample.label]));
  }
  loss /= samples.length;
  $('accuracy').textContent = `${Math.round(correct * 2)} %`;
  $('loss').textContent = loss.toFixed(3);
  history.push(loss); if (history.length > 120) history.shift();
  const ctx = $('history').getContext('2d'); ctx.clearRect(0, 0, 900, 100);
  ctx.strokeStyle = '#2c3b48'; ctx.lineWidth = 1;
  for (const y of [10, 45, 80]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(900, y); ctx.stroke(); }
  const max = Math.max(.1, ...history);
  ctx.strokeStyle = '#9aecc3'; ctx.lineWidth = 2; ctx.beginPath();
  history.forEach((v, i) => {
    const x = 5 + i / Math.max(1, history.length - 1) * 890, y = 80 - v / max * 70;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = '#9aaeb9'; ctx.font = '11px monospace'; ctx.fillText(`0 — ${max.toFixed(2)}`, 5, 98);
}

function learnOne() {
  if (steps >= MAX_STEPS) return;
  const epoch = Math.floor(steps / 50), index = ((steps % 50) * 17 + epoch * 13) % 50;
  chooseSample(index); net.train(input, target); steps++;
  if (steps % 50 === 0) metrics();
}
function pause() {
  running = false; cancelAnimationFrame(timer); timer = 0;
}
function tick(now) {
  if (!running) return;
  const speed = $('speed').value;
  if (speed !== 'slow' || now - lastSlowStep >= 600) {
    const start = performance.now(), count = speed === 'fast' ? 50 : speed === 'normal' ? 5 : 1;
    for (let i = 0; i < count; i++) { learnOne(); if (performance.now() - start > 8) break; }
    lastSlowStep = now;
    if (steps >= MAX_STEPS) pause();
    render();
  }
  if (running) timer = requestAnimationFrame(tick);
}
$('train').addEventListener('click', () => {
  if (running) pause(); else { flushDrawing(); running = true; lastSlowStep = 0; timer = requestAnimationFrame(tick); }
  render();
});
$('step').addEventListener('click', () => { flushDrawing(); pause(); learnOne(); render(); });
$('reset').addEventListener('click', () => {
  pause(); flushDrawing(); net = new Network(); steps = 0; history = []; metrics(); render();
});

function flushDrawing() {
  if (drawFrame) { cancelAnimationFrame(drawFrame); drawFrame = 0; readDrawing(); }
}
function readDrawing() {
  drawFrame = 0;
  const rgba = pen.getImageData(0, 0, 256, 256).data, raster = new Float64Array(256 * 256);
  for (let i = 0; i < raster.length; i++) raster[i] = rgba[i * 4 + 3] / 255;
  input = normalize(raster, 256, 256); target = null; selected = -1;
  hasInput = input.some(v => v > .01);
  $('input-name').textContent = 'Tvoje kresba'; $('draw-hint').hidden = hasInput;
  render();
}
function point(event) {
  const rect = draw.getBoundingClientRect();
  return {x: Math.max(0, Math.min(256, (event.clientX - rect.left) * 256 / rect.width)),
    y: Math.max(0, Math.min(256, (event.clientY - rect.top) * 256 / rect.height))};
}
function stroke(p) {
  pause();
  pen.strokeStyle = '#d7f5e5'; pen.fillStyle = '#d7f5e5'; pen.lineWidth = 17; pen.lineCap = 'round'; pen.lineJoin = 'round';
  pen.beginPath(); pen.moveTo(lastPoint.x, lastPoint.y); pen.lineTo(p.x, p.y); pen.stroke();
  pen.beginPath(); pen.arc(p.x, p.y, 8.5, 0, Math.PI * 2); pen.fill();
  lastPoint = p;
  if (!drawFrame) drawFrame = requestAnimationFrame(readDrawing);
}
draw.addEventListener('pointerdown', event => {
  if (pointer !== null || event.button !== 0) return;
  pause(); pointer = event.pointerId; draw.setPointerCapture(pointer);
  lastPoint = point(event); stroke(lastPoint); event.preventDefault();
});
draw.addEventListener('pointermove', event => { if (event.pointerId === pointer) stroke(point(event)); });
function endStroke(event) {
  if (event.pointerId !== pointer) return;
  pointer = null; lastPoint = null; flushDrawing();
}
draw.addEventListener('pointerup', endStroke);
draw.addEventListener('pointercancel', endStroke);
draw.addEventListener('lostpointercapture', endStroke);
$('clear').addEventListener('click', () => {
  pause(); cancelAnimationFrame(drawFrame); drawFrame = 0; pen.clearRect(0, 0, 256, 256); readDrawing();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && running) { pause(); render(); } });
if (reduceMotion) $('speed').value = 'slow';
metrics(); render();
