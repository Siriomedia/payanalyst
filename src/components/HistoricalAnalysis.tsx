import React, { useState, useEffect, useRef } from 'react';
import { Payslip, HistoricalAnalysisResult, MonthlyComparison } from '../types.ts';
import { getHistoricalAnalysis } from '../services/geminiService.ts';
import Spinner from './common/Spinner.tsx';
import { AssistantIcon, TrendingUpIcon, PdfIcon } from './common/Icons.tsx';
import HistoricalAnalysisPdfReport from './HistoricalAnalysisPdfReport.tsx';
import { CREDIT_COSTS } from '../config/plans.ts';

declare const jspdf: any;
declare const html2canvas: any;

interface HistoricalAnalysisProps {
    currentPayslip: Payslip;
    allPayslips: Payslip[];
    handleCreditConsumption: (cost: number) => boolean;
}

const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'short' });

const formatValue = (val: number) => `€ ${val.toFixed(2)}`;

const DifferenceCell: React.FC<{ diff: number | null }> = ({ diff }) => {
    if (diff === null || diff === 0) return null;
    
    const isPositive = diff > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const sign = isPositive ? '+' : '';
    
    return (
        <span className={`text-xs ${color} block mt-0.5`}>
            ({sign}{formatValue(diff)})
        </span>
    );
};

const ComparisonRow: React.FC<{ comparison: MonthlyComparison; isHighlighted?: boolean }> = ({ comparison, isHighlighted }) => {
    const bgClass = isHighlighted ? 'bg-blue-50' : '';
    const fontClass = comparison.type === 'summary' ? 'font-semibold' : '';
    
    return (
        <tr className={`border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 ${bgClass}`}>
            <td className={`py-3 px-3 sm:px-4 sticky left-0 bg-white ${bgClass} ${fontClass} text-gray-800 min-w-[140px] sm:min-w-[180px]`}>
                <div className="flex items-center">
                    {comparison.type === 'income' && <span className="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>}
                    {comparison.type === 'deduction' && <span className="w-2 h-2 rounded-full bg-red-500 mr-2 flex-shrink-0"></span>}
                    {comparison.type === 'summary' && <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>}
                    <span className="truncate">{comparison.description}</span>
                </div>
            </td>
            {comparison.values.map((val, idx) => (
                <td key={idx} className={`py-3 px-2 sm:px-4 text-center font-mono text-sm ${fontClass}`}>
                    <span className="text-gray-800">{formatValue(val.value)}</span>
                    <DifferenceCell diff={val.differenceFromPrevious} />
                </td>
            ))}
        </tr>
    );
};

const HistoricalAnalysis: React.FC<HistoricalAnalysisProps> = ({ currentPayslip, allPayslips, handleCreditConsumption }) => {
    const [analysis, setAnalysis] = useState<HistoricalAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const pdfReportRef = useRef<HTMLDivElement>(null);

    const historicalPayslips = allPayslips.filter(p => p.id !== currentPayslip.id);

    useEffect(() => {
        if (historicalPayslips.length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        getHistoricalAnalysis(currentPayslip, historicalPayslips)
            .then(result => {
                setAnalysis(result);
            })
            .catch(err => {
                console.error("Historical analysis failed:", err);
                setError("Impossibile generare l'analisi storica. Riprova più tardi.");
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, [currentPayslip.id]);

    useEffect(() => {
        if (!isGeneratingPdf || !analysis || !pdfReportRef.current) return;

        if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
            console.error("jsPDF or html2canvas is not loaded");
            setIsGeneratingPdf(false);
            return;
        }

        const { jsPDF } = jspdf;

        html2canvas(pdfReportRef.current, { scale: 2 })
            .then((canvas: any) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'l',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const canvasHeight = canvas.height;
                const canvasWidth = canvas.width;
                const imgHeight = canvasHeight * pdfWidth / canvasWidth;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                pdf.save(`Analisi-Storica-${getMonthName(currentPayslip.period.month)}-${currentPayslip.period.year}.pdf`);
            })
            .catch((err: any) => {
                console.error("Error generating historical analysis PDF", err);
            })
            .finally(() => {
                setIsGeneratingPdf(false);
            });
    }, [isGeneratingPdf, analysis, currentPayslip]);

    const handleExportPdf = () => {
        if (!analysis || isGeneratingPdf) return;
        if (handleCreditConsumption(CREDIT_COSTS.PDF_EXPORT)) {
            setIsGeneratingPdf(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-md min-h-[400px]">
                <Spinner />
                <p className="mt-4 font-semibold text-blue-600">Analisi dello storico in corso...</p>
                <p className="text-gray-500">Confronto mese per mese delle buste paga.</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center p-8 bg-red-50 text-red-700 rounded-xl shadow-md">{error}</div>;
    }

    if (historicalPayslips.length === 0 || !analysis) {
        return (
            <div className="text-center p-12 bg-white rounded-xl shadow-md min-h-[400px] flex items-center justify-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-700">Dati insufficienti per un'analisi</h2>
                    <p className="text-gray-500 mt-2">Carica almeno un'altra busta paga per attivare il confronto storico.</p>
                </div>
            </div>
        );
    }

    const months = analysis.comparisons[0]?.values || [];
    const summaryRows = analysis.comparisons.filter(c => c.type === 'summary');
    const detailRows = analysis.comparisons.filter(c => c.type !== 'summary');

    return (
        <div className="space-y-6">
            {isGeneratingPdf && analysis && (
                <div ref={pdfReportRef} style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -10 }}>
                    <HistoricalAnalysisPdfReport currentPayslip={currentPayslip} analysis={analysis} />
                </div>
            )}

            {/* Header con Sintesi e Bottone PDF */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                        <AssistantIcon className="mr-2 text-blue-500 flex-shrink-0"/>
                        Analisi Storica
                    </h2>
                    <button
                        onClick={handleExportPdf}
                        disabled={isGeneratingPdf}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-colors text-sm"
                    >
                        {isGeneratingPdf ? (
                            <>
                                <Spinner />
                                <span className="ml-2">Creazione...</span>
                            </>
                        ) : (
                            <>
                                <PdfIcon className="w-5 h-5 mr-2"/>
                                <span>Esporta PDF (-{CREDIT_COSTS.PDF_EXPORT})</span>
                            </>
                        )}
                    </button>
                </div>
                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Tabella Comparativa Principale */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 p-4 sm:p-6 flex items-center border-b border-gray-200">
                    <TrendingUpIcon className="mr-2 text-indigo-500 flex-shrink-0"/>
                    Confronto Mese per Mese
                </h2>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-left text-gray-600">
                            <tr>
                                <th className="py-3 px-3 sm:px-4 font-semibold sticky left-0 bg-gray-100 min-w-[140px] sm:min-w-[180px]">Voce</th>
                                {months.map((m, idx) => (
                                    <th key={idx} className="py-3 px-2 sm:px-4 text-center font-semibold whitespace-nowrap">
                                        <span className="capitalize">{getMonthName(m.month)}</span>
                                        <span className="text-gray-400 ml-1">{m.year}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Sezione Riepilogo */}
                            {summaryRows.map((row, idx) => (
                                <ComparisonRow key={`summary-${idx}`} comparison={row} isHighlighted={true} />
                            ))}
                            
                            {/* Separatore */}
                            {detailRows.length > 0 && (
                                <tr>
                                    <td colSpan={months.length + 1} className="py-2 px-4 bg-gray-50">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dettaglio Voci</span>
                                    </td>
                                </tr>
                            )}
                            
                            {/* Sezione Dettaglio */}
                            {detailRows.map((row, idx) => (
                                <ComparisonRow key={`detail-${idx}`} comparison={row} />
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Legenda */}
                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
                    <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        Riepilogo
                    </div>
                    <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        Competenze
                    </div>
                    <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                        Trattenute
                    </div>
                    <div className="flex items-center">
                        <span className="text-green-600 mr-1">(+€)</span>
                        Aumento
                    </div>
                    <div className="flex items-center">
                        <span className="text-red-600 mr-1">(-€)</span>
                        Diminuzione
                    </div>
                </div>
            </div>

            {/* Osservazioni AI */}
            {analysis.insights && analysis.insights.length > 0 && (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span className="text-2xl mr-2">💡</span>
                        Osservazioni Chiave
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {analysis.insights.map((insight, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                                    {insight.category}
                                </p>
                                <p className="text-sm text-gray-700">{insight.observation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalAnalysis;
