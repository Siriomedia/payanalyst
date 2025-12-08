import { supabase, CCNL, PayrollCode, PayrollCodeCategory, ContributionType, PayrollCodeWithCategory } from '../supabase';

export class PayrollReferenceService {
  static async getAllCCNL(): Promise<CCNL[]> {
    const { data, error } = await supabase
      .from('ccnl')
      .select('*')
      .order('name');

    if (error) {
      console.error('Errore caricamento CCNL:', error);
      return [];
    }

    return data || [];
  }

  static async getCCNLByCode(code: string): Promise<CCNL | null> {
    const { data, error } = await supabase
      .from('ccnl')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Errore caricamento CCNL:', error);
      return null;
    }

    return data;
  }

  static async getAllCategories(): Promise<PayrollCodeCategory[]> {
    const { data, error } = await supabase
      .from('payroll_code_categories')
      .select('*')
      .order('type, name');

    if (error) {
      console.error('Errore caricamento categorie:', error);
      return [];
    }

    return data || [];
  }

  static async getPayrollCodeByCode(code: string): Promise<PayrollCodeWithCategory | null> {
    const { data, error } = await supabase
      .from('payroll_codes')
      .select(`
        *,
        category:payroll_code_categories(*)
      `)
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Errore caricamento codice voce:', error);
      return null;
    }

    return data;
  }

  static async getAllPayrollCodes(): Promise<PayrollCodeWithCategory[]> {
    const { data, error } = await supabase
      .from('payroll_codes')
      .select(`
        *,
        category:payroll_code_categories(*)
      `)
      .order('code');

    if (error) {
      console.error('Errore caricamento codici voci:', error);
      return [];
    }

    return data || [];
  }

  static async getPayrollCodesByCategory(categoryType: string): Promise<PayrollCodeWithCategory[]> {
    const { data, error } = await supabase
      .from('payroll_codes')
      .select(`
        *,
        category:payroll_code_categories!inner(*)
      `)
      .eq('category.type', categoryType)
      .order('code');

    if (error) {
      console.error('Errore caricamento codici per categoria:', error);
      return [];
    }

    return data || [];
  }

  static async getContributionByCode(code: string): Promise<ContributionType | null> {
    const { data, error } = await supabase
      .from('contribution_types')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Errore caricamento contributo:', error);
      return null;
    }

    return data;
  }

  static async getAllContributions(): Promise<ContributionType[]> {
    const { data, error } = await supabase
      .from('contribution_types')
      .select('*')
      .order('entity, name');

    if (error) {
      console.error('Errore caricamento contributi:', error);
      return [];
    }

    return data || [];
  }

  static async getContributionsByEntity(entity: string): Promise<ContributionType[]> {
    const { data, error } = await supabase
      .from('contribution_types')
      .select('*')
      .eq('entity', entity)
      .order('name');

    if (error) {
      console.error('Errore caricamento contributi per ente:', error);
      return [];
    }

    return data || [];
  }

  static async searchPayrollCodes(searchTerm: string): Promise<PayrollCodeWithCategory[]> {
    const { data, error } = await supabase
      .from('payroll_codes')
      .select(`
        *,
        category:payroll_code_categories(*)
      `)
      .or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      .order('code')
      .limit(20);

    if (error) {
      console.error('Errore ricerca codici:', error);
      return [];
    }

    return data || [];
  }

  static formatPayrollCodeInfo(code: PayrollCodeWithCategory): string {
    const lines: string[] = [
      `**${code.code}** - ${code.name}`,
      ''
    ];

    if (code.category) {
      lines.push(`📂 Categoria: ${code.category.name} (${code.category.type})`);
    }

    if (code.unit) {
      lines.push(`📏 Unità: ${code.unit}`);
    }

    const impacts: string[] = [];
    if (code.affects_gross) impacts.push('Lordo');
    if (code.affects_net) impacts.push('Netto');
    if (code.affects_tfr) impacts.push('TFR');
    if (impacts.length > 0) {
      lines.push(`💰 Impatta: ${impacts.join(', ')}`);
    }

    if (code.is_deduction) {
      lines.push(`⬇️ Trattenuta`);
    } else {
      lines.push(`⬆️ Competenza`);
    }

    if (code.notes) {
      lines.push('');
      lines.push(`📝 ${code.notes}`);
    }

    return lines.join('\n');
  }

  static formatContributionInfo(contribution: ContributionType): string {
    const lines: string[] = [
      `**${contribution.name}**`,
      `🏛️ Ente: ${contribution.entity}`,
      ''
    ];

    if (contribution.rate_employee !== null) {
      lines.push(`👤 Quota dipendente: ${(contribution.rate_employee * 100).toFixed(3)}%`);
    }

    if (contribution.rate_employer !== null) {
      lines.push(`🏢 Quota azienda: ${(contribution.rate_employer * 100).toFixed(3)}%`);
    }

    if (contribution.calculation_base) {
      lines.push(`📊 Base calcolo: ${contribution.calculation_base}`);
    }

    if (contribution.notes) {
      lines.push('');
      lines.push(`📝 ${contribution.notes}`);
    }

    return lines.join('\n');
  }
}
