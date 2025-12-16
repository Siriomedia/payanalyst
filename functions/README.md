# PayAnalyst Cloud Functions

Sistema automatico di elaborazione buste paga con Firebase Cloud Functions, Gemini AI e Firestore.

## Funzionalità

La Cloud Function `onPayslipCreated` viene attivata automaticamente quando viene creato un nuovo documento in `payslips/{payslipId}` e:

1. Scarica il PDF da Firebase Storage
2. Estrae il testo dal PDF
3. Analizza i dati con Gemini AI
4. Salva l'analisi strutturata
5. Aggiorna/crea il documento mensile aggregato

## Struttura Firestore

### Collection: `payslips/{payslipId}`
```typescript
{
  userId: string,
  year: number,
  month: number,
  storagePath: string,
  status: "uploaded" | "processing" | "done" | "error",
  createdAt: timestamp,
  updatedAt: timestamp,
  errorMessage?: string,
  sourceTextPreview?: string
}
```

### Subcollection: `payslips/{payslipId}/analysis/result`
```typescript
{
  extracted: {
    year, month, paga_base,
    ferie: {maturate, godute, residue},
    permessi: {maturati, goduti, residui},
    rol: {maturati, goduti, residui},
    tfr: {quota_mese, progressivo},
    malattia: {giorni, ore, trattenute},
    confidence: number,
    warnings: string[]
  },
  rawModelOutput: string,
  confidence: number,
  warnings: string[],
  createdAt: timestamp
}
```

### Collection: `users/{userId}/monthly/{YYYY-MM}`
```typescript
{
  year: number,
  month: number,
  paga_base: number|null,
  ferie: {maturate, godute, residue},
  permessi: {maturati, goduti, residui},
  rol: {maturati, goduti, residui},
  tfr: {quota_mese, progressivo},
  malattia: {giorni, ore, trattenute},
  sourcePayslipId: string,
  updatedAt: timestamp
}
```

## Setup

### 1. Installa dipendenze
```bash
cd functions
npm install
```

### 2. Configura Gemini API Key

Ottieni una API key da [Google AI Studio](https://aistudio.google.com/app/apikey)

**Opzione A: Firebase CLI (locale)**
```bash
firebase functions:config:set gemini.api_key="YOUR_API_KEY"
```

**Opzione B: Environment variable (consigliato per produzione)**
```bash
# Crea file .env in functions/
echo "GEMINI_API_KEY=your_key_here" > .env
```

Per deploy in produzione, configura la variabile tramite Firebase Console:
- Vai su Firebase Console → Functions → Configuration
- Aggiungi: `GEMINI_API_KEY` = `your_key_here`

### 3. Build
```bash
npm run build
```

### 4. Test locale (opzionale)
```bash
npm run serve
```

### 5. Deploy
```bash
npm run deploy
```

## Chiamata Gemini API

La funzione usa `@google/generative-ai` SDK con il modello `gemini-1.5-flash`.

**Endpoint:** Gestito dall'SDK
**Headers:** API key automatica tramite SDK
**Retry:** 2 tentativi con backoff (500ms, 1500ms)

Esempio di chiamata:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const result = await model.generateContent(prompt);
const text = result.response.text();
```

## Prompt Gemini

Il prompt è costruito in `utils/geminiClient.ts` e richiede a Gemini di:
- Restituire **SOLO** JSON valido (no markdown)
- Usare numeri, non stringhe
- Usare `null` per dati mancanti
- Includere campo `confidence` (0-1)
- Includere array `warnings` con codici di avviso

## Warnings

Codici warning standard:
- `low_text_extraction` - Testo estratto < 500 caratteri
- `pdf_extraction_failed` - Fallimento estrazione PDF
- `month_mismatch` - Mese busta paga ≠ mese richiesto
- `missing_tfr` - Dati TFR mancanti
- `missing_leave_data` - Dati ferie/permessi/ROL mancanti
- `partial_data` - Alcuni campi incompleti
- `low_confidence` - Dati poco chiari

## Sicurezza

- La Gemini API key è in environment variables, mai hardcoded
- Il testo completo del PDF non viene loggato (solo preview 1000 char)
- Gestione errori completa con rollback stato

## Monitoring

```bash
# Visualizza logs in tempo reale
npm run logs

# Oppure tramite Firebase Console
# https://console.firebase.google.com → Functions → Logs
```

## Troubleshooting

**Errore: GEMINI_API_KEY non configurata**
→ Configura la variabile come descritto nel Setup step 2

**Errore: Invalid JSON from Gemini**
→ Il modello ha restituito testo non-JSON. Controlla `rawModelOutput` in `analysis/result`

**Errore: Schema validation failed**
→ Il JSON di Gemini non rispetta lo schema. Verifica il prompt o migliora i dati di input

**Errore: pdf_extraction_failed**
→ Il PDF potrebbe essere protetto o corrotto. Verifica il file originale

## Dipendenze

- `firebase-functions` v5 - Cloud Functions runtime
- `firebase-admin` v12 - Admin SDK per Firestore/Storage
- `@google/generative-ai` - Gemini API SDK
- `pdf-parse` - Estrazione testo da PDF
- `zod` - Validazione schema TypeScript

## Note

- La function usa Node.js 20
- Il timeout di default è 60s (configurabile se necessario)
- La memory di default è 256MB (configurabile se necessario per PDF grandi)
- L'estrazione PDF è "best effort" - se fallisce, continua con testo vuoto
- L'upsert mensile sovrascrive sempre con i dati più recenti
