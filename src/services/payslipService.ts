import { supabase } from '../supabase';
import { Payslip } from '../types';

export interface PayslipRecord {
    id: string;
    user_id: string;
    period_month: number;
    period_year: number;
    employee_first_name: string;
    employee_last_name: string;
    company_name: string;
    net_salary: number;
    gross_salary: number;
    total_deductions: number;
    data: Payslip;
    created_at: string;
    updated_at: string;
}

export const savePayslip = async (userId: string, payslip: Payslip): Promise<void> => {
    const { error } = await supabase
        .from('payslips')
        .insert({
            user_id: userId,
            period_month: payslip.period.month,
            period_year: payslip.period.year,
            employee_first_name: payslip.employee.firstName,
            employee_last_name: payslip.employee.lastName,
            company_name: payslip.company.name,
            net_salary: payslip.netSalary,
            gross_salary: payslip.grossSalary,
            total_deductions: payslip.totalDeductions,
            data: payslip
        });

    if (error) {
        console.error('Error saving payslip:', error);
        throw new Error('Impossibile salvare la busta paga nel database');
    }
};

export const getUserPayslips = async (userId: string): Promise<Payslip[]> => {
    const { data, error } = await supabase
        .from('payslips')
        .select('data')
        .eq('user_id', userId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    if (error) {
        console.error('Error fetching payslips:', error);
        throw new Error('Impossibile recuperare le buste paga dal database');
    }

    return (data || []).map(record => record.data as Payslip);
};

export const deletePayslip = async (userId: string, payslipId: string): Promise<void> => {
    const { error } = await supabase
        .from('payslips')
        .delete()
        .eq('user_id', userId)
        .eq('data->id', payslipId);

    if (error) {
        console.error('Error deleting payslip:', error);
        throw new Error('Impossibile eliminare la busta paga dal database');
    }
};

export const exportPayslipsToCSV = async (userId: string): Promise<string> => {
    const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('user_id', userId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    if (error) {
        console.error('Error fetching payslips for CSV:', error);
        throw new Error('Impossibile recuperare le buste paga per export CSV');
    }

    if (!data || data.length === 0) {
        throw new Error('Nessuna busta paga da esportare');
    }

    const headers = [
        'Anno',
        'Mese',
        'Nome',
        'Cognome',
        'Azienda',
        'Retribuzione Lorda',
        'Totale Trattenute',
        'Netto in Busta',
        'Imponibile Fiscale',
        'Imposta Netta',
        'Imponibile Previdenziale',
        'Contributi Dipendente',
        'TFR Maturato',
        'Fondo TFR Totale',
        'Ferie Residuo (ore)',
        'Permessi Residuo (ore)',
        'Data Creazione'
    ];

    const rows = data.map((record: any) => {
        const payslip = record.data as Payslip;
        return [
            payslip.period.year,
            payslip.period.month,
            payslip.employee.firstName,
            payslip.employee.lastName,
            payslip.company.name,
            payslip.grossSalary.toFixed(2),
            payslip.totalDeductions.toFixed(2),
            payslip.netSalary.toFixed(2),
            payslip.taxData.taxableBase.toFixed(2),
            payslip.taxData.netTax.toFixed(2),
            payslip.socialSecurityData.taxableBase.toFixed(2),
            payslip.socialSecurityData.employeeContribution.toFixed(2),
            payslip.tfr.accrued.toFixed(2),
            payslip.tfr.totalFund.toFixed(2),
            payslip.leaveData.vacation.balance.toFixed(2),
            payslip.leaveData.permits.balance.toFixed(2),
            new Date(record.created_at).toLocaleDateString('it-IT')
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string = 'buste_paga.csv'): void => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

export interface PayslipData {
    id: string;
    userId: string;
    year: number;
    month: number;
    netSalary: number;
    grossSalary: number;
    totalDeductions: number;
    createdAt: string;
    updatedAt: string;
}

export interface MonthlyData {
    id: string;
    userId: string;
    year: number;
    month: number;
    netSalary: number;
    grossSalary: number;
    totalDeductions: number;
    items: any;
    updatedAt: string;
}

export async function getUserPayslipsForArchive(userId: string, limitCount?: number): Promise<PayslipData[]> {
    let query = supabase
        .from('payslips')
        .select('*')
        .eq('user_id', userId)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    if (limitCount) {
        query = query.limit(limitCount);
    }

    const { data, error } = await query;

    if (error) {
        console.error('❌ Errore caricamento buste paga:', error);
        throw error;
    }

    return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        year: row.period_year,
        month: row.period_month,
        netSalary: Number(row.net_salary),
        grossSalary: Number(row.gross_salary),
        totalDeductions: Number(row.total_deductions),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}

export async function getUserMonthlyData(userId: string): Promise<MonthlyData[]> {
    const { data, error } = await supabase
        .from('monthly_data')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

    if (error) {
        console.error('❌ Errore caricamento dati mensili:', error);
        throw error;
    }

    return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        year: row.year,
        month: row.month,
        netSalary: Number(row.net_salary),
        grossSalary: Number(row.gross_salary),
        totalDeductions: Number(row.total_deductions),
        items: row.items,
        updatedAt: row.updated_at
    }));
}

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
            .filter(d => d.netSalary > 0)
            .map(d => d.netSalary);

        const averageSalary = salaries.length > 0
            ? salaries.reduce((sum, val) => sum + val, 0) / salaries.length
            : null;

        const latestData = monthlyData[0];
        const latestItems = latestData?.items || {};
        const leaveData = latestItems.leaveData || {};

        return {
            totalPayslips: monthlyData.length,
            averageSalary,
            totalLeaveAccrued: leaveData.vacation?.accrued ?? null,
            totalLeaveUsed: leaveData.vacation?.used ?? null,
            totalLeaveRemaining: leaveData.vacation?.balance ?? null,
            tfr: latestItems.tfr?.totalFund ?? null,
        };
    } catch (error) {
        console.error('❌ Errore calcolo statistiche:', error);
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

export async function importCSVToDatabase(userId: string, csvContent: string): Promise<{ success: number; errors: string[] }> {
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('CSV vuoto o non valido');
    }

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = parseCSVLine(lines[0]);
    const results = { success: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);

            const parseNumber = (val: string): number => {
                if (!val || val === 'N/D') return 0;
                return parseFloat(val.replace(',', '.')) || 0;
            };

            const year = parseInt(values[0]) || 0;
            const month = parseInt(values[1]) || 0;
            const grossSalary = parseNumber(values[5]);
            const totalDeductions = parseNumber(values[6]);
            const netSalary = parseNumber(values[7]);
            const tfrAccrued = parseNumber(values[12]);
            const tfrTotal = parseNumber(values[13]);
            const vacationAccrued = parseNumber(values[14]);
            const vacationTaken = parseNumber(values[15]);
            const vacationBalance = parseNumber(values[16]);
            const permitsAccrued = parseNumber(values[17]);
            const permitsTaken = parseNumber(values[18]);
            const permitsBalance = parseNumber(values[19]);
            const sickLeave = parseNumber(values[20]);
            const exHolidays = parseNumber(values[21]);

            const items = {
                leaveData: {
                    vacation: {
                        accrued: vacationAccrued,
                        used: vacationTaken,
                        balance: vacationBalance
                    },
                    permits: {
                        accrued: permitsAccrued,
                        used: permitsTaken,
                        balance: permitsBalance
                    },
                    sickLeave: sickLeave,
                    exHolidays: exHolidays
                },
                tfr: {
                    accrued: tfrAccrued,
                    totalFund: tfrTotal
                }
            };

            const { data: existing } = await supabase
                .from('monthly_data')
                .select('id')
                .eq('user_id', userId)
                .eq('year', year)
                .eq('month', month)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from('monthly_data')
                    .update({
                        net_salary: netSalary,
                        gross_salary: grossSalary,
                        total_deductions: totalDeductions,
                        items: items,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('monthly_data')
                    .insert({
                        user_id: userId,
                        year: year,
                        month: month,
                        net_salary: netSalary,
                        gross_salary: grossSalary,
                        total_deductions: totalDeductions,
                        items: items
                    });

                if (error) throw error;
            }

            results.success++;
        } catch (error) {
            console.error(`❌ Errore riga ${i + 1}:`, error);
            results.errors.push(`Riga ${i + 1}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }
    }

    return results;
}
