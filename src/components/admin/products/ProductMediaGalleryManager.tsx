'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Upload,
  Video,
  Play,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Palette,
  Smartphone,
  CheckCircle2,
  Filter,
  Loader2,
  RefreshCw,
  Info,
  X
} from 'lucide-react';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { parseMediaColor, isVideoUrl } from '@/lib/products';

export interface FormMediaItem {
  id?: string;
  url: string;
  tipo: 'image' | 'video';
  label?: string | null;
  display_order: number;
  isUploading?: boolean;
  uploadError?: string | null;
  tempFile?: File;
}

export interface ProductMediaGalleryManagerProps {
  mediaList: FormMediaItem[];
  availableColors: Array<{ nome: string; hex?: string }>;
  tenantSlug: string;
  coverIndex?: number;
  onCoverIndexChange?: (idx: number) => void;
  onChange: (updated: FormMediaItem[]) => void;
  onToast?: (msg: string, type?: 'success' | 'error') => void;
}

export function ProductMediaGalleryManager({
  mediaList,
  availableColors,
  tenantSlug,
  coverIndex = 0,
  onCoverIndexChange,
  onChange,
  onToast
}: ProductMediaGalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('todas');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTip916, setShowTip916] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onToast) onToast(msg, type === 'info' ? 'success' : type);
  };

  // Helper para construir label preservando tags
  const buildLabel = (clean: string, colorName?: string, isColorCover?: boolean, isHidden?: boolean) => {
    let base = clean || 'Foto';
    const tags: string[] = [];
    if (colorName) tags.push(`[COR: ${colorName}]`);
    if (isColorCover) tags.push(`[CAPA_COR]`);
    if (isHidden) tags.push(`[OCULTO]`);
    return tags.length > 0 ? `${tags.join(' ')} ${base}` : base;
  };

  // Processamento com Preview Otimista Imediato e Upload Seguro
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    let successCount = 0;

    // 1. Gera preview local otimista instantaneamente
    const startIndex = mediaList.length;
    const tempItems: FormMediaItem[] = fileArray.map((file, i) => {
      const isVideo = file.type.startsWith('video/') || isVideoUrl(file.name);
      return {
        id: `temp_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        url: URL.createObjectURL(file),
        tipo: isVideo ? ('video' as const) : ('image' as const),
        label: startIndex === 0 && i === 0 && !isVideo ? 'Capa Principal' : (isVideo ? 'Vídeo do Produto' : `Foto ${startIndex + i + 1}`),
        display_order: startIndex + i,
        isUploading: true,
        tempFile: file
      };
    });

    const currentListWithTemp = [...mediaList, ...tempItems];
    onChange(currentListWithTemp);

    try {
      let workingList = [...currentListWithTemp];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const tempId = tempItems[i].id;
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|m4v)$/i.test(file.name);
        const folder = isVideo ? 'videos' : 'produtos';

        const res = await uploadBrowserFileToR2(file, tenantSlug, folder);
        const targetIdx = workingList.findIndex((m) => m.id === tempId);

        if (targetIdx !== -1) {
          if (res.success && res.url) {
            successCount++;
            workingList[targetIdx] = {
              ...workingList[targetIdx],
              url: res.url,
              isUploading: false,
              uploadError: null,
              tempFile: undefined
            };
          } else {
            workingList[targetIdx] = {
              ...workingList[targetIdx],
              isUploading: false,
              uploadError: res.error || 'Falha no upload'
            };
          }
          workingList = [...workingList];
          onChange(workingList);
        }
      }

      if (successCount > 0) {
        showToast(`${successCount} mídia(s) otimizada(s) em WebP e salva(s) com sucesso!`);
      } else {
        showToast('Nenhuma mídia foi salva.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado no upload.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRetryUpload = async (index: number) => {
    const item = mediaList[index];
    if (!item || !item.tempFile) return;

    const updated = [...mediaList];
    updated[index] = { ...item, isUploading: true, uploadError: null };
    onChange(updated);

    const isVideo = item.tempFile.type.startsWith('video/') || /\.(mp4|mov|webm|avi|m4v)$/i.test(item.tempFile.name);
    const folder = isVideo ? 'videos' : 'produtos';

    const res = await uploadBrowserFileToR2(item.tempFile, tenantSlug, folder);
    const refreshed = [...mediaList];
    if (res.success && res.url) {
      refreshed[index] = {
        ...refreshed[index],
        url: res.url,
        isUploading: false,
        uploadError: null,
        tempFile: undefined
      };
      showToast('Mídia enviada com sucesso para o Cloudflare R2!');
    } else {
      refreshed[index] = {
        ...refreshed[index],
        isUploading: false,
        uploadError: res.error || 'Falha no upload'
      };
      showToast('Falha ao reenviar arquivo.', 'error');
    }
    onChange(refreshed);
  };

  // Reordenar
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const updated = [...mediaList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((m, idx) => ({ ...m, display_order: idx }));
    onChange(reordered);
    if (onCoverIndexChange) {
      if (coverIndex === index) onCoverIndexChange(targetIndex);
      else if (coverIndex === targetIndex) onCoverIndexChange(index);
    }
  };

  // Definir Capa Principal geral
  const handleSetMainCover = (index: number) => {
    const targetItem = mediaList[index];
    if (targetItem && (targetItem.tipo === 'video' || isVideoUrl(targetItem.url))) {
      showToast('Um arquivo de vídeo não pode ser definido como Capa Principal da vitrine.', 'error');
      return;
    }
    if (onCoverIndexChange) onCoverIndexChange(index);

    const updated = [...mediaList];
    const [coverItem] = updated.splice(index, 1);
    updated.unshift(coverItem);

    const reordered = updated.map((m, idx) => ({
      ...m,
      display_order: idx
    }));
    onChange(reordered);
    if (onCoverIndexChange) onCoverIndexChange(0);
    showToast('Foto definida como Capa Principal da vitrine!');
  };

  // Definir ou Alterar Cor Vinculada
  const handleSetColor = (index: number, newColor: string) => {
    const updated = mediaList.map((m, idx) => {
      if (idx !== index) return m;
      const parsed = parseMediaColor(m.label || undefined);
      const colorVal = newColor ? newColor : undefined;
      // Se desvinculou da cor, remove também isColorCover
      const isCover = colorVal ? parsed.isColorCover : false;
      const newLabel = buildLabel(parsed.cleanLabel, colorVal, isCover, parsed.isHidden);
      return { ...m, label: newLabel };
    });
    onChange(updated);
    showToast(newColor ? `Foto vinculada à cor "${newColor}"!` : 'Vínculo de cor removido.');
  };

  // Definir Capa da Cor
  const handleToggleColorCover = (index: number) => {
    const targetItem = mediaList[index];
    if (!targetItem) return;
    const parsedTarget = parseMediaColor(targetItem.label || undefined);
    if (!parsedTarget.colorName) {
      showToast('Vincule a foto a uma cor antes de torná-la Capa da Cor.', 'info');
      return;
    }

    const corAlvo = parsedTarget.colorName;
    const nextIsCover = !parsedTarget.isColorCover;

    // Se for se tornar capa, remove [CAPA_COR] das outras fotos da mesma cor
    const updated = mediaList.map((m, idx) => {
      const p = parseMediaColor(m.label || undefined);
      if (idx === index) {
        return {
          ...m,
          label: buildLabel(p.cleanLabel, p.colorName, nextIsCover, p.isHidden)
        };
      }
      if (nextIsCover && p.colorName === corAlvo && p.isColorCover) {
        return {
          ...m,
          label: buildLabel(p.cleanLabel, p.colorName, false, p.isHidden)
        };
      }
      return m;
    });

    onChange(updated);
    showToast(
      nextIsCover
        ? `Definida como Capa Oficial da cor ${corAlvo} na vitrine!`
        : `Removido status de capa da cor ${corAlvo}.`
    );
  };

  // Ocultar / Desocultar Foto
  const handleToggleHide = (index: number) => {
    const targetItem = mediaList[index];
    if (!targetItem) return;
    const p = parseMediaColor(targetItem.label || undefined);
    const nextIsHidden = !p.isHidden;

    const updated = mediaList.map((m, idx) => {
      if (idx !== index) return m;
      return {
        ...m,
        label: buildLabel(p.cleanLabel, p.colorName, p.isColorCover, nextIsHidden)
      };
    });
    onChange(updated);
    showToast(
      nextIsHidden
        ? 'Foto ocultada da vitrine! (Preservada no acervo)'
        : 'Foto reativada na vitrine da loja!'
    );
  };

  // Excluir mídia
  const handleDelete = (index: number) => {
    const updated = mediaList.filter((_, idx) => idx !== index).map((m, idx) => ({ ...m, display_order: idx }));
    onChange(updated);
    if (onCoverIndexChange && coverIndex >= updated.length) {
      onCoverIndexChange(0);
    }
    showToast('Mídia removida da galeria.');
  };

  // Filtragem de fotos no acervo
  const filteredListWithIndices = mediaList
    .map((foto, idx) => ({ foto, originalIndex: idx }))
    .filter(({ foto }) => {
      if (selectedColorFilter === 'todas') return true;
      const p = parseMediaColor(foto.label || undefined);
      if (selectedColorFilter === 'sem_cor') return !p.colorName;
      return p.colorName?.toLowerCase() === selectedColorFilter.toLowerCase();
    });

  return (
    <div
      className="space-y-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Barra de Ações Superiores: Título, Dica 9:16 e Upload */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 text-sm font-serif-luxury">
              Fotos e Vídeos da Peça ({mediaList.length} mídias)
            </h4>
            {/* Botão Discreto de Dica 9:16 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTip916(!showTip916)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 cursor-pointer transition-colors"
                title="Dica de proporção Mobile First"
              >
                <Smartphone className="w-3 h-3 text-amber-700" />
                <span>Dica 9:16</span>
                <Info className="w-2.5 h-2.5 text-amber-600" />
              </button>

              {/* Popover Flutuante Discreto da Dica 9:16 */}
              {showTip916 && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-amber-500/30 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between font-bold text-amber-300 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      Proporção 9:16 Vertical (1080×1920)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTip916(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Fotos verticais e Reels de provador ocupam a tela inteira das clientes no smartphone, destacando o caimento do tecido e aumentando a conversão.
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Vincule fotos às cores da grade, eleja a capa de cada cor e oculte imagens sem deletar.
          </p>
        </div>

        <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer text-xs transition-colors shadow-sm shrink-0">
          <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
          <span>{uploading ? 'Enviando mídias...' : '+ Adicionar Fotos / Vídeos'}</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            disabled={uploading}
            onChange={handleUploadFiles}
            className="hidden"
          />
        </label>
      </div>

      {/* Filtros Rápidos por Cor no Acervo com Dropdown Anti-Transbordo */}
      {availableColors.length > 0 && mediaList.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3 text-amber-600" /> Filtrar Cor:
          </span>
          <button
            type="button"
            onClick={() => setSelectedColorFilter('todas')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              selectedColorFilter === 'todas'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Todas ({mediaList.length})
          </button>

          {/* Primeiras 2 cores como botões rápidos */}
          {availableColors.slice(0, 2).map((c) => {
            const count = mediaList.filter((m) => {
              const p = parseMediaColor(m.label || undefined);
              return p.colorName?.toLowerCase() === c.nome.toLowerCase();
            }).length;

            return (
              <button
                key={c.nome}
                type="button"
                onClick={() => setSelectedColorFilter(c.nome)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedColorFilter.toLowerCase() === c.nome.toLowerCase()
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: c.hex || '#1A1918' }}
                />
                <span>{c.nome}</span>
                <span className="opacity-80">({count})</span>
              </button>
            );
          })}

          {/* Se houver mais de 2 cores, agrupa em Dropdown elegante */}
          {availableColors.length > 2 && (
            <select
              value={['todas', availableColors[0]?.nome.toLowerCase(), availableColors[1]?.nome.toLowerCase()].includes(selectedColorFilter.toLowerCase()) ? '' : selectedColorFilter}
              onChange={(e) => {
                if (e.target.value) setSelectedColorFilter(e.target.value);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                !['todas', availableColors[0]?.nome.toLowerCase(), availableColors[1]?.nome.toLowerCase()].includes(selectedColorFilter.toLowerCase())
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <option value="" disabled className="text-slate-500 bg-white">Mais Cores ({availableColors.length - 2}) ▾</option>
              {availableColors.slice(2).map((c) => {
                const count = mediaList.filter((m) => {
                  const p = parseMediaColor(m.label || undefined);
                  return p.colorName?.toLowerCase() === c.nome.toLowerCase();
                }).length;
                return (
                  <option key={c.nome} value={c.nome} className="text-slate-900 bg-white">
                    {c.nome} ({count})
                  </option>
                );
              })}
              <option value="sem_cor" className="text-slate-900 bg-white">Sem cor vinculada</option>
            </select>
          )}

          {availableColors.length <= 2 && (
            <button
              type="button"
              onClick={() => setSelectedColorFilter('sem_cor')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedColorFilter === 'sem_cor'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Sem cor ({mediaList.filter((m) => !parseMediaColor(m.label || undefined).colorName).length})
            </button>
          )}
        </div>
      )}

      {/* Grid de Mídias */}
      {mediaList.length === 0 ? (
        <label
          className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center group ${
            isDragOver
              ? 'border-amber-500 bg-amber-50/70 ring-4 ring-amber-300/30'
              : 'border-slate-300 hover:border-amber-500 bg-slate-50'
          }`}
        >
          <Upload className={`w-8 h-8 text-slate-400 group-hover:text-amber-600 transition-colors ${uploading ? 'animate-bounce text-amber-600' : ''}`} />
          <span className="text-xs font-bold text-slate-700">
            {isDragOver ? 'Solte as fotos ou vídeos aqui!' : 'Nenhuma foto ou vídeo cadastrado nesta peça.'}
          </span>
          <span className="text-[11px] text-slate-500">
            Clique aqui para subir múltiplas fotos ou arraste arquivos para o Cloudflare R2.
          </span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            disabled={uploading}
            onChange={handleUploadFiles}
            className="hidden"
          />
        </label>
      ) : filteredListWithIndices.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
          Nenhuma foto encontrada para o filtro de cor selecionado.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredListWithIndices.map(({ foto, originalIndex }) => {
            const parsed = parseMediaColor(foto.label || undefined);
            const isMainCover = originalIndex === 0;
            const isVideo = foto.tipo === 'video' || isVideoUrl(foto.url);

            return (
              <div
                key={foto.id || originalIndex}
                className={`relative rounded-xl border-2 overflow-hidden bg-white group transition-all shadow-2xs flex flex-col ${
                  isMainCover
                    ? 'border-amber-500 ring-2 ring-amber-400/30'
                    : parsed.isColorCover
                    ? 'border-amber-400'
                    : 'border-slate-200'
                } ${parsed.isHidden ? 'opacity-50 grayscale-40' : ''}`}
              >
                {/* Visual da Mídia */}
                <div className="relative aspect-3/4 w-full bg-slate-900">
                  {/* Overlay de Uploading Otimista */}
                  {foto.isUploading && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center text-white z-20 animate-fade-in">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-1" />
                      <span className="text-[10px] font-bold text-amber-200">Enviando R2...</span>
                    </div>
                  )}

                  {/* Overlay de Erro com Retry */}
                  {foto.uploadError && (
                    <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center text-white z-20 animate-fade-in">
                      <span className="text-[10px] font-bold text-rose-200 mb-1.5 leading-tight px-1">
                        {foto.uploadError}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRetryUpload(originalIndex)}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Tentar Novamente</span>
                      </button>
                    </div>
                  )}

                  {isVideo ? (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <video src={foto.url} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 bg-slate-950/25 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-slate-900/80 text-amber-400 flex items-center justify-center">
                          <Play className="w-4 h-4 ml-0.5 fill-amber-400" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 bg-rose-600 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <Video className="w-2.5 h-2.5" />
                        Vídeo Provador
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={foto.url}
                      alt={parsed.cleanLabel || `Foto ${originalIndex + 1}`}
                      fill
                      unoptimized={foto.url.startsWith('blob:')}
                      sizes="220px"
                      className="object-cover"
                    />
                  )}

                  {/* Badges Superiores */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                    {isMainCover ? (
                      <span className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs">
                        ⭐ Capa Principal
                      </span>
                    ) : parsed.isColorCover ? (
                      <span className="bg-amber-400 text-slate-950 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-slate-950" />
                        Capa {parsed.colorName}
                      </span>
                    ) : (
                      <span className="bg-slate-900/80 text-white font-bold text-[9px] px-1.5 py-0.5 rounded">
                        #{originalIndex + 1}
                      </span>
                    )}

                    {parsed.isHidden && (
                      <span className="bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                        Oculta
                      </span>
                    )}
                  </div>

                  {/* Tag de Cor no Rodapé da Foto */}
                  {parsed.colorName && (
                    <span className="absolute bottom-1.5 right-1.5 bg-slate-900/90 text-amber-400 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs pointer-events-none">
                      <Palette className="w-2.5 h-2.5" />
                      {parsed.colorName}
                    </span>
                  )}
                </div>

                {/* Controles de Configuração da Foto */}
                <div className="p-2 space-y-2 bg-slate-50/80 border-t border-slate-100 text-xs">
                  {/* Botão de Destaque: Definir como Capa Principal da Peça */}
                  {isMainCover ? (
                    <div className="w-full py-1 px-1.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded flex items-center justify-center gap-1 shadow-2xs">
                      <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                      <span>⭐ Capa Principal da Peça</span>
                    </div>
                  ) : !isVideo ? (
                    <button
                      type="button"
                      onClick={() => handleSetMainCover(originalIndex)}
                      className="w-full py-1.5 px-2 bg-amber-100 hover:bg-amber-500 hover:text-slate-950 text-amber-900 border border-amber-300/80 font-bold text-[10px] rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs group/btn"
                      title="Definir esta foto como a Capa Principal #1 do catálogo e vitrine"
                    >
                      <Star className="w-3 h-3 text-amber-700 group-hover/btn:fill-slate-950 group-hover/btn:text-slate-950 transition-colors" />
                      <span>Definir como Capa Principal</span>
                    </button>
                  ) : (
                    <div className="w-full py-1 px-1.5 bg-slate-900 text-rose-300 border border-rose-800/60 font-bold text-[9px] rounded flex items-center justify-center gap-1 text-center">
                      <Video className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                      <span>Vídeo Provador (Dossiê)</span>
                    </div>
                  )}

                  {/* Seletor de Vínculo de Cor */}
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      🎨 Vincular à Cor:
                    </label>
                    <select
                      value={parsed.colorName || ''}
                      onChange={(e) => handleSetColor(originalIndex, e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">Sem cor vinculada</option>
                      {availableColors.map((c) => (
                        <option key={c.nome} value={c.nome}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ações Rápidas: Capa da Cor e Ocultar */}
                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-200/60">
                    {/* Botão Capa da Cor */}
                    <button
                      type="button"
                      disabled={!parsed.colorName}
                      onClick={() => handleToggleColorCover(originalIndex)}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                        !parsed.colorName
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                          : parsed.isColorCover
                          ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                      }`}
                      title={
                        parsed.colorName
                          ? `Definir esta foto como a miniatura oficial da cor "${parsed.colorName}" na vitrine`
                          : 'Vincule uma cor no campo acima para ativar'
                      }
                    >
                      <Star className={`w-3 h-3 ${parsed.isColorCover ? 'fill-slate-950' : ''}`} />
                      <span className="truncate">
                        {parsed.isColorCover ? 'Capa da Cor' : parsed.colorName ? 'Capa da Cor' : 'Capa de Cor'}
                      </span>
                    </button>

                    {/* Botão Ocultar/Exibir */}
                    <button
                      type="button"
                      onClick={() => handleToggleHide(originalIndex)}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                        parsed.isHidden
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={parsed.isHidden ? 'Reexibir foto no catálogo' : 'Ocultar foto do catálogo sem deletar'}
                    >
                      {parsed.isHidden ? (
                        <>
                          <Eye className="w-3 h-3 text-rose-600" />
                          <span>Reexibir</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-slate-500" />
                          <span>Ocultar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Barra de Reordenação e Exclusão */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={originalIndex === 0}
                        onClick={() => handleMove(originalIndex, 'left')}
                        className={`p-1.5 rounded text-slate-600 hover:bg-slate-200 transition-colors ${
                          originalIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Mover para a frente (posição anterior)"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={originalIndex === mediaList.length - 1}
                        onClick={() => handleMove(originalIndex, 'right')}
                        className={`p-1.5 rounded text-slate-600 hover:bg-slate-200 transition-colors ${
                          originalIndex === mediaList.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Mover para trás (próxima posição)"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(originalIndex)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Remover mídia da galeria da peça"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
