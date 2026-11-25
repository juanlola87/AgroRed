import { asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { inquiries, products, services } from './schema.ts';

export interface ProductInput {
  name: string;
  price: string;
  priceKilo?: string | null;
  priceLibra?: string | null;
  category: string;
  image: string;
  petType: string;
  createdByUserId?: number | null;
}

export interface InquiryInput {
  userId?: number | null;
  companyName: string;
  email: string;
  phone?: string | null;
  city: string;
  requestType?: string;
  productCategory?: string | null;
  message: string;
}

export interface ServiceInput {
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

export async function listProducts() {
  try {
    return await db.select().from(products).orderBy(desc(products.id));
  } catch (error) {
    console.error('Database query failed in listProducts:', error);
    throw new Error('Failed to load products catalog.', { cause: error });
  }
}

export async function createProduct(input: ProductInput) {
  try {
    const result = await db
      .insert(products)
      .values({
        name: input.name,
        price: input.price,
        priceKilo: input.priceKilo || null,
        priceLibra: input.priceLibra || null,
        category: input.category,
        image: input.image,
        petType: input.petType,
        createdByUserId: input.createdByUserId ?? null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createProduct:', error);
    throw new Error('Failed to create product.', { cause: error });
  }
}

export async function updateProduct(id: number, input: ProductInput) {
  try {
    const result = await db
      .update(products)
      .set({
        name: input.name,
        price: input.price,
        priceKilo: input.priceKilo || null,
        priceLibra: input.priceLibra || null,
        category: input.category,
        image: input.image,
        petType: input.petType,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in updateProduct:', error);
    throw new Error('Failed to update product.', { cause: error });
  }
}

export async function deleteProduct(id: number) {
  try {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in deleteProduct:', error);
    throw new Error('Failed to delete product.', { cause: error });
  }
}

export async function listServices(includeInactive = false) {
  try {
    if (includeInactive) {
      return await db
        .select()
        .from(services)
        .orderBy(asc(services.sortOrder), asc(services.id));
    }
    return await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.sortOrder), asc(services.id));
  } catch (error) {
    console.error('Database query failed in listServices:', error);
    throw new Error('Failed to load services.', { cause: error });
  }
}

export async function createService(input: ServiceInput) {
  try {
    const result = await db
      .insert(services)
      .values({
        iconName: input.iconName,
        title: input.title,
        description: input.description,
        detailedInfo: input.detailedInfo ?? '',
        promoHeadline: input.promoHeadline ?? '',
        promoCopy: input.promoCopy ?? '',
        highlights: input.highlights ?? [],
        availability: input.availability ?? '',
        ctaLabel: input.ctaLabel || 'Solicitar servicio',
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createService:', error);
    throw new Error('Failed to create service.', { cause: error });
  }
}

export async function updateService(id: number, input: ServiceInput) {
  try {
    const result = await db
      .update(services)
      .set({
        iconName: input.iconName,
        title: input.title,
        description: input.description,
        detailedInfo: input.detailedInfo ?? '',
        promoHeadline: input.promoHeadline ?? '',
        promoCopy: input.promoCopy ?? '',
        highlights: input.highlights ?? [],
        availability: input.availability ?? '',
        ctaLabel: input.ctaLabel || 'Solicitar servicio',
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in updateService:', error);
    throw new Error('Failed to update service.', { cause: error });
  }
}

export async function toggleServiceActive(id: number, isActive: boolean) {
  try {
    const result = await db
      .update(services)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in toggleServiceActive:', error);
    throw new Error('Failed to update service status.', { cause: error });
  }
}

export async function deleteService(id: number) {
  try {
    const result = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in deleteService:', error);
    throw new Error('Failed to delete service.', { cause: error });
  }
}

export async function createInquiry(input: InquiryInput) {
  try {
    const result = await db
      .insert(inquiries)
      .values({
        userId: input.userId ?? null,
        companyName: input.companyName,
        email: input.email,
        phone: input.phone || null,
        city: input.city,
        requestType: input.requestType || 'Pedido de Productos',
        productCategory: input.productCategory || null,
        message: input.message,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createInquiry:', error);
    throw new Error('Failed to submit inquiry.', { cause: error });
  }
}

export async function listInquiries() {
  try {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  } catch (error) {
    console.error('Database query failed in listInquiries:', error);
    throw new Error('Failed to load inquiries.', { cause: error });
  }
}

export async function updateInquiryStatus(id: number, status: string) {
  try {
    const result = await db
      .update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database query failed in updateInquiryStatus:', error);
    throw new Error('Failed to update inquiry status.', { cause: error });
  }
}

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveInquiryCategory(
  inquiry: {
    productCategory: string | null;
    requestType: string;
    message: string;
  },
  catalogProducts: Array<{ name: string; category: string }>
): string {
  const explicit = inquiry.productCategory?.trim();
  if (explicit && explicit !== 'General / Varios') {
    return explicit;
  }

  const normalizedMsg = normalizeForMatch(inquiry.message);
  for (const prod of catalogProducts) {
    const normalizedProdName = normalizeForMatch(prod.name);
    if (normalizedProdName.length >= 5 && normalizedMsg.includes(normalizedProdName)) {
      return prod.category;
    }
  }

  const combined = `${normalizedMsg} ${normalizeForMatch(inquiry.requestType)}`;
  if (combined.includes('uranotest') || combined.includes('uranovet') || combined.includes('diagnost')) {
    return 'Línea Uranovet';
  }
  if (
    combined.includes('arena') ||
    combined.includes('kattu') ||
    combined.includes('freemiau') ||
    combined.includes('tidy cats') ||
    combined.includes('sepicats') ||
    combined.includes('kind pet') ||
    combined.includes('pino minino') ||
    combined.includes('mr cat')
  ) {
    return 'Arenas para Gato';
  }
  if (
    combined.includes('veterinary diets') ||
    combined.includes('renal') ||
    combined.includes('urinary') ||
    combined.includes('gastroenteric') ||
    combined.includes('hydrolyzed') ||
    combined.includes('fortiflora') ||
    combined.includes('calming care')
  ) {
    return 'Nutrición Clínica / Dietas';
  }
  if (
    combined.includes('snack') ||
    combined.includes('humed') ||
    combined.includes('churu') ||
    combined.includes('pouche') ||
    combined.includes('delidog') ||
    combined.includes('delicat') ||
    combined.includes('fancy feast') ||
    combined.includes('galleta') ||
    combined.includes('cabano') ||
    combined.includes('beggin') ||
    combined.includes('dentalife')
  ) {
    return 'Snacks y Nutrición Húmeda';
  }
  if (
    combined.includes('pro plan') ||
    combined.includes('concentrad') ||
    combined.includes('alimento') ||
    combined.includes('nutrecan') ||
    combined.includes('nutrecat') ||
    combined.includes('ringo') ||
    combined.includes('mirringo') ||
    combined.includes('agility') ||
    combined.includes('chunky') ||
    combined.includes('dog chow') ||
    combined.includes('cat chow') ||
    combined.includes('felix') ||
    combined.includes('go! solutions')
  ) {
    return 'Alimentación (Concentrados)';
  }
  if (
    combined.includes('juguete') ||
    combined.includes('pelota') ||
    combined.includes('mordedor') ||
    combined.includes('rascador') ||
    combined.includes('varita') ||
    combined.includes('guacal') ||
    combined.includes('arenero') ||
    combined.includes('carnaza') ||
    combined.includes('calambombo')
  ) {
    return 'Juguetes y Accesorios';
  }
  if (
    combined.includes('shampoo') ||
    combined.includes('jabon') ||
    combined.includes('talco') ||
    combined.includes('razan') ||
    combined.includes('can amor') ||
    combined.includes('asuntol') ||
    combined.includes('higiene') ||
    combined.includes('denty farm')
  ) {
    return 'Higiene & Cuidado';
  }
  if (
    combined.includes('conejina') ||
    combined.includes('hamster') ||
    combined.includes('vitagrano') ||
    combined.includes('alpiste') ||
    combined.includes('mixtura') ||
    combined.includes('ponedora') ||
    combined.includes('pollo campesino') ||
    combined.includes('peces')
  ) {
    return 'Otras Especies y Avicultura';
  }
  if (
    combined.includes('ganad') ||
    combined.includes('finhemox') ||
    combined.includes('biodipirona') ||
    combined.includes('agro')
  ) {
    return 'Medicamentos Ganadería';
  }
  if (
    combined.includes('tonic') ||
    combined.includes('vitamin') ||
    combined.includes('suplement')
  ) {
    return 'Vitaminas y Suplementos Agro';
  }
  if (
    combined.includes('endogard') ||
    combined.includes('effitix') ||
    combined.includes('doxican') ||
    combined.includes('pulfen') ||
    combined.includes('nexgard') ||
    combined.includes('bravecto') ||
    combined.includes('credelio') ||
    combined.includes('advantage') ||
    combined.includes('drontal') ||
    combined.includes('rondel') ||
    combined.includes('galgocal') ||
    combined.includes('novacan') ||
    combined.includes('fipro') ||
    combined.includes('medicament') ||
    combined.includes('antiparasit')
  ) {
    return 'Medicamentos Mascotas';
  }
  if (normalizeForMatch(inquiry.requestType).includes('asesoria')) {
    return 'Asesoría Técnica';
  }
  return 'Solicitudes Generales';
}

export interface AdminSummaryData {
  months: number;
  kpis: {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    canceledOrders: number;
    currentMonthOrders: number;
    previousMonthOrders: number;
    completionRate: number;
    totalProducts: number;
    topCategoryName: string | null;
    topCategoryCount: number;
  };
  monthlyTrends: Array<{
    monthKey: string;
    label: string;
    fullLabel: string;
    total: number;
    completed: number;
    active: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
    completed: number;
    percentage: number;
  }>;
  catalogByCategory: Array<{
    category: string;
    count: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    label: string;
    count: number;
  }>;
}

export async function getAdminSummary(monthsInput = 6): Promise<AdminSummaryData> {
  const months = monthsInput === 3 || monthsInput === 12 ? monthsInput : 6;
  try {
    const [allInquiries, allProducts] = await Promise.all([
      db.select().from(inquiries).orderBy(desc(inquiries.createdAt)),
      db.select({ name: products.name, category: products.category }).from(products),
    ]);

    const now = new Date();
    const monthShortFormatter = new Intl.DateTimeFormat('es-CO', { month: 'short' });
    const monthFullFormatter = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

    const monthBuckets = new Map<
      string,
      { monthKey: string; label: string; fullLabel: string; total: number; completed: number; active: number }
    >();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rawShort = monthShortFormatter.format(d).replace('.', '');
      const label = rawShort.charAt(0).toUpperCase() + rawShort.slice(1);
      const rawFull = monthFullFormatter.format(d);
      const fullLabel = rawFull.charAt(0).toUpperCase() + rawFull.slice(1);
      monthBuckets.set(monthKey, {
        monthKey,
        label,
        fullLabel,
        total: 0,
        completed: 0,
        active: 0,
      });
    }

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let pendingOrders = 0;
    let inProgressOrders = 0;
    let completedOrders = 0;
    let canceledOrders = 0;
    let currentMonthOrders = 0;
    let previousMonthOrders = 0;

    const categoryMap = new Map<string, { count: number; completed: number }>();

    for (const inq of allInquiries) {
      if (inq.status === 'pendiente') pendingOrders += 1;
      else if (inq.status === 'en_proceso') inProgressOrders += 1;
      else if (inq.status === 'atendida') completedOrders += 1;
      else if (inq.status === 'cancelada') canceledOrders += 1;

      const created = new Date(inq.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (key === currentMonthKey) currentMonthOrders += 1;
      if (key === prevMonthKey) previousMonthOrders += 1;

      const bucket = monthBuckets.get(key);
      if (bucket) {
        bucket.total += 1;
        if (inq.status === 'atendida') {
          bucket.completed += 1;
        } else if (inq.status === 'pendiente' || inq.status === 'en_proceso') {
          bucket.active += 1;
        }
      }

      const category = resolveInquiryCategory(inq, allProducts);
      const prevCat = categoryMap.get(category) ?? { count: 0, completed: 0 };
      prevCat.count += 1;
      if (inq.status === 'atendida') prevCat.completed += 1;
      categoryMap.set(category, prevCat);
    }

    const totalOrders = allInquiries.length;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        completed: stats.completed,
        percentage: totalOrders > 0 ? Math.round((stats.count / totalOrders) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const catalogCatCounts = new Map<string, number>();
    for (const prod of allProducts) {
      catalogCatCounts.set(prod.category, (catalogCatCounts.get(prod.category) ?? 0) + 1);
    }
    const catalogByCategory = Array.from(catalogCatCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const statusBreakdown = [
      { status: 'pendiente', label: 'Pendientes', count: pendingOrders },
      { status: 'en_proceso', label: 'En Proceso', count: inProgressOrders },
      { status: 'atendida', label: 'Atendidos', count: completedOrders },
      { status: 'cancelada', label: 'Cancelados', count: canceledOrders },
    ].filter((s) => s.count > 0);

    return {
      months,
      kpis: {
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        canceledOrders,
        currentMonthOrders,
        previousMonthOrders,
        completionRate,
        totalProducts: allProducts.length,
        topCategoryName: topCategories[0]?.category ?? null,
        topCategoryCount: topCategories[0]?.count ?? 0,
      },
      monthlyTrends: Array.from(monthBuckets.values()),
      topCategories,
      catalogByCategory,
      statusBreakdown,
    };
  } catch (error) {
    console.error('Database query failed in getAdminSummary:', error);
    throw new Error('No se pudo calcular el resumen administrativo.', { cause: error });
  }
}
