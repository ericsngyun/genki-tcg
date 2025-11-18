const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/admin-web/src/app/dashboard/events/[id]/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Skip comments and strings (simple approach)
  const cleaned = line.replace(/\/\/.*/g, '').replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').replace(/`[^`]*`/g, '');

  for (const ch of cleaned) {
    if (ch === '{') braceCount++;
    if (ch === '}') braceCount--;
    if (ch === '(') parenCount++;
    if (ch === ')') parenCount--;
    if (ch === '[') bracketCount++;
    if (ch === ']') bracketCount--;
  }

  if (i >= 340 && i <= 350) {
    console.log(`Line ${i+1}: {${braceCount}} (${parenCount}) [${bracketCount}] => ${line.trim().substring(0, 60)}`);
  }
}

console.log('\nFinal counts:');
console.log(`Braces: ${braceCount}`);
console.log(`Parens: ${parenCount}`);
console.log(`Brackets: ${bracketCount}`);
