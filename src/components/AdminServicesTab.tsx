import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Megaphone,
  Clock,
  Settings,
  Scissors,
  HeartPulse,
  Truck,
  Syringe,
  Home,
  Users,
  ShoppingBag,
  Package,
  PawPrint,
  Stethoscope,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface ServiceItem {
  id: number | string;
  slug?: string | null;
  iconName: string;
  title: string;
  description: string;
  detailedInfo?: string;
  promoHeadline?: string;
  promoCopy?: string;
  highlights?: string[];
  availability?: string;
  ctaLabel?: string;
  isActive?: boolean;
  sortOrder?: number;
}

const SERVICE_ICON_OPTIONS = [
  { value: 'Scissors', label: 'Tijeras (Peluquería)' },
  { value: 'HeartPulse', label: 'Salud / Asesoría' },
  { value: 'Truck', label: 'Camión (Domicilio)' },
  { value: 'Syringe', label: 'Jeringa (Vacunación)' },
  { value: 'Home', label: 'Campo / Línea Agro' },
  { value: 'Users', label: 'Mayoristas / Aliados' },
  { value: 'Stethoscope', label: 'Estetoscopio (Clínica)' },
  { value: 'ShieldCheck', label: 'Protección / Garantía' },
  { value: 'PawPrint', label: 'Mascotas' },
  { value: 'ShoppingBag', label: 'Compras / Pedidos' },
  { value: 'Package', label: 'Insumos / Paquetes' },
];

const SERVICE_ICON_MAP: Record<string, typeof Settings> = {
  Scissors,
  HeartPulse,
  Truck,
  Syringe,
  Home,
  Users,
  Stethoscope,
  ShieldCheck,
  PawPrint,
  ShoppingBag,
  Package,
};

interface AdminServicesTabProps {
  getFreshToken: () => Promise<string | null>;
  canManageServices: boolean;
  onSyncPublicServices: (activeServices: ServiceItem[]) => void;
  onNotify: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

export default function AdminServicesTab({
  getFreshToken,
  canManageServices,
  onSyncPublicServices,
  onNotify,
}: AdminServicesTabProps) {
  const [adminServices, setAdminServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Array<number | string>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [iconName, setIconName] = useState('HeartPulse');
  const [description, setDescription] = useState('');
  const [detailedInfo, setDetailedInfo] = useState('');
  const [promoHeadline, setPromoHeadline] = useState('');
  const [promoCopy, setPromoCopy] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [availability, setAvailability] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Solicitar servicio');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const syncPublicList = useCallback(
    (rows: ServiceItem[]) => {
      onSyncPublicServices(rows.filter((s) => s.isActive !== false));
    },
    [onSyncPublicServices]
  );

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getFreshToken();
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
      const res = await fetch('/api/admin/services', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      const data = text ? (JSON.parse(text) as ServiceItem[] | { error?: string }) : null;
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(
          (!Array.isArray(data) && data?.error) || 'No se pudieron cargar los servicios.'
        );
      }
      setAdminServices(data);
      syncPublicList(data);
      if (data.length > 0 && expandedIds.length === 0) {
        setExpandedIds([data[0].id]);
      }
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al cargar los servicios.',
      });
    } finally {
      setLoading(false);
    }
  }, [getFreshToken, syncPublicList, onNotify]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const toggleExpand = (id: number | string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => setExpandedIds(adminServices.map((s) => s.id));
  const collapseAll = () => setExpandedIds([]);

  const resetForm = () => {
    setEditingService(null);
    setTitle('');
    setIconName('HeartPulse');
    setDescription('');
    setDetailedInfo('');
    setPromoHeadline('');
    setPromoCopy('');
    setHighlightsText('');
    setAvailability('');
    setCtaLabel('Solicitar servicio');
    setIsActive(true);
    setSortOrder(adminServices.length + 1);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingService(null);
    setTitle('');
    setIconName('HeartPulse');
    setDescription('');
    setDetailedInfo('');
    setPromoHeadline('');
    setPromoCopy('');
    setHighlightsText('');
    setAvailability('');
    setCtaLabel('Solicitar servicio');
    setIsActive(true);
    setSortOrder(adminServices.length + 1);
    setShowForm(true);
  };

  const openEditForm = (srv: ServiceItem) => {
    setEditingService(srv);
    setTitle(srv.title);
    setIconName(srv.iconName || 'HeartPulse');
    setDescription(srv.description || '');
    setDetailedInfo(srv.detailedInfo || '');
    setPromoHeadline(srv.promoHeadline || '');
    setPromoCopy(srv.promoCopy || '');
    setHighlightsText(Array.isArray(srv.highlights) ? srv.highlights.join('\n') : '');
    setAvailability(srv.availability || '');
    setCtaLabel(srv.ctaLabel || 'Solicitar servicio');
    setIsActive(srv.isActive !== false);
    setSortOrder(typeof srv.sortOrder === 'number' ? srv.sortOrder : 0);
    setShowForm(true);
  };

  const handleSaveService = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onNotify(null);
    setSaving(true);
    try {
      const token = await getFreshToken();
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

      const highlights = highlightsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        iconName,
        description: description.trim(),
        detailedInfo: detailedInfo.trim(),
        promoHeadline: promoHeadline.trim(),
        promoCopy: promoCopy.trim(),
        highlights,
        availability: availability.trim(),
        ctaLabel: ctaLabel.trim() || 'Solicitar servicio',
        isActive,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      };

      const isEditing = Boolean(editingService);
      const url = isEditing ? `/api/services/${editingService!.id}` : '/api/services';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? (JSON.parse(text) as ServiceItem & { error?: string }) : null;
      if (!res.ok || !data || 'error' in data && data.error) {
        throw new Error(data?.error || 'No se pudo guardar el servicio.');
      }

      const nextList = isEditing
        ? adminServices.map((s) => (s.id === data.id ? data : s))
        : [...adminServices, data];
      nextList.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      setAdminServices(nextList);
      syncPublicList(nextList);
      if (!expandedIds.includes(data.id)) {
        setExpandedIds((prev) => [...prev, data.id]);
      }
      onNotify({
        type: 'success',
        text: isEditing
          ? `Servicio "${data.title}" actualizado correctamente.`
          : `Servicio "${data.title}" agregado al catálogo de servicios.`,
      });
      resetForm();
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar el servicio.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (srv: ServiceItem) => {
    onNotify(null);
    setTogglingId(srv.id);
    const nextActive = !(srv.isActive !== false);
    try {
      const token = await getFreshToken();
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

      const res = await fetch(`/api/services/${srv.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextActive }),
      });

      const text = await res.text();
      const data = text ? (JSON.parse(text) as ServiceItem & { error?: string }) : null;
      if (!res.ok || !data || 'error' in data && data.error) {
        throw new Error(data?.error || 'No se pudo cambiar el estado del servicio.');
      }

      const nextList = adminServices.map((s) => (s.id === data.id ? data : s));
      setAdminServices(nextList);
      syncPublicList(nextList);
      onNotify({
        type: 'success',
        text: nextActive
          ? `El servicio "${data.title}" ahora está visible en la página.`
          : `El servicio "${data.title}" fue pausado y ocultado de la página.`,
      });
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar estado.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteService = async (srv: ServiceItem) => {
    onNotify(null);
    try {
      const token = await getFreshToken();
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

      const res = await fetch(`/api/services/${srv.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      const data = text ? (JSON.parse(text) as { deletedId?: number; error?: string }) : null;
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo eliminar el servicio.');
      }

      const nextList = adminServices.filter((s) => s.id !== srv.id);
      setAdminServices(nextList);
      syncPublicList(nextList);
      setConfirmDeleteId(null);
      if (editingService?.id === srv.id) {
        resetForm();
      }
      onNotify({
        type: 'success',
        text: `Servicio "${srv.title}" eliminado permanentemente.`,
      });
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al eliminar el servicio.',
      });
    }
  };

  const activeCount = adminServices.filter((s) => s.isActive !== false).length;
  const pausedCount = adminServices.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-base">
            Servicios Activos y Publicidad ({adminServices.length})
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {activeCount} visibles en la página · {pausedCount} pausados · Despliega cada punto para ver o editar su información y publicidad
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {adminServices.length > 0 && (
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-md transition-colors whitespace-nowrap"
              >
                Expandir todos
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-md transition-colors whitespace-nowrap"
              >
                Contraer todos
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={loadServices}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>

          {canManageServices && (
            <button
              type="button"
              onClick={showForm && !editingService ? resetForm : openCreateForm}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
            >
              {showForm && !editingService ? <X size={14} /> : <Plus size={14} />}
              {showForm && !editingService ? 'Cerrar formulario' : 'Agregar Servicio'}
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Service Form */}
      {showForm && canManageServices && (
        <form
          onSubmit={handleSaveService}
          className="bg-white border border-blue-200 rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h5 className="font-bold text-slate-900 flex items-center gap-2">
              {editingService ? <Edit2 size={17} className="text-blue-600" /> : <Plus size={17} className="text-emerald-600" />}
              {editingService ? `Editar Servicio: ${editingService.title}` : 'Crear Nuevo Servicio'}
            </h5>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </button>
          </div>

          {/* Block 1: Basic Identity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nombre del servicio *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Peluquería, Teleconsulta, Guardería..."
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Ícono representativo
              </label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="admin-input"
              >
                {SERVICE_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Orden de aparición
              </label>
              <input
                type="number"
                min={0}
                max={999}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="admin-input tabular-nums"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Resumen corto (visible antes de desplegar) *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Cortes especializados y cuidado para mantener a tu mascota hermosa."
                className="admin-input"
              />
            </div>
          </div>

          {/* Block 2: Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Información detallada (al desplegar)
              </label>
              <textarea
                rows={4}
                value={detailedInfo}
                onChange={(e) => setDetailedInfo(e.target.value)}
                placeholder="Explica qué incluye el servicio, cómo se presta, requisitos o cobertura..."
                className="admin-input resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Puntos clave / Beneficios (uno por línea)
              </label>
              <textarea
                rows={4}
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                placeholder={'Baño cosmético o medicado\nCorte según raza\nLimpieza de oídos y uñas'}
                className="admin-input resize-none"
              />
            </div>
          </div>

          {/* Block 3: Advertising & CTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Titular de publicidad / Promoción
              </label>
              <input
                type="text"
                value={promoHeadline}
                onChange={(e) => setPromoHeadline(e.target.value)}
                placeholder="Ej: Spa y Peluquería con Baño Medicado"
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Horario o disponibilidad
              </label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="Ej: Lunes a Sábado · Atención con cita previa"
                className="admin-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mensaje publicitario / Oferta comercial
              </label>
              <textarea
                rows={2}
                value={promoCopy}
                onChange={(e) => setPromoCopy(e.target.value)}
                placeholder="Ej: Incluye corte según raza, cepillado y loción hipoalergénica. Pregunta por combos con desparasitación."
                className="admin-input resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Texto del botón de contacto
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Ej: Agendar Peluquería"
                className="admin-input"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Servicio activo (visible para todos los clientes en la página)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <Save size={15} />
              {saving ? 'Guardando...' : editingService ? 'Guardar Cambios' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      )}

      {/* Expandable Service Accordion List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Cargando servicios configurados...
        </div>
      ) : adminServices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-slate-600 font-semibold">No hay servicios registrados.</p>
          {canManageServices && (
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Agregar primer servicio
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {adminServices.map((srv) => {
            const Icon = SERVICE_ICON_MAP[srv.iconName] || Settings;
            const isExpanded = expandedIds.includes(srv.id);
            const active = srv.isActive !== false;
            const highlights = Array.isArray(srv.highlights) ? srv.highlights : [];

            return (
              <div
                key={srv.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
                  active ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                {/* Accordion Header */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(srv.id)}
                    aria-expanded={isExpanded}
                    className="flex items-start gap-4 text-left flex-1 min-w-0 group"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                          {srv.title}
                        </h5>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span
                          className={`text-xs font-semibold ${
                            active ? 'text-teal-700' : 'text-amber-700'
                          }`}
                        >
                          {active ? 'Activo en tienda' : 'Pausado (oculto al público)'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          Orden {srv.sortOrder ?? 0}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {srv.description}
                      </p>
                    </div>
                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-slate-700 shrink-0">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pl-15 lg:pl-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(srv.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold whitespace-nowrap"
                    >
                      {isExpanded ? 'Ocultar detalle' : 'Desplegar info'}
                    </button>

                    {canManageServices && (
                      <>
                        <button
                          type="button"
                          disabled={togglingId === srv.id}
                          onClick={() => handleToggleActive(srv)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50 ${
                            active
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {active ? <EyeOff size={13} /> : <Eye size={13} />}
                          {active ? 'Quitar / Pausar' : 'Activar servicio'}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditForm(srv)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Edit2 size={13} /> Editar
                        </button>

                        {confirmDeleteId === srv.id ? (
                          <span className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteService(srv)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(srv.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            title="Eliminar servicio"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expandable Organized Content: Information & Advertising */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 border-t border-slate-100 bg-slate-50/70 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 space-y-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Información del servicio
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {srv.detailedInfo || 'Sin información detallada configurada todavía.'}
                        </p>
                      </div>

                      {highlights.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Beneficios e incluidos
                          </p>
                          <ul className="space-y-1.5">
                            {highlights.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-700"
                              >
                                <CheckCircle2
                                  size={14}
                                  className="text-teal-600 shrink-0 mt-0.5"
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {srv.availability && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                          <Clock size={14} className="text-blue-600 shrink-0" />
                          <span>{srv.availability}</span>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                          <Megaphone size={14} className="text-blue-600 shrink-0" />
                          <span>Publicidad y Promoción</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {srv.promoHeadline || 'Sin titular promocional'}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {srv.promoCopy || 'Agrega un texto publicitario o promoción para atraer más clientes a este servicio.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500">
                          Botón: <strong className="text-slate-800">{srv.ctaLabel || 'Solicitar servicio'}</strong>
                        </span>
                        {canManageServices && (
                          <button
                            type="button"
                            onClick={() => openEditForm(srv)}
                            className="text-blue-700 hover:underline font-semibold whitespace-nowrap"
                          >
                            Editar publicidad
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
