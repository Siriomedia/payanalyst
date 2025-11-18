import React from 'react';

interface UpgradeModalProps {
    onClose: () => void;
    onUpgrade: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, onUpgrade }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md text-center">
                <h2 id="upgrade-title" className="text-2xl font-bold mb-4 text-gray-800">Crediti Esauriti</h2>
                <p className="text-gray-600 mb-6">
                    Hai terminato i crediti disponibili per questo mese. Per continuare a utilizzare questa funzionalità, esegui l'upgrade del tuo piano.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Più Tardi
                    </button>
                    <button
                        onClick={onUpgrade}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        Vedi Piani
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;