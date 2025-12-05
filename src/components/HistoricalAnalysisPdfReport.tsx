import React from 'react';
import { Payslip, HistoricalAnalysisResult, MonthlyComparison } from '../types.ts';
import { LogoIcon } from './common/Icons.tsx';

interface HistoricalAnalysisPdfReportProps {
    currentPayslip: Payslip;
    analysis: HistoricalAnalysisResult;
}

const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'short' });
const formatValue = (val: number) => `€ ${val.toFixed(2)}`;

const ComparisonRowPdf: React.FC<{ comparison: MonthlyComparison; isHighlighted?: boolean }> = ({ comparison, isHighlighted }) => {
    const bgClass = isHighlighted ? 'bg-gray-50' : '';
    const fontClass = comparison.type === 'summary' ? 'font-semibold' : '';

    return (
        <tr className={`border-b border-gray-200 text-xs ${bgClass}`}>
            <td className={`py-1.5 px-2 ${fontClass} text-gray-800`}>
                {comparison.description}
            </td>
            {comparison.values.map((val, idx) => {
                const diff = val.differenceFromPrevious;
                const showDiff = diff !== null && diff !== 0;
                const diffColor = diff && diff > 0 ? 'text-green-600' : 'text-red-600';
                const diffSign = diff && diff > 0 ? '+' : '';

                return (
                    <td key={idx} className={`py-1.5 px-2 text-center font-mono ${fontClass}`}>
                        <span className="text-gray-800">{formatValue(val.value)}</span>
                        {showDiff && (
                            <span className={`text-[10px] ${diffColor} block`}>
                                ({diffSign}{formatValue(diff!)})
                            </span>
                        )}
                    </td>
                );
            })}
        </tr>
    );
};

const HistoricalAnalysisPdfReport: React.FC<HistoricalAnalysisPdfReportProps> = ({ currentPayslip, analysis }) => {
    const generationDate = new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const months = analysis.comparisons[0]?.values || [];
    const summaryRows = analysis.comparisons.filter(c => c.type === 'summary');
    const detailRows = analysis.comparisons.filter(c => c.type !== 'summary');

    return (
        <div className="bg-white text-gray-800 font-sans" style={{ width: '297mm', minHeight: '210mm', fontFamily: 'sans-serif' }}>
            <div className="p-8">
                {/* Header */}
                <header className="flex justify-between items-center pb-4 border-b-2 border-blue-600 mb-6">
                    <div className="flex items-center space-x-3 text-blue-600">
                        <LogoIcon className="w-8 h-8" />
                        <span className="font-bold text-2xl">GioIA</span>
                    </div>
                    <div className="text-right">
                        <h1 className="text-xl font-bold">Analisi Storica Comparativa</h1>
                        <p className="text-sm text-gray-600">Generato il {generationDate}</p>
                    </div>
                </header>

                {/* Summary */}
                <section className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Sintesi</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
                </section>

                {/* Comparison Table */}
                <section className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Confronto Mese per Mese</h2>
                    <table className="w-full text-xs table-auto">
                        <thead className="bg-gray-100 text-left text-gray-600">
                            <tr>
                                <th className="py-1.5 px-2 font-semibold" style={{ minWidth: '120px' }}>Voce</th>
                                {months.map((m, idx) => (
                                    <th key={idx} className="py-1.5 px-2 text-center font-semibold whitespace-nowrap">
                                        <span className="capitalize">{getMonthName(m.month)}</span>
                                        <span className="text-gray-400 ml-1">{m.year}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Summary Rows */}
                            {summaryRows.map((row, idx) => (
                                <ComparisonRowPdf key={`summary-${idx}`} comparison={row} isHighlighted={true} />
                            ))}
                            
                            {/* Separator */}
                            {detailRows.length > 0 && (
                                <tr>
                                    <td colSpan={months.length + 1} className="py-1 px-2 bg-gray-50">
                                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Dettaglio Voci</span>
                                    </td>
                                </tr>
                            )}
                            
                            {/* Detail Rows */}
                            {detailRows.map((row, idx) => (
                                <ComparisonRowPdf key={`detail-${idx}`} comparison={row} />
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Insights */}
                {analysis.insights && analysis.insights.length > 0 && (
                    <section className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Osservazioni Chiave</h2>
                        <div className="space-y-2">
                            {analysis.insights.map((insight, idx) => (
                                <div key={idx} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                                    <p className="text-xs font-semibold text-gray-800 mb-0.5">
                                        {insight.category}
                                    </p>
                                    <p className="text-xs text-gray-600">{insight.observation}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="text-center text-[10px] text-gray-500 border-t border-gray-200 pt-3 mt-4">
                    <p>Report generato da GioIA - Questo documento è generato automaticamente a solo scopo informativo e non sostituisce una consulenza professionale.</p>
                </footer>
            </div>
        </div>
    );
};

export default HistoricalAnalysisPdfReport;
