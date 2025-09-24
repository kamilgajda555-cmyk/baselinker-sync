// BaseLinker API Service
import type { 
  BaseLinkerConfig, 
  BaseLinkerResponse, 
  BaseLinkerProduct, 
  BaseLinkerInventory,
  BaseLinkerOrder 
} from '../types/baselinker';

export class BaseLinkerService {
  private config: BaseLinkerConfig;

  constructor(token: string) {
    this.config = {
      token,
      apiUrl: 'https://api.baselinker.com/connector.php'
    };
  }

  /**
   * Wykonuje zapytanie do BaseLinker API
   */
  private async makeRequest<T>(method: string, parameters: any = {}): Promise<BaseLinkerResponse<T>> {
    const body = new URLSearchParams({
      method,
      parameters: JSON.stringify(parameters)
    });

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-BLToken': this.config.token
        },
        body: body.toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as BaseLinkerResponse<T>;
      
      if (data.status === 'ERROR') {
        throw new Error(`BaseLinker API error: ${data.error_message} (${data.error_code})`);
      }

      return data;
    } catch (error) {
      console.error('BaseLinker API request failed:', error);
      throw error;
    }
  }

  /**
   * Pobiera listę katalogów (inventory)
   */
  async getInventories(): Promise<BaseLinkerInventory[]> {
    const response = await this.makeRequest<{ inventories: BaseLinkerInventory[] }>('getInventories');
    return response.inventories || [];
  }

  /**
   * Pobiera podstawowe dane produktów z katalogu
   */
  async getInventoryProductsList(inventoryId: string, filterId?: string): Promise<BaseLinkerProduct[]> {
    const parameters: any = { inventory_id: inventoryId };
    if (filterId) {
      parameters.filter_id = filterId;
    }

    const response = await this.makeRequest<{ products: Record<string, BaseLinkerProduct> }>
      ('getInventoryProductsList', parameters);
    
    // Konwertujemy obiekt na tablicę
    const products = response.products || {};
    return Object.entries(products).map(([id, product]) => ({
      ...product,
      product_id: id
    }));
  }

  /**
   * Pobiera szczegółowe dane produktów z katalogu
   */
  async getInventoryProductsData(inventoryId: string, products: string[]): Promise<BaseLinkerProduct[]> {
    if (products.length === 0) return [];

    const parameters = {
      inventory_id: inventoryId,
      products: products
    };

    const response = await this.makeRequest<{ products: Record<string, BaseLinkerProduct> }>
      ('getInventoryProductsData', parameters);
    
    const productsData = response.products || {};
    return Object.entries(productsData).map(([id, product]) => ({
      ...product,
      product_id: id
    }));
  }

  /**
   * Pobiera stany magazynowe produktów
   */
  async getInventoryProductsStock(inventoryId: string, products?: string[]): Promise<Record<string, number>> {
    const parameters: any = { inventory_id: inventoryId };
    if (products && products.length > 0) {
      parameters.products = products;
    }

    const response = await this.makeRequest<{ products: Record<string, number> }>
      ('getInventoryProductsStock', parameters);
    
    return response.products || {};
  }

  /**
   * Pobiera ceny produktów
   */
  async getInventoryProductsPrices(inventoryId: string, products?: string[]): Promise<Record<string, number>> {
    const parameters: any = { inventory_id: inventoryId };
    if (products && products.length > 0) {
      parameters.products = products;
    }

    const response = await this.makeRequest<{ products: Record<string, number> }>
      ('getInventoryProductsPrices', parameters);
    
    return response.products || {};
  }

  /**
   * Pobiera zamówienia z określonego okresu
   */
  async getOrders(dateFrom?: number, dateTo?: number, status?: string): Promise<BaseLinkerOrder[]> {
    const parameters: any = {};
    
    if (dateFrom) parameters.date_confirmed_from = dateFrom;
    if (dateTo) parameters.date_confirmed_to = dateTo;
    if (status) parameters.status_id = status;

    const response = await this.makeRequest<{ orders: BaseLinkerOrder[] }>
      ('getOrders', parameters);
    
    return response.orders || [];
  }

  /**
   * Pobiera wszystkie produkty z danymi cenowymi i magazynowymi
   */
  async getAllProductsData(inventoryId: string): Promise<BaseLinkerProduct[]> {
    try {
      // 1. Pobieramy listę wszystkich produktów
      const productsList = await this.getInventoryProductsList(inventoryId);
      
      if (productsList.length === 0) {
        return [];
      }

      // 2. Pobieramy szczegółowe dane produktów (w partiach po 100)
      const productIds = productsList.map(p => p.product_id);
      const detailedProducts: BaseLinkerProduct[] = [];
      
      for (let i = 0; i < productIds.length; i += 100) {
        const batch = productIds.slice(i, i + 100);
        const batchData = await this.getInventoryProductsData(inventoryId, batch);
        detailedProducts.push(...batchData);
      }

      // 3. Pobieramy stany magazynowe i ceny
      const [stockData, pricesData] = await Promise.all([
        this.getInventoryProductsStock(inventoryId),
        this.getInventoryProductsPrices(inventoryId)
      ]);

      // 4. Łączymy wszystkie dane
      const enrichedProducts = detailedProducts.map(product => ({
        ...product,
        quantity: stockData[product.product_id] || 0,
        price_brutto: pricesData[product.product_id] || product.price_brutto || 0
      }));

      return enrichedProducts;
    } catch (error) {
      console.error('Error fetching all products data:', error);
      throw error;
    }
  }

  /**
   * Test połączenia z API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getInventories();
      return true;
    } catch (error) {
      console.error('BaseLinker connection test failed:', error);
      return false;
    }
  }
}