import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createInquiry,
  createProduct,
  createService,
  deleteProduct,
  deleteService,
  getAdminSummary,
  listInquiries,
  listProducts,
  listServices,
  toggleServiceActive,
  updateInquiryStatus,
  updateProduct,
  updateService,
} from './src/db/catalog.ts';
import {
  claimAdminCredential,
  createAdminUser,
  deleteAdminUser,
  getAdminCredentialByEmail,
  getConfiguredAdminEmail,
  getOrCreateUser,
  getUserByEmail,
  listAdminUsers,
  updateAdminUser,
} from './src/db/users.ts';
import {
  getSiteSettings,
  upsertSiteSettings,
} from './src/db/settings.ts';
import {
  hashPassword,
  issueAdminSessionToken,
  verifyEnvPassword,
  verifyScryptPassword,
} from './src/lib/admin-auth.ts';
import { hasPermission, sanitizePermissions } from './src/lib/permissions.ts';
import type { SiteSettingsData } from './src/lib/site-settings.ts';
import {
  type AuthRequest,
  optionalAuth,
  requireAdmin,
  requireAuth,
  requirePermission,
} from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_PET_TYPES = new Set(['todos', 'perro', 'gato', 'agro']);
const ALLOWED_INQUIRY_STATUSES = new Set(['pendiente', 'en_proceso', 'atendida', 'cancelada']);
const ALLOWED_REQUEST_TYPES = new Set([
  'Pedido de Productos',
  'Cotización Agro / Mayorista',
  'Asesoría Técnica',
  'Pedido / Contacto',
]);

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateProductBody(body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const price = typeof body.price === 'string' ? body.price.trim() : '';
  const priceKilo =
    typeof body.priceKilo === 'string' && body.priceKilo.trim()
      ? body.priceKilo.trim()
      : null;
  const priceLibra =
    typeof body.priceLibra === 'string' && body.priceLibra.trim()
      ? body.priceLibra.trim()
      : null;
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const petTypeRaw = typeof body.petType === 'string' ? body.petType.trim() : 'todos';
  const petType = ALLOWED_PET_TYPES.has(petTypeRaw) ? petTypeRaw : 'todos';

  if (!name || name.length > 200) {
    return { error: 'El nombre del producto es obligatorio (máximo 200 caracteres).' };
  }
  if (!price || price.length > 50) {
    return { error: 'El precio del producto es obligatorio.' };
  }
  if (!category || category.length > 100) {
    return { error: 'La categoría es obligatoria.' };
  }
  if (!image || !isValidHttpUrl(image)) {
    return { error: 'La URL de la imagen debe comenzar por http:// o https://.' };
  }

  return {
    data: {
      name,
      price,
      priceKilo,
      priceLibra,
      category,
      image,
      petType,
    },
  };
}

const ALLOWED_SERVICE_ICONS = new Set([
  'Scissors',
  'HeartPulse',
  'Truck',
  'Syringe',
  'Home',
  'Users',
  'ShoppingBag',
  'Package',
  'PawPrint',
  'Stethoscope',
  'ShieldCheck',
]);

function readCleanString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function validateServiceBody(body: Record<string, unknown>) {
  const title = readCleanString(body.title, 100);
  const description = readCleanString(body.description, 350);
  const iconRaw = readCleanString(body.iconName, 40);
  const iconName = ALLOWED_SERVICE_ICONS.has(iconRaw) ? iconRaw : 'HeartPulse';
  const detailedInfo = readCleanString(body.detailedInfo, 1200);
  const promoHeadline = readCleanString(body.promoHeadline, 140);
  const promoCopy = readCleanString(body.promoCopy, 600);
  const availability = readCleanString(body.availability, 160);
  const ctaLabel = readCleanString(body.ctaLabel, 60) || 'Solicitar servicio';
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
  const sortOrderRaw = Number(body.sortOrder);
  const sortOrder = Number.isInteger(sortOrderRaw) && sortOrderRaw >= 0 && sortOrderRaw <= 999 ? sortOrderRaw : 0;

  if (!title) {
    return { error: 'El nombre del servicio es obligatorio (máximo 100 caracteres).' };
  }
  if (!description) {
    return { error: 'La descripción corta del servicio es obligatoria (máximo 350 caracteres).' };
  }

  const rawHighlights = Array.isArray(body.highlights) ? body.highlights : [];
  const highlights: string[] = [];
  for (const h of rawHighlights.slice(0, 10)) {
    const clean = readCleanString(h, 160);
    if (clean) highlights.push(clean);
  }

  return {
    data: {
      iconName,
      title,
      description,
      detailedInfo,
      promoHeadline,
      promoCopy,
      highlights,
      availability,
      ctaLabel,
      isActive,
      sortOrder,
    },
  };
}

function validateSiteSettingsBody(
  body: Record<string, unknown>
): { data: SiteSettingsData } | { error: string } {
  const promoBanner = readCleanString(body.promoBanner, 300);
  const brandDescription = readCleanString(body.brandDescription, 600);
  const copyrightName = readCleanString(body.copyrightName, 120);
  const locationTitle = readCleanString(body.locationTitle, 140);
  const locationSubtitle = readCleanString(body.locationSubtitle, 200);
  const addressDetail = readCleanString(body.addressDetail, 240);
  const scheduleTitle = readCleanString(body.scheduleTitle, 120);
  const scheduleWeekdays = readCleanString(body.scheduleWeekdays, 160);
  const scheduleWeekends = readCleanString(body.scheduleWeekends, 160);
  const orderLinesTitle = readCleanString(body.orderLinesTitle, 120);
  const orderPhone = readCleanString(body.orderPhone, 100);
  const whatsappNumber = readCleanString(body.whatsappNumber, 100);
  const orderEmail = readCleanString(body.orderEmail, 160);
  const footerOrdersTitle = readCleanString(body.footerOrdersTitle, 120);
  const footerLocationTitle = readCleanString(body.footerLocationTitle, 120);
  const footerLocationText = readCleanString(body.footerLocationText, 200);
  const alliesTitle = readCleanString(body.alliesTitle, 120);
  const aboutEyebrow = readCleanString(body.aboutEyebrow, 100);
  const aboutTitle = readCleanString(body.aboutTitle, 200);
  const aboutParagraph1 = readCleanString(body.aboutParagraph1, 1200);
  const aboutParagraph2 = readCleanString(body.aboutParagraph2, 1200);
  const aboutVision = readCleanString(body.aboutVision, 160);
  const aboutValues = readCleanString(body.aboutValues, 160);
  const instagramUrl = readCleanString(body.instagramUrl, 300);
  const facebookUrl = readCleanString(body.facebookUrl, 300);
  const twitterUrl = readCleanString(body.twitterUrl, 300);

  if (!promoBanner) return { error: 'El texto del banner superior es obligatorio.' };
  if (!locationTitle) return { error: 'El título de ubicación es obligatorio.' };
  if (!scheduleTitle) return { error: 'El título de horarios es obligatorio.' };
  if (!orderLinesTitle) return { error: 'El título de líneas de pedido es obligatorio.' };
  if (orderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderEmail)) {
    return { error: 'El correo de pedidos no es válido.' };
  }

  for (const [label, url] of [
    ['Instagram', instagramUrl],
    ['Facebook', facebookUrl],
    ['Twitter / X', twitterUrl],
  ] as const) {
    if (url && !isValidHttpUrl(url)) {
      return { error: `La URL de ${label} debe comenzar con http:// o https://.` };
    }
  }

  const rawOrderLines = Array.isArray(body.extraOrderLines) ? body.extraOrderLines : [];
  if (rawOrderLines.length > 12) {
    return { error: 'Máximo 12 líneas de pedido adicionales.' };
  }
  const extraOrderLines: Array<{ label: string; value: string }> = [];
  for (const item of rawOrderLines) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const label = readCleanString(rec.label, 80);
    const value = readCleanString(rec.value, 140);
    if (label || value) {
      if (!label || !value) {
        return { error: 'Cada línea de pedido adicional debe tener etiqueta y número o dato.' };
      }
      extraOrderLines.push({ label, value });
    }
  }

  const rawAllies = Array.isArray(body.allies) ? body.allies : [];
  if (rawAllies.length > 20) {
    return { error: 'Máximo 20 aliados estratégicos.' };
  }
  const allies: Array<{ name: string; logoUrl?: string }> = [];
  for (const item of rawAllies) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const name = readCleanString(rec.name, 80);
    const logoUrl = readCleanString(rec.logoUrl, 300);
    if (!name && !logoUrl) continue;
    if (!name) {
      return { error: 'Cada aliado estratégico debe tener un nombre.' };
    }
    if (logoUrl && !isValidHttpUrl(logoUrl)) {
      return { error: `La URL del logo para "${name}" debe comenzar con http:// o https://.` };
    }
    allies.push({ name, logoUrl });
  }

  const rawStats = Array.isArray(body.stats) ? body.stats : [];
  if (rawStats.length > 6) {
    return { error: 'Máximo 6 indicadores estadísticos.' };
  }
  const stats: Array<{ value: string; label: string }> = [];
  for (const item of rawStats) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const value = readCleanString(rec.value, 30);
    const label = readCleanString(rec.label, 80);
    if (!value && !label) continue;
    if (!value || !label) {
      return { error: 'Cada estadística debe tener valor y descripción.' };
    }
    stats.push({ value, label });
  }

  return {
    data: {
      promoBanner,
      brandDescription,
      copyrightName,
      locationTitle,
      locationSubtitle,
      addressDetail,
      scheduleTitle,
      scheduleWeekdays,
      scheduleWeekends,
      orderLinesTitle,
      orderPhone,
      whatsappNumber,
      orderEmail,
      extraOrderLines,
      footerOrdersTitle,
      footerLocationTitle,
      footerLocationText,
      alliesTitle,
      allies,
      aboutEyebrow,
      aboutTitle,
      aboutParagraph1,
      aboutParagraph2,
      aboutVision,
      aboutValues,
      stats,
      instagramUrl,
      facebookUrl,
      twitterUrl,
    },
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Current authenticated user profile
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.dbUser });
  });

  // Check if first-run admin password setup is still needed for the primary owner
  app.get('/api/auth/admin/status', async (_req, res) => {
    try {
      const hasEnvPassword = Boolean(process.env.ADMIN_PASSWORD?.trim());
      if (hasEnvPassword) {
        return res.json({ needsSetup: false });
      }
      const ownerCred = await getAdminCredentialByEmail(getConfiguredAdminEmail());
      return res.json({ needsSetup: !ownerCred });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to check admin status.';
      return res.status(500).json({ error: message });
    }
  });

  // One-time atomic bootstrap for claiming initial admin password when ADMIN_PASSWORD env is unset
  app.post('/api/auth/admin/setup', async (req, res) => {
    try {
      if (process.env.ADMIN_PASSWORD?.trim()) {
        return res.status(403).json({
          error: 'La contraseña de administrador ya está configurada en las variables del servidor.',
        });
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const expectedEmail = getConfiguredAdminEmail();

      if (!email || email !== expectedEmail) {
        return res.status(403).json({
          error: 'El correo ingresado no corresponde al administrador autorizado.',
        });
      }

      if (password.length < 8 || password.length > 128) {
        return res.status(400).json({
          error: 'La contraseña debe tener entre 8 y 128 caracteres.',
        });
      }

      const passwordHash = hashPassword(password);
      const claimed = await claimAdminCredential(expectedEmail, passwordHash);
      if (!claimed) {
        return res.status(403).json({
          error: 'La contraseña de administrador ya fue configurada previamente.',
        });
      }

      const uid = `admin:${expectedEmail}`;
      const dbUser = await getOrCreateUser(uid, expectedEmail, 'Administrador Principal');
      const token = issueAdminSessionToken(dbUser.uid, dbUser.email);

      return res.status(201).json({ token, user: dbUser });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to configure admin access.';
      return res.status(500).json({ error: message });
    }
  });

  // Email + password admin login (supports primary owner and created admin team members)
  app.post('/api/auth/admin/login', async (req, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const ownerEmail = getConfiguredAdminEmail();

      if (!email || !password) {
        return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
      }

      const envPassword = process.env.ADMIN_PASSWORD?.trim();
      const isOwnerAccount = email === ownerEmail;
      let isValid = false;
      let dbUser = await getUserByEmail(email);

      if (isOwnerAccount && envPassword) {
        isValid = verifyEnvPassword(password, envPassword);
        if (isValid) {
          dbUser = await getOrCreateUser(
            dbUser?.uid || `admin:${ownerEmail}`,
            ownerEmail,
            dbUser?.displayName || 'Administrador Principal'
          );
        }
      } else {
        const storedCred = await getAdminCredentialByEmail(email);
        if (!storedCred) {
          if (isOwnerAccount) {
            return res.status(401).json({
              error: 'Primero debes configurar la contraseña inicial de administrador.',
            });
          }
          return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        isValid = verifyScryptPassword(password, storedCred.passwordHash);
        if (isValid) {
          if (isOwnerAccount) {
            dbUser = await getOrCreateUser(
              dbUser?.uid || `admin:${ownerEmail}`,
              ownerEmail,
              dbUser?.displayName || 'Administrador Principal'
            );
          } else if (!dbUser || dbUser.role !== 'admin') {
            return res.status(403).json({ error: 'Esta cuenta no tiene permisos de administrador.' });
          } else if (!dbUser.isActive) {
            return res.status(403).json({ error: 'Esta cuenta de administrador está desactivada.' });
          }
        }
      }

      if (!isValid || !dbUser) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
      }

      const token = issueAdminSessionToken(dbUser.uid, dbUser.email);
      return res.json({ token, user: dbUser });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign in.';
      return res.status(500).json({ error: message });
    }
  });

  // Public catalog read endpoints
  app.get('/api/products', async (_req, res) => {
    try {
      const rows = await listProducts();
      res.json(rows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load products.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/services', async (_req, res) => {
    try {
      const rows = await listServices(false);
      res.json(rows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load services.';
      res.status(500).json({ error: message });
    }
  });

  // Admin-protected services listing (active + paused) & CRUD endpoints
  app.get('/api/admin/services', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    if (!hasPermission(req.dbUser, 'services:view') && !hasPermission(req.dbUser, 'services:manage')) {
      return res.status(403).json({ error: 'No tienes permiso para ver los servicios.' });
    }
    try {
      const rows = await listServices(true);
      res.json(rows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los servicios.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/services', requireAuth, requireAdmin, requirePermission('services:manage'), async (req: AuthRequest, res) => {
    const validated = validateServiceBody((req.body ?? {}) as Record<string, unknown>);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }
    try {
      const created = await createService(validated.data);
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el servicio.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/services/:id', requireAuth, requireAdmin, requirePermission('services:manage'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de servicio inválido.' });
    }
    const validated = validateServiceBody((req.body ?? {}) as Record<string, unknown>);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }
    try {
      const updated = await updateService(id, validated.data);
      if (!updated) {
        return res.status(404).json({ error: 'Servicio no encontrado.' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el servicio.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/services/:id/toggle', requireAuth, requireAdmin, requirePermission('services:manage'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de servicio inválido.' });
    }
    if (typeof req.body?.isActive !== 'boolean') {
      return res.status(400).json({ error: 'El estado activo/inactivo debe ser booleano.' });
    }
    try {
      const updated = await toggleServiceActive(id, req.body.isActive);
      if (!updated) {
        return res.status(404).json({ error: 'Servicio no encontrado.' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el estado del servicio.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/services/:id', requireAuth, requireAdmin, requirePermission('services:manage'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de servicio inválido.' });
    }
    try {
      const deleted = await deleteService(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Servicio no encontrado.' });
      }
      res.json({ deletedId: deleted.id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el servicio.';
      res.status(500).json({ error: message });
    }
  });

  // Public global site settings read & admin-protected update
  app.get('/api/settings', async (_req, res) => {
    try {
      const data = await getSiteSettings();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los datos de la página.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/settings', requireAuth, requireAdmin, requirePermission('settings:edit'), async (req: AuthRequest, res) => {
    const validated = validateSiteSettingsBody((req.body ?? {}) as Record<string, unknown>);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }

    try {
      const updated = await upsertSiteSettings(validated.data, req.dbUser?.id ?? null);
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudieron guardar los datos de la página.';
      res.status(500).json({ error: message });
    }
  });

  // Admin-protected product CRUD endpoints with granular permissions
  app.post('/api/products', requireAuth, requireAdmin, requirePermission('products:create'), async (req: AuthRequest, res) => {
    const validated = validateProductBody((req.body ?? {}) as Record<string, unknown>);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }

    try {
      const created = await createProduct({
        ...validated.data,
        createdByUserId: req.dbUser?.id ?? null,
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create product.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/products/:id', requireAuth, requireAdmin, requirePermission('products:edit'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const validated = validateProductBody((req.body ?? {}) as Record<string, unknown>);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }

    try {
      const updated = await updateProduct(id, validated.data);
      if (!updated) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update product.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/products/:id', requireAuth, requireAdmin, requirePermission('products:delete'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    try {
      const deleted = await deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      res.json({ deletedId: deleted.id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete product.';
      res.status(500).json({ error: message });
    }
  });

  // Public contact/order/advisory inquiry submission
  app.post('/api/inquiries', optionalAuth, async (req: AuthRequest, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const requestTypeRaw = typeof body.requestType === 'string' ? body.requestType.trim() : 'Pedido de Productos';
    const requestType = ALLOWED_REQUEST_TYPES.has(requestTypeRaw) ? requestTypeRaw : 'Pedido de Productos';
    const productCategory =
      typeof body.productCategory === 'string' ? body.productCategory.trim().slice(0, 100) : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!companyName || companyName.length > 200) {
      return res.status(400).json({ error: 'Ingresa tu nombre, empresa o veterinaria.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    }
    if (phone.length > 40) {
      return res.status(400).json({ error: 'El teléfono no puede superar 40 caracteres.' });
    }
    if (!city || city.length > 120) {
      return res.status(400).json({ error: 'Ingresa la ciudad de operación.' });
    }
    if (!message || message.length > 2000) {
      return res.status(400).json({ error: 'Describe brevemente tu pedido o solicitud.' });
    }

    try {
      const created = await createInquiry({
        userId: req.dbUser?.id ?? null,
        companyName,
        email,
        phone: phone || null,
        city,
        requestType,
        productCategory: productCategory || null,
        message,
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to submit inquiry.';
      res.status(500).json({ error: errMsg });
    }
  });

  // Admin-protected executive summary analytics
  app.get('/api/admin/summary', requireAuth, requireAdmin, requirePermission('inquiries:view'), async (req: AuthRequest, res) => {
    try {
      const rawMonths = Number(req.query.months);
      const months = rawMonths === 3 || rawMonths === 12 ? rawMonths : 6;
      const summary = await getAdminSummary(months);
      res.json(summary);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el resumen administrativo.';
      res.status(500).json({ error: message });
    }
  });

  // Admin-protected inquiry listing and status updates
  app.get('/api/inquiries', requireAuth, requireAdmin, requirePermission('inquiries:view'), async (_req: AuthRequest, res) => {
    try {
      const rows = await listInquiries();
      res.json(rows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load inquiries.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/inquiries/:id', requireAuth, requireAdmin, requirePermission('inquiries:manage'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de solicitud inválido.' });
    }

    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!ALLOWED_INQUIRY_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Estado inválido.' });
    }

    try {
      const updated = await updateInquiryStatus(id, status);
      if (!updated) {
        return res.status(404).json({ error: 'Solicitud no encontrada.' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update inquiry.';
      res.status(500).json({ error: message });
    }
  });

  // Admin team & permissions management endpoints
  app.get('/api/admin/users', requireAuth, requireAdmin, requirePermission('users:manage'), async (_req: AuthRequest, res) => {
    try {
      const rows = await listAdminUsers();
      res.json(rows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el equipo de administradores.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/users', requireAuth, requireAdmin, requirePermission('users:manage'), async (req: AuthRequest, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const permissions = sanitizePermissions(body.permissions);

    if (!displayName || displayName.length > 120) {
      return res.status(400).json({ error: 'El nombre del administrador es obligatorio (máximo 120 caracteres).' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' });
    }
    if (permissions.length === 0) {
      return res.status(400).json({ error: 'Selecciona al menos un permiso para el nuevo usuario.' });
    }
    if (!req.dbUser?.isOwner && permissions.some((p) => !hasPermission(req.dbUser, p))) {
      return res.status(403).json({ error: 'No puedes asignar permisos que no posees.' });
    }

    try {
      const passwordHash = hashPassword(password);
      const created = await createAdminUser({
        email,
        displayName,
        permissions,
        passwordHash,
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el usuario administrador.';
      res.status(500).json({ error: message });
    }
  });

  app.put('/api/admin/users/:id', requireAuth, requireAdmin, requirePermission('users:manage'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
    const permissions = sanitizePermissions(body.permissions);

    if (!displayName || displayName.length > 120) {
      return res.status(400).json({ error: 'El nombre del administrador es obligatorio.' });
    }
    if (password && (password.length < 8 || password.length > 128)) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener entre 8 y 128 caracteres.' });
    }
    if (req.dbUser?.id === id && !isActive) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta mientras estás conectado.' });
    }
    if (!req.dbUser?.isOwner && permissions.some((p) => !hasPermission(req.dbUser, p))) {
      return res.status(403).json({ error: 'No puedes asignar permisos que no posees.' });
    }

    try {
      const passwordHash = password ? hashPassword(password) : null;
      const updated = await updateAdminUser(id, {
        displayName,
        permissions,
        isActive,
        passwordHash,
      });
      if (!updated) {
        return res.status(404).json({ error: 'Usuario administrador no encontrado.' });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el usuario.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, requirePermission('users:manage'), async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario inválido.' });
    }
    if (req.dbUser?.id === id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
    }

    try {
      const result = await deleteAdminUser(id);
      if (result.status === 'not_found') {
        return res.status(404).json({ error: 'Usuario administrador no encontrado.' });
      }
      if (result.status === 'protected') {
        return res.status(403).json({ error: 'No se puede eliminar al administrador propietario principal.' });
      }
      res.json({ deletedId: result.deletedId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el usuario.';
      res.status(500).json({ error: message });
    }
  });

  // Ensure unknown /api/* routes and API errors always return JSON instead of HTML
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.' });
  });

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('Unhandled API error:', err);
      const message = err instanceof Error ? err.message : 'Error interno del servidor.';
      return res.status(500).json({ error: message });
    }
    next(err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
