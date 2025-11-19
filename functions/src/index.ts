import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI, Type } from '@google/genai';

admin.initializeApp();

const GEMINI_API_KEY = functions.config().gemini?.apikey || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY non configurata! Usa: firebase functions:config:set gemini.apikey="YOUR_KEY"');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Tabella addizionali comunali (copia completa dal client)
const MUNICIPAL_TAX_TABLES_TEXT = `Diffusione Limitata
Elenco aggiornato al 12 febbraio 2025
... [tabella completa omessa per brevità - verrà copiata dal file originale]`;

// Helper function per convertire File in GenerativePart
async function fileToGenerativePart(fileData: string, mimeType: string) {
  return {
    inlineData: {
      data: fileData,
      mimeType: mimeType,
    },
  };
}

// ================================
// CLOUD FUNCTION 1: Analisi Busta Paga
// ================================
export const analyzePayslip = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Verifica autenticazione
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    const { fileData, mimeType, fileName } = data;

    if (!fileData || !mimeType) {
      throw new functions.https.HttpsError('invalid-argument', 'File data mancanti');
    }

    try {
      const filePart = await fileToGenerativePart(fileData, mimeType);

      // Schema Gemini per l'estrazione strutturata (copia dallo schema originale)
      const payslipSchema = {
        type: Type.OBJECT,
        properties: {
          period: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.INTEGER },
              year: { type: Type.INTEGER }
            },
            required: ['month', 'year']
          },
          company: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              taxId: { type: Type.STRING },
              address: { type: Type.STRING }
            },
            required: ['name', 'taxId']
          },
          employee: {
            type: Type.OBJECT,
            properties: {
              firstName: { type: Type.STRING, description: "Nome del dipendente" },
              lastName: { type: Type.STRING, description: "Cognome del dipendente" },
              taxId: { type: Type.STRING },
              dateOfBirth: { type: Type.STRING, description: "Data di nascita OBBLIGATORIA nel formato DD/MM/YYYY o YYYY-MM-DD" },
              placeOfBirth: { type: Type.STRING, description: "Luogo di nascita OBBLIGATORIO (città completa, es. 'Roma', 'Milano')" },
              level: { type: Type.STRING },
              contractType: { type: Type.STRING }
            },
            required: ['firstName', 'lastName', 'taxId', 'dateOfBirth', 'placeOfBirth']
          },
          remunerationElements: { type: Type.ARRAY, items: { type: Type.OBJECT } },
          incomeItems: { type: Type.ARRAY, items: { type: Type.OBJECT } },
          deductionItems: { type: Type.ARRAY, items: { type: Type.OBJECT } },
          grossSalary: { type: Type.NUMBER },
          totalDeductions: { type: Type.NUMBER },
          netSalary: { type: Type.NUMBER },
          taxData: { type: Type.OBJECT },
          socialSecurityData: { type: Type.OBJECT },
          tfr: { type: Type.OBJECT },
          leaveData: { type: Type.OBJECT }
        },
        required: ['period', 'company', 'employee', 'grossSalary', 'totalDeductions', 'netSalary']
      };

      const prompt = `Analizza accuratamente questa busta paga italiana...`; // [prompt completo]

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [filePart, { text: prompt }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: payslipSchema,
        },
      });

      const jsonStr = response.text.trim();
      const payslipData = JSON.parse(jsonStr);

      // Validazione dati anagrafici
      const { firstName, lastName, dateOfBirth, placeOfBirth } = payslipData.employee;
      if (!firstName || !lastName || !dateOfBirth || !placeOfBirth ||
          firstName.trim() === '' || lastName.trim() === '' ||
          dateOfBirth.trim() === '' || placeOfBirth.trim() === '') {
        throw new Error(
          'DATI ANAGRAFICI MANCANTI: La busta paga non contiene tutti i dati anagrafici necessari. Verifica la qualità del documento.'
        );
      }

      return payslipData;
    } catch (error: any) {
      console.error('Errore analisi:', error);
      throw new functions.https.HttpsError('internal', error.message || 'Errore durante l\'analisi');
    }
  });

// ================================
// CLOUD FUNCTION 2: Confronto Buste Paga
// ================================
export const comparePayslips = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    const { payslip1, payslip2 } = data;

    if (!payslip1 || !payslip2) {
      throw new functions.https.HttpsError('invalid-argument', 'Due buste paga richieste');
    }

    const getMonthName = (month: number) =>
      new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'long' });

    const prompt = `In qualità di consulente del lavoro, analizza e confronta le seguenti due buste paga in formato JSON.
Busta Paga 1 (${getMonthName(payslip1.period.month)} ${payslip1.period.year}):
${JSON.stringify(payslip1, null, 2)}

Busta Paga 2 (${getMonthName(payslip2.period.month)} ${payslip2.period.year}):
${JSON.stringify(payslip2, null, 2)}

Fornisci un'analisi sintetica ma professionale che metta in luce le differenze principali...`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return { analysis: response.text };
  });

// ================================
// CLOUD FUNCTION 3: Riassunto Busta Paga
// ================================
export const summarizePayslip = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    const { payslip } = data;

    if (!payslip) {
      throw new functions.https.HttpsError('invalid-argument', 'Busta paga richiesta');
    }

    const prompt = `In qualità di consulente del lavoro, crea un'analisi descrittiva chiara e concisa per la seguente busta paga...
${JSON.stringify(payslip, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return { summary: response.text };
  });

// ================================
// CLOUD FUNCTION 4: Chat Assistant
// ================================
export const chatAssistant = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    const { history, question, contextData } = data;

    let systemInstruction = `Sei un consulente del lavoro virtuale, esperto di tutti i contratti collettivi nazionali di lavoro (CCNL) italiani...`;

    // Costruisci il contesto basato sui dati forniti
    if (contextData.payslipsToCompare) {
      const [p1, p2] = contextData.payslipsToCompare;
      systemInstruction += `\nL'utente sta confrontando queste due buste paga...`;
    } else if (contextData.focusedPayslip) {
      systemInstruction += `\nL'utente sta visualizzando questa busta paga...`;
    } else if (contextData.payslips && contextData.payslips.length > 0) {
      systemInstruction += `\nEcco i dati delle buste paga dell'utente...`;
    }

    if (contextData.includeTaxTables) {
      systemInstruction += `\n\n--- INIZIO DOCUMENTO ADDIZIONALI COMUNALI ---\n${MUNICIPAL_TAX_TABLES_TEXT}\n--- FINE DOCUMENTO ADDIZIONALI COMUNALI ---`;
    }

    const conversationHistory = history.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const userParts: any[] = [{ text: question }];

    if (contextData.fileData && contextData.fileMimeType) {
      const filePart = await fileToGenerativePart(
        contextData.fileData,
        contextData.fileMimeType
      );
      userParts.unshift(filePart);
    }

    const contents = [...conversationHistory, { role: 'user', parts: userParts }];

    // NOTA: Cloud Functions non supporta streaming nativo, quindi generiamo la risposta completa
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return { response: response.text };
  });

// ================================
// CLOUD FUNCTION 5: Analisi Storica
// ================================
export const analyzeHistorical = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Devi essere autenticato');
    }

    const { currentPayslip, historicalPayslips } = data;

    if (!currentPayslip || !historicalPayslips || historicalPayslips.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Busta paga corrente e storico richiesti'
      );
    }

    const historicalAnalysisSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        averageNetSalary: { type: Type.NUMBER },
        averageGrossSalary: { type: Type.NUMBER },
        differingItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              currentValue: { type: Type.NUMBER },
              averageValue: { type: Type.NUMBER },
              difference: { type: Type.NUMBER },
              type: { type: Type.STRING },
              comment: { type: Type.STRING },
            },
            required: ['description', 'currentValue', 'averageValue', 'difference', 'type', 'comment'],
          },
        },
      },
      required: ['summary', 'averageNetSalary', 'averageGrossSalary', 'differingItems'],
    };

    const prompt = `In qualità di esperto consulente del lavoro, analizza la busta paga corrente in relazione allo storico...
**Busta Paga Corrente (${currentPayslip.period.month}/${currentPayslip.period.year}):**
${JSON.stringify(currentPayslip, null, 2)}

**Storico Buste Paga Precedenti:**
${JSON.stringify(historicalPayslips, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: historicalAnalysisSchema,
      },
    });

    const jsonStr = response.text.trim();
    const analysisData = JSON.parse(jsonStr);

    return analysisData;
  });
