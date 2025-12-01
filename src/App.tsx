import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import Upload from './components/Upload.tsx';
import Archive from './components/Archive.tsx';
import Compare from './components/Compare.tsx';
import Assistant from './components/Assistant.tsx';
import Login from './components/Login.tsx';
import Settings from './components/Settings.tsx';
import ShiftPlanner from './components/ShiftPlanner.tsx';
import LeavePlanner from './components/LeavePlanner.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import Subscription from './components/Subscription.tsx';
import UpgradeModal from './components/UpgradeModal.tsx';

import { View, Payslip, User, Shift, LeavePlan, Absence, Plan } from './types.ts';
import { PLANS, CREDIT_COSTS } from './config/plans.ts';
import { normalizeTimestamp } from './utils/timestampHelpers.ts';

// FIREBASE
import { auth, db } from "./firebase.ts";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, increment, updateDoc, serverTimestamp } from "firebase/firestore";

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const isUpdatingFromFirestore = useRef(false);
    const isAtomicCreditUpdate = useRef(false);

    //
    // LOAD USER FROM LOCAL STORAGE
    //
    const [user, setUser] = useState<User | null>(() => {
        try {
            const item = window.localStorage.getItem('gioia_user');
            if (!item) return null;

            const parsed = JSON.parse(item);
            if (
                parsed &&
                typeof parsed === "object" &&
                "email" in parsed &&
                "plan" in parsed &&
                "credits" in parsed
            ) {
                return parsed as User;
            }

            window.localStorage.removeItem("gioia_user");
            return null;
        } catch {
            window.localStorage.removeItem("gioia_user");
            return null;
        }
    });

    //
    // FIREBASE AUTH LISTENER + REAL-TIME USER DATA SYNC
    //
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser) {
                setUser(null);
                return;
            }

            // Carica i dati iniziali
            const ref = doc(db, "users", fbUser.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data();

                const mergedUser: User = {
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                    dateOfBirth: data.dateOfBirth,
                    placeOfBirth: data.placeOfBirth,
                    plan: data.plan,
                    credits: data.credits ?? 0,
                    creditResetDate: "", // non serve più
                    createdAt: normalizeTimestamp(data.createdAt, Date.now()),
                };

                setUser(mergedUser);
                window.localStorage.setItem("gioia_user", JSON.stringify(mergedUser));
            } else {
                // Documento Firestore non esiste - crealo automaticamente
                let firstName = "";
                let lastName = "";

                // Prova a estrarre nome e cognome dal displayName (Google/Apple login)
                if (fbUser.displayName) {
                    const nameParts = fbUser.displayName.split(" ");
                    firstName = nameParts[0] || "";
                    lastName = nameParts.slice(1).join(" ") || "";
                }

                const newUserData: User = {
                    email: fbUser.email || "",
                    firstName: firstName,
                    lastName: lastName,
                    role: 'user',
                    dateOfBirth: "",
                    placeOfBirth: "",
                    plan: 'free',
                    credits: PLANS.free.credits,
                    creditResetDate: "",
                    createdAt: Date.now(), // Fallback se la rilettura fallisce
                };

                // Salva in Firestore con campo createdAt per ordinamento cronologico
                await setDoc(ref, {
                    ...newUserData,
                    createdAt: serverTimestamp(),
                }, { merge: true });

                // Rileggi il documento per ottenere il timestamp server-side effettivo
                const savedSnap = await getDoc(ref);
                if (savedSnap.exists()) {
                    const savedData = savedSnap.data();
                    const completeUserData: User = {
                        email: savedData.email,
                        firstName: savedData.firstName,
                        lastName: savedData.lastName,
                        role: savedData.role,
                        dateOfBirth: savedData.dateOfBirth,
                        placeOfBirth: savedData.placeOfBirth,
                        plan: savedData.plan,
                        credits: savedData.credits ?? 0,
                        creditResetDate: savedData.creditResetDate || "",
                        createdAt: normalizeTimestamp(savedData.createdAt, Date.now()),
                    };
                    setUser(completeUserData);
                    window.localStorage.setItem("gioia_user", JSON.stringify(completeUserData));
                } else {
                    // Fallback se la rilettura fallisce
                    setUser(newUserData);
                    window.localStorage.setItem("gioia_user", JSON.stringify(newUserData));
                }
            }
        });

        return () => unsubAuth();
    }, []);

    //
    // REAL-TIME FIRESTORE LISTENER FOR USER DATA (crediti aggiornati da admin)
    //
    useEffect(() => {
        if (!auth.currentUser) return;

        const userRef = doc(db, "users", auth.currentUser.uid);
        const unsubFirestore = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                
                // Merge completo: spread tutti i campi esistenti e sovrascrivi con Firestore
                setUser(prevUser => {
                    const updatedUser: User = {
                        ...(prevUser || {}),  // Preserva campi esistenti, gestisce caso null
                        ...data,              // Sovrascrivi con dati da Firestore
                        credits: data.credits ?? (prevUser?.credits || 0),
                        creditResetDate: data.creditResetDate || (prevUser?.creditResetDate || ''),
                        createdAt: normalizeTimestamp(data.createdAt, prevUser?.createdAt || Date.now()),
                    } as User;

                    // Imposta il flag per evitare loop infinito
                    isUpdatingFromFirestore.current = true;
                    window.localStorage.setItem("gioia_user", JSON.stringify(updatedUser));
                    
                    return updatedUser;
                });
            }
        }, (error) => {
            console.error('Errore nel listener Firestore utente:', error);
        });

        return () => unsubFirestore();
    }, [auth.currentUser?.uid]);

    //
    // SAVE USER (LOCALSTORAGE + FIRESTORE)
    //
    useEffect(() => {
        if (!user) {
            window.localStorage.removeItem("gioia_user");
            return;
        }

        window.localStorage.setItem("gioia_user", JSON.stringify(user));

        // Se l'aggiornamento viene dal listener Firestore, non salvare di nuovo
        if (isUpdatingFromFirestore.current) {
            isUpdatingFromFirestore.current = false;
            return;
        }

        // Se i crediti sono stati aggiornati atomicamente, non sovrascrivere
        if (isAtomicCreditUpdate.current) {
            isAtomicCreditUpdate.current = false;
            return;
        }

        const saveToFirestore = async () => {
            if (!auth.currentUser) return;
            const ref = doc(db, "users", auth.currentUser.uid);
            
            // Rimuovi createdAt dallo stato locale prima di salvare per non sovrascriverlo
            const { createdAt, ...userDataToSave } = user as any;
            await setDoc(ref, userDataToSave, { merge: true });
        };

        saveToFirestore().catch(console.error);
    }, [user]);

    //
    // LOCAL DATA
    //
    const [payslips, setPayslips] = useState<Payslip[]>(() => {
        try { return JSON.parse(localStorage.getItem("gioia_payslips") || "[]"); }
        catch { return []; }
    });

    const [shifts, setShifts] = useState<Shift[]>(() => {
        try { return JSON.parse(localStorage.getItem("gioia_shifts") || "[]"); }
        catch { return []; }
    });

    const [leavePlans, setLeavePlans] = useState<LeavePlan[]>(() => {
        try { return JSON.parse(localStorage.getItem("gioia_leave_plans") || "[]"); }
        catch { return []; }
    });

    const [absences, setAbsences] = useState<Absence[]>(() => {
        try { return JSON.parse(localStorage.getItem("gioia_absences") || "[]"); }
        catch { return []; }
    });

    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(
        payslips.length > 0 ? payslips[0] : null
    );

    const [payslipsToCompare, setPayslipsToCompare] = useState<[Payslip, Payslip] | null>(null);
    const [alert, setAlert] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    //
    // PERSIST LOCAL DATA TO LOCALSTORAGE
    //
    useEffect(() => {
        localStorage.setItem("gioia_payslips", JSON.stringify(payslips));
    }, [payslips]);

    useEffect(() => {
        localStorage.setItem("gioia_shifts", JSON.stringify(shifts));
    }, [shifts]);

    useEffect(() => {
        localStorage.setItem("gioia_leave_plans", JSON.stringify(leavePlans));
    }, [leavePlans]);

    useEffect(() => {
        localStorage.setItem("gioia_absences", JSON.stringify(absences));
    }, [absences]);

    //
    // REMOVE MONTHLY RESET (PIANO A)
    // → Nessun reset. Nessun credito gratis.
    //

    //
    // CREDIT USAGE — ADMIN HAVE INFINITE CREDITS
    //
    const handleCreditConsumption = (cost: number): boolean => {
        if (!user) {
            setShowUpgradeModal(true);
            return false;
        }

        // Admin hanno crediti infiniti
        if (user.role === 'admin') {
            return true;
        }

        // Utenti normali: controllo crediti
        if (user.credits < cost) {
            setShowUpgradeModal(true);
            return false;
        }

        // Usa increment atomico per evitare race conditions con admin gifts
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            updateDoc(userRef, { credits: increment(-cost) }).catch(console.error);
            
            // Imposta flag per evitare che useEffect riscriva su Firestore
            isAtomicCreditUpdate.current = true;
        }
        
        // Aggiorna anche lo stato locale per UI reattiva (verrà sincronizzato dal listener)
        setUser(prev => prev ? { ...prev, credits: prev.credits - cost } : null);
        return true;
    };

    //
    // CHANGE PLAN — NO FREE CREDITS
    //
    const handlePlanChange = (newPlan: Plan) => {
        setUser(prev => {
            if (!prev) return null;

            return {
                ...prev,
                plan: newPlan
                // NO crediti aggiunti
            };
        });

        setCurrentView(View.Dashboard);
    };

    //
    // ADD CREDITS (PAYPAL)
    //
    const handleAddCredits = (amount: number) => {
        setUser(prev => {
            if (!prev) return null;
            return { ...prev, credits: prev.credits + amount };
        });
    };

    //
    // ANALYSIS COMPLETE - VERIFICA CORRISPONDENZA DATI ANAGRAFICI
    //
    const handleAnalysisComplete = (newPayslip: Payslip) => {
        setSelectedPayslip(newPayslip);

        // Admin bypassa tutti i controlli
        if (user && user.role === "admin") {
            const updated = [...payslips, newPayslip].sort((a, b) => {
                const dA = new Date(a.period.year, a.period.month - 1);
                const dB = new Date(b.period.year, b.period.month - 1);
                return dB.getTime() - dA.getTime();
            });
            setPayslips(updated);
            setAlert(null);
            setCurrentView(View.Dashboard);
            return;
        }

        // Controllo completo dei dati anagrafici
        if (!user) {
            setAlert("⚠️ Errore: Nessun utente autenticato.");
            setCurrentView(View.Dashboard);
            return;
        }

        // Funzione per normalizzare le date (supporta vari formati italiani e internazionali)
        const normalizeDate = (dateStr: string | undefined): string => {
            if (!dateStr) return "";
            const cleaned = dateStr.trim().replace(/\s+/g, '');
            
            // Prova a parsare diversi formati
            const patterns = [
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // D/M/YYYY o DD/MM/YYYY
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/,    // D-M-YYYY o DD-MM-YYYY
                /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,  // D.M.YYYY o DD.MM.YYYY
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/,    // YYYY-M-D o YYYY-MM-DD
                /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,  // YYYY/M/D o YYYY/MM/DD
                /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,  // YYYY.M.D o YYYY.MM.DD
            ];

            for (const pattern of patterns) {
                const match = cleaned.match(pattern);
                if (match) {
                    let day: string, month: string, year: string;
                    
                    // Se è YYYY-M-D (anno all'inizio)
                    if (match[1].length === 4) {
                        year = match[1];
                        month = match[2].padStart(2, '0');
                        day = match[3].padStart(2, '0');
                    } else {
                        // Se è D-M-YYYY (giorno all'inizio)
                        day = match[1].padStart(2, '0');
                        month = match[2].padStart(2, '0');
                        year = match[3];
                    }
                    
                    return `${day}/${month}/${year}`; // Normalizza in DD/MM/YYYY
                }
            }
            
            return cleaned; // Ritorna come è se non riconosciuto
        };

        // Funzione per normalizzare i luoghi e nomi (case-insensitive, trim, rimuovi spazi multipli, preserva apostrofi)
        const normalizePlace = (place: string | undefined): string => {
            if (!place) return "";
            return place.trim().toLowerCase()
                .replace(/\s+/g, ' ')  // Normalizza spazi multipli
                .replace(/'/g, "'")    // Normalizza apostrofi (smart quote → standard)
                .replace(/'/g, "'")    // Normalizza altri apostrofi
                .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Rimuovi accenti per confronto uniforme
        };

        // Verifica che TUTTI i campi richiesti siano presenti nel profilo (con controlli sicuri)
        const userProfileComplete = 
            user.firstName && user.firstName.trim() !== "" &&
            user.lastName && user.lastName.trim() !== "" &&
            user.dateOfBirth && user.dateOfBirth.trim() !== "" &&
            user.placeOfBirth && user.placeOfBirth.trim() !== "";

        if (!userProfileComplete) {
            setAlert(
                `⚠️ PROFILO INCOMPLETO - IMPOSSIBILE SALVARE\n\n` +
                `Per salvare le buste paga nell'archivio, devi completare il tuo profilo in Impostazioni con:\n\n` +
                `• Nome\n` +
                `• Cognome\n` +
                `• Data di nascita\n` +
                `• Luogo di nascita\n\n` +
                `📌 Puoi visualizzare l'analisi temporanea, ma non verrà salvata nell'archivio.\n` +
                `💡 Vai in Impostazioni e completa i tuoi dati anagrafici.`
            );
            setCurrentView(View.Dashboard);
            return;
        }

        // Verifica che TUTTI i campi richiesti siano presenti nella busta paga (con controlli sicuri)
        const payslipDataComplete =
            newPayslip.employee.firstName && newPayslip.employee.firstName.trim() !== "" &&
            newPayslip.employee.lastName && newPayslip.employee.lastName.trim() !== "" &&
            newPayslip.employee.dateOfBirth && newPayslip.employee.dateOfBirth.trim() !== "" &&
            newPayslip.employee.placeOfBirth && newPayslip.employee.placeOfBirth.trim() !== "";

        if (!payslipDataComplete) {
            setAlert(
                `⚠️ DATI INCOMPLETI NELLA BUSTA PAGA\n\n` +
                `La busta paga non contiene tutti i dati anagrafici necessari (nome, cognome, data di nascita, luogo di nascita).\n\n` +
                `📌 Puoi visualizzare l'analisi temporanea, ma non verrà salvata nell'archivio.\n` +
                `💡 Assicurati che la busta paga sia leggibile e contenga tutti i dati.`
            );
            setCurrentView(View.Dashboard);
            return;
        }

        // Confronto normalizzato di tutti i campi
        const firstNameMatch = normalizePlace(newPayslip.employee.firstName) === normalizePlace(user.firstName);
        const lastNameMatch = normalizePlace(newPayslip.employee.lastName) === normalizePlace(user.lastName);
        const dateOfBirthMatch = normalizeDate(newPayslip.employee.dateOfBirth) === normalizeDate(user.dateOfBirth);
        const placeOfBirthMatch = normalizePlace(newPayslip.employee.placeOfBirth) === normalizePlace(user.placeOfBirth);

        const allDataMatches = firstNameMatch && lastNameMatch && dateOfBirthMatch && placeOfBirthMatch;

        if (allDataMatches) {
            // DATI CORRISPONDENTI → Salva busta paga
            const updated = [...payslips, newPayslip].sort((a, b) => {
                const dA = new Date(a.period.year, a.period.month - 1);
                const dB = new Date(b.period.year, b.period.month - 1);
                return dB.getTime() - dA.getTime();
            });
            setPayslips(updated);
            setAlert(null);
        } else {
            // DATI NON CORRISPONDENTI → Solo analisi temporanea
            let mismatchDetails = "I seguenti dati non corrispondono:\n\n";
            if (!firstNameMatch) mismatchDetails += `• Nome: "${newPayslip.employee.firstName}" ≠ "${user.firstName}"\n`;
            if (!lastNameMatch) mismatchDetails += `• Cognome: "${newPayslip.employee.lastName}" ≠ "${user.lastName}"\n`;
            if (!dateOfBirthMatch) mismatchDetails += `• Data di nascita: "${newPayslip.employee.dateOfBirth}" ≠ "${user.dateOfBirth}"\n`;
            if (!placeOfBirthMatch) mismatchDetails += `• Luogo di nascita: "${newPayslip.employee.placeOfBirth}" ≠ "${user.placeOfBirth}"\n`;

            setAlert(
                `⚠️ ANALISI TEMPORANEA - DATI NON SALVATI\n\n` +
                `Questa busta paga non corrisponde ai tuoi dati anagrafici.\n\n` +
                mismatchDetails +
                `\n📌 Puoi visualizzare l'analisi ma NON verrà salvata nell'archivio.\n` +
                `💡 Se è la tua busta paga, verifica e aggiorna i tuoi dati in Impostazioni.`
            );
        }

        setCurrentView(View.Dashboard);
    };

    //
    // DELETE PAYSLIP FROM ARCHIVE
    //
    const handleDeletePayslip = (payslipId: string) => {
        setPayslips(prev => {
            const updated = prev.filter(p => p.id !== payslipId);
            return updated;
        });
    };

    //
    // COMPARE PAYSLIPS - Navigate to Compare view
    //
    const handleComparePayslips = (payslipsToCompareArr: [Payslip, Payslip]) => {
        if (!handleCreditConsumption(CREDIT_COSTS.COMPARISON_ANALYSIS)) {
            return;
        }
        setPayslipsToCompare(payslipsToCompareArr);
        setCurrentView(View.Compare);
    };

    //
    // LOGOUT
    //
    const handleLogout = async () => {
        await signOut(auth);

        localStorage.clear();
        setUser(null);
        setPayslips([]);
        setShifts([]);
        setLeavePlans([]);
        setAbsences([]);
        setSelectedPayslip(null);
        setPayslipsToCompare(null);
        setAlert(null);
        setCurrentView(View.Dashboard);
    };

    //
    // RENDER
    //
    if (!user) return <Login onLoginSuccess={setUser} />;

    return (
        <>
            <Layout user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout}>
                {(() => {
                    switch (currentView) {
                        case View.Dashboard:
                            return (
                                <Dashboard
                                    payslip={selectedPayslip}
                                    alert={alert}
                                    payslips={payslips}
                                    handleCreditConsumption={handleCreditConsumption}
                                />
                            );
                        case View.Upload:
                            return (
                                <Upload
                                    onAnalysisComplete={handleAnalysisComplete}
                                    handleCreditConsumption={handleCreditConsumption}
                                />
                            );
                        case View.Archive:
                            return (
                                <Archive
                                    payslips={payslips}
                                    onSelectPayslip={(p) => {
                                        setSelectedPayslip(p);
                                        setCurrentView(View.Dashboard);
                                    }}
                                    onCompare={handleComparePayslips}
                                    onDeletePayslip={handleDeletePayslip}
                                />
                            );
                        case View.Compare:
                            return <Compare payslips={payslipsToCompare} />;
                        case View.Assistant:
                            return (
                                <Assistant
                                    payslips={payslips}
                                    mode="general"
                                    handleCreditConsumption={handleCreditConsumption}
                                />
                            );
                        case View.AdminPanel:
                            return user.role === "admin"
                                ? <AdminPanel user={user} />
                                : <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} handleCreditConsumption={handleCreditConsumption} />;
                        case View.ShiftPlanner:
                            return <ShiftPlanner shifts={shifts} onSave={() => {}} onDelete={() => {}} absences={absences} onSaveAbsence={() => {}} onDeleteAbsence={() => {}} />;
                        case View.LeavePlanner:
                            return <LeavePlanner leavePlans={leavePlans} onSave={() => {}} onDelete={() => {}} />;
                        case View.Subscription:
                            return (
                                <Subscription
                                    user={user}
                                    onPlanChange={handlePlanChange}
                                    onAddCredits={handleAddCredits}
                                />
                            );
                        case View.Settings:
                            return <Settings user={user} onSave={() => {}} onPasswordChange={() => Promise.resolve()} />;
                        default:
                            return null;
                    }
                })()}
            </Layout>

            {showUpgradeModal && (
                <UpgradeModal
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgrade={() => {
                        setShowUpgradeModal(false);
                        setCurrentView(View.Subscription);
                    }}
                />
            )}
        </>
    );
};

export default App;
