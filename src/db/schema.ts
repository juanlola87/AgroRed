import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { SiteSettingsData } from '../lib/site-settings.ts';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('customer'),
  permissions: jsonb('permissions').$type<string[]>().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  isOwner: boolean('is_owner').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const adminCredentials = pgTable('admin_credentials', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique(),
  name: text('name').notNull(),
  price: text('price').notNull(),
  priceKilo: text('price_kilo'),
  priceLibra: text('price_libra'),
  category: text('category').notNull(),
  image: text('image').notNull(),
  petType: text('pet_type').notNull().default('todos'),
  createdByUserId: integer('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique(),
  iconName: text('icon_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  detailedInfo: text('detailed_info').notNull().default(''),
  promoHeadline: text('promo_headline').notNull().default(''),
  promoCopy: text('promo_copy').notNull().default(''),
  highlights: jsonb('highlights').$type<string[]>().notNull().default([]),
  availability: text('availability').notNull().default(''),
  ctaLabel: text('cta_label').notNull().default('Solicitar servicio'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  companyName: text('company_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  city: text('city').notNull(),
  requestType: text('request_type').notNull().default('Pedido de Productos'),
  productCategory: text('product_category'),
  message: text('message').notNull(),
  status: text('status').notNull().default('pendiente'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique().default('global'),
  data: jsonb('data').$type<SiteSettingsData>().notNull(),
  updatedByUserId: integer('updated_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  inquiries: many(inquiries),
}));

export const productsRelations = relations(products, ({ one }) => ({
  createdBy: one(users, {
    fields: [products.createdByUserId],
    references: [users.id],
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  user: one(users, {
    fields: [inquiries.userId],
    references: [users.id],
  }),
}));
