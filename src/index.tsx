import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';
import api from './routes/api';

type Bindings = {
  BASELINKER_TOKEN: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// CORS dla wszystkich routes
app.use('/api/*', cors());

// Serwowanie plików statycznych
app.use('/static/*', serveStatic({ root: './public' }));
app.use('/favicon.ico', serveStatic({ path: './public/favicon.ico' }));

// API routes
app.route('/api', api);

// Strona główna
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BaseLinker Product Sync</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .card { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); }
        </style>
    </head>
    <body class="gradient-bg min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <!-- Header -->
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-white mb-4">
                    <i class="fas fa-sync-alt mr-3"></i>
                    BaseLinker Product Sync
                </h1>
                <p class="text-white text-lg opacity-90">
                    System integracji danych produktowych z BaseLinker API
                </p>
            </div>

            <!-- Status Section -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div class="card rounded-lg p-6 border border-white border-opacity-20">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-satellite-dish text-2xl text-white mr-3"></i>
                        <h3 class="text-xl font-semibold text-white">Status API</h3>
                    </div>
                    <div id="api-status" class="text-white">
                        <span class="opacity-75">Sprawdzanie...</span>
                    </div>
                </div>

                <div class="card rounded-lg p-6 border border-white border-opacity-20">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-boxes text-2xl text-white mr-3"></i>
                        <h3 class="text-xl font-semibold text-white">Katalogi</h3>
                    </div>
                    <div id="inventories-count" class="text-white">
                        <span class="opacity-75">Ładowanie...</span>
                    </div>
                </div>

                <div class="card rounded-lg p-6 border border-white border-opacity-20">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-clock text-2xl text-white mr-3"></i>
                        <h3 class="text-xl font-semibold text-white">Ostatnia aktualizacja</h3>
                    </div>
                    <div id="last-update" class="text-white text-sm">
                        <span class="opacity-75">Brak danych</span>
                    </div>
                </div>
            </div>

            <!-- API Endpoints -->
            <div class="card rounded-lg p-8 border border-white border-opacity-20 mb-8">
                <h2 class="text-2xl font-bold text-white mb-6">
                    <i class="fas fa-plug mr-3"></i>
                    Dostępne Endpointy API
                </h2>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-4">Zarządzanie danymi</h3>
                        <ul class="space-y-2 text-white text-sm">
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/test</code> - Test połączenia</li>
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/inventories</code> - Lista katalogów</li>
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/products/:id</code> - Produkty z katalogu</li>
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/orders</code> - Lista zamówień</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-4">Eksport danych</h3>
                        <ul class="space-y-2 text-white text-sm">
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/export/xml/:id</code> - Eksport XML</li>
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/export/csv/:id</code> - Eksport CSV</li>
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/stock/:id</code> - Stany magazynowe</li>
                            <li><code class="bg-black bg-opacity-30 px-2 py-1 rounded">GET /api/prices/:id</code> - Ceny produktów</li>
                            <li><code class="bg-green-400 bg-opacity-30 px-2 py-1 rounded">?format=commaval</code> - Format COMMAVAL XML</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card rounded-lg p-8 border border-white border-opacity-20">
                <h2 class="text-2xl font-bold text-white mb-6">
                    <i class="fas fa-bolt mr-3"></i>
                    Szybkie akcje
                </h2>
                
                <div class="grid md:grid-cols-3 gap-4">
                    <button onclick="testAPI()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors">
                        <i class="fas fa-play mr-2"></i>
                        Test API
                    </button>
                    
                    <button onclick="loadInventories()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors">
                        <i class="fas fa-refresh mr-2"></i>
                        Odśwież katalogi
                    </button>
                    
                    <button onclick="window.open('/api/status', '_blank')" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors">
                        <i class="fas fa-info-circle mr-2"></i>
                        Status systemu
                    </button>
                </div>
            </div>
        </div>

        <!-- JavaScript -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Aktualizacja czasu
            function updateTime() {
                document.getElementById('last-update').innerHTML = 
                    '<span class="opacity-75">' + new Date().toLocaleString('pl-PL') + '</span>';
            }
            
            // Test połączenia API
            async function testAPI() {
                try {
                    const response = await axios.get('/api/test');
                    const status = response.data.status === 'success' ? 
                        '<span class="text-green-300"><i class="fas fa-check-circle mr-1"></i> Połączono</span>' :
                        '<span class="text-red-300"><i class="fas fa-times-circle mr-1"></i> Błąd połączenia</span>';
                    document.getElementById('api-status').innerHTML = status;
                    updateTime();
                } catch (error) {
                    document.getElementById('api-status').innerHTML = 
                        '<span class="text-red-300"><i class="fas fa-times-circle mr-1"></i> Błąd: ' + error.message + '</span>';
                }
            }
            
            // Ładowanie katalogów
            async function loadInventories() {
                try {
                    const response = await axios.get('/api/inventories');
                    const count = response.data.count || 0;
                    document.getElementById('inventories-count').innerHTML = 
                        '<span class="text-2xl font-bold">' + count + '</span><br><span class="opacity-75">katalogów</span>';
                    updateTime();
                } catch (error) {
                    document.getElementById('inventories-count').innerHTML = 
                        '<span class="text-red-300">Błąd ładowania</span>';
                }
            }
            
            // Inicjalizacja
            document.addEventListener('DOMContentLoaded', function() {
                testAPI();
                loadInventories();
                updateTime();
                
                // Aktualizacja co minutę
                setInterval(updateTime, 60000);
            });
        </script>
    </body>
    </html>
  `);
});

// Dokumentacja API
app.get('/docs', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BaseLinker API - Dokumentacja</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-8">
                <i class="fas fa-book mr-3"></i>
                BaseLinker API - Dokumentacja
            </h1>
            
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">Endpointy API</h2>
                
                <div class="space-y-4">
                    <div class="border-l-4 border-blue-500 pl-4">
                        <h3 class="font-semibold">GET /api/test</h3>
                        <p class="text-gray-600">Test połączenia z BaseLinker API</p>
                    </div>
                    
                    <div class="border-l-4 border-green-500 pl-4">
                        <h3 class="font-semibold">GET /api/inventories</h3>
                        <p class="text-gray-600">Pobiera listę dostępnych katalogów</p>
                    </div>
                    
                    <div class="border-l-4 border-yellow-500 pl-4">
                        <h3 class="font-semibold">GET /api/products/:inventoryId</h3>
                        <p class="text-gray-600">Pobiera produkty z określonego katalogu</p>
                        <p class="text-sm text-gray-500">Parametry: ?detailed=true&limit=100</p>
                    </div>
                    
                    <div class="border-l-4 border-purple-500 pl-4">
                        <h3 class="font-semibold">GET /api/export/xml/:inventoryId</h3>
                        <p class="text-gray-600">Eksportuje produkty do formatu XML</p>
                        <p class="text-sm text-gray-500">Parametry: ?format=simple|detailed|standard&download=true</p>
                    </div>
                    
                    <div class="border-l-4 border-red-500 pl-4">
                        <h3 class="font-semibold">GET /api/export/csv/:inventoryId</h3>
                        <p class="text-gray-600">Eksportuje produkty do formatu CSV</p>
                        <p class="text-sm text-gray-500">Parametry: ?download=true</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold mb-4">Przykłady użycia</h2>
                
                <div class="space-y-4">
                    <div>
                        <h3 class="font-semibold">Pobieranie listy katalogów:</h3>
                        <code class="bg-gray-100 px-2 py-1 rounded block">curl https://your-domain.pages.dev/api/inventories</code>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold">Eksport XML dla dostawcy:</h3>
                        <code class="bg-gray-100 px-2 py-1 rounded block">curl "https://your-domain.pages.dev/api/export/xml/12345?format=simple&download=true"</code>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

export default app;