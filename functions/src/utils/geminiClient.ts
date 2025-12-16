import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiOutput, GeminiOutputSchema } from '../types';

/**
 * Costruisce il prompt per Gemini con istruzioni rigorose per JSON output
 */
function buildPrompt(year: number, month: number, extractedText: string): string {
  return `Sei un assistente esperto nell'analisi di buste paga italiane. Ti viene fornito il testo estratto da una busta paga.

ISTRUZIONI CRITICHE:
- Restituisci SOLO un oggetto JSON valido, senza markdown, senza backticks, senza testo aggiuntivo
- Il JSON deve essere parsabile direttamente
- Tutti i numeri devono essere di tipo number (non stringhe)
- Usa punto decimale per i decimali (es. 1234.56)
- Se un dato non è trovato o non è chiaro, usa null
- Il campo confidence deve essere un numero tra 0 e 1 che indica la tua sicurezza nell'estrazione

DATI RICHIESTI:
- year: ${year}
- month: ${month}
- paga_base: retribuzione base lorda (number o null)
- ferie: {maturate: number|null, godute: number|null, residue: number|null}
- permessi: {maturati: number|null, goduti: number|null, residui: number|null}
- rol: {maturati: number|null, goduti: number|null, residui: number|null}
- tfr: {quota_mese: number|null, progressivo: number|null}
- malattia: {giorni: number|null, ore: number|null, trattenute: number|null}
- confidence: number (0-1)
- warnings: array di stringhe con avvisi (es. ["month_mismatch", "missing_tfr"])

WARNINGS DA INCLUDERE SE NECESSARIO:
- "month_mismatch": se il mese nella busta paga non corrisponde a quello richiesto (${month})
- "low_confidence": se i dati sono poco chiari
- "missing_tfr": se mancano dati TFR
- "missing_leave_data": se mancano dati ferie/permessi/rol
- "partial_data": se alcuni campi sono incompleti

TESTO BUSTA PAGA:
${extractedText}

ESEMPIO OUTPUT (ESATTO FORMATO RICHIESTO):
{"year":2025,"month":3,"paga_base":2500.50,"ferie":{"maturate":2.0,"godute":0,"residue":15.5},"permessi":{"maturati":1.5,"goduti":0,"residui":10.0},"rol":{"maturati":1.0,"goduti":0,"residui":8.0},"tfr":{"quota_mese":150.00,"progressivo":5000.00},"malattia":{"giorni":null,"ore":null,"trattenute":null},"confidence":0.9,"warnings":[]}

RISPONDI SOLO CON IL JSON:`;
}

/**
 * Chiama Gemini API con retry logic
 */
async function callGeminiWithRetry(
  apiKey: string,
  prompt: string,
  maxRetries: number = 2
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const delays = [500, 1500]; // Backoff delays in ms

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      return text;
    } catch (error) {
      console.error(`Tentativo ${attempt + 1} fallito:`, error);

      if (attempt < maxRetries) {
        const delay = delays[attempt] || 1500;
        console.log(`Retry tra ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Gemini API fallita dopo ${maxRetries + 1} tentativi: ${error}`);
      }
    }
  }

  throw new Error('Retry logic failed unexpectedly');
}

/**
 * Pulisce il testo della risposta da eventuali markdown o wrapper
 */
function cleanJsonResponse(text: string): string {
  // Rimuovi markdown code blocks
  let cleaned = text.trim();

  // Rimuovi ```json ... ```
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

  // Rimuovi ``` ... ```
  cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

  return cleaned.trim();
}

export interface GeminiAnalysisResult {
  extracted: GeminiOutput;
  rawModelOutput: string;
  confidence: number;
  warnings: string[];
}

/**
 * Analizza il testo estratto dalla busta paga usando Gemini API
 */
export async function analyzePayslipWithGemini(
  apiKey: string,
  year: number,
  month: number,
  extractedText: string,
  initialWarnings: string[] = []
): Promise<GeminiAnalysisResult> {
  const prompt = buildPrompt(year, month, extractedText);

  // Chiama Gemini con retry
  const rawOutput = await callGeminiWithRetry(apiKey, prompt);

  // Pulisci la risposta
  const cleanedOutput = cleanJsonResponse(rawOutput);

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedOutput);
  } catch (error) {
    throw new Error(`Invalid JSON from Gemini: ${error}. Raw output: ${cleanedOutput.substring(0, 200)}`);
  }

  // Valida con Zod
  const validationResult = GeminiOutputSchema.safeParse(parsed);

  if (!validationResult.success) {
    throw new Error(`Schema validation failed: ${validationResult.error.message}`);
  }

  const extracted = validationResult.data;

  // Merge warnings iniziali con quelli di Gemini
  const allWarnings = [...initialWarnings, ...extracted.warnings];

  return {
    extracted,
    rawModelOutput: rawOutput,
    confidence: extracted.confidence,
    warnings: allWarnings,
  };
}
