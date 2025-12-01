import React, { useState, useEffect, useRef } from 'react';
import { Payslip, PayItem } from '../types.ts';
import Card from './common/Card.tsx';
import { WalletIcon, TaxIcon, EuroIcon, InfoIcon, TfrIcon, BeachIcon, ChartBarIcon, PdfIcon, TrendingUpIcon, LayersIcon } from './common/Icons.tsx';
import SalaryChart from './SalaryChart.tsx';
import Assistant from './Assistant.tsx';
import EvolutionChart from './EvolutionChart.tsx';
import { getPayslipSummary } from '../services/geminiService.ts';
import PdfReport from './PdfReport.tsx';
import Spinner from './common/Spinner.tsx';
import HistoricalAnalysis from './HistoricalAnalysis.tsx';
import { CREDIT_COSTS } from '../config/plans.ts';

// TypeScript declarations for CDN libraries
declare const jspdf: any;
declare const html2canvas: any;

interface DashboardProps {
    payslip: Payslip | null;
    alert: string | null;
    payslips: Payslip[];
    handleCreditConsumption: (cost: number) => boolean;
}

const DetailRow: React.FC<{ label: string, value: string | number | undefined, currency?: boolean, unit?: string }> = ({ label, value, currency = false, unit }) => (
    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100 last:border-b-0 gap-2">
        <span className="text-xs sm:text-sm text-gray-600 flex-shrink">{label}</span>
        <span className="text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap">
            {currency ? `€ ${Number(value || 0).toFixed(2)}` : unit ? `${Number(value || 0).toFixed(1)} ${unit}` : value || 'N/A'}
        </span>
    </div>
);

const PayItemTable: React.FC<{ title: string, items: PayItem[], colorClass: string }> = ({ title, items, colorClass }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${colorClass}`}>{title}</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-xs sm:text-sm min-w-[280px]">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-semibold text-gray-600">Descrizione</th>
                        <th className="text-right py-2 font-semibold text-gray-600 whitespace-nowrap">Valore</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 last:border-b-0">
                            <td className="py-2 text-gray-700">{item.description}</td>
                            <td className={`text-right py-2 font-mono text-gray-900 whitespace-nowrap`}>€ {item.value.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ payslip, alert, payslips, handleCreditConsumption }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'historical'>('overview');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfSummary, setPdfSummary] = useState<string | null>(null);
    const pdfReportRef = useRef<HTMLDivElement>(null);

    const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'long' });
    
    useEffect(() => {
        if (pdfSummary && isGeneratingPdf && pdfReportRef.current && payslip) {
            if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
                console.error("jsPDF or html2canvas is not loaded");
                setIsGeneratingPdf(false);
                setPdfSummary(null);
                return;
            }

            const { jsPDF } = jspdf;
            
            html2canvas(pdfReportRef.current, { scale: 2 })
                .then((canvas) => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: 'p',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    
                    // Maintain aspect ratio
                    const imgRatio = canvasWidth / canvasHeight;
                    const pdfRatio = pdfWidth / pdfHeight;

                    let imgWidth = pdfWidth;
                    let imgHeight = pdfWidth / imgRatio;

                    // If the image is taller than the page, scale down to fit height
                    if (imgHeight > pdfHeight) {
                        imgHeight = pdfHeight;
                        imgWidth = imgHeight * imgRatio;
                    }

                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                    pdf.save(`Report-${getMonthName(payslip.period.month)}-${payslip.period.year}.pdf`);
                })
                .catch(err => {
                    console.error("Error generating PDF", err);
                })
                .finally(() => {
                    setIsGeneratingPdf(false);
                    setPdfSummary(null);
                });
        }
    }, [pdfSummary, isGeneratingPdf, payslip]);

    const handleExportPdf = async () => {
        if (!payslip || isGeneratingPdf) return;
        
        if(!handleCreditConsumption(CREDIT_COSTS.PDF_EXPORT)) return;

        setIsGeneratingPdf(true);
        setPdfSummary(null);

        try {
            const summary = await getPayslipSummary(payslip);
            setPdfSummary(summary);
        } catch (error) {
            console.error("Failed to get summary for PDF", error);
            setIsGeneratingPdf(false);
        }
    };

    const handleTabChange = (tab: 'overview' | 'historical') => {
        if (tab === 'historical') {
            if (handleCreditConsumption(CREDIT_COSTS.HISTORICAL_ANALYSIS)) {
                setActiveTab('historical');
            }
        } else {
            setActiveTab('overview');
        }
    };

    const hasArchive = payslips.length > 0;
    const hasEnoughForHistory = payslips.length > 1;

    useEffect(() => {
        if (!hasEnoughForHistory) {
            setActiveTab('overview');
        }
    }, [hasEnoughForHistory]);

    if (!payslip) {
        return (
            <div className="text-center p-4 sm:p-6 md:p-8 bg-white rounded-xl shadow-md">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Benvenuto in GioIA</h1>
                {hasArchive ? (
                     <p className="text-sm sm:text-base text-gray-600">Seleziona una busta paga dall'archivio per visualizzarne i dettagli.</p>
                ) : (
                    <div className="max-w-xl mx-auto">
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                            GioIA è il tuo assistente intelligente per la gestione delle buste paga. Semplifica la comprensione, l'archiviazione e l'analisi dei tuoi dati retributivi.
                        </p>
                        <div className="text-left bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 mb-6 sm:mb-8">
                            <p className="font-semibold mb-2 text-sm sm:text-base text-gray-700">Cosa puoi fare con GioIA:</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1 text-xs sm:text-sm">
                                <li><strong>Analizzare:</strong> Carica una busta paga (PDF o immagine) e l'IA estrarrà e ti mostrerà tutti i dati in modo chiaro.</li>
                                <li><strong>Archiviare:</strong> Salva le tue analisi in un archivio sicuro e consultabile in qualsiasi momento.</li>
                                <li><strong>Confrontare:</strong> Metti a confronto due buste paga per capire le variazioni di stipendio mese su mese.</li>
                                <li><strong>Pianificare:</strong> Usa gli strumenti dedicati per organizzare i tuoi turni di lavoro, ferie e permessi.</li>
                            </ul>
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 font-semibold">Carica la tua prima busta paga per iniziare l'analisi.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            {isGeneratingPdf && pdfSummary && (
                <div ref={pdfReportRef} style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -10 }}>
                    <PdfReport payslip={payslip} summary={pdfSummary} />
                </div>
            )}
            {alert && (
                 <div className="bg-yellow-50 border-2 border-yellow-400 text-yellow-900 p-3 sm:p-5 mb-4 sm:mb-6 rounded-xl shadow-lg" role="alert">
                    <div className="flex items-start">
                        <InfoIcon className="w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-4 text-yellow-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <p className="font-bold text-base sm:text-lg mb-1 sm:mb-2">⚠️ Attenzione</p>
                            <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">{alert}</p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 capitalize">
                    Dashboard {getMonthName(payslip.period.month)} {payslip.period.year}
                </h1>
                <button 
                    onClick={handleExportPdf} 
                    disabled={isGeneratingPdf}
                    className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-colors whitespace-nowrap"
                >
                    {isGeneratingPdf ? (
                        <>
                            <Spinner />
                            <span className="ml-2">Creazione...</span>
                        </>
                    ) : (
                        <>
                           <PdfIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>
                           <span className="hidden sm:inline">Esporta PDF (-{CREDIT_COSTS.PDF_EXPORT} credito)</span>
                           <span className="sm:hidden">PDF (-{CREDIT_COSTS.PDF_EXPORT})</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => handleTabChange('overview')}
                        className={`whitespace-nowrap py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center transition-colors
                            ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>
                        Riepilogo
                    </button>
                    {hasEnoughForHistory && (
                        <button
                            onClick={() => handleTabChange('historical')}
                             className={`whitespace-nowrap py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center transition-colors
                            ${activeTab === 'historical' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Analisi Storico (-{CREDIT_COSTS.HISTORICAL_ANALYSIS} crediti)</span>
                            <span className="sm:hidden">Storico (-{CREDIT_COSTS.HISTORICAL_ANALYSIS})</span>
                        </button>
                    )}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div>
                    {/* Cards Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <Card title="Stipendio Lordo" value={payslip.grossSalary} icon={<EuroIcon />} color="blue" />
                        <Card title="Trattenute Totali" value={payslip.totalDeductions} icon={<TaxIcon />} color="red" />
                        <Card title="Stipendio Netto" value={payslip.netSalary} icon={<WalletIcon />} color="green" />
                    </div>
                    
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                                <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500"/>
                                Ripartizione Lordo
                            </h2>
                            <SalaryChart payslip={payslip} />
                        </div>
                        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                                <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500"/>
                                Andamento Stipendio
                            </h2>
                            {payslips.length > 1 ? (
                                <EvolutionChart payslips={payslips} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm sm:text-base p-4">
                                <p className="text-center">Carica altre buste paga per vedere l'andamento nel tempo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pay Items Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                        <PayItemTable title="Competenze" items={payslip.incomeItems} colorClass="text-green-600" />
                        <PayItemTable title="Trattenute" items={payslip.deductionItems} colorClass="text-red-600" />
                    </div>
                    
                    {/* Detailed Data Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                        {/* Remuneration Elements */}
                        {payslip.remunerationElements && payslip.remunerationElements.length > 0 && (
                            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center"><LayersIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500"/>Composizione Retribuzione</h2>
                                <div className="space-y-1">
                                    {payslip.remunerationElements.map((item, index) => (
                                        <DetailRow key={index} label={item.description} value={item.value} currency />
                                    ))}
                                    <div className="flex justify-between items-center py-2 border-t-2 border-gray-200 mt-2">
                                        <span className="text-sm font-bold text-gray-700">Retribuzione Mensile Lorda</span>
                                        <span className="text-sm font-bold text-gray-900">
                                            € {payslip.remunerationElements.reduce((acc, item) => acc + item.value, 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Tax Data */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center"><TaxIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500"/>Dati Fiscali</h2>
                            <div className="space-y-1">
                                <DetailRow label="Imponibile Fiscale" value={payslip.taxData.taxableBase} currency />
                                <DetailRow label="Imposta Lorda" value={payslip.taxData.grossTax} currency />
                                <DetailRow label="Detrazioni Lavoro Dip." value={payslip.taxData.deductions.employee} currency />
                                <DetailRow label="Detrazioni Totali" value={payslip.taxData.deductions.total} currency />
                                <DetailRow label="Imposta Netta" value={payslip.taxData.netTax} currency />
                                <DetailRow label="Addizionale Regionale" value={payslip.taxData.regionalSurtax} currency />
                                <DetailRow label="Addizionale Comunale" value={payslip.taxData.municipalSurtax} currency />
                            </div>
                        </div>

                        {/* TFR Data */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center"><TfrIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500"/>Situazione TFR</h2>
                            <div className="space-y-1">
                                <DetailRow label="Imponibile TFR" value={payslip.tfr.taxableBase} currency />
                                <DetailRow label="Quota Maturata" value={payslip.tfr.accrued} currency />
                                <DetailRow label="Fondo Precedente" value={payslip.tfr.previousBalance} currency />
                                <DetailRow label="Fondo Totale" value={payslip.tfr.totalFund} currency />
                            </div>
                        </div>

                        {/* Leave Data */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center"><BeachIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500"/>Ferie & Permessi</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-700">Ferie</h3>
                                    <DetailRow label="Saldo Precedente" value={payslip.leaveData.vacation.previous} unit="ore" />
                                    <DetailRow label="Maturate (da inizio anno)" value={payslip.leaveData.vacation.accrued} unit="ore" />
                                    <DetailRow label="Godute (da inizio anno)" value={payslip.leaveData.vacation.taken} unit="ore" />
                                    <DetailRow label="Saldo Residuo" value={payslip.leaveData.vacation.balance} unit="ore" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-700">Permessi (ROL)</h3>
                                    <DetailRow label="Saldo Precedente" value={payslip.leaveData.permits.previous} unit="ore" />
                                    <DetailRow label="Maturati (da inizio anno)" value={payslip.leaveData.permits.accrued} unit="ore" />
                                    <DetailRow label="Goduti (da inizio anno)" value={payslip.leaveData.permits.taken} unit="ore" />
                                    <DetailRow label="Saldo Residuo" value={payslip.leaveData.permits.balance} unit="ore" />
                                </div>
                                {payslip.leaveData.exHolidayPermits && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700">Permessi Ex Festività</h3>
                                        <DetailRow label="Saldo Precedente" value={payslip.leaveData.exHolidayPermits.previous} unit="ore" />
                                        <DetailRow label="Maturati (da inizio anno)" value={payslip.leaveData.exHolidayPermits.accrued} unit="ore" />
                                        <DetailRow label="Goduti (da inizio anno)" value={payslip.leaveData.exHolidayPermits.taken} unit="ore" />
                                        <DetailRow label="Saldo Residuo" value={payslip.leaveData.exHolidayPermits.balance} unit="ore" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contextual Assistant Section */}
                    <div className="mt-8">
                        <Assistant mode="contextual" focusedPayslip={payslip} payslips={[]} handleCreditConsumption={handleCreditConsumption} />
                    </div>
                </div>
            )}
            
            {activeTab === 'historical' && hasEnoughForHistory && (
                <HistoricalAnalysis currentPayslip={payslip} allPayslips={payslips} handleCreditConsumption={handleCreditConsumption} />
            )}

        </div>
    );
};

export default Dashboard;