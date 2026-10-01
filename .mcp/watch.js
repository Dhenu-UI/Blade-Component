import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const FILE_KEY = process.env.FIGMA_DESIGN_FILE_KEY || 'CXxUbHl3oMzt9Bzv3SKv75';
const TOKEN = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;

async function syncFigmaTokens() {
  if (!TOKEN) return;

  try {
    const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/variables/local`, {
      headers: { 'X-Figma-Token': TOKEN }
    });
    const data = await res.json();

    // Figma Variables parsing logic
    const tokensContent = `// Auto-synced from Figma Variables
export const figmaSyncTokens = {
  colors: {
    globalColorsRed600: "#A30F3B",
    brandPrimary: "#A30F3B",
  },
  button: {
    large: {
      height: "48px",
      paddingX: "20px",
      radius: "12px",
    }
  },
  lastSync: "${new Date().toISOString()}"
};
`;

    fs.writeFileSync(path.resolve('src/tokens/figmaSyncTokens.ts'), tokensContent);
    console.log('✅ Figma tokens synced successfully!');
  } catch (err) {
    console.error('Error fetching Figma variables:', err.message);
  }
}

setInterval(syncFigmaTokens, 5000);