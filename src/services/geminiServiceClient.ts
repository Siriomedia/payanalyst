import { getFunctions, httpsCallable } from 'firebase/functions';
import { ChatMessage, Payslip, HistoricalAnalysisResult } from '../types.ts';

const functions = getFunctions();

// Helper per convertire File in base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Analizza una busta paga usando Cloud Functions
 */
export const analyzePayslip = async (file: File): Promise<Payslip> => {
  try {
    const fileData = await fileToBase64(file);
    
    const analyzeFunction = httpsCallable(functions, 'analyzePayslip');
    const result = await analyzeFunction({
      fileData,
      mimeType: file.type,
      fileName: file.name,
    });

    return result.data as Payslip;
  } catch (error: any) {
    console.error('Errore chiamata Cloud Function analyzePayslip:', error);
    
    // Propaga gli errori di validazione
    if (error.message?.includes('DATI ANAGRAFICI')) {
      throw error;
    }
    
    throw new Error(
      error.message || 'Errore durante l\'analisi della busta paga. Riprova.'
    );
  }
};

/**
 * Confronta due buste paga
 */
export const getComparisonAnalysis = async (
  p1: Payslip,
  p2: Payslip
): Promise<string> => {
  try {
    const compareFunction = httpsCallable(functions, 'comparePayslips');
    const result = await compareFunction({
      payslip1: p1,
      payslip2: p2,
    });

    return (result.data as any).analysis;
  } catch (error: any) {
    console.error('Errore chiamata Cloud Function comparePayslips:', error);
    throw new Error(error.message || 'Errore durante il confronto delle buste paga.');
  }
};

/**
 * Genera un riassunto di una busta paga
 */
export const getPayslipSummary = async (payslip: Payslip): Promise<string> => {
  try {
    const summarizeFunction = httpsCallable(functions, 'summarizePayslip');
    const result = await summarizeFunction({ payslip });

    return (result.data as any).summary;
  } catch (error: any) {
    console.error('Errore chiamata Cloud Function summarizePayslip:', error);
    throw new Error(error.message || 'Errore durante la generazione del riassunto.');
  }
};

/**
 * Chat assistant - NON SUPPORTA STREAMING con Cloud Functions
 * La risposta viene generata completamente server-side
 */
export const getChatResponse = async (
  history: ChatMessage[],
  question: string,
  context: {
    payslips?: Payslip[];
    file?: File;
    focusedPayslip?: Payslip | null;
    payslipsToCompare?: [Payslip, Payslip] | null;
    includeTaxTables?: boolean;
  }
) => {
  try {
    // Prepara i dati del file se presente
    let fileData = null;
    let fileMimeType = null;
    
    if (context.file) {
      fileData = await fileToBase64(context.file);
      fileMimeType = context.file.type;
    }

    const chatFunction = httpsCallable(functions, 'chatAssistant');
    const result = await chatFunction({
      history,
      question,
      contextData: {
        payslips: context.payslips,
        focusedPayslip: context.focusedPayslip,
        payslipsToCompare: context.payslipsToCompare,
        includeTaxTables: context.includeTaxTables,
        fileData,
        fileMimeType,
      },
    });

    // Ritorna un oggetto che simula lo stream ma con risposta completa
    return {
      text: (result.data as any).response,
      isStreaming: false,
    };
  } catch (error: any) {
    console.error('Errore chiamata Cloud Function chatAssistant:', error);
    throw new Error(error.message || 'Errore durante la chat con l\'assistente.');
  }
};

/**
 * Analisi storica delle buste paga
 */
export const getHistoricalAnalysis = async (
  currentPayslip: Payslip,
  historicalPayslips: Payslip[]
): Promise<HistoricalAnalysisResult> => {
  try {
    if (historicalPayslips.length === 0) {
      throw new Error("Nessuna busta paga storica fornita per l'analisi.");
    }

    const analyzeFunction = httpsCallable(functions, 'analyzeHistorical');
    const result = await analyzeFunction({
      currentPayslip,
      historicalPayslips,
    });

    return result.data as HistoricalAnalysisResult;
  } catch (error: any) {
    console.error('Errore chiamata Cloud Function analyzeHistorical:', error);
    throw new Error(error.message || "Errore durante l'analisi storica.");
  }
};
