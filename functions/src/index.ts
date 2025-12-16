import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { extractTextFromPDF, createTextPreview } from './utils/pdfExtractor';
import { analyzePayslipWithGemini } from './utils/geminiClient';
import { upsertMonthlyData } from './utils/monthlyUpsert';
import { PayslipDocument, AnalysisResult } from './types';

// Inizializza Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * Cloud Function triggered quando viene creato un nuovo documento in payslips/{payslipId}
 *
 * Workflow:
 * 1. Imposta status = "processing"
 * 2. Scarica PDF da Storage
 * 3. Estrae testo dal PDF
 * 4. Chiama Gemini API per analisi
 * 5. Valida e salva risultato in analysis/result
 * 6. Upsert documento mensile in users/{userId}/monthly/{YYYY-MM}
 * 7. Imposta status = "done"
 */
export const onPayslipCreated = functions.firestore.onDocumentCreated(
  'payslips/{payslipId}',
  async (event) => {
    const payslipId = event.params.payslipId;
    const payslipData = event.data?.data() as PayslipDocument;

    if (!payslipData) {
      console.error('❌ Nessun dato nel documento payslip');
      return;
    }

    const { userId, year, month, storagePath } = payslipData;
    const payslipRef = db.collection('payslips').doc(payslipId);

    console.log(`🚀 Avvio elaborazione payslip: ${payslipId} per utente: ${userId}`);

    try {
      // STEP 1: Imposta status = processing
      await payslipRef.update({
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // STEP 2: Scarica PDF da Storage
      console.log(`📥 Download PDF da: ${storagePath}`);
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      const [fileBuffer] = await file.download();
      console.log(`✅ PDF scaricato: ${fileBuffer.length} bytes`);

      // STEP 3: Estrai testo dal PDF
      console.log('📄 Estrazione testo PDF...');
      const { text: extractedText, warnings: extractionWarnings } = await extractTextFromPDF(fileBuffer);
      console.log(`✅ Testo estratto: ${extractedText.length} caratteri`);

      const textPreview = createTextPreview(extractedText, 1000);

      // Aggiorna con preview (per privacy non loggare tutto)
      await payslipRef.update({
        sourceTextPreview: textPreview,
      });

      // STEP 4: Chiama Gemini API
      console.log('🤖 Analisi con Gemini API...');
      const geminiApiKey = process.env.GEMINI_API_KEY;

      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY non configurata nelle environment variables');
      }

      const analysisResult = await analyzePayslipWithGemini(
        geminiApiKey,
        year,
        month,
        extractedText,
        extractionWarnings
      );

      console.log(`✅ Analisi completata. Confidence: ${analysisResult.confidence}`);
      if (analysisResult.warnings.length > 0) {
        console.log(`⚠️  Warnings: ${analysisResult.warnings.join(', ')}`);
      }

      // STEP 5: Salva analysis/result
      const analysisDoc: AnalysisResult = {
        extracted: analysisResult.extracted,
        rawModelOutput: analysisResult.rawModelOutput,
        confidence: analysisResult.confidence,
        warnings: analysisResult.warnings,
        createdAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      };

      await payslipRef.collection('analysis').doc('result').set(analysisDoc);
      console.log('✅ Analysis salvata');

      // STEP 6: Upsert documento mensile
      console.log('💾 Upsert documento mensile...');
      await upsertMonthlyData(db, userId, analysisResult.extracted, payslipId);

      // STEP 7: Imposta status = done
      await payslipRef.update({
        status: 'done',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Elaborazione completata con successo: ${payslipId}`);

    } catch (error: any) {
      console.error(`❌ Errore durante elaborazione ${payslipId}:`, error);

      // Salva errore nel documento
      await payslipRef.update({
        status: 'error',
        errorMessage: error.message || 'Unknown error',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Se l'errore è JSON invalid da Gemini, prova a salvare rawModelOutput
      if (error.message?.includes('Invalid JSON from Gemini')) {
        const match = error.message.match(/Raw output: (.+)$/);
        if (match) {
          await payslipRef.collection('analysis').doc('result').set({
            rawModelOutput: match[1],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }

      throw error;
    }
  }
);
