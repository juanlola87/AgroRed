import { useMemo } from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

export function parseProductPrice(rawPrice: string): number {
  const cleaned = rawPrice.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return 0;
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) {
    return Number(cleaned.replace(/[.,]/g, '')) || 0;
  }
  const normalized = cleaned.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export function formatCopPrice(value: number): string {
  return `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

export interface PricePreset {
  id: string;
  label: string;
  min: number;
  max: number;
}

export interface DynamicPriceBounds {
  min: number;
  max: number;
  step: number;
  presets: PricePreset[];
  hasRange: boolean;
}

export function computeDynamicPriceBounds(prices: number[]): DynamicPriceBounds {
  const valid = prices.filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (valid.length === 0) {
    return { min: 0, max: 0, step: 1000, presets: [], hasRange: false };
  }

  const rawMin = valid[0];
  const rawMax = valid[valid.length - 1];
  const rawSpan = rawMax - rawMin;

  if (rawSpan <= 0) {
    return { min: rawMin, max: rawMax, step: 1000, presets: [], hasRange: false };
  }

  const unit = rawSpan > 200000 ? 5000 : 1000;
  const min = Math.floor(rawMin / unit) * unit;
  const max = Math.ceil(rawMax / unit) * unit;
  const step = rawSpan <= 20000 ? 500 : rawSpan <= 150000 ? 1000 : 5000;

  const uniqueSorted = Array.from(new Set(valid));
  const presets: PricePreset[] = [];

  if (uniqueSorted.length >= 3) {
    const q1Raw = uniqueSorted[Math.floor((uniqueSorted.length - 1) * 0.33)];
    const q2Raw = uniqueSorted[Math.floor((uniqueSorted.length - 1) * 0.67)];
    let cut1 = Math.round(q1Raw / unit) * unit;
    let cut2 = Math.round(q2Raw / unit) * unit;

    if (cut1 <= min) cut1 = min + step;
    if (cut2 >= max) cut2 = max - step;

    if (cut1 > min && cut2 > cut1 && cut2 < max) {
      presets.push(
        { id: 'low', label: `Hasta ${formatCopPrice(cut1)}`, min, max: cut1 },
        { id: 'mid', label: `${formatCopPrice(cut1)} – ${formatCopPrice(cut2)}`, min: cut1, max: cut2 },
        { id: 'high', label: `Desde ${formatCopPrice(cut2)}`, min: cut2, max }
      );
    } else {
      const mid = Math.round(((min + max) / 2) / unit) * unit;
      if (mid > min && mid < max) {
        presets.push(
          { id: 'low', label: `Hasta ${formatCopPrice(mid)}`, min, max: mid },
          { id: 'high', label: `Desde ${formatCopPrice(mid)}`, min: mid, max }
        );
      }
    }
  } else if (uniqueSorted.length === 2) {
    const mid = Math.round(((min + max) / 2) / unit) * unit;
    if (mid > min && mid < max) {
      presets.push(
        { id: 'low', label: `Hasta ${formatCopPrice(mid)}`, min, max: mid },
        { id: 'high', label: `Desde ${formatCopPrice(mid)}`, min: mid, max }
      );
    }
  }

  return { min, max, step, presets, hasRange: max > min };
}

interface PriceRangeFilterProps {
  bounds: DynamicPriceBounds;
  selectedMin: number | null;
  selectedMax: number | null;
  onChangeRange: (min: number | null, max: number | null) => void;
  petLabel: string;
  visibleCount: number;
  totalInScope: number;
}

export default function PriceRangeFilter({
  bounds,
  selectedMin,
  selectedMax,
  onChangeRange,
  petLabel,
  visibleCount,
  totalInScope,
}: PriceRangeFilterProps) {
  const activeMin = selectedMin !== null ? Math.max(bounds.min, Math.min(selectedMin, bounds.max)) : bounds.min;
  const activeMax = selectedMax !== null ? Math.min(bounds.max, Math.max(selectedMax, bounds.min)) : bounds.max;
  const isFiltered =
    bounds.hasRange && (activeMin > bounds.min || activeMax < bounds.max);

  const trackStyle = useMemo(() => {
    if (!bounds.hasRange) return { left: '0%', width: '100%' };
    const span = bounds.max - bounds.min;
    const leftPct = ((activeMin - bounds.min) / span) * 100;
    const rightPct = ((activeMax - bounds.min) / span) * 100;
    return {
      left: `${Math.max(0, Math.min(100, leftPct))}%`,
      width: `${Math.max(0, Math.min(100 - leftPct, rightPct - leftPct))}%`,
    };
  }, [bounds, activeMin, activeMax]);

  if (totalInScope === 0 || bounds.max <= 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-950">
            <SlidersHorizontal size={16} className="text-blue-600 shrink-0" />
            <span>Filtro de Precio</span>
          </div>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 tabular-nums">
            Línea {petLabel}: rango disponible {formatCopPrice(bounds.min)} – {formatCopPrice(bounds.max)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 tabular-nums mr-1">
            {visibleCount} de {totalInScope} {totalInScope === 1 ? 'producto' : 'productos'}
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={() => onChangeRange(null, null)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw size={12} /> Restablecer precio
            </button>
          )}
        </div>
      </div>

      {bounds.hasRange ? (
        <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Dynamic Preset Buttons */}
          <div className="lg:col-span-6 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChangeRange(null, null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                !isFiltered
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              Todos los precios
            </button>
            {bounds.presets.map((preset) => {
              const active =
                isFiltered && activeMin === preset.min && activeMax === preset.max;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChangeRange(preset.min, preset.max)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Dual Range Slider + Exact Min/Max Inputs */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 tabular-nums mb-1.5">
                <span>Mín: {formatCopPrice(activeMin)}</span>
                <span>Máx: {formatCopPrice(activeMax)}</span>
              </div>
              <div className="relative h-6 flex items-center">
                <div className="w-full h-1.5 bg-slate-200 rounded-full relative">
                  <div
                    className="absolute h-1.5 bg-blue-600 rounded-full"
                    style={trackStyle}
                  />
                </div>
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={activeMin}
                  aria-label="Precio mínimo"
                  onChange={(e) => {
                    const nextMin = Math.min(Number(e.target.value), activeMax);
                    onChangeRange(nextMin, activeMax);
                  }}
                  className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:cursor-pointer"
                />
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={activeMax}
                  aria-label="Precio máximo"
                  onChange={(e) => {
                    const nextMax = Math.max(Number(e.target.value), activeMin);
                    onChangeRange(activeMin, nextMax);
                  }}
                  className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="sr-only" htmlFor="price-min-input">Precio mínimo exacto</label>
              <input
                id="price-min-input"
                type="number"
                min={bounds.min}
                max={activeMax}
                step={bounds.step}
                value={activeMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!Number.isFinite(val)) return;
                  const clamped = Math.max(bounds.min, Math.min(val, activeMax));
                  onChangeRange(clamped, activeMax);
                }}
                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 tabular-nums focus:outline-none focus:border-blue-600"
              />
              <span className="text-slate-400 text-xs">–</span>
              <label className="sr-only" htmlFor="price-max-input">Precio máximo exacto</label>
              <input
                id="price-max-input"
                type="number"
                min={activeMin}
                max={bounds.max}
                step={bounds.step}
                value={activeMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!Number.isFinite(val)) return;
                  const clamped = Math.min(bounds.max, Math.max(val, activeMin));
                  onChangeRange(activeMin, clamped);
                }}
                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-3 text-xs text-slate-500 tabular-nums">
          Precio único en esta selección: <span className="font-semibold text-slate-800">{formatCopPrice(bounds.min)}</span>
        </div>
      )}
    </div>
  );
}
