import { supabase } from '../supabase.ts';
import { Payslip } from '../types.ts';

export interface PayslipDatabase {
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

export const savePayslipToDatabase = async (
  userId: string,
  payslip: Payslip
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('payslips')
      .insert({
        id: payslip.id,
        user_id: userId,
        period_month: payslip.period.month,
        period_year: payslip.period.year,
        employee_first_name: payslip.employee.firstName,
        employee_last_name: payslip.employee.lastName,
        company_name: payslip.company.name,
        net_salary: payslip.netSalary,
        gross_salary: payslip.grossSalary,
        total_deductions: payslip.totalDeductions,
        data: payslip as any,
      });

    if (error) {
      console.error('Errore nel salvataggio della busta paga:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nel salvataggio della busta paga:', error);
    return { success: false, error: String(error) };
  }
};

export const getUserPayslips = async (
  userId: string
): Promise<{ payslips: Payslip[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .eq('user_id', userId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (error) {
      console.error('Errore nel recupero delle buste paga:', error);
      return { payslips: [], error: error.message };
    }

    const payslips: Payslip[] = (data || []).map((row: any) => row.data as Payslip);
    return { payslips };
  } catch (error) {
    console.error('Errore nel recupero delle buste paga:', error);
    return { payslips: [], error: String(error) };
  }
};

export const deletePayslipFromDatabase = async (
  payslipId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('payslips')
      .delete()
      .eq('id', payslipId);

    if (error) {
      console.error('Errore nella cancellazione della busta paga:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nella cancellazione della busta paga:', error);
    return { success: false, error: String(error) };
  }
};

export const updatePayslipInDatabase = async (
  payslipId: string,
  payslip: Payslip
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('payslips')
      .update({
        period_month: payslip.period.month,
        period_year: payslip.period.year,
        employee_first_name: payslip.employee.firstName,
        employee_last_name: payslip.employee.lastName,
        company_name: payslip.company.name,
        net_salary: payslip.netSalary,
        gross_salary: payslip.grossSalary,
        total_deductions: payslip.totalDeductions,
        data: payslip as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payslipId);

    if (error) {
      console.error('Errore nell\'aggiornamento della busta paga:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nell\'aggiornamento della busta paga:', error);
    return { success: false, error: String(error) };
  }
};

export const migrateLocalPayslipsToDatabase = async (
  userId: string,
  localPayslips: Payslip[]
): Promise<{ success: boolean; migrated: number; error?: string }> => {
  try {
    let migrated = 0;

    for (const payslip of localPayslips) {
      const result = await savePayslipToDatabase(userId, payslip);
      if (result.success) {
        migrated++;
      }
    }

    return { success: true, migrated };
  } catch (error) {
    console.error('Errore nella migrazione delle buste paga:', error);
    return { success: false, migrated: 0, error: String(error) };
  }
};
