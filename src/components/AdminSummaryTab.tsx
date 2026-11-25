import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { RefreshCw, TrendingUp, BarChart3, ArrowRight, Package } from 'lucide-react';
import type { AdminSummaryData } from '../db/catalog';

interface AdminSummaryTabProps {
  getFreshToken: () => Promise<string | null>;
  onNavigateToInquiries: () => void;
  onNavigateToProducts: () => void;
  onGoToContactForm: () => void;
}

const CATEGORY_COLORS = [
  '#1d4ed8',
  '#0d9488',
  '#0284c7',
  '#0f766e',
  '#2563eb',
  '#059669',
  '#4f46e5',
  '#64748b',
];

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#d97706',
  en_proceso: '#2563eb',
  atendida: '#16a34a',
  cancelada: '#dc2626',
};

interface MonthlyTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  payload?: { fullLabel?: string; total?: number; completed?: number; active?: number };
}

function MonthlyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: MonthlyTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-900 mb-1.5">{row?.fullLabel}</p>
      <div className="space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Total pedidos</span>
          <span className="font-semibold text-blue-700">{row?.total ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Atendidos</span>
          <span className="font-semibold text-teal-700">{row?.completed ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Pendientes / en proceso</span>
          <span className="font-semibold text-amber-700">{row?.active ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

interface CategoryTooltipPayloadItem {
  payload?: {
    category?: string;
    count?: number;
    completed?: number;
    percentage?: number;
  };
}

function CategoryTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: CategoryTooltipPayloadItem[];
  mode: 'orders' | 'catalog';
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-lg text-xs max-w-xs">
      <p className="font-semibold text-slate-900 mb-1.5">{row.category}</p>
      <div className="space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">
            {mode === 'orders' ? 'Pedidos solicitados' : 'Productos en catálogo'}
          </span>
          <span className="font-semibold text-blue-700">{row.count ?? 0}</span>
        </div>
        {mode === 'orders' && typeof row.percentage === 'number' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Participación</span>
            <span className="font-semibold text-slate-800">{row.percentage}%</span>
          </div>
        )}
        {mode === 'orders' && typeof row.completed === 'number' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Atendidos</span>
            <span className="font-semibold text-teal-700">{row.completed}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSummaryTab({
  getFreshToken,
  onNavigateToInquiries,
  onNavigateToProducts,
  onGoToContactForm,
}: AdminSummaryTabProps) {
  const [months, setMonths] = useState<3 | 6 | 12>(6);
  const [trendChartType, setTrendChartType] = useState<'area' | 'bar'>('area');
  const [categoryViewMode, setCategoryViewMode] = useState<'orders' | 'catalog'>('orders');
  const [summary, setSummary] = useState<AdminSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(
    async (targetMonths: 3 | 6 | 12) => {
      setLoading(true);
      setError(null);
      try {
        const token = await getFreshToken();
        if (!token) {
          throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
        }
        const res = await fetch(`/api/admin/summary?months=${targetMonths}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        let data: (AdminSummaryData & { error?: string }) | null = null;
        if (text) {
          try {
            data = JSON.parse(text) as AdminSummaryData & { error?: string };
          } catch {
            data = null;
          }
        }
        if (!res.ok || !data || 'error' in data && data.error) {
          throw new Error(data?.error || 'No se pudo cargar el resumen administrativo.');
        }
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar las métricas.');
      } finally {
        setLoading(false);
      }
    },
    [getFreshToken]
  );

  useEffect(() => {
    loadSummary(months);
  }, [months, loadSummary]);

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-9 w-56 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-24 bg-white border border-slate-200 rounded-2xl p-5" />
          ))}
        </div>
        <div className="h-80 bg-white border border-slate-200 rounded-2xl p-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 bg-white border border-slate-200 rounded-2xl p-6" />
          <div className="lg:col-span-5 h-80 bg-white border border-slate-200 rounded-2xl p-6" />
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => loadSummary(months)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  const kpis = summary?.kpis;
  const monthlyTrends = summary?.monthlyTrends ?? [];
  const topCategories = summary?.topCategories ?? [];
  const catalogByCategory = summary?.catalogByCategory ?? [];
  const statusBreakdown = summary?.statusBreakdown ?? [];

  const activeQueue = (kpis?.pendingOrders ?? 0) + (kpis?.inProgressOrders ?? 0);
  const monthDelta = (kpis?.currentMonthOrders ?? 0) - (kpis?.previousMonthOrders ?? 0);
  const monthDeltaLabel =
    monthDelta > 0
      ? `+${monthDelta} respecto al mes anterior`
      : monthDelta < 0
        ? `${monthDelta} respecto al mes anterior`
        : 'Sin variación frente al mes anterior';

  const activeCategoryDataset =
    categoryViewMode === 'orders' ? topCategories : catalogByCategory;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-display font-bold text-slate-900">
            Resumen Administrativo
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tendencias mensuales de pedidos y categorías con mayor demanda en tienda y línea agro
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Rango de meses"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
          >
            {([3, 6, 12] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  months === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m} meses
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadSummary(months)}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadSummary(months)}
            className="font-semibold underline whitespace-nowrap"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Pedidos Totales</p>
          <p className="text-2xl font-display font-bold text-slate-900 mt-1 tabular-nums">
            {kpis?.totalOrders ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            {kpis?.currentMonthOrders ?? 0} este mes · {monthDeltaLabel}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Tasa de Atención</p>
          <p className="text-2xl font-display font-bold text-teal-700 mt-1 tabular-nums">
            {kpis?.completionRate ?? 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            {kpis?.completedOrders ?? 0} atendidos de {kpis?.totalOrders ?? 0} registrados
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Cola Activa</p>
            <p className="text-2xl font-display font-bold text-amber-700 mt-1 tabular-nums">
              {activeQueue}
            </p>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
            <span>
              {kpis?.pendingOrders ?? 0} pendientes · {kpis?.inProgressOrders ?? 0} en proceso
            </span>
            <button
              type="button"
              onClick={onNavigateToInquiries}
              className="text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Gestionar <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Categoría Líder</p>
            <p
              className="text-base font-display font-bold text-slate-900 mt-1.5 truncate"
              title={kpis?.topCategoryName || 'Sin pedidos aún'}
            >
              {kpis?.topCategoryName || 'Sin pedidos aún'}
            </p>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
            <span>
              {kpis?.topCategoryName
                ? `${kpis.topCategoryCount} ${kpis.topCategoryCount === 1 ? 'solicitud' : 'solicitudes'}`
                : `${kpis?.totalProducts ?? 0} productos activos`}
            </span>
            <button
              type="button"
              onClick={onNavigateToProducts}
              className="text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Catálogo <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart 1: Monthly Order Trends */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Tendencia de Pedidos Mensuales
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Volumen mensual de solicitudes recibidas frente a pedidos atendidos en los últimos {months} meses
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-700 inline-block" />
                Total pedidos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />
                Atendidos
              </span>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setTrendChartType('area')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  trendChartType === 'area'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp size={13} /> Área
              </button>
              <button
                type="button"
                onClick={() => setTrendChartType('bar')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  trendChartType === 'bar'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={13} /> Barras
              </button>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {trendChartType === 'area' ? (
              <AreaChart data={monthlyTrends} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersTotalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="ordersCompletedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MonthlyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total pedidos"
                  stroke="#1d4ed8"
                  strokeWidth={2.25}
                  fill="url(#ordersTotalFill)"
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Atendidos"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fill="url(#ordersCompletedFill)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={monthlyTrends} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MonthlyTooltip />} />
                <Bar
                  dataKey="total"
                  name="Total pedidos"
                  fill="#1d4ed8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="completed"
                  name="Atendidos"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {(kpis?.totalOrders ?? 0) === 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Aún no hay pedidos registrados. La línea temporal se alimentará en tiempo real al recibir solicitudes desde el formulario o el catálogo.
            </span>
            <button
              type="button"
              onClick={onGoToContactForm}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              Ir al formulario de pedidos
            </button>
          </div>
        )}
      </div>

      {/* Bottom Split: Most Requested Product Categories + Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {categoryViewMode === 'orders'
                  ? 'Categorías de Productos Más Solicitadas'
                  : 'Distribución del Catálogo por Categoría'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {categoryViewMode === 'orders'
                  ? 'Clasificación según los pedidos enviados desde catálogo y contacto'
                  : 'Cantidad de referencias publicadas actualmente por categoría'}
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCategoryViewMode('orders')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  categoryViewMode === 'orders'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Pedidos
              </button>
              <button
                type="button"
                onClick={() => setCategoryViewMode('catalog')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  categoryViewMode === 'catalog'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Catálogo
              </button>
            </div>
          </div>

          {activeCategoryDataset.length === 0 ? (
            <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center px-6 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
              <Package size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Sin solicitudes por categoría todavía
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Cuando los clientes soliciten productos desde el catálogo o el formulario, verás aquí qué líneas tienen mayor demanda.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryViewMode('catalog')}
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Ver distribución del catálogo
                </button>
                <button
                  type="button"
                  onClick={onGoToContactForm}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Registrar pedido de prueba
                </button>
              </div>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeCategoryDataset}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={170}
                    tick={{ fill: '#334155', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CategoryTooltip mode={categoryViewMode} />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
                    {activeCategoryDataset.map((entry, idx) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900">Estado de Pedidos</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Seguimiento operativo del historial recibido
            </p>
          </div>

          {statusBreakdown.length === 0 ? (
            <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center px-6 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
              <p className="text-sm font-semibold text-slate-700">
                Sin pedidos en cola
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Aquí aparecerá la proporción entre pedidos pendientes, en proceso, atendidos y cancelados.
              </p>
              <button
                type="button"
                onClick={onNavigateToInquiries}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Abrir Historial de Pedidos
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}`, name]}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                {statusBreakdown.map((item) => {
                  const total = kpis?.totalOrders || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div
                      key={item.status}
                      className="py-2 flex items-center justify-between text-xs tabular-nums"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[item.status] || '#64748b' }}
                        />
                        <span className="font-medium text-slate-700">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{pct}%</span>
                        <span className="font-semibold text-slate-900 w-6 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
