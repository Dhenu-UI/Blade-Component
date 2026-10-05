import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const jsonPath = path.join(process.cwd(), 'src', 'style', 'figma', 'json');

console.log('👀 Watching Figma token JSON files for changes...');

fs.watch(jsonPath, (eventType, filename) => {
  if (filename && filename.endsWith('.json')) {
    console.log(`🔄 Token file changed: ${filename}. Regenerating SCSS...`);
    exec('npx tsx src/tokens/figmaSyncTokens.ts', (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Error: ${stderr}`);
        return;
      }
      console.log(stdout);
    });
  }
});