import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import Upload from './components/Upload.tsx';
import Archive from './components/Archive.tsx';
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

import { View, Payslip, User, Shift, LeavePlan, Absence } from './types.ts';
import { PLANS, CREDIT_COSTS } from './config/plans.ts';
import { supabase } from './supabase.ts';
import { loadUserData, saveUserData } from './services/authService.ts';

const APP_VERSION = "2.0.0";

const App: React.FC = () => {
    useEffect(() => {
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion !== APP_VERSION) {
            console.log('Nuova versione rilevata:', APP_VERSION);
            localStorage.setItem('app_version', APP_VERSION);
        }
    }, []);

    const [currentView, setCurrentView] = useState<View>(() => {
        try {
            const saved = localStorage.getItem('gioia_currentView');
            return saved ? (saved as View) : View.Dashboard;
        } catch {
            return View.Dashboard;
        }
    });

    const isUpdatingFromDatabase = useRef(false);

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

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setUser(null);
                localStorage.removeItem('gioia_user');
                return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                const userData = await loadUserData(session.user.id);

                if (userData) {
                    const mergedUser: User = {
                        email: userData.email || session.user.email || '',
                        firstName: userData.first_name || '',
                        lastName: userData.last_name || '',
                        role: userData.role || 'user',
                        dateOfBirth: userData.date_of_birth || '',
                        placeOfBirth: userData.place_of_birth || '',
                        plan: userData.plan || 'free',
                        credits: userData.credits ?? 10,
                        creditResetDate: '',
                        taxId: userData.tax_id || '',
                        createdAt: userData.created_at ? new Date(userData.created_at).getTime() : Date.now(),
                    };

                    setUser(mergedUser);
                    window.localStorage.setItem("gioia_user", JSON.stringify(mergedUser));
                } else {
                    const newUserData: User = {
                        email: session.user.email || '',
                        firstName: '',
                        lastName: '',
                        role: 'user',
                        dateOfBirth: '',
                        placeOfBirth: '',
                        plan: 'free',
                        credits: 10,
                        creditResetDate: '',
                        taxId: '',
                        createdAt: Date.now(),
                    };

                    await saveUserData(session.user.id, {
                        email: newUserData.email,
                        first_name: newUserData.firstName,
                        last_name: newUserData.lastName,
                        role: newUserData.role,
                        plan: newUserData.plan,
                        credits: newUserData.credits,
                    });

                    setUser(newUserData);
                    window.localStorage.setItem("gioia_user", JSON.stringify(newUserData));
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!user || isUpdatingFromDatabase.current) return;

        const saveData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { createdAt, creditResetDate, ...userDataToSave } = user;

            await saveUserData(session.user.id, {
                email: userDataToSave.email,
                first_name: userDataToSave.firstName,
                last_name: userDataToSave.lastName,
                role: userDataToSave.role,
                date_of_birth: userDataToSave.dateOfBirth,
                place_of_birth: userDataToSave.placeOfBirth,
                plan: userDataToSave.plan,
                credits: userDataToSave.credits,
                tax_id: userDataToSave.taxId,
            });

            window.localStorage.setItem("gioia_user", JSON.stringify(user));
        };

        saveData();
    }, [user]);

    const [payslips, setPayslips] = useState<Payslip[]>(() => {
        const stored = localStorage.getItem('gioia_payslips');
        return stored ? JSON.parse(stored) : [];
    });

    const [shifts, setShifts] = useState<Shift[]>(() => {
        const stored = localStorage.getItem('gioia_shifts');
        return stored ? JSON.parse(stored) : [];
    });

    const [leavePlans, setLeavePlans] = useState<LeavePlan[]>(() => {
        const stored = localStorage.getItem('gioia_leavePlans');
        return stored ? JSON.parse(stored) : [];
    });

    const [absences, setAbsences] = useState<Absence[]>(() => {
        const stored = localStorage.getItem('gioia_absences');
        return stored ? JSON.parse(stored) : [];
    });

    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(() => {
        try {
            const saved = localStorage.getItem('gioia_selectedPayslip');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed;
            }
        } catch {}
        return null;
    });

    const [alert, setAlert] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [databaseContext, setDatabaseContext] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('gioia_currentView', currentView);
    }, [currentView]);

    useEffect(() => {
        localStorage.setItem('gioia_payslips', JSON.stringify(payslips));
    }, [payslips]);

    useEffect(() => {
        localStorage.setItem('gioia_shifts', JSON.stringify(shifts));
    }, [shifts]);

    useEffect(() => {
        localStorage.setItem('gioia_leavePlans', JSON.stringify(leavePlans));
    }, [leavePlans]);

    useEffect(() => {
        localStorage.setItem('gioia_absences', JSON.stringify(absences));
    }, [absences]);

    useEffect(() => {
        if (selectedPayslip) {
            localStorage.setItem('gioia_selectedPayslip', JSON.stringify(selectedPayslip));
        }
    }, [selectedPayslip]);

    const handleCreditConsumption = async (cost: number): boolean => {
        if (!user) return false;

        if (user.credits < cost) {
            setShowUpgradeModal(true);
            return false;
        }

        const updatedUser = { ...user, credits: user.credits - cost };
        setUser(updatedUser);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase
                .from('users')
                .update({ credits: updatedUser.credits })
                .eq('id', session.user.id);
        }

        return true;
    };

    const handleAnalysisComplete = (payslip: Payslip) => {
        const existingIndex = payslips.findIndex(
            (p) => p.period.year === payslip.period.year && p.period.month === payslip.period.month
        );

        let updatedPayslips: Payslip[];
        if (existingIndex !== -1) {
            updatedPayslips = [...payslips];
            updatedPayslips[existingIndex] = payslip;
        } else {
            updatedPayslips = [...payslips, payslip];
        }

        setPayslips(updatedPayslips);
        setSelectedPayslip(payslip);
        setAlert('Analisi completata con successo');
        setCurrentView(View.Dashboard);
    };

    const handleDeletePayslip = (payslipId: string) => {
        const updatedPayslips = payslips.filter((p) => {
            const id = `${p.period.year}-${p.period.month}`;
            return id !== payslipId;
        });

        setPayslips(updatedPayslips);

        if (selectedPayslip) {
            const currentId = `${selectedPayslip.period.year}-${selectedPayslip.period.month}`;
            if (currentId === payslipId) {
                setSelectedPayslip(null);
            }
        }

        setAlert('Busta paga eliminata');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setPayslips([]);
        setSelectedPayslip(null);
        localStorage.clear();
    };

    const handleOnboardingComplete = async (updatedData: { firstName: string; lastName: string; dateOfBirth: string; placeOfBirth: string }) => {
        if (!user) return;

        const updatedUser: User = {
            ...user,
            ...updatedData,
        };

        setUser(updatedUser);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await saveUserData(session.user.id, {
                first_name: updatedData.firstName,
                last_name: updatedData.lastName,
                date_of_birth: updatedData.dateOfBirth,
                place_of_birth: updatedData.placeOfBirth,
            });
        }
    };

    const needsProfileSetup = user && (!user.firstName || !user.lastName || !user.dateOfBirth || !user.placeOfBirth);

    if (!user) {
        return <Login onLoginSuccess={() => {}} />;
    }

    if (needsProfileSetup && currentView !== View.Settings) {
        return (
            <ProfileOnboarding
                user={user}
                onComplete={handleOnboardingComplete}
                onSkip={() => setCurrentView(View.Dashboard)}
            />
        );
    }

    const getCurrentUserId = async (): Promise<string | undefined> => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Layout
                onNavigate={setCurrentView}
                currentView={currentView}
                user={user}
                onLogout={handleLogout}
            >
                {(() => {
                    switch (currentView) {
                        case View.Dashboard:
                            return (
                                <Dashboard
                                    payslip={selectedPayslip}
                                    alert={alert}
                                    payslips={payslips}
                                    handleCreditConsumption={handleCreditConsumption}
                                    userId={(async () => await getCurrentUserId())() as any}
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
                                    onDeletePayslip={handleDeletePayslip}
                                    userId={(async () => await getCurrentUserId())() as any}
                                    onAnalyzeWithAssistant={(csvData) => {
                                        setDatabaseContext(csvData);
                                        setCurrentView(View.Assistant);
                                    }}
                                />
                            );
                        case View.Assistant:
                            return (
                                <Assistant
                                    payslips={payslips}
                                    mode="general"
                                    handleCreditConsumption={handleCreditConsumption}
                                    userId={(async () => await getCurrentUserId())() as any}
                                    externalDatabaseContext={databaseContext}
                                    onClearDatabaseContext={() => setDatabaseContext(null)}
                                />
                            );
                        case View.AdminPanel:
                            return user.role === "admin"
                                ? <AdminPanel user={user} />
                                : <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} handleCreditConsumption={handleCreditConsumption} userId={(async () => await getCurrentUserId())() as any} />;
                        case View.ShiftPlanner:
                            return <ShiftPlanner shifts={shifts} onSave={() => {}} onDelete={() => {}} absences={absences} onSaveAbsence={() => {}} onDeleteAbsence={() => {}} />;
                        case View.LeavePlanner:
                            return (
                                <LeavePlanner
                                    leavePlans={leavePlans}
                                    onSave={() => {}}
                                    onDelete={() => {}}
                                />
                            );
                        case View.Settings:
                            return <Settings user={user} onSave={async (updatedData) => {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session) return;

                                const updatedUser: User = {
                                    ...user,
                                    ...updatedData,
                                };

                                setUser(updatedUser);

                                await saveUserData(session.user.id, {
                                    first_name: updatedData.firstName,
                                    last_name: updatedData.lastName,
                                    date_of_birth: updatedData.dateOfBirth,
                                    place_of_birth: updatedData.placeOfBirth,
                                    tax_id: updatedData.taxId,
                                });
                            }} onPasswordChange={() => Promise.resolve()} />;
                        case View.PayrollReference:
                            return <PayrollReference />;
                        case View.Subscription:
                            return <Subscription user={user} onPlanChange={(newPlan) => setUser({ ...user, plan: newPlan })} />;
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
                    userPlan={user.plan}
                />
            )}
        </div>
    );
};

export default App;
