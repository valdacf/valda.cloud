import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check')) {
  console.error('Usage: node scripts/sync-navigation.mjs [--check]');
  process.exit(2);
}
const check = args.includes('--check');
const template = readFileSync('templates/navigation.html', 'utf8').trim();
const pattern = /<nav class="site-nav"[^>]*>[\s\S]*?<\/nav>/g;
if (!/^<nav class="site-nav"[^>]*>[\s\S]*<\/nav>$/.test(template)) {
  throw new Error('The navigation template must contain one site-nav element.');
}
let changed = 0;
let matched = 0;
function visit(directory) {
  for (const entry of readdirSync(directory, {withFileTypes:true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { visit(path); continue; }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const source = readFileSync(path, 'utf8');
    const updated = source.replace(pattern, () => { matched++; return template; });
    if (updated === source) continue;
    changed++;
    console.log(`${check ? 'Outdated' : 'Updated'}: ${path}`);
    if (!check) writeFileSync(path, updated);
  }
}
visit('web');
if (!matched) throw new Error('No site navigation found under web/.');
console.log(`${matched} navigation instances checked; ${changed} ${check ? 'outdated' : 'updated'}.`);
if (check && changed) process.exitCode = 1;
