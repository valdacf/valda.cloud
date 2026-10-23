import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const script = new URL('../scripts/sync-navigation.mjs', import.meta.url);
test('navigation sync detects drift, updates nested pages, and preserves unrelated content', () => {
  const root = mkdtempSync(join(tmpdir(), 'navigation-'));
  try {
    mkdirSync(join(root, 'templates'));
    mkdirSync(join(root, 'web/book'), {recursive:true});
    const nav = '<nav class="site-nav" aria-label="Hlavní navigace"><a href="/">Domů</a></nav>';
    writeFileSync(join(root, 'templates/navigation.html'), nav);
    const page = join(root, 'web/book/index.html');
    writeFileSync(page, '<header>Before</header><nav class="site-nav">Old</nav><main>Book</main>');
    writeFileSync(join(root, 'web/game.html'), '<main>Game without site menu</main>');
    const run = (...args) => spawnSync(process.execPath, [script.pathname, ...args], {cwd:root, encoding:'utf8'});
    assert.equal(run('--check').status, 1);
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(page, 'utf8'), '<header>Before</header>'+nav+'<main>Book</main>');
    assert.equal(readFileSync(join(root,'web/game.html'),'utf8'), '<main>Game without site menu</main>');
    assert.equal(run('--check').status, 0);
    assert.equal(run().status, 0);
    assert.equal(readFileSync(page,'utf8'), '<header>Before</header>'+nav+'<main>Book</main>');
  } finally { rmSync(root, {recursive:true, force:true}); }
});
test('all site pages use the shared navigation template', () => {
  const result = spawnSync(process.execPath, [script.pathname, '--check'], {cwd:new URL('..',import.meta.url), encoding:'utf8'});
  assert.equal(result.status, 0, result.stdout+result.stderr);
});
