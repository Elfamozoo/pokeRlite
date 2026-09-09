const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const pokeDir = path.join(rootDir, 'js/poke');

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllJsFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = getAllJsFiles(pokeDir);

const nonDetPatterns = [
  { name: 'Math.random', regex: /Math\.random\s*\(/g },
  { name: 'Date.now', regex: /Date\.now\s*\(/g },
  { name: 'new Date', regex: /new\s+Date\b/g },
  { name: 'Date()', regex: /\bDate\s*\(/g },
  { name: 'performance.now', regex: /performance\.now\s*\(/g },
  { name: 'crypto', regex: /\bcrypto\b/g }
];

console.log('=== SCANNING ALL JS FILES FOR NON-DETERMINISTIC CALLS ===');
allFiles.forEach(file => {
  const rel = path.relative(rootDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Skip pure comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
    for (const pat of nonDetPatterns) {
      if (pat.regex.test(line)) {
        console.log(`[NON-DET] ${rel}:${idx + 1} (${pat.name}) -> ${trimmed}`);
      }
      pat.regex.lastIndex = 0;
    }
  });
});
