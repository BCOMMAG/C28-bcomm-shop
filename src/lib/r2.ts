import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Variáveis de ambiente para o Cloudflare R2
const R2_ACCOUNT_ID =
  process.env.R2_ACCOUNT_ID ||
  process.env.NEXT_PUBLIC_R2_ACCOUNT_ID ||
  '47ce862c285bb81ad80e052f7ed16ae5';

const R2_ACCESS_KEY_ID =
  process.env.R2_ACCESS_KEY_ID ||
  process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID ||
  '8040d9c1208cae602f044cceb2abac1c';

const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY ||
  process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY ||
  '9b2cd002c0f0988324c76ea9c8af05651bdf4c68e3580dfaaecf683c6ce7e82a';

const R2_BUCKET_NAME =
  process.env.R2_BUCKET_NAME ||
  process.env.NEXT_PUBLIC_R2_BUCKET_NAME ||
  'bcomm-saas-media';

export const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_URL ||
  'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev';

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.warn('⚠️ [Cloudflare R2] Chaves do R2 não configuradas.');
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
  key: string; // Ex: 'tenants/leidy-boutique/produtos/vestido-rosa.webp'
  fileBuffer: Buffer | Uint8Array;
  contentType: string;
  bucketName?: string;
}

/**
 * Envia um arquivo (buffer/Uint8Array) para o bucket Cloudflare R2 com taxa zero de saída.
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

/**
 * Helper para upload direto de arquivos selecionados no navegador (File)
 * Converte o arquivo para Uint8Array e envia diretamente para o Cloudflare R2.
 */
export async function uploadBrowserFileToR2(
  file: File,
  tenantSlug: string = 'leidy-boutique',
  folder: 'produtos' | 'banners' | 'logos' = 'produtos'
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Higieniza o nome do arquivo
    const cleanFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');

    const key = `tenants/${tenantSlug}/${folder}/${Date.now()}-${cleanFileName}`;

    return await uploadToR2({
      key,
      fileBuffer: uint8Array,
      contentType: file.type || 'application/octet-stream',
    });
  } catch (err: any) {
    console.error('❌ [Cloudflare R2] Erro ao ler arquivo no navegador:', err);
    return {
      success: false,
      url: '',
      error: err?.message || 'Erro ao processar arquivo no navegador',
    };
  }
}
