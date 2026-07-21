import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(frontendRoot, '..');
const sourceAssetsDir = path.join(frontendRoot, 'dist', 'assets');
const targetAssetsDir = path.join(projectRoot, 'static', 'assets');

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  let copiedFiles = 0;
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copiedFiles += copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      copiedFiles += 1;
    }
  }

  return copiedFiles;
}

if (!fs.existsSync(sourceAssetsDir)) {
  console.error(`Dossier introuvable: ${sourceAssetsDir}`);
  console.error('Lancez d’abord le build Vite pour générer dist/assets.');
  process.exit(1);
}

fs.rmSync(targetAssetsDir, { recursive: true, force: true });

const copiedFiles = copyDirectory(sourceAssetsDir, targetAssetsDir);

console.log(`Assets copiés avec succès: ${copiedFiles} fichier(s)`);
console.log(`Source: ${sourceAssetsDir}`);
console.log(`Destination: ${targetAssetsDir}`);
