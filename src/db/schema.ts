import { pgTable, text, timestamp, uuid, decimal, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  phone: text('phone'),
  role: text('role', { enum: ['admin', 'owner', 'customer'] }).default('owner').notNull(),
  restaurantId: uuid('restaurant_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const restaurants = pgTable('restaurants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  logoUrl: text('logo_url'),
  coverUrl: text('cover_url'),
  description: text('description'),
  whatsappNumber: text('whatsapp_number'),
  address: text('address'),
  currency: text('currency').default('USD').notNull(),
  plan: text('plan', { enum: ['free', 'premium'] }).default('free').notNull(),
  planExpiresAt: text('plan_expires_at'),
  status: text('status', { enum: ['active', 'suspended'] }).default('active').notNull(),
  template: text('template', { enum: ['list', 'grid'] }).default('list').notNull(),
  languages: text('languages').default('en').notNull(),
  defaultLanguage: text('default_language').default('en').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  nameFr: text('name_fr'),
  nameAr: text('name_ar'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  nameEn: text('name_en'),
  nameFr: text('name_fr'),
  nameAr: text('name_ar'),
  descriptionEn: text('description_en'),
  descriptionFr: text('description_fr'),
  descriptionAr: text('description_ar'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
