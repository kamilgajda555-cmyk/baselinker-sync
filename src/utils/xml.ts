// XML utilities dla BaseLinker data
import type { BaseLinkerProduct, XMLProductData } from '../types/baselinker';

/**
 * Konwertuje dane BaseLinker na format XML
 */
export function convertToXMLData(products: BaseLinkerProduct[]): XMLProductData[] {
  return products.map(product => {
    // Obsługa różnych formatów danych z BaseLinker API
    let name = '';
    let description = '';
    let price = 0;
    let quantity = 0;
    let images: string[] = [];

    // Nazwa produktu
    if (product.text_fields?.name) {
      name = product.text_fields.name;
    } else if (product.name) {
      name = product.name;
    }

    // Opis produktu
    if (product.text_fields?.description) {
      description = product.text_fields.description;
    } else if (product.description) {
      description = product.description;
    }

    // Cena - może być w różnych formatach
    if (product.price_brutto) {
      price = typeof product.price_brutto === 'object' ? 
        (product.price_brutto as any)?.prices?.[Object.keys((product.price_brutto as any)?.prices || {})[0]] || 0 : 
        product.price_brutto;
    } else if (product.prices) {
      const priceKeys = Object.keys(product.prices);
      if (priceKeys.length > 0) {
        price = (product.prices as any)[priceKeys[0]] || 0;
      }
    }

    // Stany magazynowe - może być w różnych formatach
    if (product.quantity) {
      quantity = typeof product.quantity === 'object' ? 
        (product.quantity as any)?.stock?.[Object.keys((product.quantity as any)?.stock || {})[0]] || 0 : 
        product.quantity;
    } else if (product.stock) {
      const stockKeys = Object.keys(product.stock);
      if (stockKeys.length > 0) {
        quantity = (product.stock as any)[stockKeys[0]] || 0;
      }
    }

    // Zdjęcia
    if (product.images) {
      if (Array.isArray(product.images)) {
        images = product.images;
      } else if (typeof product.images === 'object') {
        images = Object.values(product.images as any).filter(img => typeof img === 'string');
      }
    }

    return {
      id: product.product_id,
      name: name,
      sku: product.sku || '',
      description: description,
      price: price,
      quantity: quantity,
      category: product.category || '',
      manufacturer: product.manufacturer || '',
      ean: product.ean || '',
      images: images,
      lastUpdated: new Date().toISOString()
    };
  });
}

/**
 * Generuje XML string z danych produktowych
 */
export function generateProductsXML(products: XMLProductData[], options?: {
  rootElement?: string;
  encoding?: string;
  includeHeader?: boolean;
}): string {
  const {
    rootElement = 'products',
    encoding = 'UTF-8',
    includeHeader = true
  } = options || {};

  let xml = '';
  
  if (includeHeader) {
    xml += `<?xml version="1.0" encoding="${encoding}"?>\n`;
  }
  
  xml += `<${rootElement}>\n`;
  xml += `  <metadata>\n`;
  xml += `    <generated>${new Date().toISOString()}</generated>\n`;
  xml += `    <count>${products.length}</count>\n`;
  xml += `    <source>BaseLinker API</source>\n`;
  xml += `  </metadata>\n`;

  products.forEach(product => {
    xml += '  <product>\n';
    xml += `    <id>${escapeXML(product.id)}</id>\n`;
    xml += `    <name>${escapeXML(product.name)}</name>\n`;
    xml += `    <sku>${escapeXML(product.sku)}</sku>\n`;
    
    if (product.description) {
      xml += `    <description><![CDATA[${product.description}]]></description>\n`;
    }
    
    xml += `    <price>${product.price}</price>\n`;
    xml += `    <quantity>${product.quantity}</quantity>\n`;
    
    if (product.category) {
      xml += `    <category>${escapeXML(product.category)}</category>\n`;
    }
    
    if (product.manufacturer) {
      xml += `    <manufacturer>${escapeXML(product.manufacturer)}</manufacturer>\n`;
    }
    
    if (product.ean) {
      xml += `    <ean>${escapeXML(product.ean)}</ean>\n`;
    }
    
    if (product.images && product.images.length > 0) {
      xml += '    <images>\n';
      product.images.forEach((image, index) => {
        xml += `      <image id="${index + 1}">${escapeXML(image)}</image>\n`;
      });
      xml += '    </images>\n';
    }
    
    xml += `    <lastUpdated>${product.lastUpdated}</lastUpdated>\n`;
    xml += '  </product>\n';
  });

  xml += `</${rootElement}>\n`;
  
  return xml;
}

/**
 * Generuje uproszczony XML dla dostawcy
 */
export function generateSupplierXML(products: XMLProductData[], supplierFormat?: string): string {
  switch (supplierFormat) {
    case 'simple':
      return generateSimpleSupplierXML(products);
    case 'detailed':
      return generateDetailedSupplierXML(products);
    case 'commaval':
      return generateCommavalXML(products);
    default:
      return generateProductsXML(products);
  }
}

/**
 * Uproszczony format XML dla dostawcy
 */
function generateSimpleSupplierXML(products: XMLProductData[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<catalog>\n';
  
  products.forEach(product => {
    xml += '  <item>\n';
    xml += `    <code>${escapeXML(product.sku)}</code>\n`;
    xml += `    <name>${escapeXML(product.name)}</name>\n`;
    xml += `    <price>${product.price}</price>\n`;
    xml += `    <stock>${product.quantity}</stock>\n`;
    xml += '  </item>\n';
  });
  
  xml += '</catalog>\n';
  return xml;
}

/**
 * Szczegółowy format XML dla dostawcy
 */
function generateDetailedSupplierXML(products: XMLProductData[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<products>\n';
  xml += `  <export_date>${new Date().toISOString()}</export_date>\n`;
  xml += `  <product_count>${products.length}</product_count>\n`;
  
  products.forEach(product => {
    xml += '  <product>\n';
    xml += `    <product_id>${escapeXML(product.id)}</product_id>\n`;
    xml += `    <sku>${escapeXML(product.sku)}</sku>\n`;
    xml += `    <title>${escapeXML(product.name)}</title>\n`;
    xml += `    <price_gross>${product.price}</price_gross>\n`;
    xml += `    <availability>${product.quantity}</availability>\n`;
    
    if (product.description) {
      xml += `    <description><![CDATA[${product.description}]]></description>\n`;
    }
    
    if (product.manufacturer) {
      xml += `    <brand>${escapeXML(product.manufacturer)}</brand>\n`;
    }
    
    if (product.ean) {
      xml += `    <barcode>${escapeXML(product.ean)}</barcode>\n`;
    }
    
    xml += `    <last_modified>${product.lastUpdated}</last_modified>\n`;
    xml += '  </product>\n';
  });
  
  xml += '</products>\n';
  return xml;
}

/**
 * Escapuje znaki specjalne w XML
 */
function escapeXML(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generuje XML w formacie COMMAVAL dla dostawcy
 */
function generateCommavalXML(products: XMLProductData[]): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += `<Supplier-Catalog timestamp="${timestamp}">\n`;
  xml += '  <Load>F</Load>\n';
  xml += '  <Supplier>\n';
  xml += '    <Code>BASELINKER</Code>\n';
  xml += '    <Name>BaseLinker Product Sync</Name>\n';
  xml += '  </Supplier>\n';
  xml += '  <Products>\n';
  
  products.forEach(product => {
    xml += '    <Product>\n';
    xml += '      <Codes>\n';
    
    // EAN code (type="1")
    if (product.ean) {
      xml += `        <Code type="1">${escapeXML(product.ean)}</Code>\n`;
    }
    
    // SKU/Catalog number (type="3")
    if (product.sku) {
      xml += `        <Code type="3">${escapeXML(product.sku)}</Code>\n`;
    }
    
    xml += '      </Codes>\n';
    xml += '      <Stock>\n';
    xml += '        <Type>2</Type>\n'; // Typ 2 = dostępny
    xml += `        <Quantity>${product.quantity}</Quantity>\n`;
    xml += '      </Stock>\n';
    xml += '      <Prices>\n';
    xml += `        <Price>${product.price.toFixed(2)}</Price>\n`;
    xml += `        <SalesPrice>${(product.price * 1.2).toFixed(2)}</SalesPrice>\n`; // +20% marża
    xml += '      </Prices>\n';
    xml += '    </Product>\n';
  });
  
  xml += '  </Products>\n';
  xml += '</Supplier-Catalog>\n';
  
  return xml;
}

/**
 * Generuje CSV z danych produktowych (alternatywa dla XML)
 */
export function generateProductsCSV(products: XMLProductData[]): string {
  if (products.length === 0) {
    return 'id,sku,name,price,quantity,category,manufacturer,ean,lastUpdated\n';
  }

  const headers = 'id,sku,name,price,quantity,category,manufacturer,ean,lastUpdated\n';
  
  const rows = products.map(product => {
    return [
      product.id,
      product.sku,
      `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in CSV
      product.price,
      product.quantity,
      `"${(product.category || '').replace(/"/g, '""')}"`,
      `"${(product.manufacturer || '').replace(/"/g, '""')}"`,
      product.ean,
      product.lastUpdated
    ].join(',');
  }).join('\n');

  return headers + rows + '\n';
}