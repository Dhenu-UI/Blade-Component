import fs from 'fs';
import path from 'path';

const jsonDir = path.join(process.cwd(), 'src', 'style', 'figma', 'json');
const scssDir = path.join(process.cwd(), 'src', 'style', 'figma', 'scss');

function formatValue(keyName: string, rawVal: any): string {
  if (typeof rawVal === 'number') {
    // Height, width, padding, margin, radius, gap, size vagege ma px add karse
    const needsPx = /height|width|padding|margin|radius|size|gap|spacing|top|bottom|left|right/i.test(keyName);
    return needsPx ? `${rawVal}px` : `${rawVal}`;
  }
  
  let strVal = String(rawVal);
  if (/^\d+(\.\d+)?$/.test(strVal)) {
    const needsPx = /height|width|padding|margin|radius|size|gap|spacing|top|bottom|left|right/i.test(keyName);
    return needsPx ? `${strVal}px` : strVal;
  }
  
  return strVal;
}

function getHexValue(value: any): string | null {
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (typeof normalized !== 'string') return null;

  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized) ? normalized.toUpperCase() : null;
}

function extractTokens(obj: any, prefix = '', seenValues = new Map<string, string>()) {
  let scssVars = '';
  let cssVars = '';

  for (const key in obj) {
    if (key.startsWith('$') && key !== '$value') continue;

    const value = obj[key];
    const formattedKey = key
      .replace(/[\/\s\_]+/g, '-')
      .replace(/[^a-zA-Z0-9\-]/g, '')
      .toLowerCase();

    const newPrefix = prefix ? `${prefix}-${formattedKey}` : formattedKey;

    if (value && typeof value === 'object') {
      const tokenVal = value?.$value !== undefined ? value.$value : value?.value;

      if (tokenVal !== undefined && typeof tokenVal !== 'object') {
        let rawVal = String(tokenVal);
        let finalCssValue = '';

        if (rawVal.startsWith('{') && rawVal.endsWith('}')) {
          const aliasName = rawVal
            .slice(1, -1)
            .replace(/[\/\s\_\.]+/g, '-')
            .toLowerCase();
          finalCssValue = `var(--${aliasName})`;
        } else {
          finalCssValue = formatValue(newPrefix, tokenVal);
        }

        const cleanName = newPrefix.replace(/^--+/, '').toLowerCase();
        const colorHex = getHexValue(finalCssValue);

        if (colorHex) {
          const existingVar = seenValues.get(colorHex);
          if (existingVar) {
            finalCssValue = `var(--${existingVar})`;
          } else {
            seenValues.set(colorHex, cleanName);
          }
        }

        scssVars += `$${cleanName}: ${finalCssValue};\n`;
        cssVars += `  --${cleanName}: ${finalCssValue};\n`;
      } else if (tokenVal?.hex) {
        const cleanName = newPrefix.replace(/^--+/, '').toLowerCase();
        const hexValue = getHexValue(tokenVal.hex);
        const existingVar = hexValue ? seenValues.get(hexValue) : null;

        const finalHexValue = existingVar ? `var(--${existingVar})` : tokenVal.hex;

        if (hexValue && !existingVar) {
          seenValues.set(hexValue, cleanName);
        }

        scssVars += `$${cleanName}: ${finalHexValue};\n`;
        cssVars += `  --${cleanName}: ${finalHexValue};\n`;
      } else {
        const res = extractTokens(value, newPrefix, seenValues);
        scssVars += res.scssVars;
        cssVars += res.cssVars;
      }
    }
  }

  return { scssVars, cssVars };
}

function processAllTokens() {
  if (!fs.existsSync(jsonDir)) {
    console.log(`ℹ️ No Figma JSON folder found at ${jsonDir}. Skipping token generation.`);
    return;
  }

  if (!fs.existsSync(scssDir)) {
    fs.mkdirSync(scssDir, { recursive: true });
  }

  const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.tokens.json'));

  files.forEach(file => {
    const jsonPath = path.join(jsonDir, file);
    const fileNameWithoutExt = file.replace('.tokens.json', '');
    const scssPath = path.join(scssDir, `${fileNameWithoutExt}.scss`);

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const tokens = JSON.parse(rawData);

    const { scssVars, cssVars } = extractTokens(tokens, '', new Map<string, string>());

    const content = `// 🤖 Auto-generated SCSS variables from ${file}\n${scssVars}\n:root {\n${cssVars}}\n`;

    fs.writeFileSync(scssPath, content, 'utf-8');
    console.log(`✅ Generated: ${scssPath}`);
  });
}

processAllTokens();