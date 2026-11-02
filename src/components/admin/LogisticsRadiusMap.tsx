'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, CheckCircle, XCircle, Loader2, Compass } from 'lucide-react';
import { CoordenadasGeograficas, calculateGeodesicDistanceKm, fetchCepCoordinates } from '@/lib/shipping-engine';

interface LogisticsRadiusMapProps {
  center: CoordenadasGeograficas;
  radiusKm: number;
  storeName?: string;
  onCoordinatesChange?: (coords: CoordenadasGeograficas) => void;
  onRadiusChange?: (radiusKm: number) => void;
  color?: string;
}

export const LogisticsRadiusMap: React.FC<LogisticsRadiusMapProps> = ({
  center,
  radiusKm,
  storeName = 'Boutique Física',
  onCoordinatesChange,
  onRadiusChange,
  color = '#10B981' // Esmeralda elegante
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const testMarkerRef = useRef<any>(null);
  const testLineRef = useRef<any>(null);

  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [testCep, setTestCep] = useState('');
  const [isTestingCep, setIsTestingCep] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'inside' | 'outside' | 'error';
    distanceKm?: number;
    message?: string;
    destination?: CoordenadasGeograficas;
  } | null>(null);

  // Carrega CSS e JS do Leaflet dinamicamente para zero overhead e zero lock-in
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Injeta CSS do Leaflet se ainda não existir
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Injeta JS do Leaflet se ainda não existir
    if ((window as any).L) {
      setIsLeafletLoaded(true);
    } else {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setIsLeafletLoaded(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  // Inicializa ou atualiza o Mapa
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const lat = center?.latitude || -25.5348;
    const lon = center?.longitude || -49.2064;

    if (!mapInstanceRef.current) {
      // Cria a instância do mapa
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 12,
        scrollWheelZoom: false
      });

      // Camada CartoDB Voyager / OpenStreetMap (Leve, limpa e moderna)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      // Ícone customizado da Loja Física
      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="background: #C5A059; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      // Marcador da Loja
      const marker = L.marker([lat, lon], {
        icon: storeIcon,
        draggable: true
      }).addTo(map);

      marker.bindPopup(`<b>${storeName}</b><br/>Arraste para ajustar o ponto exato da loja.`);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        if (circleRef.current) {
          circleRef.current.setLatLng(position);
        }
        if (onCoordinatesChange) {
          onCoordinatesChange({
            latitude: Number(position.lat.toFixed(5)),
            longitude: Number(position.lng.toFixed(5)),
            cidade: center.cidade,
            uf: center.uf,
            cep: center.cep
          });
        }
      });

      // Círculo Translúcido de Cobertura
      const circle = L.circle([lat, lon], {
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
        radius: (radiusKm || 15) * 1000 // metros
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    } else {
      // Atualiza posição do marcador e raio do círculo
      const map = mapInstanceRef.current;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      }
      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lon]);
        circleRef.current.setRadius((radiusKm || 15) * 1000);
        circleRef.current.setStyle({ color: color, fillColor: color });
      }
    }
  }, [isLeafletLoaded, center?.latitude, center?.longitude, radiusKm, color, storeName]);

  // Função para testar qualquer CEP no mapa
  const handleTestCep = async () => {
    const clean = testCep.replace(/\D/g, '');
    if (clean.length !== 8) {
      setTestResult({ status: 'error', message: 'Digite um CEP válido com 8 dígitos.' });
      return;
    }

    setIsTestingCep(true);
    setTestResult(null);

    try {
      const coords = await fetchCepCoordinates(clean);
      if (!coords || !coords.latitude || !coords.longitude) {
        setTestResult({
          status: 'error',
          message: 'Não foi possível localizar as coordenadas geográficas deste CEP.'
        });
        return;
      }

      const dist = calculateGeodesicDistanceKm(
        center.latitude,
        center.longitude,
        coords.latitude,
        coords.longitude
      );

      const isInside = dist <= radiusKm;
      setTestResult({
        status: isInside ? 'inside' : 'outside',
        distanceKm: dist,
        destination: coords,
        message: isInside
          ? `✓ Elegível: Endereço a ${dist} km da loja (Dentro do raio de ${radiusKm} km)`
          : `✗ Fora de Cobertura: Endereço a ${dist} km da loja (Excede o raio de ${radiusKm} km)`
      });

      // Plota no mapa
      const L = (window as any).L;
      const map = mapInstanceRef.current;
      if (L && map) {
        if (testMarkerRef.current) map.removeLayer(testMarkerRef.current);
        if (testLineRef.current) map.removeLayer(testLineRef.current);

        const destIcon = L.divIcon({
          className: 'custom-dest-pin',
          html: `
            <div style="background: ${isInside ? '#10B981' : '#EF4444'}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid white;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const destMarker = L.marker([coords.latitude, coords.longitude], { icon: destIcon }).addTo(map);
        destMarker.bindPopup(`<b>Destino de Teste (CEP ${clean})</b><br/>Distância: ${dist} km`).openPopup();
        testMarkerRef.current = destMarker;

        // Linha tracejada conectando a loja e o destino
        const line = L.polyline(
          [
            [center.latitude, center.longitude],
            [coords.latitude, coords.longitude]
          ],
          {
            color: isInside ? '#10B981' : '#EF4444',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.8
          }
        ).addTo(map);
        testLineRef.current = line;

        // Ajusta zoom para enquadrar ambos os pontos
        map.fitBounds([
          [center.latitude, center.longitude],
          [coords.latitude, coords.longitude]
        ], { padding: [50, 50] });
      }
    } catch (err: any) {
      setTestResult({ status: 'error', message: err?.message || 'Erro ao consultar o CEP.' });
    } finally {
      setIsTestingCep(false);
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.latitude, center.longitude], 12);
    }
  };

  return (
    <div className="space-y-3">
      {/* Controles de Topo do Mapa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-stone-900/60 p-3 rounded-xl border border-slate-200 dark:border-stone-800 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-stone-300">
          <Compass className="w-4 h-4 text-[#C5A059]" />
          <span>
            Centro em: <strong>{center.cidade || 'Origem'} ({center.uf || 'UF'})</strong> • Raio Atual: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{radiusKm} km</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg text-slate-700 dark:text-stone-200 font-semibold hover:border-[#C5A059] transition-colors cursor-pointer"
          >
            Recentralizar Loja
          </button>
        </div>
      </div>

      {/* Container do Mapa */}
      <div className="relative w-full h-[340px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-stone-800 shadow-inner bg-slate-100">
        {!isLeafletLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-stone-900 text-slate-500 text-xs gap-2 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
            <span>Carregando mapa interativo de cobertura...</span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

        {/* Legenda Flutuante */}
        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 dark:border-stone-800 shadow-md text-[11px] space-y-1" style={{ zIndex: 1000 }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#C5A059]" />
            <span className="font-semibold text-slate-800 dark:text-stone-200">Sua Loja Física (Pino arrastável)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500" />
            <span className="text-slate-600 dark:text-stone-400">Área de Atuação ({radiusKm} km)</span>
          </div>
        </div>
      </div>

      {/* Simulador de Teste de CEP ao Vivo no Mapa */}
      <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 dark:text-stone-200 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Testar CEP no Mapa:</span>
          </label>
          <span className="text-[11px] text-slate-500 dark:text-stone-400">
            Verifique se a casa da sua cliente está dentro do raio
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testCep}
            onChange={(e) => setTestCep(e.target.value)}
            placeholder="Digite um CEP de teste (ex: 82010-600)"
            maxLength={9}
            className="flex-1 bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-lg px-3 py-2 text-slate-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleTestCep}
            disabled={isTestingCep}
            className="px-4 py-2 bg-[#1A1918] dark:bg-[#C5A059] text-white hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] dark:hover:text-[#1A1918] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isTestingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            <span>Testar</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-medium animate-fadeIn ${
              testResult.status === 'inside'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : testResult.status === 'outside'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            {testResult.status === 'inside' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

