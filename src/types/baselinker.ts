// TypeScript typy dla BaseLinker API

export interface BaseLinkerConfig {
  token: string;
  apiUrl: string;
}

export interface BaseLinkerResponse<T = any> {
  status: 'SUCCESS' | 'ERROR';
  error_message?: string;
  error_code?: string;
  [key: string]: T;
}

export interface BaseLinkerProduct {
  product_id: string;
  name: string;
  sku: string;
  description?: string;
  price_brutto?: number;
  price_netto?: number;
  tax_rate?: number;
  quantity?: number;
  weight?: number;
  dimensions?: {
    width?: number;
    height?: number;
    length?: number;
  };
  category?: string;
  manufacturer?: string;
  ean?: string;
  images?: string[];
  variants?: BaseLinkerProductVariant[];
  created_time?: number;
  updated_time?: number;
}

export interface BaseLinkerProductVariant {
  variant_id: string;
  name: string;
  sku: string;
  price_brutto?: number;
  price_netto?: number;
  quantity?: number;
  attributes?: Record<string, string>;
}

export interface BaseLinkerInventory {
  inventory_id: string;
  name: string;
  description?: string;
  languages?: string[];
  default_language?: string;
  price_groups?: string[];
  default_price_group?: string;
  warehouses?: string[];
  default_warehouse?: string;
}

export interface BaseLinkerOrder {
  order_id: string;
  order_source: string;
  order_source_id: string;
  order_status_id: string;
  date_add: number;
  date_confirmed?: number;
  date_in_status?: number;
  user_login?: string;
  phone?: string;
  email?: string;
  user_comments?: string;
  admin_comments?: string;
  currency?: string;
  payment_method?: string;
  delivery_method?: string;
  delivery_price?: number;
  delivery_package_module?: string;
  delivery_package_nr?: string;
  delivery_fullname?: string;
  delivery_company?: string;
  delivery_address?: string;
  delivery_postcode?: string;
  delivery_city?: string;
  delivery_country?: string;
  invoice_fullname?: string;
  invoice_company?: string;
  invoice_nip?: string;
  invoice_address?: string;
  invoice_postcode?: string;
  invoice_city?: string;
  invoice_country?: string;
  products?: BaseLinkerOrderProduct[];
}

export interface BaseLinkerOrderProduct {
  product_id?: string;
  variant_id?: string;
  name: string;
  sku?: string;
  price_brutto: number;
  price_netto?: number;
  tax_rate?: number;
  quantity: number;
  weight?: number;
}

export interface XMLProductData {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  manufacturer?: string;
  ean?: string;
  images?: string[];
  lastUpdated: string;
}