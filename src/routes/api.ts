// API routes dla BaseLinker integration
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { BaseLinkerService } from '../services/baselinker';
import { convertToXMLData, generateProductsXML, generateSupplierXML, generateProductsCSV } from '../utils/xml';

type Bindings = {
  BASELINKER_TOKEN: string;
}

const api = new Hono<{ Bindings: Bindings }>();

// Middleware
api.use('/*', cors());

// Middleware do walidacji tokenu BaseLinker
api.use('/*', async (c, next) => {
  const token = c.env?.BASELINKER_TOKEN;
  if (!token || token === 'YOUR_NEW_TOKEN_HERE') {
    return c.json({
      error: 'BaseLinker token not configured',
      message: 'Please set BASELINKER_TOKEN in environment variables'
    }, 401);
  }
  await next();
});

/**
 * Test połączenia z BaseLinker API
 */
api.get('/test', async (c) => {
  try {
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    const isConnected = await service.testConnection();
    
    return c.json({
      status: isConnected ? 'success' : 'error',
      message: isConnected ? 'BaseLinker API connection successful' : 'BaseLinker API connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Pobiera listę katalogów (inventories)
 */
api.get('/inventories', async (c) => {
  try {
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    const inventories = await service.getInventories();
    
    return c.json({
      status: 'success',
      data: inventories,
      count: inventories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Pobiera produkty z danego katalogu
 */
api.get('/products/:inventoryId', async (c) => {
  try {
    const inventoryId = c.req.param('inventoryId');
    const detailed = c.req.query('detailed') === 'true';
    const limit = parseInt(c.req.query('limit') || '100');
    
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    
    let products;
    if (detailed) {
      products = await service.getAllProductsData(inventoryId);
    } else {
      products = await service.getInventoryProductsList(inventoryId);
    }
    
    // Limitujemy wyniki jeśli określono
    if (limit > 0) {
      products = products.slice(0, limit);
    }
    
    return c.json({
      status: 'success',
      data: products,
      count: products.length,
      inventory_id: inventoryId,
      detailed: detailed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Eksportuje produkty do XML
 */
api.get('/export/xml/:inventoryId', async (c) => {
  try {
    const inventoryId = c.req.param('inventoryId');
    const format = c.req.query('format') || 'standard'; // standard, simple, detailed, commaval
    const download = c.req.query('download') === 'true';
    
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    const products = await service.getAllProductsData(inventoryId);
    
    const xmlData = convertToXMLData(products);
    
    let xml: string;
    if (format === 'simple' || format === 'detailed' || format === 'commaval') {
      xml = generateSupplierXML(xmlData, format);
    } else {
      xml = generateProductsXML(xmlData);
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/xml; charset=utf-8'
    };
    
    if (download) {
      const filename = `products_${inventoryId}_${new Date().toISOString().split('T')[0]}.xml`;
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }
    
    return new Response(xml, { headers });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Eksportuje produkty do CSV
 */
api.get('/export/csv/:inventoryId', async (c) => {
  try {
    const inventoryId = c.req.param('inventoryId');
    const download = c.req.query('download') === 'true';
    
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    const products = await service.getAllProductsData(inventoryId);
    
    const xmlData = convertToXMLData(products);
    const csv = generateProductsCSV(xmlData);
    
    const headers: Record<string, string> = {
      'Content-Type': 'text/csv; charset=utf-8'
    };
    
    if (download) {
      const filename = `products_${inventoryId}_${new Date().toISOString().split('T')[0]}.csv`;
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }
    
    return new Response(csv, { headers });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Pobiera stany magazynowe produktów
 */
api.get('/stock/:inventoryId', async (c) => {
  try {
    const inventoryId = c.req.param('inventoryId');
    const productIds = c.req.query('products')?.split(',');
    
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    const stock = await service.getInventoryProductsStock(inventoryId, productIds);
    
    return c.json({
      status: 'success',
      data: stock,
      inventory_id: inventoryId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Pobiera ceny produktów
 */
api.get('/prices/:inventoryId', async (c) => {
  try {
    const inventoryId = c.req.param('inventoryId');
    const productIds = c.req.query('products')?.split(',');
    
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    const prices = await service.getInventoryProductsPrices(inventoryId, productIds);
    
    return c.json({
      status: 'success',
      data: prices,
      inventory_id: inventoryId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Pobiera zamówienia
 */
api.get('/orders', async (c) => {
  try {
    const dateFrom = c.req.query('date_from') ? parseInt(c.req.query('date_from')!) : undefined;
    const dateTo = c.req.query('date_to') ? parseInt(c.req.query('date_to')!) : undefined;
    const status = c.req.query('status');
    
    const service = new BaseLinkerService(c.env.BASELINKER_TOKEN);
    const orders = await service.getOrders(dateFrom, dateTo, status);
    
    return c.json({
      status: 'success',
      data: orders,
      count: orders.length,
      filters: { date_from: dateFrom, date_to: dateTo, status },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

/**
 * Endpoint do monitorowania - status systemu
 */
api.get('/status', async (c) => {
  return c.json({
    status: 'online',
    service: 'BaseLinker Product Sync',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/test - Test połączenia z BaseLinker',
      'GET /api/inventories - Lista katalogów',
      'GET /api/products/:inventoryId - Produkty z katalogu',
      'GET /api/export/xml/:inventoryId - Eksport XML',
      'GET /api/export/csv/:inventoryId - Eksport CSV',
      'GET /api/stock/:inventoryId - Stany magazynowe',
      'GET /api/prices/:inventoryId - Ceny produktów',
      'GET /api/orders - Lista zamówień',
      'GET /api/status - Status systemu'
    ]
  });
});

export default api;