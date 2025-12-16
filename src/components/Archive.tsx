import React, { useState, useEffect } from 'react';
import { Payslip } from '../types.ts';
import { EuroIcon, TrashIcon } from './common/Icons.tsx';
import { getUserMonthlyData, getUserPayslips, calculateUserStatistics, MonthlyData, PayslipData } from '../services/databaseQueryService.ts';
import Spinner from './common/Spinner.tsx';

interface ArchiveProps {
    payslips: Payslip[];
    onSelectPayslip: (payslip: Payslip) => void;
    onDeletePayslip: (payslipId: string) => void;
    userId?: string;
}

interface Filters {
    year: string;
    month: string;
    minSalary: string;
    maxSalary: string;
    minVacation: string;
    maxVacation: string;
    minPermits: string;
    maxPermits: string;
    minTfr: string;
    maxTfr: string;
}

const Archive: React.FC<ArchiveProps> = ({ payslips, onSelectPayslip, onDeletePayslip, userId }) => {
    const [activeTab, setActiveTab] = useState<'local' | 'database'>('local');
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [dbPayslips, setDbPayslips] = useState<PayslipData[]>([]);
    const [statistics, setStatistics] = useState<any>(null);
    const [isLoadingDb, setIsLoadingDb] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        year: '',
        month: '',
        minSalary: '',
        maxSalary: '',
        minVacation: '',
        maxVacation: '',
        minPermits: '',
        maxPermits: '',
        minTfr: '',
        maxTfr: ''
    });

    const exportToCSV = () => {
        if (payslips.length === 0) {
            alert('Nessuna busta paga da esportare');
            return;
        }

        const headers = [
            'Anno',
            'Mese',
            'Nome',
            'Cognome',
            'Azienda',
            'Retribuzione Lorda',
            'Totale Trattenute',
            'Netto in Busta',
            'Imponibile Fiscale',
            'Imposta Netta',
            'Imponibile Previdenziale',
            'Contributi Dipendente',
            'TFR Maturato',
            'Fondo TFR Totale',
            'Ferie Maturate (ore)',
            'Ferie Consumate (ore)',
            'Ferie Residuo (ore)',
            'Permessi Maturati (ore)',
            'Permessi Consumati (ore)',
            'Permessi Residuo (ore)',
            'Malattia (ore/gg)',
            'Ex Festività Residuo (ore)'
        ];

        const rows = payslips.map((payslip) => {
            const sickLeaveItems = [
                ...payslip.remunerationElements,
                ...payslip.incomeItems,
                ...payslip.deductionItems
            ].filter(item =>
                item.description &&
                (item.description.toLowerCase().includes('malattia') ||
                 item.description.toLowerCase().includes('assenza'))
            );

            const sickLeaveHours = sickLeaveItems.reduce((sum, item) => {
                return sum + (item.quantity || 0);
            }, 0);

            return [
                payslip.period.year,
                payslip.period.month,
                payslip.employee.firstName,
                payslip.employee.lastName,
                payslip.company.name,
                payslip.grossSalary.toFixed(2),
                payslip.totalDeductions.toFixed(2),
                payslip.netSalary.toFixed(2),
                payslip.taxData.taxableBase.toFixed(2),
                payslip.taxData.netTax.toFixed(2),
                payslip.socialSecurityData.taxableBase.toFixed(2),
                payslip.socialSecurityData.employeeContribution.toFixed(2),
                payslip.tfr.accrued.toFixed(2),
                payslip.tfr.totalFund.toFixed(2),
                payslip.leaveData.vacation.accrued.toFixed(2),
                payslip.leaveData.vacation.taken.toFixed(2),
                payslip.leaveData.vacation.balance.toFixed(2),
                payslip.leaveData.permits.accrued.toFixed(2),
                payslip.leaveData.permits.taken.toFixed(2),
                payslip.leaveData.permits.balance.toFixed(2),
                sickLeaveHours > 0 ? sickLeaveHours.toFixed(2) : '0',
                payslip.leaveData.exHolidayPermits ? payslip.leaveData.exHolidayPermits.balance.toFixed(2) : 'N/D'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const today = new Date();
        const filename = `buste_paga_${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'long' });

    useEffect(() => {
        if (userId && activeTab === 'database') {
            loadDatabaseData();
        }
    }, [userId, activeTab]);

    const loadDatabaseData = async () => {
        if (!userId) return;

        setIsLoadingDb(true);
        try {
            const [monthly, payslipsDb, stats] = await Promise.all([
                getUserMonthlyData(userId),
                getUserPayslips(userId),
                calculateUserStatistics(userId)
            ]);

            setMonthlyData(monthly.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            }));
            setDbPayslips(payslipsDb);
            setStatistics(stats);
        } catch (error) {
            console.error('Errore caricamento dati database:', error);
        } finally {
            setIsLoadingDb(false);
        }
    };

    const applyFilters = (data: MonthlyData[]) => {
        return data.filter((item) => {
            if (filters.year && item.year.toString() !== filters.year) return false;
            if (filters.month && item.month.toString() !== filters.month) return false;

            if (filters.minSalary && item.paga_base) {
                if (item.paga_base < parseFloat(filters.minSalary)) return false;
            }
            if (filters.maxSalary && item.paga_base) {
                if (item.paga_base > parseFloat(filters.maxSalary)) return false;
            }

            if (filters.minVacation && item.ferie.residue !== null) {
                if (item.ferie.residue < parseFloat(filters.minVacation)) return false;
            }
            if (filters.maxVacation && item.ferie.residue !== null) {
                if (item.ferie.residue > parseFloat(filters.maxVacation)) return false;
            }

            if (filters.minPermits && item.permessi.residui !== null) {
                if (item.permessi.residui < parseFloat(filters.minPermits)) return false;
            }
            if (filters.maxPermits && item.permessi.residui !== null) {
                if (item.permessi.residui > parseFloat(filters.maxPermits)) return false;
            }

            if (filters.minTfr && item.tfr.progressivo) {
                if (item.tfr.progressivo < parseFloat(filters.minTfr)) return false;
            }
            if (filters.maxTfr && item.tfr.progressivo) {
                if (item.tfr.progressivo > parseFloat(filters.maxTfr)) return false;
            }

            return true;
        });
    };

    const resetFilters = () => {
        setFilters({
            year: '',
            month: '',
            minSalary: '',
            maxSalary: '',
            minVacation: '',
            maxVacation: '',
            minPermits: '',
            maxPermits: '',
            minTfr: '',
            maxTfr: ''
        });
    };

    const availableYears = Array.from(new Set(monthlyData.map(d => d.year))).sort((a, b) => b - a);
    const filteredMonthlyData = applyFilters(monthlyData);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Archivio</h1>
                {activeTab === 'local' && payslips.length > 0 && (
                    <button
                        type="button"
                        onClick={exportToCSV}
                        className="px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold rounded-lg shadow-md bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors whitespace-nowrap"
                    >
                        <span className="hidden sm:inline">Esporta CSV</span>
                        <span className="sm:hidden">CSV</span>
                    </button>
                )}
            </div>

            {userId && (
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            activeTab === 'local'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Archivio Locale
                    </button>
                    <button
                        onClick={() => setActiveTab('database')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            activeTab === 'database'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Database Storico
                    </button>
                </div>
            )}

            {activeTab === 'local' && payslips.length === 0 ? (
                <p className="text-center text-sm sm:text-base text-gray-500 mt-6 sm:mt-8">Nessuna busta paga in archivio locale.</p>
            ) : activeTab === 'local' ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {payslips.map(p => (
                            <li key={p.id} className="p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-gray-50 transition-colors gap-3 md:gap-0">
                                <div className="flex-grow cursor-pointer" onClick={() => onSelectPayslip(p)}>
                                    <p className="font-bold text-base sm:text-lg text-gray-800 capitalize">
                                        {getMonthName(p.period.month)} {p.period.year}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500">{p.company.name}</p>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-4 w-full md:w-auto justify-between md:justify-end">
                                     <div className="flex items-center text-green-600">
                                        <EuroIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                        <span className="font-semibold text-base sm:text-lg ml-1 sm:ml-2">{p.netSalary.toFixed(2)}</span>
                                     </div>
                                    <button
                                        onClick={() => onSelectPayslip(p)}
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
            ) : activeTab === 'database' ? (
                <div className="space-y-6">
                    {isLoadingDb ? (
                        <div className="flex justify-center items-center py-12">
                            <Spinner />
                        </div>
                    ) : (
                        <>
                            {/* Statistiche Generali */}
                            {statistics && statistics.totalPayslips > 0 && (
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiche Generali</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Buste Paga Elaborate</p>
                                            <p className="text-2xl font-bold text-blue-600">{statistics.totalPayslips}</p>
                                        </div>
                                        {statistics.averageSalary && (
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Paga Media</p>
                                                <p className="text-2xl font-bold text-green-600">€{statistics.averageSalary.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {statistics.totalLeaveRemaining !== null && (
                                            <div className="bg-purple-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">Ferie Residue</p>
                                                <p className="text-2xl font-bold text-purple-600">{statistics.totalLeaveRemaining}</p>
                                            </div>
                                        )}
                                        {statistics.tfr && (
                                            <div className="bg-orange-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600">TFR Progressivo</p>
                                                <p className="text-2xl font-bold text-orange-600">€{statistics.tfr.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dati Mensili */}
                            {monthlyData.length > 0 && (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">Dati Mensili Aggregati</h2>
                                                <p className="text-sm text-gray-600 mt-1">Dati estratti e elaborati dalle Cloud Functions</p>
                                            </div>
                                            <button
                                                onClick={() => setShowFilters(!showFilters)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                                            >
                                                {showFilters ? 'Nascondi Filtri' : 'Mostra Filtri'}
                                            </button>
                                        </div>
                                    </div>

                                    {showFilters && (
                                        <div className="p-6 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtri di Ricerca</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Anno</label>
                                                    <select
                                                        value={filters.year}
                                                        onChange={(e) => setFilters({...filters, year: e.target.value})}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="">Tutti</option>
                                                        {availableYears.map(year => (
                                                            <option key={year} value={year}>{year}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mese</label>
                                                    <select
                                                        value={filters.month}
                                                        onChange={(e) => setFilters({...filters, month: e.target.value})}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="">Tutti</option>
                                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                                            <option key={m} value={m}>{getMonthName(m)}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Paga Min (€)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.minSalary}
                                                        onChange={(e) => setFilters({...filters, minSalary: e.target.value})}
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Paga Max (€)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.maxSalary}
                                                        onChange={(e) => setFilters({...filters, maxSalary: e.target.value})}
                                                        placeholder="999999"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ferie Min (ore)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.minVacation}
                                                        onChange={(e) => setFilters({...filters, minVacation: e.target.value})}
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ferie Max (ore)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.maxVacation}
                                                        onChange={(e) => setFilters({...filters, maxVacation: e.target.value})}
                                                        placeholder="999"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permessi Min (ore)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.minPermits}
                                                        onChange={(e) => setFilters({...filters, minPermits: e.target.value})}
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permessi Max (ore)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.maxPermits}
                                                        onChange={(e) => setFilters({...filters, maxPermits: e.target.value})}
                                                        placeholder="999"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">TFR Min (€)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.minTfr}
                                                        onChange={(e) => setFilters({...filters, minTfr: e.target.value})}
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">TFR Max (€)</label>
                                                    <input
                                                        type="number"
                                                        value={filters.maxTfr}
                                                        onChange={(e) => setFilters({...filters, maxTfr: e.target.value})}
                                                        placeholder="999999"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={resetFilters}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
                                                >
                                                    Resetta Filtri
                                                </button>
                                                <div className="text-sm text-gray-600 flex items-center ml-2">
                                                    Risultati: {filteredMonthlyData.length} / {monthlyData.length}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mese</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Paga Base</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ferie Residue</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Permessi Residui</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">TFR Progressivo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredMonthlyData.map((data) => (
                                                    <tr key={data.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 capitalize">
                                                            {getMonthName(data.month)} {data.year}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                            {data.paga_base ? `€${data.paga_base.toFixed(2)}` : 'N/D'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                            {data.ferie.residue ?? 'N/D'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                            {data.permessi.residui ?? 'N/D'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                            {data.tfr.progressivo ? `€${data.tfr.progressivo.toFixed(2)}` : 'N/D'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Buste Paga nel Database */}
                            {dbPayslips.length > 0 && (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                                        <h2 className="text-xl font-bold text-gray-800">Buste Paga Elaborate</h2>
                                        <p className="text-sm text-gray-600 mt-1">Documenti processati dalle Cloud Functions</p>
                                    </div>
                                    <ul className="divide-y divide-gray-200">
                                        {dbPayslips.map((payslip) => (
                                            <li key={payslip.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold text-gray-800 capitalize">
                                                            {getMonthName(payslip.month)} {payslip.year}
                                                        </p>
                                                        <p className="text-sm text-gray-500">ID: {payslip.id}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Status: <span className="font-semibold text-green-600">{payslip.status}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {monthlyData.length === 0 && dbPayslips.length === 0 && !isLoadingDb && (
                                <p className="text-center text-gray-500 mt-8">Nessun dato disponibile nel database.</p>
                            )}
                        </>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default Archive;