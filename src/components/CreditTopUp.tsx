import React, { useEffect } from "react";

interface CreditTopUpProps {
    onPurchase: (credits: number) => void;
}

const PACKS = [
    { id: "credit20", credits: 20, price: "0.99" },
    { id: "credit50", credits: 50, price: "1.99" },
    { id: "credit70", credits: 70, price: "2.99" },
    { id: "credit150", credits: 150, price: "5.99" }
];

const CreditTopUp: React.FC<CreditTopUpProps> = ({ onPurchase }) => {

    useEffect(() => {
        let wait = setInterval(() => {

            // Attendi PayPal caricata
            if (!window.paypal) return;
            clearInterval(wait);

            PACKS.forEach(pack => {
                const containerId = `paypal-button-${pack.id}`;
                const div = document.getElementById(containerId);

                if (!div) return;

                div.innerHTML = ""; // evita duplicati

                window.paypal.Buttons({
                    style: {
                        layout: "vertical",
                        color: "blue",
                        shape: "pill",
                        label: "pay"
                    },

                    createOrder: (data: any, actions: any) => {
                        return actions.order.create({
                            purchase_units: [
                                {
                                    description: `${pack.credits} crediti GioIA`,
                                    amount: { value: pack.price }
                                }
                            ]
                        });
                    },

                    onApprove: async (data: any, actions: any) => {
                        const details = await actions.order.capture();

                        // Controllo FERREO
                        if (!details || details.status !== "COMPLETED") {
                            alert("Il pagamento non è stato confermato.");
                            return;
                        }

                        // Aggiunge crediti SOLO dopo esito PayPal valido
                        onPurchase(pack.credits);

                        alert(
                            `Ricarica completata! Hai acquistato ${pack.credits} crediti.`
                        );
                    },

                    onError: (err: any) => {
                        console.error("PayPal Error", err);
                        alert("Errore durante il pagamento PayPal.");
                    }

                }).render(`#${containerId}`);
            });

        }, 300);

        return () => clearInterval(wait);
    }, [onPurchase]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {PACKS.map(pack => (
                <div
                    key={pack.id}
                    className="bg-white shadow-md rounded-xl p-6 border border-gray-200"
                >
                    <h3 className="text-xl font-bold text-gray-800">
                        {pack.credits} Crediti
                    </h3>
                    <p className="text-gray-600 mt-2">Ricarica immediata</p>

                    <div className="text-4xl font-extrabold text-blue-600 mt-4">
                        €{pack.price}
                    </div>

                    <div id={`paypal-button-${pack.id}`} className="mt-6"></div>
                </div>
            ))}
        </div>
    );
};

export default CreditTopUp;
