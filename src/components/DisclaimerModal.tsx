import React from 'react';

interface DisclaimerModalProps {
    onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg text-gray-800">
                <h2 id="disclaimer-title" className="text-2xl font-bold mb-4 text-center">Avviso Importante e Termini di Utilizzo</h2>
                <div className="text-sm text-gray-600 max-h-[50vh] overflow-y-auto space-y-3 pr-2" tabIndex={0}>
                    <p>
                        Benvenuto in GioIA. Prima di procedere, ti preghiamo di leggere e accettare le seguenti condizioni.
                    </p>
                    <p>
                        <strong>1. Scopo Informativo:</strong> Le analisi e le risposte fornite da questa applicazione, generate tramite intelligenza artificiale (IA), sono da intendersi esclusivamente a scopo informativo e non costituiscono in alcun modo una consulenza legale, fiscale o professionale.
                    </p>
                    <p>
                        <strong>2. Accuratezza dei Dati:</strong> Le informazioni elaborate dall'IA si basano sui dati più recenti a sua disposizione. Tuttavia, tali dati potrebbero aver subito variazioni nel tempo o non essere completi. Non ci assumiamo alcuna responsabilità per eventuali inesattezze, omissioni o errori presenti nelle analisi.
                    </p>
                    <p>
                        <strong>3. Esclusione di Responsabilità:</strong> Decliniamo ogni responsabilità per decisioni o azioni intraprese sulla base delle informazioni ottenute tramite questa applicazione. L'utilizzo del servizio è a tuo completo rischio.
                    </p>
                    <p>
                        <strong>4. Consulenza Professionale:</strong> Per qualsiasi questione di natura legale, fiscale o contrattuale relativa alla tua busta paga o alla tua posizione lavorativa, è fondamentale e obbligatorio rivolgersi a un professionista qualificato, come un <strong>Consulente del Lavoro</strong>, un <strong>CAF</strong> o i propri <strong>sindacati</strong> di riferimento.
                    </p>
                </div>
                <div className="mt-6 text-center">
                    <button
                        onClick={onAccept}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                        Accetto e Continua
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisclaimerModal;
