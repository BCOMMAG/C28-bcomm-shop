import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Variáveis de ambiente para o Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'bcomm-saas-media';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || 'https://pub-r2.bcomm.shop';

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.warn('⚠️ [Cloudflare R2] Chaves do R2 não configuradas no .env.local.');
    }

    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  return s3ClientInstance;
}

export interface UploadR2Params {
  key: string; // Ex: 'tenants/aura-privee/produtos/vestido-rosa.webp'
  fileBuffer: Buffer | Uint8Array;
  contentType: string;
  bucketName?: string;
}

/**
 * Envia um arquivo para o bucket Cloudflare R2 com taxa zero de saída.
 * Retorna a URL pública do arquivo na CDN global da Cloudflare.
 */
export async function uploadToR2({
  key,
  fileBuffer,
  contentType,
  bucketName = R2_BUCKET_NAME,
}: UploadR2Params): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await client.send(command);

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
    console.log(`✅ [Cloudflare R2] Arquivo enviado com sucesso: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (err: any) {
    console.error('❌ [Cloudflare R2] Erro ao fazer upload para o R2:', err);
    return {
      success: false,
      url: '',
      error: err?.message || 'Falha ao enviar arquivo para o Cloudflare R2',
    };
  }
}
