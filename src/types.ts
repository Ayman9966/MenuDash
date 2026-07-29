export interface User {
  id: string;
  username: string;
  phone?: string;
  role: 'superadmin' | 'admin' | 'owner' | 'customer';
  restaurantId?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  description_fr?: string;
  description_ar?: string;
  whatsappNumber?: string;
  address?: string;
  currency: string;
  plan: 'free' | 'premium';
  planExpiresAt?: string | null;
  rawPlan?: string;
  status: 'active' | 'suspended';
  template: 'list' | 'grid';
  languages: string; // Comma-separated like "en,fr,ar"
  defaultLanguage: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  name_en?: string;
  name_fr?: string;
  name_ar?: string;
  order: number;
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  name_en?: string;
  name_fr?: string;
  name_ar?: string;
  description?: string;
  description_en?: string;
  description_fr?: string;
  description_ar?: string;
  price: string;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
