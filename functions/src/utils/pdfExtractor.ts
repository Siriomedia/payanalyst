import * as pdfParse from 'pdf-parse';

export interface ExtractionResult {
  text: string;
  warnings: string[];
}

/**
 * Estrae testo da un PDF buffer.
 * Se il testo estratto è troppo corto (< 500 caratteri), aggiunge un warning.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  const warnings: string[] = [];

  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();

    if (text.length < 500) {
      warnings.push('low_text_extraction');
    }

    return {
      text,
      warnings,
    };
  } catch (error) {
    console.error('Errore estrazione PDF:', error);
    // Se fallisce l'estrazione, ritorna testo vuoto con warning
    warnings.push('pdf_extraction_failed');
    return {
      text: '',
      warnings,
    };
  }
}

/**
 * Crea un preview del testo limitato a maxLength caratteri
 */
export function createTextPreview(text: string, maxLength: number = 1000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}
