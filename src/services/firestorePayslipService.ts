import { supabase } from '../supabase.ts';
import { Payslip } from '../types.ts';
import { firebaseUidToUuid } from '../utils/uuidHelpers.ts';

export async function savePayslipToDatabase(userId: string, payslip: Payslip): Promise<void> {
    const supabaseUserId = firebaseUidToUuid(userId);
    try {
        console.log('💾 Salvando busta paga in Supabase...');
        console.log('   - Firebase UID:', userId);
        console.log('   - Supabase UUID:', supabaseUserId);
        console.log('   - Periodo:', `${payslip.month}/${payslip.year}`);

        const { data: existingPayslip, error: checkError } = await supabase
            .from('payslips')
            .select('id')
            .eq('user_id', supabaseUserId)
            .eq('period_month', payslip.month)
            .eq('period_year', payslip.year)
            .maybeSingle();

        if (checkError) {
            console.error('❌ Errore verificando buste paga esistenti:', checkError);
            throw checkError;
        }

        const payslipData = {
            user_id: supabaseUserId,
            period_month: payslip.month,
            period_year: payslip.year,
            employee_first_name: payslip.employeeInfo?.firstName || '',
            employee_last_name: payslip.employeeInfo?.lastName || '',
            company_name: payslip.employerInfo?.companyName || '',
            net_salary: payslip.netSalary,
            gross_salary: payslip.grossSalary,
            total_deductions: payslip.totalDeductions,
            data: payslip
        };

        if (existingPayslip) {
            console.log('📝 Aggiornando busta paga esistente...');
            const { error: updateError } = await supabase
                .from('payslips')
                .update({ ...payslipData, updated_at: new Date().toISOString() })
                .eq('id', existingPayslip.id);

            if (updateError) {
                console.error('❌ Errore aggiornando busta paga:', updateError);
                throw updateError;
            }
            console.log('✅ Busta paga aggiornata');
        } else {
            console.log('➕ Inserendo nuova busta paga...');
            const { error: insertError } = await supabase
                .from('payslips')
                .insert(payslipData);

            if (insertError) {
                console.error('❌ Errore inserendo busta paga:', insertError);
                throw insertError;
            }
            console.log('✅ Busta paga inserita');
        }

        const { data: existingMonthly, error: monthlyCheckError } = await supabase
            .from('monthly_data')
            .select('id')
            .eq('user_id', supabaseUserId)
            .eq('month', payslip.month)
            .eq('year', payslip.year)
            .maybeSingle();

        if (monthlyCheckError) {
            console.error('❌ Errore verificando dati mensili:', monthlyCheckError);
            throw monthlyCheckError;
        }

        const monthlyData = {
            user_id: supabaseUserId,
            month: payslip.month,
            year: payslip.year,
            net_salary: payslip.netSalary,
            gross_salary: payslip.grossSalary,
            total_deductions: payslip.totalDeductions,
            items: {
                incomeItems: payslip.incomeItems || [],
                deductionItems: payslip.deductionItems || [],
                leaveData: payslip.leaveData || null,
                tfr: payslip.tfr || null
            }
        };

        if (existingMonthly) {
            console.log('📝 Aggiornando dati mensili esistenti...');
            const { error: updateMonthlyError } = await supabase
                .from('monthly_data')
                .update({ ...monthlyData, updated_at: new Date().toISOString() })
                .eq('id', existingMonthly.id);

            if (updateMonthlyError) {
                console.error('❌ Errore aggiornando dati mensili:', updateMonthlyError);
                throw updateMonthlyError;
            }
            console.log('✅ Dati mensili aggiornati');
        } else {
            console.log('➕ Inserendo nuovi dati mensili...');
            const { error: insertMonthlyError } = await supabase
                .from('monthly_data')
                .insert(monthlyData);

            if (insertMonthlyError) {
                console.error('❌ Errore inserendo dati mensili:', insertMonthlyError);
                throw insertMonthlyError;
            }
            console.log('✅ Dati mensili inseriti');
        }

        console.log('🎉 Busta paga salvata con successo nel Database Storico!');
    } catch (error) {
        console.error('❌ Errore salvando busta paga:', error);
        throw error;
    }
}
