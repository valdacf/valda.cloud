import test from 'node:test';
import assert from 'node:assert/strict';
import {Network} from '../web/games/neural-ocr/model.js';
import {encodeFP8, decodeFP8, quantizeNetwork} from '../web/games/neural-ocr/precision.js';

test('E4M3 uses subnormals, round-to-nearest-even, sign, and finite saturation', () => {
  assert.equal(typeof encodeFP8, 'function');
  for (const [value, code, rounded] of [[0,0,0],[1/512,1,1/512],[1/1024,0,0],[3/1024,2,1/256],
    [1,56,1],[1.0625,56,1],[1.1875,58,1.25],[-1.1875,186,-1.25],[448,126,448],[500,126,448],[-Infinity,254,-448]]) {
    assert.equal(encodeFP8(value),code,`encode ${value}`);
    assert.equal(decodeFP8(code),rounded);
  }
  assert.ok(Object.is(decodeFP8(encodeFP8(-0)),-0));
  assert.ok(Number.isNaN(decodeFP8(encodeFP8(NaN))));
});

test('all finite FP8 encodings round-trip and both NaN codes decode as NaN', () => {
  assert.equal(typeof decodeFP8, 'function');
  for (let code=0;code<256;code++) {
    const value=decodeFP8(code);
    if ((code & 127) === 127) assert.ok(Number.isNaN(value));
    else assert.equal(encodeFP8(value),code);
  }
});

test('FP8 inference rounds both weight layers and biases without changing the trained model', () => {
  assert.equal(typeof quantizeNetwork, 'function');
  const net = new Network();
  for (const key of ['w1','w2','b1','b2']) net[key].fill(1.0625);
  const saved = JSON.stringify(net), low = quantizeNetwork(net);
  for (const key of ['w1','w2','b1','b2']) assert.ok(low[key].every(v=>v===1));
  const output=low.forward(new Float64Array(256));
  assert.ok(output.hidden.every(v=>Math.abs(v-1/(1+Math.exp(-1)))<1e-12));
  assert.ok(output.probabilities.every(v=>Math.abs(v-.1)<1e-12));
  assert.equal(JSON.stringify(net),saved);
  low.w1[0]=99;
  assert.equal(net.w1[0],1.0625);
});

test('quantized predictions differ from FP64 and returning to FP64 preserves its exact prediction', () => {
  assert.equal(typeof quantizeNetwork, 'function');
  const net=new Network(), input=new Float64Array(256).fill(.3);
  const original=net.forward(input);
  const reduced=quantizeNetwork(net).forward(input);
  assert.notDeepEqual(reduced.probabilities, original.probabilities);
  assert.deepEqual(net.forward(input),original);
});
