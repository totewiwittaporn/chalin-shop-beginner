// scripts/patch-imports.mjs
// Run from client/ folder: `node scripts/patch-imports.mjs`
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (EXTS.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

function patchContent(s) {
  let t = s;
  // Normalize common import strings from routes -> pages
  t = t.replaceAll('/routes/', '/pages/');
  t = t.replaceAll('\\routes\\', '\\pages\\');

  t = t.replaceAll("from './routes/", "from './pages/");
  t = t.replaceAll('from "./routes/', 'from "./pages/');

  t = t.replaceAll("from '../routes/", "from '../pages/");
  t = t.replaceAll('from "../routes/', 'from "../pages/');

  t = t.replaceAll("from '../../routes/", "from '../../pages/");
  t = t.replaceAll('from "../../routes/', 'from "../../pages/');

  return t;
}

function patchFile(fp) {
  const s = fs.readFileSync(fp, 'utf-8');
  const t = patchContent(s);
  if (t !== s) {
    fs.writeFileSync(fp, t);
    return true;
  }
  return false;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('ERROR: src/ not found. Run this from the client/ folder.');
    process.exit(1);
  }
  const files = walk(SRC);
  let changed = 0;
  for (const f of files) if (patchFile(f)) changed++;
  console.log(`Patched imports in ${changed} files.`);
}

main();
