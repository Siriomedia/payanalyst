import { getUserMonthlyData, getUserPayslipsForArchive, calculateUserStatistics, MonthlyData, PayslipData } from './payslipService';

export type { MonthlyData, PayslipData };

export async function getUserPayslips(userId: string, limitCount?: number): Promise<PayslipData[]> {
  return getUserPayslipsForArchive(userId, limitCount);
}

export { getUserMonthlyData, calculateUserStatistics };

export async function buildUserDatabaseContext(userId: string): Promise<string> {
  try {
    const monthlyData = await getUserMonthlyData(userId);
    const payslips = await getUserPayslipsForArchive(userId, 12);

    if (monthlyData.length === 0 && payslips.length === 0) {
      return "CONTESTO DATABASE: Nessuna busta paga elaborata disponibile per questo utente.";
    }

    let context = "=== CONTESTO DATABASE UTENTE ===\n\n";

    if (monthlyData.length > 0) {
      context += "DATI MENSILI AGGREGATI:\n";
      monthlyData.forEach(data => {
        context += `\n[${data.year}-${data.month.toString().padStart(2, '0')}]:\n`;
        context += `  Netto in busta: €${data.netSalary?.toFixed(2) ?? 'N/D'}\n`;
        context += `  Lordo: €${data.grossSalary?.toFixed(2) ?? 'N/D'}\n`;
        context += `  Ferie residue: ${data.items?.leaveData?.vacation?.balance ?? 'N/D'}\n`;
        context += `  Permessi residui: ${data.items?.leaveData?.permits?.balance ?? 'N/D'}\n`;
        context += `  TFR progressivo: €${data.items?.tfr?.totalFund?.toFixed(2) ?? 'N/D'}\n`;
      });
    }

    if (payslips.length > 0) {
      context += `\n\nBUSTE PAGA ELABORATE (ultime ${payslips.length}):\n`;
      payslips.forEach(payslip => {
        context += `\n- ${payslip.year}-${payslip.month.toString().padStart(2, '0')}\n`;
        context += `  Netto: €${payslip.netSalary?.toFixed(2) ?? 'N/D'}\n`;
      });
    }

    context += "\n=== FINE CONTESTO DATABASE ===\n";

    return context;
  } catch (error) {
    console.error('Errore costruzione contesto database:', error);
    return "CONTESTO DATABASE: Errore nel recupero dati dal database.";
  }
}
