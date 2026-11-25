export interface AllyItem {
  name: string;
  logoUrl?: string;
}

export interface OrderLineItem {
  label: string;
  value: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface SiteSettingsData {
  promoBanner: string;
  brandDescription: string;
  copyrightName: string;
  locationTitle: string;
  locationSubtitle: string;
  addressDetail: string;
  scheduleTitle: string;
  scheduleWeekdays: string;
  scheduleWeekends: string;
  orderLinesTitle: string;
  orderPhone: string;
  whatsappNumber: string;
  orderEmail: string;
  extraOrderLines: OrderLineItem[];
  footerOrdersTitle: string;
  footerLocationTitle: string;
  footerLocationText: string;
  alliesTitle: string;
  allies: AllyItem[];
  aboutEyebrow: string;
  aboutTitle: string;
  aboutParagraph1: string;
  aboutParagraph2: string;
  aboutVision: string;
  aboutValues: string;
  stats: StatItem[];
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  promoBanner:
    'Somos distribuidores exclusivos de Uranovet para Colombia • Excelencia en salud animal',
  brandDescription:
    'Líderes en Colombia en la distribución de soluciones especializadas para la salud y nutrición animal. Comprometidos con la excelencia técnica y operativa desde 2008.',
  copyrightName: 'AgroRed Animal',
  locationTitle: 'Bogotá, Colombia',
  locationSubtitle: 'Sede Principal: Operaciones y Logística Nacional',
  addressDetail: '',
  scheduleTitle: 'Horarios de Operación',
  scheduleWeekdays: 'Lunes a Viernes: 8:00 AM - 5:30 PM',
  scheduleWeekends: 'Sábados: 8:00 AM - 1:00 PM',
  orderLinesTitle: 'Línea de Pedidos',
  orderPhone: '+57 (601) 123 4567',
  whatsappNumber: '',
  orderEmail: 'ventas@redagro.com.co',
  extraOrderLines: [],
  footerOrdersTitle: 'Central de Pedidos',
  footerLocationTitle: 'Sede Administrativa',
  footerLocationText: 'Bogotá D.C, Colombia',
  alliesTitle: 'Aliados Estratégicos',
  allies: [
    { name: 'URANOVET', logoUrl: '' },
    { name: 'PURINA', logoUrl: '' },
    { name: 'VIRBAC', logoUrl: '' },
    { name: 'CEVA', logoUrl: '' },
    { name: 'ZOETIS', logoUrl: '' },
  ],
  aboutEyebrow: 'Nuestra Historia',
  aboutTitle: 'Comprometidos con la Distribución Veterinaria de Excelencia',
  aboutParagraph1:
    'En AgroRed Animal, nos especializamos en la comercialización y distribución de medicamentos veterinarios, equipos de diagnóstico y nutrición especializada.',
  aboutParagraph2:
    'Somos distribuidores exclusivos de Uranovet para Colombia, lo que nos permite ofrecer pruebas diagnósticas de vanguardia que transforman la práctica clínica diaria.',
  aboutVision: 'Líderes Regionales',
  aboutValues: 'Ciencia & Ética',
  stats: [
    { value: '15+', label: 'Años de Experiencia' },
    { value: '500+', label: 'Productos Activos' },
    { value: '10k+', label: 'Clientes Felices' },
    { value: '24/7', label: 'Asesoría Online' },
  ],
  instagramUrl: '',
  facebookUrl: '',
  twitterUrl: '',
};

export function mergeSiteSettings(
  partial?: Partial<SiteSettingsData> | null
): SiteSettingsData {
  if (!partial || typeof partial !== 'object') {
    return {
      ...DEFAULT_SITE_SETTINGS,
      allies: DEFAULT_SITE_SETTINGS.allies.map((a) => ({ ...a })),
      extraOrderLines: [],
      stats: DEFAULT_SITE_SETTINGS.stats.map((s) => ({ ...s })),
    };
  }

  return {
    promoBanner:
      typeof partial.promoBanner === 'string' && partial.promoBanner.trim()
        ? partial.promoBanner
        : DEFAULT_SITE_SETTINGS.promoBanner,
    brandDescription:
      typeof partial.brandDescription === 'string' && partial.brandDescription.trim()
        ? partial.brandDescription
        : DEFAULT_SITE_SETTINGS.brandDescription,
    copyrightName:
      typeof partial.copyrightName === 'string' && partial.copyrightName.trim()
        ? partial.copyrightName
        : DEFAULT_SITE_SETTINGS.copyrightName,
    locationTitle:
      typeof partial.locationTitle === 'string' && partial.locationTitle.trim()
        ? partial.locationTitle
        : DEFAULT_SITE_SETTINGS.locationTitle,
    locationSubtitle:
      typeof partial.locationSubtitle === 'string' && partial.locationSubtitle.trim()
        ? partial.locationSubtitle
        : DEFAULT_SITE_SETTINGS.locationSubtitle,
    addressDetail:
      typeof partial.addressDetail === 'string' ? partial.addressDetail : '',
    scheduleTitle:
      typeof partial.scheduleTitle === 'string' && partial.scheduleTitle.trim()
        ? partial.scheduleTitle
        : DEFAULT_SITE_SETTINGS.scheduleTitle,
    scheduleWeekdays:
      typeof partial.scheduleWeekdays === 'string'
        ? partial.scheduleWeekdays
        : DEFAULT_SITE_SETTINGS.scheduleWeekdays,
    scheduleWeekends:
      typeof partial.scheduleWeekends === 'string'
        ? partial.scheduleWeekends
        : DEFAULT_SITE_SETTINGS.scheduleWeekends,
    orderLinesTitle:
      typeof partial.orderLinesTitle === 'string' && partial.orderLinesTitle.trim()
        ? partial.orderLinesTitle
        : DEFAULT_SITE_SETTINGS.orderLinesTitle,
    orderPhone:
      typeof partial.orderPhone === 'string'
        ? partial.orderPhone
        : DEFAULT_SITE_SETTINGS.orderPhone,
    whatsappNumber:
      typeof partial.whatsappNumber === 'string' ? partial.whatsappNumber : '',
    orderEmail:
      typeof partial.orderEmail === 'string'
        ? partial.orderEmail
        : DEFAULT_SITE_SETTINGS.orderEmail,
    extraOrderLines: Array.isArray(partial.extraOrderLines)
      ? partial.extraOrderLines
          .filter(
            (item): item is OrderLineItem =>
              Boolean(item) &&
              typeof item.label === 'string' &&
              typeof item.value === 'string' &&
              (item.label.trim().length > 0 || item.value.trim().length > 0)
          )
          .map((item) => ({ label: item.label.trim(), value: item.value.trim() }))
      : [],
    footerOrdersTitle:
      typeof partial.footerOrdersTitle === 'string' && partial.footerOrdersTitle.trim()
        ? partial.footerOrdersTitle
        : DEFAULT_SITE_SETTINGS.footerOrdersTitle,
    footerLocationTitle:
      typeof partial.footerLocationTitle === 'string' && partial.footerLocationTitle.trim()
        ? partial.footerLocationTitle
        : DEFAULT_SITE_SETTINGS.footerLocationTitle,
    footerLocationText:
      typeof partial.footerLocationText === 'string' && partial.footerLocationText.trim()
        ? partial.footerLocationText
        : DEFAULT_SITE_SETTINGS.footerLocationText,
    alliesTitle:
      typeof partial.alliesTitle === 'string' && partial.alliesTitle.trim()
        ? partial.alliesTitle
        : DEFAULT_SITE_SETTINGS.alliesTitle,
    allies: Array.isArray(partial.allies)
      ? partial.allies
          .filter(
            (item): item is AllyItem =>
              Boolean(item) &&
              typeof item.name === 'string' &&
              item.name.trim().length > 0
          )
          .map((item) => ({
            name: item.name.trim(),
            logoUrl: typeof item.logoUrl === 'string' ? item.logoUrl.trim() : '',
          }))
      : DEFAULT_SITE_SETTINGS.allies.map((a) => ({ ...a })),
    aboutEyebrow:
      typeof partial.aboutEyebrow === 'string' && partial.aboutEyebrow.trim()
        ? partial.aboutEyebrow
        : DEFAULT_SITE_SETTINGS.aboutEyebrow,
    aboutTitle:
      typeof partial.aboutTitle === 'string' && partial.aboutTitle.trim()
        ? partial.aboutTitle
        : DEFAULT_SITE_SETTINGS.aboutTitle,
    aboutParagraph1:
      typeof partial.aboutParagraph1 === 'string' && partial.aboutParagraph1.trim()
        ? partial.aboutParagraph1
        : DEFAULT_SITE_SETTINGS.aboutParagraph1,
    aboutParagraph2:
      typeof partial.aboutParagraph2 === 'string'
        ? partial.aboutParagraph2
        : DEFAULT_SITE_SETTINGS.aboutParagraph2,
    aboutVision:
      typeof partial.aboutVision === 'string' && partial.aboutVision.trim()
        ? partial.aboutVision
        : DEFAULT_SITE_SETTINGS.aboutVision,
    aboutValues:
      typeof partial.aboutValues === 'string' && partial.aboutValues.trim()
        ? partial.aboutValues
        : DEFAULT_SITE_SETTINGS.aboutValues,
    stats:
      Array.isArray(partial.stats) && partial.stats.length > 0
        ? partial.stats
            .filter(
              (item): item is StatItem =>
                Boolean(item) &&
                typeof item.value === 'string' &&
                typeof item.label === 'string' &&
                item.value.trim().length > 0 &&
                item.label.trim().length > 0
            )
            .map((item) => ({ value: item.value.trim(), label: item.label.trim() }))
        : DEFAULT_SITE_SETTINGS.stats.map((s) => ({ ...s })),
    instagramUrl:
      typeof partial.instagramUrl === 'string' ? partial.instagramUrl.trim() : '',
    facebookUrl:
      typeof partial.facebookUrl === 'string' ? partial.facebookUrl.trim() : '',
    twitterUrl:
      typeof partial.twitterUrl === 'string' ? partial.twitterUrl.trim() : '',
  };
}
