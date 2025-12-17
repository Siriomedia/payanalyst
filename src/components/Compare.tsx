import React, { useState, useEffect } from 'react';
import { Payslip } from '../types.ts';
import { getComparisonAnalysis } from '../services/geminiService.ts';
import Spinner from './common/Spinner.tsx';
import Assistant from './Assistant.tsx';

interface CompareProps {
    payslips: Payslip[] | null;
}

const Compare: React.FC<CompareProps> = ({ payslips }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'long' });

    useEffect(() => {
        if (payslips && payslips.length >= 2) {
            setIsAnalysisLoading(true);
            setAnalysis(null);
            setAnalysisError(null);

            getComparisonAnalysis(payslips)
                .then(result => {
                    setAnalysis(result);
                })
                .catch(err => {
                    console.error("Analysis failed:", err);
                    setAnalysisError("Impossibile generare l'analisi comparativa. Riprova più tardi.");
                })
                .finally(() => {
                    setIsAnalysisLoading(false);
                });
        }
    }, [payslips]);

    if (!payslips || payslips.length < 2) {
        return (
            <div className="text-center p-4 sm:p-6 md:p-8 bg-white rounded-xl shadow-md">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Seleziona Buste Paga</h1>
                <p className="text-sm sm:text-base text-gray-600">Vai all'archivio per selezionare da 2 a 12 buste paga da confrontare.</p>
            </div>
        );
    }

    const ComparisonRow: React.FC<{ label: string, values: number[], isCurrency?: boolean, highlight?: boolean }> = ({ label, values, isCurrency = true, highlight = false }) => {
        const formatValue = (val: number) => isCurrency ? `€ ${val.toFixed(2)}` : val.toFixed(2);
        const rowBg = highlight ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50';

        const firstValue = values[0];
        const diffs = values.map(v => v - firstValue);

        return (
            <tr className={`border-b border-gray-200 last:border-b-0 ${rowBg}`}>
                <td className="py-3 sm:py-4 px-3 sm:px-4 font-semibold text-gray-700 text-sm sm:text-base sticky left-0 bg-white z-10">{label}</td>
                {values.map((val, idx) => {
                    const diff = diffs[idx];
                    const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-700';
                    const diffSign = diff > 0 ? '+' : '';
                    const showDiff = idx > 0 && diff !== 0;

                    return (
                        <td key={idx} className={`py-3 sm:py-4 px-3 sm:px-4 text-center font-mono text-sm sm:text-base whitespace-nowrap ${diffColor}`}>
                            <div>{formatValue(val)}</div>
                            {showDiff && <div className="text-xs">{diffSign}{formatValue(diff)}</div>}
                        </td>
                    );
                })}
            </tr>
        );
    };

    const payslipLabels = payslips.map(p => `${getMonthName(p.period.month)} ${p.period.year}`);

    return (
        <div>
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Confronto Buste Paga</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Confronto tra {payslips.length} buste paga: {payslipLabels.join(', ')}
                </p>
            </div>
            
            {/* AI Analysis Section */}
            <div className="mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                    Analisi AI
                </h2>
                {isAnalysisLoading && (
                    <div className="flex items-center space-x-2 text-gray-600 text-sm sm:text-base">
                        <Spinner />
                        <span>Sto analizzando le differenze...</span>
                    </div>
                )}
                {analysisError && <p className="text-red-600 text-sm sm:text-base">{analysisError}</p>}
                {analysis && <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{analysis}</p>}
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 sm:mb-8">
                <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                    <table className="w-full text-xs sm:text-sm min-w-[600px]">
                        <thead className="sticky top-0 bg-white z-20">
                            <tr className="bg-gray-100 text-left text-gray-600">
                                <th className="py-2 sm:py-3 px-2 sm:px-4 font-semibold sticky left-0 bg-gray-100 z-30">Voce</th>
                                {payslips.map((p, idx) => (
                                    <th key={idx} className="py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold min-w-[120px]">
                                        <div className="capitalize text-[10px] sm:text-sm">{getMonthName(p.period.month)}</div>
                                        <div className="text-[10px] sm:text-sm">{p.period.year}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr className="bg-blue-100">
                                <td colSpan={payslips.length + 1} className="py-2 sm:py-3 px-3 sm:px-4 font-bold text-blue-800 text-sm sm:text-base sticky left-0 z-10">
                                    Riepilogo Principale
                                </td>
                            </tr>
                            <ComparisonRow label="Stipendio Lordo" values={payslips.map(p => p.grossSalary)} highlight={true} />
                            <ComparisonRow label="Stipendio Netto" values={payslips.map(p => p.netSalary)} highlight={true} />
                            <ComparisonRow label="Trattenute Totali" values={payslips.map(p => p.totalDeductions)} />

                            <tr className="bg-gray-50">
                                <td colSpan={payslips.length + 1} className="py-1.5 sm:py-2 px-2 sm:px-4 font-bold text-gray-500 text-xs sm:text-sm sticky left-0 z-10">
                                    Dettaglio Fiscale
                                </td>
                            </tr>
                            <ComparisonRow label="Imponibile Fiscale" values={payslips.map(p => p.taxData.taxableBase)} />
                            <ComparisonRow label="Imposta Lorda" values={payslips.map(p => p.taxData.grossTax)} />
                            <ComparisonRow label="Detrazioni Totali" values={payslips.map(p => p.taxData.deductions.total)} />
                            <ComparisonRow label="Imposta Netta" values={payslips.map(p => p.taxData.netTax)} />

                            <tr className="bg-gray-50">
                                <td colSpan={payslips.length + 1} className="py-1.5 sm:py-2 px-2 sm:px-4 font-bold text-gray-500 text-xs sm:text-sm sticky left-0 z-10">
                                    Dettaglio Previdenziale
                                </td>
                            </tr>
                            <ComparisonRow label="Imponibile Previdenziale" values={payslips.map(p => p.socialSecurityData.taxableBase)} />
                            <ComparisonRow label="Contributi Dipendente" values={payslips.map(p => p.socialSecurityData.employeeContribution)} />

                            <tr className="bg-gray-50">
                                <td colSpan={payslips.length + 1} className="py-1.5 sm:py-2 px-2 sm:px-4 font-bold text-gray-500 text-xs sm:text-sm sticky left-0 z-10">
                                    TFR
                                </td>
                            </tr>
                            <ComparisonRow label="TFR Maturato" values={payslips.map(p => p.tfr.accrued)} />
                            <ComparisonRow label="Fondo TFR Totale" values={payslips.map(p => p.tfr.totalFund)} />

                            <tr className="bg-gray-50">
                                <td colSpan={payslips.length + 1} className="py-1.5 sm:py-2 px-2 sm:px-4 font-bold text-gray-500 text-xs sm:text-sm sticky left-0 z-10">
                                    Ferie, Permessi & Assenze
                                </td>
                            </tr>
                            <ComparisonRow label="Ferie Usufruite" values={payslips.map(p => p.leaveData.vacation.taken)} isCurrency={false} />
                            <ComparisonRow label="Permessi Usufruiti" values={payslips.map(p => p.leaveData.permits.taken)} isCurrency={false} />
                            {payslips.some(p => p.leaveData.sickLeave) && (
                                <ComparisonRow label="Malattia" values={payslips.map(p => p.leaveData.sickLeave?.taken || 0)} isCurrency={false} />
                            )}
                            <ComparisonRow label="Saldo Ferie" values={payslips.map(p => p.leaveData.vacation.balance)} isCurrency={false} />
                            <ComparisonRow label="Saldo Permessi" values={payslips.map(p => p.leaveData.permits.balance)} isCurrency={false} />
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* The assistant is removed from here as it doesn't make sense to pass the credit handler down */}
        </div>
    );
};

export default Compare;