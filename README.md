# BaseLinker Product Sync

## Opis projektu
System integracji danych produktowych z BaseLinker API umożliwiający pobieranie danych produktowych w formacie XML/CSV i udostępnianie ich dostawcom przez REST API.

## 🌐 URLs
- **Aplikacja**: https://3000-iwazimeq4f7mceiuj4pz9-6532622b.e2b.dev
- **API Status**: https://3000-iwazimeq4f7mceiuj4pz9-6532622b.e2b.dev/api/status
- **Dokumentacja**: https://3000-iwazimeq4f7mceiuj4pz9-6532622b.e2b.dev/docs

## 🔧 Funkcje

### ✅ Zrealizowane funkcje
- **Integracja z BaseLinker API** - pełna komunikacja z BaseLinker REST API
- **Pobieranie danych produktowych** - katalogi, produkty, ceny, stany magazynowe
- **Eksport do XML** - różne formaty XML (standard, simple, detailed) dla dostawców
- **Eksport do CSV** - alternatywny format eksportu danych
- **Bezpieczne przechowywanie tokenów** - zmienne środowiskowe Cloudflare
- **REST API** - kompletne API do zarządzania danymi
- **Interface webowy** - dashboard do monitorowania i zarządzania
- **Automatyczna synchronizacja** - real-time pobieranie danych z BaseLinker

### 📊 Główne endpointy API
| Endpoint | Metoda | Opis |
|----------|---------|------|
| `/api/test` | GET | Test połączenia z BaseLinker |
| `/api/inventories` | GET | Lista katalogów produktowych |
| `/api/products/:id` | GET | Produkty z określonego katalogu |
| `/api/export/xml/:id` | GET | Eksport produktów do XML |
| `/api/export/csv/:id` | GET | Eksport produktów do CSV |
| `/api/stock/:id` | GET | Stany magazynowe produktów |
| `/api/prices/:id` | GET | Ceny produktów |
| `/api/orders` | GET | Lista zamówień |
| `/api/status` | GET | Status systemu |

### 📋 Parametry API
- **Eksport XML**: `?format=simple|detailed|standard|commaval&download=true`
- **Format COMMAVAL**: Specjalny format XML dla dostawcy COMMAVAL
- **Produkty**: `?detailed=true&limit=100`
- **Zamówienia**: `?date_from=1640995200&date_to=1672531199&status=123`

## 🏗️ Architektura danych

### Usługi przechowywania danych
- **Zmienne środowiskowe Cloudflare** - tokeny API i konfiguracja
- **BaseLinker API** - źródło danych produktowych (zewnętrzne)
- **Memory cache** - tymczasowe przechowywanie danych podczas przetwarzania

### Modele danych
- **BaseLinkerProduct** - szczegółowe dane produktu z BaseLinker
- **BaseLinkerInventory** - informacje o katalogach produktowych  
- **XMLProductData** - przekształcone dane do eksportu XML/CSV
- **BaseLinkerOrder** - dane zamówień

### Przepływ danych
1. **BaseLinker API** → **BaseLinkerService** → **REST API endpoints**
2. **Raw JSON data** → **XML/CSV transformation** → **Export dla dostawców**
3. **Real-time queries** - dane pobierane na żądanie (brak lokalnego cache)

## 📖 Instrukcja użytkowania

### 1. Konfiguracja tokenu BaseLinker
```bash
# W pliku .dev.vars (development)
BASELINKER_TOKEN=your_new_baselinker_token_here

# W Cloudflare Pages (production)
wrangler pages secret put BASELINKER_TOKEN --project-name webapp
```

### 2. Podstawowe użycie
1. **Test połączenia**: Przejdź do `/api/test`
2. **Lista katalogów**: Wywołaj `/api/inventories`
3. **Pobranie produktów**: Użyj `/api/products/{inventory_id}?detailed=true`
4. **Eksport XML**: Pobierz `/api/export/xml/{inventory_id}?format=simple&download=true`

### 3. Integracja dla dostawców
```bash
# Pobieranie XML w formacie prostym
curl "https://your-domain.pages.dev/api/export/xml/12345?format=simple" > products.xml

# Eksport XML w formacie COMMAVAL dla dostawcy
curl "https://your-domain.pages.dev/api/export/xml/12345?format=commaval&download=true" > commaval_products.xml

# Pobieranie CSV
curl "https://your-domain.pages.dev/api/export/csv/12345?download=true" > products.csv

# Monitorowanie stanów magazynowych
curl "https://your-domain.pages.dev/api/stock/12345"
```

## 🚀 Deployment

### Status deploymentu
- **Platform**: Cloudflare Pages
- **Status**: ✅ Aktywny (Development)
- **Tech Stack**: Hono + TypeScript + TailwindCSS
- **Last Updated**: 2025-09-23

### Deployment do produkcji
```bash
# 1. Konfiguracja Cloudflare API
setup_cloudflare_api_key

# 2. Utworzenie projektu
wrangler pages project create baselinker-sync --production-branch main

# 3. Deployment
npm run build
wrangler pages deploy dist --project-name baselinker-sync

# 4. Konfiguracja tokenów
wrangler pages secret put BASELINKER_TOKEN --project-name baselinker-sync
```

## 📋 Format COMMAVAL XML

### Specjalna integracja z dostawcą COMMAVAL

System obsługuje dedykowany format XML zgodny ze specyfikacją COMMAVAL:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Supplier-Catalog timestamp="2025-09-23 17:42:29">
  <Load>F</Load>
  <Supplier>
    <Code>BASELINKER</Code>
    <Name>BaseLinker Product Sync</Name>
  </Supplier>
  <Products>
    <Product>
      <Codes>
        <Code type="1">5902801032325</Code>  <!-- EAN -->
        <Code type="3">HT6D874</Code>        <!-- SKU -->
      </Codes>
      <Stock>
        <Type>2</Type>                       <!-- Dostępny -->
        <Quantity>0</Quantity>
      </Stock>
      <Prices>
        <Price>37.69</Price>                 <!-- Cena zakupu -->
        <SalesPrice>45.23</SalesPrice>       <!-- +20% marża -->
      </Prices>
    </Product>
  </Products>
</Supplier-Catalog>
```

### Użycie formatu COMMAVAL:
```bash
# Eksport dla dostawcy COMMAVAL
curl "https://your-domain.pages.dev/api/export/xml/12345?format=commaval&download=true" \
  -o "commaval_export_$(date +%Y%m%d).xml"

# Automatyczna synchronizacja co godzinę
0 * * * * curl -s "https://your-domain.pages.dev/api/export/xml/12345?format=commaval" > /path/to/ftp/commaval.xml
```

## ⚠️ Ważne informacje bezpieczeństwa

### 🔒 Token API
- **Ujawniony token musi zostać zresetowany** - token w pierwszej wiadomości był ujawniony publicznie
- Wygeneruj nowy token w panelu BaseLinker
- Nie commituj tokenów do repozytorium git
- Używaj tylko zmiennych środowiskowych

### 🌐 Ograniczenia Cloudflare Workers
- **Brak FTP** - system nie obsługuje bezpośredniego przesyłu FTP
- **HTTP only** - dostawcy muszą pobierać dane przez HTTP API
- **Limity czasowe** - maksymalnie 30s na request w płatnym planie
- **Bez lokalnej pamięci** - dane pobierane real-time z BaseLinker API

## 🔄 Alternatywy dla FTP

### Zalecane rozwiązania
1. **HTTP API** - dostawcy używają REST API do pobierania danych
2. **Scheduled exports** - regularne generowanie plików do pobrania
3. **Webhooks** - powiadomienia o zmianach danych
4. **Email delivery** - wysyłanie eksportów mailem (możliwa integracja)

### Implementacja FTP (poza Cloudflare)
Jeśli FTP jest wymagany, rozważ:
- **Node.js server** z biblioteką `ftp` 
- **Python script** z `ftplib`
- **Aplikacja desktopowa** z bezpośrednim dostępem

## 🚀 Następne kroki

### Planowane funkcje
- [ ] Caching produktów w Cloudflare KV
- [ ] Automatyczne powiadomienia o zmianach stanów
- [ ] Integracja z zewnętrznymi systemami FTP (jeśli wymagana)
- [ ] Dashboard analityczny z wykresami
- [ ] Bulk operations na produktach
- [ ] Integracja z systemami email (SendGrid)

### Optymalizacje
- [ ] Implementacja cache w Cloudflare KV dla lepszej wydajności
- [ ] Batch processing dla dużych katalogów
- [ ] Rate limiting zgodnie z limitami BaseLinker API (100/min)
- [ ] Error handling i retry logic
- [ ] Monitoring i alerting

## 📞 Wsparcie
W przypadku problemów sprawdź:
1. Status API: `/api/status`
2. Logi błędów w Cloudflare Pages Dashboard
3. Dokumentację BaseLinker API: https://api.baselinker.com/
4. Limity API BaseLinker (100 requestów/minutę)