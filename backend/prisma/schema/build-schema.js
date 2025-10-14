import fs from 'fs';
import path from 'path';

const partsDir = path.resolve('prisma/parts');
const outFile  = path.resolve('prisma/schema.prisma');

const files = fs.readdirSync(partsDir)
  .filter(f => f.endsWith('.prisma'))
  .sort(); // ใช้เลขนำหน้าไฟล์เป็นลำดับรวม

const content = files
  .map(f => `// >>> ${f}\n${fs.readFileSync(path.join(partsDir, f), 'utf8')}\n`)
  .join('\n');

fs.writeFileSync(outFile, content);
console.log(`[schema] Built -> ${outFile}`);
