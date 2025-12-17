import React, { useState } from 'react';
import { Payslip } from '../types.ts';
import { EuroIcon, TrashIcon } from './common/Icons.tsx';

interface ArchiveProps {
    payslips: Payslip[];
    onSelectPayslip: (payslip: Payslip) => void;
    onCompare: (payslips: Payslip[]) => void;
    onDeletePayslip: (payslipId: string) => void;
}

const Archive: React.FC<ArchiveProps> = ({ payslips, onSelectPayslip, onCompare, onDeletePayslip }) => {
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

    // Debug: controlla ID duplicati
    React.useEffect(() => {
        const ids = payslips.map(p => p.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            console.error('⚠️ ID DUPLICATI TROVATI!', ids);
        }
    }, [payslips]);

    const toggleCompareSelection = (payslipId: string) => {
        setSelectedForCompare(prev => {
            if (prev.includes(payslipId)) {
                return prev.filter(id => id !== payslipId);
            }
            if (prev.length < 12) {
                return [...prev, payslipId];
            }
            return prev;
        });
    };

    const handleCompareClick = () => {
        if (selectedForCompare.length >= 2) {
            const payslipsToCompare = payslips.filter(p => selectedForCompare.includes(p.id));
            if (payslipsToCompare.length >= 2) {
                const sorted = [...payslipsToCompare].sort((a, b) => {
                    const dateA = new Date(a.period.year, a.period.month - 1);
                    const dateB = new Date(b.period.year, b.period.month - 1);
                    return dateB.getTime() - dateA.getTime();
                });
                onCompare(sorted);
            }
        }
    };
    
    const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'long' });

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Archivio Buste Paga</h1>
                {selectedForCompare.length >= 2 ? (
                    <button
                        type="button"
                        onClick={handleCompareClick}
                        className="px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold rounded-lg shadow-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors whitespace-nowrap"
                    >
                        <span className="hidden sm:inline">Confronta Selezionati ({selectedForCompare.length})</span>
                        <span className="sm:hidden">Confronta ({selectedForCompare.length})</span>
                    </button>
                ) : (
                    <span className="px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold rounded-lg shadow-md bg-gray-300 text-gray-500 whitespace-nowrap">
                        <span className="hidden sm:inline">Confronta Selezionati ({selectedForCompare.length}/12)</span>
                        <span className="sm:hidden">Confronta ({selectedForCompare.length}/12)</span>
                    </span>
                )}
            </div>
            
            {payslips.length === 0 ? (
                <p className="text-center text-sm sm:text-base text-gray-500 mt-6 sm:mt-8">Nessuna busta paga in archivio.</p>
            ) : (
                <>
                {selectedForCompare.length < 2 && (
                    <p className="text-sm text-gray-500 mb-3 italic">
                        Seleziona da 2 a 12 buste paga usando le caselle a sinistra per confrontarle
                    </p>
                )}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {payslips.map(p => (
                            <li key={p.id} className="p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-gray-50 transition-colors gap-3 md:gap-0">
                                <div className="flex items-start sm:items-center w-full md:w-auto">
                                    <input
                                        type="checkbox"
                                        id={`compare-${p.id}`}
                                        name={`compare-${p.id}`}
                                        aria-label={`Seleziona per confronto: ${getMonthName(p.period.month)} ${p.period.year}`}
                                        className="h-5 w-5 sm:h-6 sm:w-6 rounded border-2 border-gray-400 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 flex-shrink-0"
                                        checked={selectedForCompare.includes(p.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleCompareSelection(p.id);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="ml-3 sm:ml-4 flex-grow">
                                        <p className="font-bold text-base sm:text-lg text-gray-800 capitalize">
                                            {getMonthName(p.period.month)} {p.period.year}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500">{p.company.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-4 w-full md:w-auto justify-between md:justify-end">
                                     <div className="flex items-center text-green-600">
                                        <EuroIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                        <span className="font-semibold text-base sm:text-lg ml-1 sm:ml-2">{p.netSalary.toFixed(2)}</span>
                                     </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectPayslip(p);
                                        }}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Visualizza
                                    </button>
                                     <button
                                        onClick={(e) => { e.stopPropagation(); onDeletePayslip(p.id); }}
                                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                        aria-label="Elimina busta paga"
                                     >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                </>
            )}
        </div>
    );
};

export default Archive;