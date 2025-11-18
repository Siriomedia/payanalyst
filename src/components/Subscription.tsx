import React from 'react';
import { User, Plan } from '../types.ts';
import { PLANS, CREDIT_COSTS } from '../config/plans.ts';
import { CheckIcon } from './common/Icons.tsx';

interface SubscriptionProps {
    user: User;
    onPlanChange: (plan: Plan) => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ user, onPlanChange }) => {
    
    return (
        <div>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-800">Scegli il piano adatto a te</h1>
                <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                    Sblocca tutto il potenziale di GioIA con un piano a pagamento o continua con il piano Free per le funzionalità di base.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(Object.keys(PLANS) as Plan[]).map(planKey => {
                    const plan = PLANS[planKey];
                    const isCurrentPlan = user.plan === planKey;
                    
                    return (
                        <div key={plan.name} className={`border-2 ${isCurrentPlan ? plan.accentColor : 'border-gray-200'} rounded-xl shadow-lg p-8 flex flex-col`}>
                            <h2 className={`text-2xl font-bold ${isCurrentPlan ? 'text-blue-600' : 'text-gray-800'}`}>{plan.name}</h2>
                            <p className="text-gray-500 mt-2 flex-grow">{plan.description}</p>
                            
                            <div className="my-8">
                                <span className="text-5xl font-extrabold">€{plan.price}</span>
                                <span className="text-gray-500">/mese</span>
                            </div>

                            <ul className="space-y-3 text-gray-600 mb-8">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => onPlanChange(planKey)}
                                disabled={isCurrentPlan}
                                className={`w-full mt-auto py-3 px-6 font-bold rounded-lg transition-colors ${
                                    isCurrentPlan 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isCurrentPlan ? 'Piano Attuale' : 'Scegli Piano'}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
                Come vengono usati i crediti?
              </h2>
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 font-semibold text-gray-600">Funzionalità</th>
                          <th className="p-4 font-semibold text-gray-600 text-right">Costo in Crediti</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                        <tr>
                          <td className="p-4">Analisi Busta Paga (Upload)</td>
                          <td className="p-4 text-right font-mono font-semibold">{CREDIT_COSTS.PAYSLIP_ANALYSIS}</td>
                        </tr>
                        <tr>
                          <td className="p-4">Assistente AI: Domanda senza allegato</td>
                          <td className="p-4 text-right font-mono font-semibold">{CREDIT_COSTS.ASSISTANT_SIMPLE}</td>
                        </tr>
                        <tr>
                          <td className="p-4">Assistente AI: Domanda con allegato</td>
                          <td className="p-4 text-right font-mono font-semibold">{CREDIT_COSTS.ASSISTANT_COMPLEX}</td>
                        </tr>
                        <tr>
                          <td className="p-4">Confronto tra 2 Buste Paga</td>
                          <td className="p-4 text-right font-mono font-semibold">{CREDIT_COSTS.COMPARISON_ANALYSIS}</td>
                        </tr>
                         <tr>
                          <td className="p-4">Analisi Storica (Confronto con mesi precedenti)</td>
                          <td className="p-4 text-right font-mono font-semibold">{CREDIT_COSTS.HISTORICAL_ANALYSIS}</td>
                        </tr>
                        <tr>
                          <td className="p-4">Esportazione Report in PDF</td>
                          <td className="p-4 text-right font-mono font-semibold">{CREDIT_COSTS.PDF_EXPORT}</td>
                        </tr>
                      </tbody>
                    </table>
                </div>
              </div>
            </div>

        </div>
    );
};

export default Subscription;
