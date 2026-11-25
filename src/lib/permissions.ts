export type AdminPermission =
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'inquiries:view'
  | 'inquiries:manage'
  | 'services:view'
  | 'services:manage'
  | 'settings:edit'
  | 'users:manage';

export interface PermissionDefinition {
  id: AdminPermission;
  label: string;
  description: string;
  group: 'Catálogo' | 'Asesorías' | 'Servicios' | 'Administración';
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    id: 'products:create',
    label: 'Crear productos',
    description: 'Agregar nuevos productos al catálogo.',
    group: 'Catálogo',
  },
  {
    id: 'products:edit',
    label: 'Editar productos',
    description: 'Modificar precios, categorías, imágenes y datos.',
    group: 'Catálogo',
  },
  {
    id: 'products:delete',
    label: 'Eliminar productos',
    description: 'Quitar productos existentes del catálogo.',
    group: 'Catálogo',
  },
  {
    id: 'inquiries:view',
    label: 'Ver historial de pedidos y solicitudes',
    description: 'Consultar el historial de pedidos y mensajes enviados por contacto.',
    group: 'Asesorías',
  },
  {
    id: 'inquiries:manage',
    label: 'Gestionar pedidos y solicitudes',
    description: 'Cambiar el estado de pedidos (pendiente, en proceso, atendido).',
    group: 'Asesorías',
  },
  {
    id: 'services:view',
    label: 'Ver servicios activos',
    description: 'Consultar el listado y detalle de los servicios configurados.',
    group: 'Servicios',
  },
  {
    id: 'services:manage',
    label: 'Gestionar servicios y publicidad',
    description: 'Agregar, editar, activar/desactivar o eliminar servicios y su publicidad.',
    group: 'Servicios',
  },
  {
    id: 'settings:edit',
    label: 'Editar datos de la página',
    description: 'Modificar contactos, aliados, líneas de pedido, horarios y textos globales.',
    group: 'Administración',
  },
  {
    id: 'users:manage',
    label: 'Gestionar equipo y permisos',
    description: 'Crear usuarios administradores y asignar sus permisos.',
    group: 'Administración',
  },
];

export const ALL_PERMISSIONS: AdminPermission[] = PERMISSION_DEFINITIONS.map((p) => p.id);

export function sanitizePermissions(input: unknown): AdminPermission[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(ALL_PERMISSIONS);
  const unique = new Set<AdminPermission>();
  for (const item of input) {
    if (typeof item === 'string' && allowed.has(item)) {
      unique.add(item as AdminPermission);
    }
  }
  return Array.from(unique);
}

export function hasPermission(
  user: { role?: string; isOwner?: boolean; isActive?: boolean; permissions?: string[] } | null | undefined,
  permission: AdminPermission
): boolean {
  if (!user || user.role !== 'admin' || user.isActive === false) return false;
  if (user.isOwner) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
