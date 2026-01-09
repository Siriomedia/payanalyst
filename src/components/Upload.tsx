import React, { useState, useCallback, useEffect } from 'react';
import { analyzePayslip } from '../services/geminiService.ts';
import { savePayslipToDatabase } from '../services/payslipService.ts';
import { Payslip } from '../types.ts';
import Spinner from './common/Spinner.tsx';
import { UploadIcon } from './common/Icons.tsx';
import { CREDIT_COSTS } from '../config/plans.ts';
import { User } from '../types.ts';
import { auth } from '../firebase.ts';

interface UploadProps {
    user: User;
    onAnalysisComplete: (payslip: Payslip) => void;
    handleCreditConsumption: (cost: number) => boolean;
}

const Upload: React.FC<UploadProps> = ({ user, onAnalysisComplete, handleCreditConsumption }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showProfileAlert, setShowProfileAlert] = useState(false);
    const [creditsConsumed, setCreditsConsumed] = useState(false);
    const [showFileWarning, setShowFileWarning] = useState(false);

    // Mostra avviso se c'era un file selezionato prima
    useEffect(() => {
        try {
            const savedFileInfo = localStorage.getItem('gioia_upload_file_info');
            if (savedFileInfo) {
                setShowFileWarning(true);
                // Rimuovi dopo averlo mostrato
                localStorage.removeItem('gioia_upload_file_info');
            }
        } catch {
            // Ignore
        }
    }, []);

    useEffect(() => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Salva info file in caso l'app venga minimizzata
            try {
                localStorage.setItem('gioia_upload_file_info', JSON.stringify({
                    name: file.name,
                    size: file.size,
                    type: file.type
                }));
            } catch {
                // Ignore
            }
        } else {
            setPreviewUrl(null);
        }
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setShowFileWarning(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (['image/jpeg', 'image/png', 'application/pdf'].includes(droppedFile.type)) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError('Formato file non supportato. Usa PDF, JPG, o PNG.');
            }
        }
    }, []);

    const handleRemoveFile = () => {
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        setShowFileWarning(false);
        // Rimuovi anche le info salvate
        try {
            localStorage.removeItem('gioia_upload_file_info');
        } catch {
            // Ignore
        }
    };

    const isProfileComplete = () => {
        return (
            user.firstName.trim() !== '' &&
            user.lastName.trim() !== '' &&
            user.dateOfBirth.trim() !== '' &&
            user.placeOfBirth.trim() !== ''
        );
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);


    const handleSubmit = async () => {
        if (!file) {
            setError('Per favore, seleziona un file da caricare.');
            return;
        }

        if (!isProfileComplete()) {
            setShowProfileAlert(true);
            return;
        }

        // Verifica crediti PRIMA, ma NON consumare ancora
        if (user.role !== 'admin' && user.credits < CREDIT_COSTS.PAYSLIP_ANALYSIS) {
            setError('Crediti insufficienti per analizzare la busta paga.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setShowProfileAlert(false);
        setCreditsConsumed(false);

        try {
            const payslipData = await analyzePayslip(file);

            // Analisi completata con successo - ORA consuma i crediti
            if (!creditsConsumed) {
                handleCreditConsumption(CREDIT_COSTS.PAYSLIP_ANALYSIS);
                setCreditsConsumed(true);
            }

            // Salva la busta paga nel database
            if (auth.currentUser) {
                const saveResult = await savePayslipToDatabase(auth.currentUser.uid, payslipData);
                if (!saveResult.success) {
                    console.error('Errore nel salvataggio nel database:', saveResult.error);
                }
            }

            // Rimuovi info file salvate dopo successo
            try {
                localStorage.removeItem('gioia_upload_file_info');
            } catch {
                // Ignore
            }

            onAnalysisComplete(payslipData);
        } catch (err) {
            // Analisi fallita - NON consumare crediti
            setError('Analisi fallita. Assicurati che il documento sia una busta paga leggibile e riprova.');
            console.error(err);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Carica Busta Paga</h1>

            {showFileWarning && !file && (
                <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">Avevi selezionato un file</p>
                            <p className="text-sm mt-1">Sembra che tu abbia interrotto il caricamento. Per procedere, seleziona nuovamente il file della busta paga.</p>
                        </div>
                        <button
                            onClick={() => setShowFileWarning(false)}
                            className="ml-2 text-amber-600 hover:text-amber-800"
                            aria-label="Chiudi avviso"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
                {isLoading ? (
                    <div className="text-center">
                        <Spinner />
                        <p className="mt-4 text-base sm:text-lg font-semibold text-blue-600">Analisi in corso...</p>
                        <p className="text-sm sm:text-base text-gray-500">L'IA sta leggendo la tua busta paga. Potrebbe volerci un momento.</p>
                    </div>
                ) : (
                    <>
                        {file ? (
                            <div className="border-2 border-solid border-green-500 bg-green-50 rounded-lg p-6">
                                <div className="flex flex-col items-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Anteprima" className="max-h-48 max-w-full rounded-lg shadow-md mb-4 object-contain" />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="text-center mb-4">
                                        <div className="flex items-center justify-center text-green-600 mb-2">
                                            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="font-semibold">File caricato con successo</span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium break-all">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                                    >
                                        Rimuovi e scegli un altro file
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label
                                htmlFor="file-upload"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`flex flex-col items-center justify-center w-full p-6 sm:p-8 md:p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                            >
                                <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
                                <div className="text-center">
                                    <span className="text-sm sm:text-base text-blue-600 font-semibold">Scegli un file</span>
                                    <span className="text-sm sm:text-base text-gray-500 ml-1">o trascinalo qui</span>
                                </div>
                                <input id="file-upload" name="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-2">PDF, PNG, JPG (MAX. 10MB)</p>
                            </label>
                        )}

                        {showProfileAlert && (
                            <div className="mt-4 text-center text-sm sm:text-base text-amber-700 bg-amber-100 border border-amber-300 p-4 rounded-lg">
                                <div className="flex items-center justify-center mb-2">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-semibold">Dati del profilo incompleti</span>
                                </div>
                                <p>Per analizzare la busta paga, è necessario completare i dati anagrafici nel tuo profilo utente.</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 text-center text-sm sm:text-base text-red-600 bg-red-100 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 sm:mt-8 text-center">
                            <button
                                onClick={handleSubmit}
                                disabled={!file || isLoading}
                                className="w-full md:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                            >
                                <span className="hidden sm:inline">Analizza Documento (-{CREDIT_COSTS.PAYSLIP_ANALYSIS} crediti)</span>
                                <span className="sm:hidden">Analizza (-{CREDIT_COSTS.PAYSLIP_ANALYSIS})</span>
                            </button>
                        </div>
                    </>
                )}
                 <div className="mt-8 text-center text-sm text-gray-500">
                    <p>I tuoi documenti sono trattati con la massima riservatezza e non vengono memorizzati permanentemente sui nostri server dopo l'analisi.</p>
                </div>
            </div>
        </div>
    );
};

export default Upload;