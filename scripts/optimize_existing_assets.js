const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_PUBLIC = path.join(__dirname, '..', 'public');
const BACKUP_DIR = path.join(ROOT_PUBLIC, '_backup_original');

function formatBytes(bytes) {
  if (bytes <= 0) return '0 B';
  const kb = bytes / 1024;
  if (kb < 1000) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

async function run() {
  console.log('🚀 [Sanitização de Acervo] Iniciando otimização com backup seguro...');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Diretório de backup criado em: ${BACKUP_DIR}`);
  }

  let totalSavedBytes = 0;

  // 1. Limpeza de arquivo de vídeo duplicado (10.58 MB!)
  const duplicatedVideo = path.join(ROOT_PUBLIC, 'video', 'plano de fundo.mp4');
  if (fs.existsSync(duplicatedVideo)) {
    const stat = fs.statSync(duplicatedVideo);
    const backupDest = path.join(BACKUP_DIR, 'plano de fundo.mp4');
    fs.copyFileSync(duplicatedVideo, backupDest);
    fs.unlinkSync(duplicatedVideo);
    totalSavedBytes += stat.size;
    console.log(`🗑️ Removido arquivo duplicado com espaço 'plano de fundo.mp4': Economizou ${formatBytes(stat.size)}`);
  }

  // 2. Otimizar Logo.jpg (1.27 MB -> ~30 KB)
  const logoJpg = path.join(ROOT_PUBLIC, 'images', 'Logo.jpg');
  if (fs.existsSync(logoJpg)) {
    const originalStat = fs.statSync(logoJpg);
    const origBuffer = fs.readFileSync(logoJpg);
    fs.writeFileSync(path.join(BACKUP_DIR, 'Logo.jpg'), origBuffer);

    const buffer = await sharp(origBuffer)
      .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, progressive: true })
      .toBuffer();

    fs.writeFileSync(logoJpg, buffer);
    const newStat = fs.statSync(logoJpg);
    const saved = originalStat.size - newStat.size;
    totalSavedBytes += saved;
    console.log(`✨ Otimizado Logo.jpg: ${formatBytes(originalStat.size)} → ${formatBytes(newStat.size)} (-${Math.round((saved / originalStat.size) * 100)}%)`);
  }

  // 3. Otimizar Logo sem fundo.png (926 KB -> ~45 KB)
  const logoPng = path.join(ROOT_PUBLIC, 'images', 'Logo sem fundo.png');
  if (fs.existsSync(logoPng)) {
    const originalStat = fs.statSync(logoPng);
    const origBuffer = fs.readFileSync(logoPng);
    fs.writeFileSync(path.join(BACKUP_DIR, 'Logo sem fundo.png'), origBuffer);

    const buffer = await sharp(origBuffer)
      .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
      .png({ quality: 85, compressionLevel: 9, palette: true })
      .toBuffer();

    fs.writeFileSync(logoPng, buffer);
    const newStat = fs.statSync(logoPng);
    const saved = originalStat.size - newStat.size;
    totalSavedBytes += saved;
    console.log(`✨ Otimizado Logo sem fundo.png: ${formatBytes(originalStat.size)} → ${formatBytes(newStat.size)} (-${Math.round((saved / originalStat.size) * 100)}%)`);
  }

  // 4. Otimizar favicon 512x512 (428 KB -> ~20 KB)
  const fav512 = path.join(ROOT_PUBLIC, 'favicon-android-chrome-512x512.png');
  if (fs.existsSync(fav512)) {
    const originalStat = fs.statSync(fav512);
    const origBuffer = fs.readFileSync(fav512);
    fs.writeFileSync(path.join(BACKUP_DIR, 'favicon-android-chrome-512x512.png'), origBuffer);

    const buffer = await sharp(origBuffer)
      .resize({ width: 512, height: 512, fit: 'contain' })
      .png({ quality: 85, compressionLevel: 9, palette: true })
      .toBuffer();

    fs.writeFileSync(fav512, buffer);
    const newStat = fs.statSync(fav512);
    const saved = originalStat.size - newStat.size;
    totalSavedBytes += saved;
    console.log(`✨ Otimizado favicon 512x512: ${formatBytes(originalStat.size)} → ${formatBytes(newStat.size)} (-${Math.round((saved / originalStat.size) * 100)}%)`);
  }

  // 5. Otimizar plano-de-fundo.jpg (534 KB -> ~80 KB)
  const bgJpg = path.join(ROOT_PUBLIC, 'images', 'plano-de-fundo.jpg');
  if (fs.existsSync(bgJpg)) {
    const originalStat = fs.statSync(bgJpg);
    const origBuffer = fs.readFileSync(bgJpg);
    fs.writeFileSync(path.join(BACKUP_DIR, 'plano-de-fundo.jpg'), origBuffer);

    const buffer = await sharp(origBuffer)
      .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    fs.writeFileSync(bgJpg, buffer);
    const newStat = fs.statSync(bgJpg);
    const saved = originalStat.size - newStat.size;
    totalSavedBytes += saved;
    console.log(`✨ Otimizado plano-de-fundo.jpg: ${formatBytes(originalStat.size)} → ${formatBytes(newStat.size)} (-${Math.round((saved / originalStat.size) * 100)}%)`);
  }

  console.log(`\n🎉 [Concluído com Sucesso] Economia total gerada no acervo: ${formatBytes(totalSavedBytes)}!`);
}

run().catch(console.error);
