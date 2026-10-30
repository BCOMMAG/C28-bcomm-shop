import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { compressImageFile, isProcessableImage, ImageTargetType } from '@/lib/image-compressor';
import { extractVideoPoster, validateVideoMedia } from '@/lib/video-optimizer';

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

export interface BrowserUploadResult {
  success: boolean;
  url: string;
  error?: string;
  posterUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  savingsPercent?: number;
  wasCompressed?: boolean;
}

/**
 * Helper para upload direto de arquivos selecionados no navegador (File)
 * Otimiza e comprime imagens automaticamente no cliente (WebP, downscaling proporcional,
 * correção EXIF e preservação de canal alfa) e extrai Poster Frame para vídeos.
 */
export async function uploadBrowserFileToR2(
  file: File,
  tenantSlug: string = 'leidy-boutique',
  folder: 'produtos' | 'banners' | 'logos' | 'videos' | 'avatars' | 'og' | 'backgrounds' = 'produtos'
): Promise<BrowserUploadResult> {
  try {
    // 1. Otimização Client-Side de Imagens
    let fileToSend = file;
    let originalSize = file.size;
    let compressedSize = file.size;
    let savingsPercent = 0;
    let wasCompressed = false;
    let posterUrl: string | undefined = undefined;

    if (typeof window !== 'undefined' && isProcessableImage(file)) {
      const targetMap: Record<string, ImageTargetType> = {
        produtos: 'produto',
        banners: 'banner_desktop',
        logos: 'logo',
        avatars: 'avatar',
        og: 'og',
        backgrounds: 'backgrounds'
      };
      const targetType = targetMap[folder] || 'produto';
      const compRes = await compressImageFile(file, { targetType });
      fileToSend = compRes.file;
      originalSize = compRes.originalSize;
      compressedSize = compRes.compressedSize;
      savingsPercent = compRes.savingsPercent;
      wasCompressed = compRes.wasCompressed;
      if (wasCompressed) {
        console.log(`⚡ [Compressor R2] ${file.name}: ${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB (-${savingsPercent}%)`);
      }
    } else if (typeof window !== 'undefined' && (file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name))) {
      // 1.1 Para Vídeos: extrai poster frame de carregamento instantâneo
      const videoValidation = validateVideoMedia(file);
      if (!videoValidation.isValid) {
        return { success: false, url: '', error: videoValidation.error };
      }
      try {
        const posterRes = await extractVideoPoster(file);
        if (posterRes?.posterFile) {
          const posterUpload = await uploadBrowserFileToR2(posterRes.posterFile, tenantSlug, 'produtos');
          if (posterUpload.success) {
            posterUrl = posterUpload.url;
            console.log(`🎬 [Video Poster] Poster extraído e salvo com sucesso: ${posterUrl}`);
          }
        }
      } catch (postErr) {
        console.warn('⚠️ Falha secundária ao extrair poster do vídeo:', postErr);
      }
    }

    // 2. Se estiver no Browser, envia para a API Route segura
    if (typeof window !== 'undefined') {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      const uploadEndpoint = isLocalhost ? 'http://127.0.0.1:3005/api/upload' : '/api/upload';

      const formData = new FormData();
      formData.append('file', fileToSend);
      formData.append('tenantSlug', tenantSlug);
      formData.append('folder', folder);

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const errorMsg = data?.error || `Falha no upload do arquivo (HTTP ${res.status})`;
        console.error('❌ [Upload API] Erro retornado pela rota /api/upload:', errorMsg);
        return {
          success: false,
          url: '',
          error: errorMsg
        };
      }

      return {
        success: true,
        url: data.url,
        posterUrl,
        originalSize,
        compressedSize,
        savingsPercent,
        wasCompressed
      };
    }

    // 3. Se for invocado no ambiente do Servidor (Node.js)
    const arrayBuffer = await fileToSend.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const cleanFileName = fileToSend.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');

    const key = `tenants/${tenantSlug}/${folder}/${Date.now()}-${cleanFileName}`;

    const r2Res = await uploadToR2({
      key,
      fileBuffer: uint8Array,
      contentType: fileToSend.type || 'application/octet-stream',
    });

    return {
      success: r2Res.success,
      url: r2Res.url,
      error: r2Res.error,
      originalSize,
      compressedSize,
      savingsPercent,
      wasCompressed
    };
  } catch (err: any) {
    console.error('❌ [Cloudflare R2] Erro ao processar arquivo no upload:', err);
    return {
      success: false,
      url: '',
      error: err?.message || 'Erro inesperado ao processar arquivo para upload',
    };
  }
}

/**
 * Upload concorrente em lotes (batch) de múltiplos arquivos para o Cloudflare R2
 * com controle de concorrência (padrão: 3 paralelos) e relatório de progresso.
 */
export async function uploadMultipleBrowserFilesToR2(
  files: File[] | FileList,
  tenantSlug: string = 'leidy-boutique',
  folder: 'produtos' | 'banners' | 'logos' | 'videos' | 'avatars' | 'og' | 'backgrounds' = 'produtos',
  concurrency = 3,
  onProgress?: (completed: number, total: number, lastUploaded?: { name: string; url: string; savingsPercent?: number }) => void
): Promise<Array<{ file: File; success: boolean; url: string; posterUrl?: string; error?: string; savingsPercent?: number; wasCompressed?: boolean }>> {
  const fileArray = Array.from(files);
  const results: Array<{ file: File; success: boolean; url: string; posterUrl?: string; error?: string; savingsPercent?: number; wasCompressed?: boolean }> = [];
  let index = 0;
  let completed = 0;

  async function worker() {
    while (index < fileArray.length) {
      const currentIndex = index++;
      const file = fileArray[currentIndex];
      const res = await uploadBrowserFileToR2(file, tenantSlug, folder);
      results[currentIndex] = {
        file,
        success: res.success,
        url: res.url,
        posterUrl: res.posterUrl,
        savingsPercent: res.savingsPercent,
        wasCompressed: res.wasCompressed,
        error: res.error
      };
      completed++;
      if (onProgress) {
        onProgress(completed, fileArray.length, res.success ? { name: file.name, url: res.url, savingsPercent: res.savingsPercent } : undefined);
      }
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, fileArray.length) }, () => worker());
  await Promise.all(pool);
  return results;
}

/**
 * Exclui um arquivo do Cloudflare R2 a partir de sua URL pública ou chave de objeto (Key).
 */
export async function deleteFromR2(
  fileUrlOrKey: string,
  bucketName = R2_BUCKET_NAME
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!fileUrlOrKey) return { success: true };

    // Extrai a chave (key) caso tenha sido passada a URL completa do R2
    let key = fileUrlOrKey;
    const cleanPublicUrl = R2_PUBLIC_URL.replace(/\/$/, '');
    if (key.startsWith(cleanPublicUrl)) {
      key = key.replace(cleanPublicUrl, '').replace(/^\//, '');
    } else if (key.startsWith('http://') || key.startsWith('https://')) {
      const urlObj = new URL(key);
      key = urlObj.pathname.replace(/^\//, '');
    }

    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
    console.log(`🗑️ [Cloudflare R2] Arquivo excluído com sucesso: ${key}`);
    return { success: true };
  } catch (err: any) {
    console.warn('⚠️ [Cloudflare R2] Falha ao excluir arquivo do R2:', err?.message || err);
    return { success: false, error: err?.message };
  }
}

