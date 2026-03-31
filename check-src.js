import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = join(__dirname, 'src');

if (existsSync(srcPath)) {
  console.log(`✔ src folder found at: ${srcPath}`);
  process.exit(0);
} else {
  console.error(`✘ src folder not found in root directory: ${srcPath}`);
  process.exit(1);
}
