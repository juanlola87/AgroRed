import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { siteSettings } from './schema.ts';
import {
  DEFAULT_SITE_SETTINGS,
  mergeSiteSettings,
  type SiteSettingsData,
} from '../lib/site-settings.ts';

const GLOBAL_SETTINGS_KEY = 'global';

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, GLOBAL_SETTINGS_KEY))
      .limit(1);

    if (rows.length === 0) {
      return mergeSiteSettings(DEFAULT_SITE_SETTINGS);
    }

    return mergeSiteSettings(rows[0].data);
  } catch (error) {
    console.error('Database query failed in getSiteSettings:', error);
    throw new Error('No se pudieron cargar los datos de la página.', { cause: error });
  }
}

export async function upsertSiteSettings(
  data: SiteSettingsData,
  updatedByUserId?: number | null
): Promise<SiteSettingsData> {
  try {
    const normalized = mergeSiteSettings(data);
    const rows = await db
      .insert(siteSettings)
      .values({
        key: GLOBAL_SETTINGS_KEY,
        data: normalized,
        updatedByUserId: updatedByUserId ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          data: normalized,
          updatedByUserId: updatedByUserId ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return mergeSiteSettings(rows[0]?.data ?? normalized);
  } catch (error) {
    console.error('Database query failed in upsertSiteSettings:', error);
    throw new Error('No se pudieron guardar los datos de la página.', { cause: error });
  }
}
