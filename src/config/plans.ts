import { Plan } from '../types.ts';

export const PLANS: Record<Plan, { name: string; price: number; credits: number; features: string[], description: string; accentColor: string }> = {
  free: {
    name: 'Free',
    price: 0,
    credits: 10,
    description: 'Ideale per testare l\'app e per curiosità.',
    accentColor: 'border-gray-300',
    features: [
        '10 crediti/mese', 
        'Tutte le funzionalità abilitate',
        'Esempio: 1 analisi + 5 domande', 
        'Scadenza mensile'
    ]
  },
  basic: {
    name: 'Basic',
    price: 0.99,
    credits: 20,
    description: 'Per chi usa l\'app in modo saltuario ma vuole risultati completi.',
    accentColor: 'border-blue-500',
    features: [
        '20 crediti/mese', 
        'Tutte le funzionalità abilitate',
        'Esempio: 1 analisi storica completa',
        'Rinnovo mensile'
    ]
  },
  medium: {
    name: 'Medium',
    price: 1.99,
    credits: 50,
    description: 'Per liberi professionisti o utenti che fanno 2-3 analisi al mese.',
    accentColor: 'border-purple-500',
    features: [
        '50 crediti/mese', 
        'Tutte le funzionalità abilitate',
        'Esempio: 2 analisi storiche + 1 confronto',
        'Rinnovo mensile'
    ]
  },
  premium: {
    name: 'Premium',
    price: 2.99,
    credits: 70,
    description: 'Perfetto per un uso regolare e per chi gestisce più buste paga.',
    accentColor: 'border-orange-500',
    features: [
        '70 crediti/mese', 
        'Tutte le funzionalità abilitate',
        'Esempio: 3 analisi storiche + 1 confronto',
        'Rinnovo mensile'
    ]
  },
  professional: {
    name: 'Professional',
    price: 5.99,
    credits: 150,
    description: 'Per consulenti, responsabili HR e uso quotidiano intensivo.',
    accentColor: 'border-red-500',
    features: [
        '150 crediti/mese', 
        'Tutte le funzionalità abilitate',
        'Esempio: 5 analisi storiche + 5 confronti',
        'Ricariche sempre disponibili'
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