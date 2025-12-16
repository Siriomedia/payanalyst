import * as admin from 'firebase-admin';
import { GeminiOutput, MonthlyData } from '../types';

/**
 * Formatta year e month in chiave documento YYYY-MM
 */
export function formatMonthlyKey(year: number, month: number): string {
  const monthStr = month.toString().padStart(2, '0');
  return `${year}-${monthStr}`;
}

/**
 * Esegue upsert del documento mensile in users/{userId}/monthly/{YYYY-MM}
 * Se il documento esiste già, aggiorna i campi. Altrimenti lo crea.
 */
export async function upsertMonthlyData(
  db: admin.firestore.Firestore,
  userId: string,
  geminiOutput: GeminiOutput,
  sourcePayslipId: string
): Promise<void> {
  const { year, month } = geminiOutput;
  const monthlyKey = formatMonthlyKey(year, month);

  const monthlyRef = db
    .collection('users')
    .doc(userId)
    .collection('monthly')
    .doc(monthlyKey);

  const monthlyData: MonthlyData = {
    year,
    month,
    paga_base: geminiOutput.paga_base,
    ferie: geminiOutput.ferie,
    permessi: geminiOutput.permessi,
    rol: geminiOutput.rol,
    tfr: geminiOutput.tfr,
    malattia: geminiOutput.malattia,
    sourcePayslipId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
  };

  // Upsert: set con merge true
  await monthlyRef.set(monthlyData, { merge: true });

  console.log(`✅ Upsert completato per ${userId}/monthly/${monthlyKey}`);
}
