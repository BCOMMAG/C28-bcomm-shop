/**
 * Otimizador e Validador de Vídeos Client-Side
 * Gerencia validação de tamanho/duração e extração automática de Poster Frame (WebP).
 * Permite que a vitrine e o catálogo exibam a capa da modelo no provador instantaneamente
 * sem precisar aguardar o download do fluxo de vídeo.
 */

import { formatBytes } from '@/lib/image-compressor';

export interface VideoValidationResult {
  isValid: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  error?: string;
  warning?: string;
}

export interface VideoPosterResult {
  posterFile: File;
  width: number;
  height: number;
  duration: number;
  dataUrl: string;
}

export const MAX_VIDEO_BYTES_RECOMMENDED = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_DURATION_RECOMMENDED = 60; // 60 segundos para provador fashion

/**
 * Valida o arquivo de vídeo antes do envio.
 */
export function validateVideoMedia(file: File): VideoValidationResult {
  const sizeBytes = file.size;
  const sizeFormatted = formatBytes(sizeBytes);
  const name = file.name.toLowerCase();

  const isSupportedExt = /\.(mp4|mov|webm|m4v)$/i.test(name);
  if (!isSupportedExt && !file.type.startsWith('video/')) {
    return {
      isValid: false,
      sizeBytes,
      sizeFormatted,
      error: 'Formato de vídeo não suportado. Utilize arquivos .MP4, .MOV ou .WEBM.'
    };
  }

  // Alerta preventivo se o vídeo for muito pesado
  let warning: string | undefined;
  if (sizeBytes > MAX_VIDEO_BYTES_RECOMMENDED) {
    warning = `Vídeo pesado (${sizeFormatted}). O tamanho recomendado para provador é de até 25 MB para carregamento rápido no 4G.`;
  }

  return {
    isValid: true,
    sizeBytes,
    sizeFormatted,
    warning
  };
}

/**
 * Extrai o primeiro frame de um vídeo (ou frame no tempo especificado)
 * e o converte em um arquivo de imagem WebP leve de alta definição para servir como Poster.
 */
export async function extractVideoPoster(
  file: File,
  atTimeSeconds: number = 0.5
): Promise<VideoPosterResult | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      const videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;

      let hasCleanedUp = false;
      const cleanup = () => {
        if (!hasCleanedUp) {
          hasCleanedUp = true;
          URL.revokeObjectURL(videoUrl);
          video.remove();
        }
      };

      // Timeout preventivo de 7 segundos caso o codec não seja decodificável pelo browser
      const timeoutId = setTimeout(() => {
        cleanup();
        console.warn('⚠️ [Video Optimizer] Timeout ao extrair poster frame do vídeo.');
        resolve(null);
      }, 7000);

      video.onloadedmetadata = () => {
        // Se a duração for menor que o tempo alvo, busca na metade do vídeo
        const targetTime = video.duration > atTimeSeconds ? atTimeSeconds : video.duration / 2;
        video.currentTime = targetTime;
      };

      video.onseeked = async () => {
        clearTimeout(timeoutId);

        try {
          const width = video.videoWidth || 720;
          const height = video.videoHeight || 1280;

          // Limita a resolução máxima do poster (Full HD)
          let targetWidth = width;
          let targetHeight = height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            targetWidth = Math.round(width * ratio);
            targetHeight = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            cleanup();
            resolve(null);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

          const blob = await new Promise<Blob | null>((resBlob) => {
            canvas.toBlob((b) => resBlob(b), 'image/webp', 0.82);
          });

          if (!blob) {
            cleanup();
            resolve(null);
            return;
          }

          const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');
          const posterName = `${cleanBaseName}-poster.webp`;
          const posterFile = new File([blob], posterName, {
            type: 'image/webp',
            lastModified: Date.now()
          });

          const dataUrl = canvas.toDataURL('image/webp', 0.82);

          cleanup();
          resolve({
            posterFile,
            width: targetWidth,
            height: targetHeight,
            duration: video.duration || 0,
            dataUrl
          });
        } catch (canvasErr) {
          console.warn('⚠️ [Video Optimizer] Erro ao desenhar frame do vídeo no canvas:', canvasErr);
          cleanup();
          resolve(null);
        }
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        cleanup();
        console.warn('⚠️ [Video Optimizer] Erro ao carregar elemento de vídeo para extração de poster.');
        resolve(null);
      };
    } catch (err) {
      console.warn('⚠️ [Video Optimizer] Erro inesperado na extração de poster:', err);
      resolve(null);
    }
  });
}

