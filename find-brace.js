const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/admin-web/src/app/dashboard/events/[id]/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const prevBraceCount = braceCount;

  // Skip comments and strings (simple approach)
  const cleaned = line.replace(/\/\/.*/g, '').replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').replace(/`[^`]*`/g, '');

  for (const ch of cleaned) {
    if (ch === '{') braceCount++;
    if (ch === '}') braceCount--;
  }

  if (prevBraceCount !== braceCount) {
    console.log(`Line ${i+1}: ${prevBraceCount} -> ${braceCount} | ${line.trim().substring(0, 80)}`);
  }
}

console.log(`\nFinal brace count: ${braceCount} (should be 0)`);
