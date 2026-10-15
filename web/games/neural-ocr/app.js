import {Network, makeSamples, normalize} from './model.js';
import {createNetworkView} from './view.js?v=a3e95d5b9628';

const $ = id => document.getElementById(id);
const samples = makeSamples();
const MAX_STEPS = 100 * samples.length;
let net = new Network(), steps = 0, running = false, timer = 0;
let selected = 0, input = samples[0].pixels, target = 0, hasInput = true;
let history = [], selectedNeuron = 0, lastSlowStep = 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const drawNetwork = createNetworkView($('network'), $('neuron-controls'), h => {
  selectedNeuron = h; $('neuron').value = h; render();
});
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

function renderNetwork(output) {
  drawNetwork({net, input, output, selectedNeuron, hasInput});
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
  const trainLabel = finished ? 'Naučeno' : running ? 'Pozastavit' : 'Nauč se';
  // WebKit can drop a click if its text node changes between pointer down and up.
  if ($('train').textContent !== trainLabel) $('train').textContent = trainLabel;
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
