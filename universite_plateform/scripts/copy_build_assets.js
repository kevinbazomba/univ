#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

// Chemins relatifs depuis le dossier Django (universite_plateform/universite_plateform/scripts)
const srcDir = path.resolve(__dirname, '..', '..', 'plateform_react', 'dist', 'assets');
const destDir = path.resolve(__dirname, '..', '..', 'static', 'assets');

(async () => {
  try {
    const entries = await fs.readdir(srcDir);
    await fs.rm(destDir, { recursive: true, force: true });
    await fs.mkdir(destDir, { recursive: true });

    const files = entries.filter((f) => f.endsWith('.css') || f.endsWith('.js'));
    if (files.length === 0) {
      console.log('Aucun fichier .css ou .js trouvé dans', srcDir);
      return;
    }

    for (const file of files) {
      const s = path.join(srcDir, file);
      const d = path.join(destDir, file);
      await fs.copyFile(s, d);
      console.log('Copié', file);
    }

    console.log('Terminé — assets copiés vers', destDir);
  } catch (err) {
    console.error('Erreur lors de la copie des assets :', err.message || err);
    process.exit(1);
  }
})();
