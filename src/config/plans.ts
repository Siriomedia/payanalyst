import { Plan } from '../types.ts';

export const PLANS: Record<Plan, { name: string; price: number; credits: number; features: string[], description: string; accentColor: string }> = {
  free: {
    name: 'Free',
    price: 0,
    credits: 10,
    description: 'Ideale per testare l\'app e per curiosità.',
    accentColor: 'border-gray-300',
    features: [
        '10 crediti alla registrazione', 
        'Esempio: 1 analisi + 5 domande all\'assistente',
        'Esempio: 2 analisi storiche',
        'I crediti non scadono'
    ]
  },
  basic: {
    name: 'Basic',
    price: 0.99,
    credits: 20,
    description: 'Per chi usa l\'app in modo saltuario ma vuole risultati completi.',
    accentColor: 'border-blue-500',
    features: [
        '20 crediti nel pacchetto', 
        'Esempio: 1 analisi storica completa',
        'Esempio: 4 analisi buste paga',
        'I crediti si aggiungono al saldo attuale'
    ]
  },
  medium: {
    name: 'Medium',
    price: 1.99,
    credits: 50,
    description: 'Per liberi professionisti o utenti che fanno 2-3 analisi al mese.',
    accentColor: 'border-purple-500',
    features: [
        '50 crediti nel pacchetto', 
        'Esempio: 2 analisi storiche + 1 confronto',
        'Esempio: 10 analisi buste paga',
        'I crediti si aggiungono al saldo attuale'
    ]
  },
  premium: {
    name: 'Premium',
    price: 2.99,
    credits: 70,
    description: 'Perfetto per un uso regolare e per chi gestisce più buste paga.',
    accentColor: 'border-orange-500',
    features: [
        '70 crediti nel pacchetto', 
        'Esempio: 3 analisi storiche + 1 confronto',
        'Esempio: 14 analisi buste paga',
        'I crediti si aggiungono al saldo attuale'
    ]
  },
  professional: {
    name: 'Professional',
    price: 5.99,
    credits: 150,
    description: 'Per consulenti, responsabili HR e uso quotidiano intensivo.',
    accentColor: 'border-red-500',
    features: [
        '150 crediti nel pacchetto', 
        'Esempio: 5 analisi storiche + 5 confronti',
        'Esempio: 30 analisi buste paga',
        'I crediti si aggiungono al saldo attuale'
    ]
  },
};

export const CREDIT_COSTS = {
    PAYSLIP_ANALYSIS: 5,
    ASSISTANT_SIMPLE: 1,
    ASSISTANT_COMPLEX: 2,
    COMPARISON_ANALYSIS: 10,
    HISTORICAL_ANALYSIS: 20,
    PDF_EXPORT: 1,
};