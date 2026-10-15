import test from 'node:test';
import assert from 'node:assert/strict';
import {Network, makeSamples, normalize} from '../web/games/neural-ocr/model.js';

test('samples contain five distinct nonempty normalized images for every digit', () => {
  assert.equal(typeof makeSamples, 'function');
  const samples = makeSamples();
  assert.equal(samples.length, 50);
  for (let label = 0; label < 10; label++) {
    const images = samples.filter(s => s.label === label).map(s => Array.from(s.pixels));
    assert.equal(images.length, 5);
    assert.equal(new Set(images.map(p => JSON.stringify(p))).size, 5);
    for (const pixels of images) {
      assert.equal(pixels.length, 256);
      assert.ok(pixels.every(p => p >= 0 && p <= 1));
      assert.ok(pixels.reduce((a, b) => a + b, 0) > 5);
    }
  }
  assert.deepEqual(makeSamples(), samples);
});

test('normalization centers a stroke, keeps its aspect ratio, and handles blank input', () => {
  assert.equal(typeof normalize, 'function');
  assert.deepEqual(Array.from(normalize(new Float64Array(400), 20, 20)), Array(256).fill(0));
  const source = new Float64Array(400);
  for (let y = 2; y < 14; y++) source[y * 20 + 3] = 1;
  const result = normalize(source, 20, 20);
  const points = [...result.keys()].filter(i => result[i] > .1);
  const xs = points.map(i => i % 16), ys = points.map(i => Math.floor(i / 16));
  assert.ok(Math.max(...xs) - Math.min(...xs) <= 2);
  assert.ok(Math.max(...ys) - Math.min(...ys) >= 11);
  assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 7.5) <= .5);
});

test('forward pass returns finite normalized scores without changing model state', () => {
  assert.equal(typeof Network, 'function');
  const net = new Network(42), pixels = new Float64Array(256).fill(1);
  const before = JSON.stringify(net);
  const output = net.forward(pixels);
  assert.equal(output.hidden.length, 24);
  assert.equal(output.probabilities.length, 10);
  assert.ok(output.probabilities.every(p => Number.isFinite(p) && p > 0 && p < 1));
  assert.ok(Math.abs(output.probabilities.reduce((a, b) => a + b) - 1) < 1e-12);
  assert.equal(JSON.stringify(net), before);
  assert.deepEqual(new Network(42).forward(pixels), output);
});

test('one gradient update lowers the target loss and adjusts both layers', () => {
  assert.equal(typeof Network, 'function');
  const net = new Network(7), pixels = new Float64Array(256).fill(.4);
  const a = Array.from(net.w1), b = Array.from(net.w2);
  const before = -Math.log(net.forward(pixels).probabilities[3]);
  const loss = net.train(pixels, 3);
  assert.ok(Math.abs(loss - before) < 1e-12);
  assert.ok(-Math.log(net.forward(pixels).probabilities[3]) < before);
  assert.notDeepEqual(Array.from(net.w1), a);
  assert.notDeepEqual(Array.from(net.w2), b);
});

test('training learns all ten classes instead of predicting one majority class', () => {
  assert.equal(typeof Network, 'function');
  const net = new Network(42), samples = makeSamples();
  const score = () => samples.reduce((sum, s) => sum - Math.log(net.forward(s.pixels).probabilities[s.label]), 0) / 50;
  const before = score();
  for (let epoch = 0; epoch < 100; epoch++) {
    for (let i = 0; i < 50; i++) {
      const s = samples[(i * 17 + epoch * 13) % 50];
      net.train(s.pixels, s.label);
    }
  }
  assert.ok(score() < before * .2);
  for (let label = 0; label < 10; label++) {
    const correct = samples.filter(s => s.label === label).filter(s => {
      const p = net.forward(s.pixels).probabilities;
      return p.indexOf(Math.max(...p)) === label;
    }).length;
    assert.ok(correct >= 4, `digit ${label}: only ${correct}/5 learned`);
  }
});
