# GioIA Cloud Functions

Cloud Functions per proteggere la Gemini API key e gestire le chiamate AI lato server.

## Configurazione

### 1. Installa dipendenze
```bash
cd functions
npm install
```

### 2. Configura la Gemini API Key
```bash
firebase functions:config:set gemini.apikey="YOUR_GEMINI_API_KEY"
```

### 3. Build
```bash
npm run build
```

### 4. Deploy
```bash
firebase deploy --only functions
```

## Functions Disponibili

### analyzePayslip
Analizza una busta paga da file PDF/immagine.
- **Input**: `{ fileData, mimeType, fileName }`
- **Output**: Oggetto `Payslip` strutturato

### comparePayslips
Confronta due buste paga.
- **Input**: `{ payslip1, payslip2 }`
- **Output**: `{ analysis: string }`

### summarizePayslip
Genera un riassunto testuale di una busta paga.
- **Input**: `{ payslip }`
- **Output**: `{ summary: string }`

### chatAssistant
Chat assistant per domande sulle buste paga.
- **Input**: `{ history, question, contextData }`
- **Output**: `{ response: string }`
- **Nota**: Non supporta streaming (risposta completa)

### analyzeHistorical
Analisi storica confrontando buste paga.
- **Input**: `{ currentPayslip, historicalPayslips }`
- **Output**: Oggetto `HistoricalAnalysisResult`

## Regione
Tutte le functions sono deployate in `europe-west1` per latenza ottimale.

## Sicurezza
- Tutte le functions richiedono autenticazione Firebase
- La Gemini API key è protetta server-side
- Non viene mai esposta al client
