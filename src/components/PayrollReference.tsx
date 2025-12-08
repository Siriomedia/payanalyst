import React, { useState, useEffect } from 'react';
import { PayrollReferenceService } from '../services/payrollReferenceService';
import { PayrollCodeWithCategory, ContributionType, CCNL } from '../supabase';
import Spinner from './common/Spinner';

const PayrollReference: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'codes' | 'contributions' | 'ccnl'>('codes');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [payrollCodes, setPayrollCodes] = useState<PayrollCodeWithCategory[]>([]);
  const [contributions, setContributions] = useState<ContributionType[]>([]);
  const [ccnlList, setCcnlList] = useState<CCNL[]>([]);
  const [selectedCode, setSelectedCode] = useState<PayrollCodeWithCategory | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'codes') {
        const codes = await PayrollReferenceService.getAllPayrollCodes();
        setPayrollCodes(codes);
      } else if (activeTab === 'contributions') {
        const contribs = await PayrollReferenceService.getAllContributions();
        setContributions(contribs);
      } else if (activeTab === 'ccnl') {
        const ccnls = await PayrollReferenceService.getAllCCNL();
        setCcnlList(ccnls);
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'codes') {
        const results = await PayrollReferenceService.searchPayrollCodes(searchTerm);
        setPayrollCodes(results);
      }
    } catch (error) {
      console.error('Errore ricerca:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCodes = searchTerm
    ? payrollCodes.filter(code =>
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : payrollCodes;

  const filteredContributions = searchTerm
    ? contributions.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.entity.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : contributions;

  const filteredCcnl = searchTerm
    ? ccnlList.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : ccnlList;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database di Riferimento</h1>
        <p className="text-gray-600">
          Consulta i codici voci Zucchetti, contributi e CCNL
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('codes')}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === 'codes'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Codici Voci ({payrollCodes.length})
            </button>
            <button
              onClick={() => setActiveTab('contributions')}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === 'contributions'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Contributi ({contributions.length})
            </button>
            <button
              onClick={() => setActiveTab('ccnl')}
              className={`px-6 py-4 font-medium text-sm ${
                activeTab === 'ccnl'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              CCNL ({ccnlList.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cerca codice, nome, descrizione..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <>
              {activeTab === 'codes' && (
                <div className="space-y-4">
                  {filteredCodes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nessun codice trovato</p>
                  ) : (
                    filteredCodes.map((code) => (
                      <div
                        key={code.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedCode(code)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-blue-600">{code.code}</span>
                              <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700">
                                {code.category?.name || 'Senza categoria'}
                              </span>
                              {code.is_deduction && (
                                <span className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded">
                                  Trattenuta
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 mb-2">{code.name}</p>
                            <div className="flex gap-4 text-sm text-gray-600">
                              {code.unit && (
                                <span>📏 {code.unit}</span>
                              )}
                              {code.affects_gross && <span>💰 Lordo</span>}
                              {code.affects_net && <span>💵 Netto</span>}
                              {code.affects_tfr && <span>🏦 TFR</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'contributions' && (
                <div className="space-y-4">
                  {filteredContributions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nessun contributo trovato</p>
                  ) : (
                    filteredContributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{contribution.name}</h3>
                          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {contribution.entity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          {contribution.rate_employee !== null && (
                            <div>
                              <span className="font-medium">Dipendente:</span>{' '}
                              {(contribution.rate_employee * 100).toFixed(3)}%
                            </div>
                          )}
                          {contribution.rate_employer !== null && (
                            <div>
                              <span className="font-medium">Azienda:</span>{' '}
                              {(contribution.rate_employer * 100).toFixed(3)}%
                            </div>
                          )}
                        </div>
                        {contribution.calculation_base && (
                          <p className="text-sm text-gray-600 mt-2">
                            📊 Base: {contribution.calculation_base}
                          </p>
                        )}
                        {contribution.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">{contribution.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'ccnl' && (
                <div className="space-y-4">
                  {filteredCcnl.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nessun CCNL trovato</p>
                  ) : (
                    filteredCcnl.map((ccnl) => (
                      <div
                        key={ccnl.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{ccnl.name}</h3>
                          <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded font-mono">
                            {ccnl.code}
                          </span>
                        </div>
                        {ccnl.sector && (
                          <p className="text-sm text-gray-600 mb-2">
                            🏢 Settore: {ccnl.sector}
                          </p>
                        )}
                        {ccnl.notes && (
                          <p className="text-sm text-gray-500 italic">{ccnl.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedCode.code}</h2>
              <button
                onClick={() => setSelectedCode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-lg text-gray-900 mb-4">{selectedCode.name}</p>
              {selectedCode.category && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Categoria: </span>
                  <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700">
                    {selectedCode.category.name} ({selectedCode.category.type})
                  </span>
                </div>
              )}
              <div className="space-y-2 text-gray-700">
                {selectedCode.unit && <p>📏 Unità di misura: <strong>{selectedCode.unit}</strong></p>}
                {selectedCode.calculation_base && <p>📊 Base calcolo: {selectedCode.calculation_base}</p>}
                <p>💰 Impatta lordo: {selectedCode.affects_gross ? '✓' : '✗'}</p>
                <p>💵 Impatta netto: {selectedCode.affects_net ? '✓' : '✗'}</p>
                <p>🏦 Impatta TFR: {selectedCode.affects_tfr ? '✓' : '✗'}</p>
                <p>Natura: {selectedCode.is_deduction ? '⬇️ Trattenuta' : '⬆️ Competenza'}</p>
              </div>
              {selectedCode.notes && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedCode.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollReference;
