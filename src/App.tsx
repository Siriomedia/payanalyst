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
import ProfileOnboarding from './components/ProfileOnboarding.tsx';
import PayrollReference from './components/PayrollReference.tsx';

import { View, Payslip, User, Shift, LeavePlan, Absence, Plan } from './types.ts';
import { PLANS, CREDIT_COSTS } from './config/plans.ts';
import { normalizeTimestamp } from './utils/timestampHelpers.ts';

// FIREBASE
import { auth, db } from "./firebase.ts";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, increment, updateDoc, serverTimestamp } from "firebase/firestore";

const APP_VERSION = "2.0.0";

const App: React.FC = () => {
    // VERIFICA VERSIONE APP (senza cancellare dati utente)
    useEffect(() => {
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion !== APP_VERSION) {
            console.log('Nuova versione rilevata:', APP_VERSION);
            localStorage.setItem('app_version', APP_VERSION);
            // NON cancelliamo più i dati utente - tutto è in Firestore
        }
    }, []);

    // Ripristina currentView da localStorage
    const [currentView, setCurrentView] = useState<View>(() => {
        try {
            const saved = localStorage.getItem('gioia_currentView');
            return saved ? (saved as View) : View.Dashboard;
        } catch {
            return View.Dashboard;
        }
    });

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
        try {
            const loaded = JSON.parse(localStorage.getItem("gioia_payslips") || "[]");

            // Verifica e rigenera ID duplicati
            const ids = new Set<string>();
            const fixed = loaded.map((p: Payslip) => {
                if (!p.id || ids.has(p.id)) {
                    // ID mancante o duplicato - rigenera
                    const newId = `payslip-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                    console.warn('ID duplicato o mancante trovato, rigenerato:', newId);
                    ids.add(newId);
                    return { ...p, id: newId };
                }
                ids.add(p.id);
                return p;
            });

            return fixed;
        }
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

    // Ripristina selectedPayslip da localStorage
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(() => {
        try {
            const saved = localStorage.getItem('gioia_selectedPayslip');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed as Payslip;
            }
        } catch {
            // Ignore
        }
        return payslips.length > 0 ? payslips[0] : null;
    });

    const [payslipsToCompare, setPayslipsToCompare] = useState<Payslip[] | null>(null);
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

    // Persist currentView to localStorage
    useEffect(() => {
        localStorage.setItem('gioia_currentView', currentView);
    }, [currentView]);

    // Persist selectedPayslip to localStorage
    useEffect(() => {
        if (selectedPayslip) {
            localStorage.setItem('gioia_selectedPayslip', JSON.stringify(selectedPayslip));
        }
    }, [selectedPayslip]);

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
        console.log('======================================');
        console.log('CHIAMATA handleAnalysisComplete');
        console.log('Busta paga - Nome:', newPayslip.employee.firstName, 'Cognome:', newPayslip.employee.lastName);
        console.log('Profilo utente - Nome:', user?.firstName, 'Cognome:', user?.lastName);
        console.log('Utente è admin?', user?.role === 'admin');
        console.log('======================================');

        setSelectedPayslip(newPayslip);

        // Admin bypassa tutti i controlli
        if (user && user.role === "admin") {
            console.log('🔑 UTENTE ADMIN: Bypassa controlli e salva sempre');
            const updated = [...payslips, newPayslip].sort((a, b) => {
                const dA = new Date(a.period.year, a.period.month - 1);
                const dB = new Date(b.period.year, b.period.month - 1);
                return dB.getTime() - dA.getTime();
            });
            setPayslips(updated);
            console.log('✅ Admin: Busta paga salvata. Archivio contiene', updated.length, 'buste paga');
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

        // Verifica che nome e cognome siano presenti nel profilo
        const userProfileComplete =
            user.firstName && user.firstName.trim() !== "" &&
            user.lastName && user.lastName.trim() !== "";

        if (!userProfileComplete) {
            setAlert(
                `⚠️ PROFILO INCOMPLETO - IMPOSSIBILE SALVARE\n\n` +
                `Per salvare le buste paga nell'archivio, devi completare il tuo profilo in Impostazioni con:\n\n` +
                `• Nome\n` +
                `• Cognome\n\n` +
                `📌 Puoi visualizzare l'analisi temporanea, ma non verrà salvata nell'archivio.\n` +
                `💡 Vai in Impostazioni e completa i tuoi dati anagrafici.`
            );
            setCurrentView(View.Dashboard);
            return;
        }

        // Verifica che nome e cognome siano presenti nella busta paga
        const payslipDataComplete =
            newPayslip.employee.firstName && newPayslip.employee.firstName.trim() !== "" &&
            newPayslip.employee.lastName && newPayslip.employee.lastName.trim() !== "";

        if (!payslipDataComplete) {
            setAlert(
                `⚠️ DATI INCOMPLETI NELLA BUSTA PAGA\n\n` +
                `La busta paga non contiene nome e cognome del dipendente.\n\n` +
                `📌 Puoi visualizzare l'analisi temporanea, ma non verrà salvata nell'archivio.\n` +
                `💡 Assicurati che la busta paga sia leggibile e contenga tutti i dati.`
            );
            setCurrentView(View.Dashboard);
            return;
        }

        // Confronto normalizzato di nome e cognome
        const firstNameMatch = normalizePlace(newPayslip.employee.firstName) === normalizePlace(user.firstName);
        const lastNameMatch = normalizePlace(newPayslip.employee.lastName) === normalizePlace(user.lastName);

        const nameMatches = firstNameMatch && lastNameMatch;

        console.log('=== CONFRONTO DATI ANAGRAFICI ===');
        console.log('Busta paga - Nome:', newPayslip.employee.firstName, '→ Normalizzato:', normalizePlace(newPayslip.employee.firstName));
        console.log('Profilo - Nome:', user.firstName, '→ Normalizzato:', normalizePlace(user.firstName));
        console.log('Nome corrisponde?', firstNameMatch);
        console.log('Busta paga - Cognome:', newPayslip.employee.lastName, '→ Normalizzato:', normalizePlace(newPayslip.employee.lastName));
        console.log('Profilo - Cognome:', user.lastName, '→ Normalizzato:', normalizePlace(user.lastName));
        console.log('Cognome corrisponde?', lastNameMatch);
        console.log('Risultato finale - Salva in archivio?', nameMatches);

        if (nameMatches) {
            // DATI CORRISPONDENTI → Salva busta paga
            console.log('✅ SALVATAGGIO IN ARCHIVIO: Nome e cognome corrispondono');
            const updated = [...payslips, newPayslip].sort((a, b) => {
                const dA = new Date(a.period.year, a.period.month - 1);
                const dB = new Date(b.period.year, b.period.month - 1);
                return dB.getTime() - dA.getTime();
            });
            setPayslips(updated);
            console.log('✅ Busta paga salvata. Archivio ora contiene', updated.length, 'buste paga');
            setAlert(null);
        } else {
            // DATI NON CORRISPONDENTI → Solo analisi temporanea, NON salvare
            console.log('❌ NON SALVATO: Nome e/o cognome NON corrispondono');
            console.log('❌ La busta paga NON viene aggiunta all\'archivio');
            setAlert(
                `⚠️ ATTENZIONE: DATI NON CORRISPONDENTI\n\n` +
                `I dati di questa busta paga NON corrispondono all'utente registrato:\n\n` +
                `• Nome sulla busta paga: "${newPayslip.employee.firstName}"\n` +
                `• Nome nel tuo profilo: "${user.firstName}"\n\n` +
                `• Cognome sulla busta paga: "${newPayslip.employee.lastName}"\n` +
                `• Cognome nel tuo profilo: "${user.lastName}"\n\n` +
                `✅ Puoi visualizzare l'analisi della busta paga\n` +
                `❌ I dati NON verranno salvati nell'archivio\n\n` +
                `💡 Se questa è la tua busta paga, aggiorna i tuoi dati in Impostazioni.`
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
    const handleComparePayslips = (payslipsToCompareArr: Payslip[]) => {
        const canProceed = handleCreditConsumption(CREDIT_COSTS.COMPARISON_ANALYSIS);
        if (!canProceed) {
            return;
        }

        setPayslipsToCompare(payslipsToCompareArr);

        setTimeout(() => {
            setCurrentView(View.Compare);
        }, 0);
    };

    //
    // HANDLE ONBOARDING COMPLETE
    //
    const handleOnboardingComplete = async (updatedData: { firstName: string; lastName: string; dateOfBirth: string; placeOfBirth: string }) => {
        if (!user || !auth.currentUser) return;

        const updatedUser: User = {
            ...user,
            ...updatedData,
        };

        setUser(updatedUser);

        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, updatedData, { merge: true });
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

    const isProfileComplete = user.dateOfBirth && user.dateOfBirth.trim() !== '' &&
                              user.placeOfBirth && user.placeOfBirth.trim() !== '';

    if (!isProfileComplete) {
        return <ProfileOnboarding user={user} onComplete={handleOnboardingComplete} />;
    }

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
                                    user={user}
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
                            return <Settings user={user} onSave={async (updatedData) => {
                                if (!auth.currentUser) return;

                                const updatedUser: User = {
                                    ...user,
                                    ...updatedData,
                                };

                                setUser(updatedUser);

                                const userRef = doc(db, "users", auth.currentUser.uid);
                                await setDoc(userRef, updatedData, { merge: true });
                            }} onPasswordChange={() => Promise.resolve()} />;
                        case View.PayrollReference:
                            return <PayrollReference />;
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
