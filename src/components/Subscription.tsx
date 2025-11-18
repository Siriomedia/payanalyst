import React, { useEffect } from "react";
import { User, Plan } from "../types.ts";
import { PLANS, CREDIT_COSTS } from "../config/plans.ts";
import { CheckIcon } from "./common/Icons.tsx";

interface SubscriptionProps {
    user: User;
    onPlanChange: (plan: Plan) => void;      // CAMBIA piano DOPO PAGAMENTO
    onAddCredits: (credits: number) => void; // AGGIUNGE crediti DOPO PAGAMENTO
}

const PLAN_PRICES: Record<Plan, string> = {
    free: "0.00",
    basic: "0.99",
    medium: "1.99",
    premium: "2.99",
    professional: "5.99",
};

const Subscription: React.FC<SubscriptionProps> = ({ user, onPlanChange, onAddCredits }) => {

    useEffect(() => {
        if (!window.paypal) return;

        (Object.keys(PLANS) as Plan[]).forEach((planKey) => {

            if (planKey === "free") return; // Nessun pagamento

            const containerId = `paypal-btn-plan-${planKey}`;
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = ""; // evitiamo doppi render

            window.paypal
                .Buttons({
                    style: {
                        layout: "vertical",
                        color: "blue",
                        shape: "pill",
                        label: "pay",
                    },

                    createOrder: (data: any, actions: any) => {
                        return actions.order.create({
                            purchase_units: [
                                {
                                    description: `Acquisto piano: ${PLANS[planKey].name}`,
                                    amount: { value: PLAN_PRICES[planKey] },
                                },
                            ],
                        });
                    },

                    onApprove: async (data: any, actions: any) => {
                        const orderDetails = await actions.order.capture();

                        console.log('Pagamento completato:', orderDetails);

                        const creditsToAdd = PLANS[planKey].credits;

                        // Aggiunge crediti al saldo esistente
                        onAddCredits(creditsToAdd);

                        // Aggiorna piano utente (per tracking)
                        onPlanChange(planKey);

                        alert(
                            `✅ Pagamento completato con successo! 
                            
Pacchetto: ${PLANS[planKey].name}
Crediti aggiunti: ${creditsToAdd}
Nuovo saldo: ${user.credits + creditsToAdd} crediti

Grazie per il tuo acquisto!`
                        );
                    },

                    onError: (err: any) => {
                        console.error("PayPal Error", err);
                        alert("Errore durante il pagamento PayPal.");
                    },
                })
                .render(`#${containerId}`);
        });
    }, [onPlanChange, onAddCredits]);

    return (
        <div>
            {/* --- TITOLO --- */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-800">Pacchetti Ricarica Crediti</h1>
                <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                    Acquista pacchetti di crediti che si aggiungono al tuo saldo attuale. Nessun abbonamento, nessun rinnovo automatico.
                </p>
            </div>

            {/* --- PIANI --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(Object.keys(PLANS) as Plan[]).map((planKey) => {
                    const plan = PLANS[planKey];
                    const isCurrentPlan = user.plan === planKey;

                    return (
                        <div
                            key={plan.name}
                            className={`border-2 ${
                                planKey === 'professional' ? 'border-blue-500 bg-blue-50' : "border-gray-200"
                            } rounded-xl shadow-lg p-8 flex flex-col relative`}
                        >
                            {planKey === 'professional' && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                    Più conveniente
                                </div>
                            )}
                            <h2
                                className={`text-2xl font-bold ${
                                    planKey === 'professional' ? "text-blue-600" : "text-gray-800"
                                }`}
                            >
                                {plan.name}
                            </h2>

                            <p className="text-gray-500 mt-2 flex-grow">{plan.description}</p>

                            <div className="my-8">
                                <span className="text-5xl font-extrabold">
                                    €{PLAN_PRICES[planKey]}
                                </span>
                            </div>

                            <ul className="space-y-3 text-gray-600 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {planKey === "free" ? (
                                <div className="w-full mt-auto py-3 px-6 text-center font-medium text-gray-600 bg-gray-100 rounded-lg">
                                    <div className="text-sm">Saldo attuale:</div>
                                    <div className="text-2xl font-bold text-blue-600">{user.credits} crediti</div>
                                </div>
                            ) : (
                                <>
                                    <div id={`paypal-btn-plan-${planKey}`} className="mt-4"></div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* --- NOTA --- */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12 max-w-3xl mx-auto">
                <h3 className="font-bold text-gray-800 mb-2">ℹ️ Come funzionano i crediti</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• I crediti acquistati si <strong>aggiungono</strong> al tuo saldo attuale</li>
                    <li>• Non scadono e non si rinnovano automaticamente</li>
                    <li>• Puoi acquistare più pacchetti quando vuoi</li>
                    <li>• Pagamento sicuro tramite PayPal</li>
                </ul>
            </div>
        </div>
    );
};

export default Subscription;
