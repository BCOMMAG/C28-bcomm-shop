import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega as variáveis do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'bcomm-saas-media';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL;
const DATABASE_URL = process.env.DATABASE_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
  console.log('\n============================================================');
  console.log('⚠️ AVISO: Variáveis do Cloudflare R2 ausentes no .env.local:');
  console.log('   - R2_ACCOUNT_ID');
  console.log('   - R2_ACCESS_KEY_ID');
  console.log('   - R2_SECRET_ACCESS_KEY');
  console.log('   - R2_BUCKET_NAME');
  console.log('   - NEXT_PUBLIC_R2_URL');
  console.log('============================================================\n');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.webp': return 'image/webp';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    default: return 'application/octet-stream';
  }
}

async function uploadFolder(dirPath: string, baseDir: string, s3Prefix: string) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await uploadFolder(fullPath, baseDir, s3Prefix);
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const s3Key = `${s3Prefix}/${relPath}`;
      const fileBuffer = fs.readFileSync(fullPath);
      const mime = getMimeType(fullPath);

      console.log(`⬆️ Enviando para o R2: ${s3Key} (${(stat.size / 1024).toFixed(1)} KB)...`);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: mime,
        })
      );
    }
  }
}

async function run() {
  console.log('\n🚀 INICIANDO SINCRONIZAÇÃO DE MÍDIAS PARA O CLOUDFLARE R2...');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const productsDir = path.join(publicDir, 'products');
  const imagesDir = path.join(publicDir, 'images');
  const videoDir = path.join(publicDir, 'video');

  if (fs.existsSync(productsDir)) {
    console.log('\n📁 Enviando fotos de produtos...');
    await uploadFolder(productsDir, publicDir, 'tenants/leidy-boutique');
  }

  if (fs.existsSync(imagesDir)) {
    console.log('\n📁 Enviando imagens de identidade visual...');
    await uploadFolder(imagesDir, publicDir, 'tenants/leidy-boutique');
  }

  if (fs.existsSync(videoDir)) {
    console.log('\n🎥 Enviando vídeos de provador...');
    await uploadFolder(videoDir, publicDir, 'tenants/leidy-boutique');
  }

  console.log('\n🎉 Sincronização concluída com sucesso!');
  console.log(`🌐 Base URL do R2: ${R2_PUBLIC_URL}\n`);
}

run().catch((err) => {
  console.error('❌ Erro na sincronização:', err);
  process.exit(1);
});
