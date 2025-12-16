import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy, limit as limitQuery } from 'firebase/firestore';

export interface PayslipData {
  id: string;
  userId: string;
  year: number;
  month: number;
  status: string;
  createdAt: any;
  updatedAt: any;
  errorMessage?: string;
  sourceTextPreview?: string;
}

export interface AnalysisData {
  extracted: {
    year: number;
    month: number;
    paga_base: number | null;
    ferie: {
      maturate: number | null;
      godute: number | null;
      residue: number | null;
    };
    permessi: {
      maturati: number | null;
      goduti: number | null;
      residui: number | null;
    };
    rol: {
      maturati: number | null;
      goduti: number | null;
      residui: number | null;
    };
    tfr: {
      quota_mese: number | null;
      progressivo: number | null;
    };
    malattia: {
      giorni: number | null;
      ore: number | null;
      trattenute: number | null;
    };
    confidence: number;
    warnings: string[];
  };
  rawModelOutput: string;
  confidence: number;
  warnings: string[];
  createdAt: any;
}

export interface MonthlyData {
  id: string;
  year: number;
  month: number;
  paga_base: number | null;
  ferie: {
    maturate: number | null;
    godute: number | null;
    residue: number | null;
  };
  permessi: {
    maturati: number | null;
    goduti: number | null;
    residui: number | null;
  };
  rol: {
    maturati: number | null;
    goduti: number | null;
    residui: number | null;
  };
  tfr: {
    quota_mese: number | null;
    progressivo: number | null;
  };
  malattia: {
    giorni: number | null;
    ore: number | null;
    trattenute: number | null;
  };
  sourcePayslipId: string;
  updatedAt: any;
}

/**
 * Recupera tutte le buste paga elaborate di un utente
 */
export async function getUserPayslips(userId: string, limitCount?: number): Promise<PayslipData[]> {
  const db = getFirestore();
  const payslipsRef = collection(db, 'payslips');

  let q = query(
    payslipsRef,
    where('userId', '==', userId),
    where('status', '==', 'done'),
    orderBy('year', 'desc'),
    orderBy('month', 'desc')
  );

  if (limitCount) {
    q = query(q, limitQuery(limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PayslipData));
}

/**
 * Recupera l'analisi di una specifica busta paga
 */
export async function getPayslipAnalysis(payslipId: string): Promise<AnalysisData | null> {
  const db = getFirestore();
  const analysisRef = doc(db, 'payslips', payslipId, 'analysis', 'result');

  const snapshot = await getDoc(analysisRef);

  if (snapshot.exists()) {
    return snapshot.data() as AnalysisData;
  }

  return null;
}

/**
 * Recupera tutti i dati mensili aggregati di un utente
 */
export async function getUserMonthlyData(userId: string): Promise<MonthlyData[]> {
  const db = getFirestore();
  const monthlyRef = collection(db, 'users', userId, 'monthly');

  const snapshot = await getDocs(monthlyRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MonthlyData));
}

/**
 * Recupera un singolo documento mensile
 */
export async function getMonthlyDataForMonth(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyData | null> {
  const db = getFirestore();
  const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
  const monthlyRef = doc(db, 'users', userId, 'monthly', monthKey);

  const snapshot = await getDoc(monthlyRef);

  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as MonthlyData;
  }

  return null;
}

/**
 * Costruisce un contesto testuale completo da passare all'assistente AI
 */
export async function buildUserDatabaseContext(userId: string): Promise<string> {
  try {
    const monthlyData = await getUserMonthlyData(userId);
    const payslips = await getUserPayslips(userId, 12);

    if (monthlyData.length === 0 && payslips.length === 0) {
      return "CONTESTO DATABASE: Nessuna busta paga elaborata disponibile per questo utente.";
    }

    let context = "=== CONTESTO DATABASE UTENTE ===\n\n";

    if (monthlyData.length > 0) {
      context += "DATI MENSILI AGGREGATI:\n";
      monthlyData
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        })
        .forEach(data => {
          context += `\n[${data.year}-${data.month.toString().padStart(2, '0')}]:\n`;
          context += `  Paga base: €${data.paga_base?.toFixed(2) ?? 'N/D'}\n`;
          context += `  Ferie - Maturate: ${data.ferie.maturate ?? 'N/D'}, Godute: ${data.ferie.godute ?? 'N/D'}, Residue: ${data.ferie.residue ?? 'N/D'}\n`;
          context += `  Permessi - Maturati: ${data.permessi.maturati ?? 'N/D'}, Goduti: ${data.permessi.goduti ?? 'N/D'}, Residui: ${data.permessi.residui ?? 'N/D'}\n`;
          context += `  ROL - Maturati: ${data.rol.maturati ?? 'N/D'}, Goduti: ${data.rol.goduti ?? 'N/D'}, Residui: ${data.rol.residui ?? 'N/D'}\n`;
          context += `  TFR - Quota mese: €${data.tfr.quota_mese?.toFixed(2) ?? 'N/D'}, Progressivo: €${data.tfr.progressivo?.toFixed(2) ?? 'N/D'}\n`;
          if (data.malattia.giorni !== null || data.malattia.ore !== null) {
            context += `  Malattia - Giorni: ${data.malattia.giorni ?? 'N/D'}, Ore: ${data.malattia.ore ?? 'N/D'}, Trattenute: €${data.malattia.trattenute?.toFixed(2) ?? 'N/D'}\n`;
          }
        });
    }

    if (payslips.length > 0) {
      context += `\n\nBUSTE PAGA ELABORATE (ultime ${payslips.length}):\n`;
      payslips.forEach(payslip => {
        context += `\n- ${payslip.year}-${payslip.month.toString().padStart(2, '0')} (ID: ${payslip.id})\n`;
        context += `  Status: ${payslip.status}\n`;
        if (payslip.sourceTextPreview) {
          context += `  Preview: ${payslip.sourceTextPreview.substring(0, 200)}...\n`;
        }
      });
    }

    context += "\n=== FINE CONTESTO DATABASE ===\n";

    return context;
  } catch (error) {
    console.error('Errore costruzione contesto database:', error);
    return "CONTESTO DATABASE: Errore nel recupero dati dal database.";
  }
}

/**
 * Calcola statistiche aggregate per l'assistente
 */
export async function calculateUserStatistics(userId: string): Promise<{
  totalPayslips: number;
  averageSalary: number | null;
  totalLeaveAccrued: number | null;
  totalLeaveUsed: number | null;
  totalLeaveRemaining: number | null;
  tfr: number | null;
}> {
  try {
    const monthlyData = await getUserMonthlyData(userId);

    if (monthlyData.length === 0) {
      return {
        totalPayslips: 0,
        averageSalary: null,
        totalLeaveAccrued: null,
        totalLeaveUsed: null,
        totalLeaveRemaining: null,
        tfr: null,
      };
    }

    const salaries = monthlyData
      .filter(d => d.paga_base !== null)
      .map(d => d.paga_base as number);

    const averageSalary = salaries.length > 0
      ? salaries.reduce((sum, val) => sum + val, 0) / salaries.length
      : null;

    const latestData = monthlyData.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];

    return {
      totalPayslips: monthlyData.length,
      averageSalary,
      totalLeaveAccrued: latestData?.ferie.maturate ?? null,
      totalLeaveUsed: latestData?.ferie.godute ?? null,
      totalLeaveRemaining: latestData?.ferie.residue ?? null,
      tfr: latestData?.tfr.progressivo ?? null,
    };
  } catch (error) {
    console.error('Errore calcolo statistiche:', error);
    return {
      totalPayslips: 0,
      averageSalary: null,
      totalLeaveAccrued: null,
      totalLeaveUsed: null,
      totalLeaveRemaining: null,
      tfr: null,
    };
  }
}
