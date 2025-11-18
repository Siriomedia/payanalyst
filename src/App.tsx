import React, { useState, useEffect } from 'react';
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

// FIREBASE
import { auth, db } from "./firebase.ts";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);

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
    // FIREBASE AUTH LISTENER
    //
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser) {
                setUser(null);
                return;
            }

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
                };

                setUser(mergedUser);
                window.localStorage.setItem("gioia_user", JSON.stringify(mergedUser));
            }
        });

        return () => unsub();
    }, []);

    //
    // SAVE USER (LOCALSTORAGE + FIRESTORE)
    //
    useEffect(() => {
        if (!user) {
            window.localStorage.removeItem("gioia_user");
            return;
        }

        window.localStorage.setItem("gioia_user", JSON.stringify(user));

        const saveToFirestore = async () => {
            if (!auth.currentUser) return;
            const ref = doc(db, "users", auth.currentUser.uid);
            await setDoc(ref, user, { merge: true });
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
    // REMOVE MONTHLY RESET (PIANO A)
    // → Nessun reset. Nessun credito gratis.
    //

    //
    // CREDIT USAGE
    //
    const handleCreditConsumption = (cost: number): boolean => {
        if (!user || user.credits < cost) {
            setShowUpgradeModal(true);
            return false;
        }

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
    // ANALYSIS COMPLETE
    //
    const handleAnalysisComplete = (newPayslip: Payslip) => {
        const namesMatch =
            user &&
            (user.role === "admin" ||
                (newPayslip.employee.firstName.trim().toLowerCase() === user.firstName.trim().toLowerCase() &&
                 newPayslip.employee.lastName.trim().toLowerCase() === user.lastName.trim().toLowerCase()));

        setSelectedPayslip(newPayslip);

        if (namesMatch) {
            const updated = [...payslips, newPayslip].sort((a, b) => {
                const dA = new Date(a.period.year, a.period.month - 1);
                const dB = new Date(b.period.year, b.period.month - 1);
                return dB.getTime() - dA.getTime();
            });
            setPayslips(updated);
            setAlert(null);
        } else {
            setAlert("Attenzione: i dati non corrispondono al profilo.");
        }

        setCurrentView(View.Dashboard);
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
                                    onSelectPayslip={setSelectedPayslip}
                                    onCompare={(p) =>
                                        handleCreditConsumption(CREDIT_COSTS.COMPARISON_ANALYSIS) &&
                                        setPayslipsToCompare(p)
                                    }
                                    onDeletePayslip={() => {}}
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
                                ? <AdminPanel users={[]} />
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
