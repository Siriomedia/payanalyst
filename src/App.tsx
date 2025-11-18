import React, { useState, useEffect, useMemo } from 'react';
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

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    
    const [user, setUser] = useState<User | null>(() => {
        try {
            const item = window.localStorage.getItem('gioia_user');
            if (!item) return null;

            const parsedUser = JSON.parse(item);
            
            // Validate the stored user object. It must have the newer properties.
            if (
                parsedUser &&
                typeof parsedUser === 'object' &&
                'email' in parsedUser &&
                'plan' in parsedUser &&
                'credits' in parsedUser &&
                'creditResetDate' in parsedUser
            ) {
                return parsedUser as User;
            }
    
            // If validation fails, the data is from an old version. Discard it.
            console.warn('Stale user data found in localStorage. Clearing for re-login.');
            window.localStorage.removeItem('gioia_user');
            return null;
        } catch (error) {
            console.error("Error reading or validating user from localStorage", error);
            // Clear potentially corrupted data
            window.localStorage.removeItem('gioia_user');
            return null;
        }
    });

    const [payslips, setPayslips] = useState<Payslip[]>(() => {
         try {
            const item = window.localStorage.getItem('gioia_payslips');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading payslips from localStorage", error);
            return [];
        }
    });
    
    const [shifts, setShifts] = useState<Shift[]>(() => {
        try {
            const item = window.localStorage.getItem('gioia_shifts');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading shifts from localStorage", error);
            return [];
        }
    });

    const [leavePlans, setLeavePlans] = useState<LeavePlan[]>(() => {
        try {
            const item = window.localStorage.getItem('gioia_leave_plans');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading leave plans from localStorage", error);
            return [];
        }
    });

    const [absences, setAbsences] = useState<Absence[]>(() => {
        try {
            const item = window.localStorage.getItem('gioia_absences');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading absences from localStorage", error);
            return [];
        }
    });


    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(payslips.length > 0 ? payslips[0] : null);
    const [payslipsToCompare, setPayslipsToCompare] = useState<[Payslip, Payslip] | null>(null);
    const [alert, setAlert] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        try {
            if (user) {
                const now = new Date();
                const resetDate = user.creditResetDate ? new Date(user.creditResetDate) : null;

                if (resetDate && now > resetDate) {
                    const planDetails = PLANS[user.plan];
                    const newResetDate = new Date(now.getFullYear(), now.getMonth(), 27);
                     if (now.getDate() >= 27) {
                        newResetDate.setMonth(newResetDate.getMonth() + 1);
                    }
                    const updatedUser = {
                        ...user,
                        credits: planDetails.credits,
                        creditResetDate: newResetDate.toISOString(),
                    };
                    setUser(updatedUser);
                    window.localStorage.setItem('gioia_user', JSON.stringify(updatedUser));
                } else {
                    window.localStorage.setItem('gioia_user', JSON.stringify(user));
                }

            } else {
                 window.localStorage.removeItem('gioia_user');
            }
        } catch (error) {
            console.error("Error in user effect", error);
        }
    }, [user]);

    useEffect(() => {
        try {
            window.localStorage.setItem('gioia_payslips', JSON.stringify(payslips));
        } catch (error) {
            console.error("Error saving payslips to localStorage", error);
        }
    }, [payslips]);
    
    useEffect(() => {
        try {
            window.localStorage.setItem('gioia_shifts', JSON.stringify(shifts));
        } catch (error) {
            console.error("Error saving shifts to localStorage", error);
        }
    }, [shifts]);

    useEffect(() => {
        try {
            window.localStorage.setItem('gioia_leave_plans', JSON.stringify(leavePlans));
        } catch (error) {
            console.error("Error saving leave plans to localStorage", error);
        }
    }, [leavePlans]);
    
    useEffect(() => {
        try {
            window.localStorage.setItem('gioia_absences', JSON.stringify(absences));
        } catch (error) {
            console.error("Error saving absences to localStorage", error);
        }
    }, [absences]);

    const handleCreditConsumption = (cost: number): boolean => {
      if (!user || user.credits < cost) {
          setShowUpgradeModal(true);
          return false;
      }
      setUser(prevUser => {
          if (!prevUser) return null;
          return { ...prevUser, credits: prevUser.credits - cost };
      });
      return true;
    };
    
    const handlePlanChange = (newPlan: Plan) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const now = new Date();
            const newResetDate = new Date(now.getFullYear(), now.getMonth(), 27);
             if (now.getDate() >= 27) {
                newResetDate.setMonth(newResetDate.getMonth() + 1);
            }
            return { 
                ...prevUser, 
                plan: newPlan,
                credits: PLANS[newPlan].credits, // Reset credits on plan change
                creditResetDate: newResetDate.toISOString(),
            };
        });
        setCurrentView(View.Dashboard); // Navigate to dashboard after upgrade
    };

    const handleAnalysisComplete = (newPayslip: Payslip) => {
        const namesMatch = user &&
            (user.role === 'admin' || 
            (newPayslip.employee.firstName.trim().toLowerCase() === user.firstName.trim().toLowerCase() &&
             newPayslip.employee.lastName.trim().toLowerCase() === user.lastName.trim().toLowerCase()));

        setSelectedPayslip(newPayslip);

        if (namesMatch) {
            const updatedPayslips = [...payslips, newPayslip].sort((a, b) => {
                const dateA = new Date(a.period.year, a.period.month - 1);
                const dateB = new Date(b.period.year, b.period.month - 1);
                return dateB.getTime() - dateA.getTime();
            });
            setPayslips(updatedPayslips);
            setAlert(null);
        } else {
            setAlert("Attenzione: I dati anagrafici sulla busta paga non corrispondono al tuo profilo. Questa analisi è temporanea e non verrà salvata nell'archivio.");
        }
        
        setCurrentView(View.Dashboard);
    };
    
    const handleSelectPayslipForDashboard = (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setAlert(null);
        setCurrentView(View.Dashboard);
    };

    const handleCompare = (payslipsForComparison: [Payslip, Payslip]) => {
        if (handleCreditConsumption(CREDIT_COSTS.COMPARISON_ANALYSIS)) {
            setPayslipsToCompare(payslipsForComparison);
            setCurrentView(View.Compare);
        }
    }
    
    const handleDeletePayslip = (payslipId: string) => {
        const updatedPayslips = payslips.filter(p => p.id !== payslipId);
        setPayslips(updatedPayslips);
        if(selectedPayslip?.id === payslipId){
           setSelectedPayslip(updatedPayslips.length > 0 ? updatedPayslips[0] : null);
        }
        if (currentView === View.Dashboard && updatedPayslips.length === 0) {
            setSelectedPayslip(null);
        }
    }
    
    const handleUpdateUser = (updatedUserData: Omit<User, 'role' | 'email' | 'password' | 'plan' | 'credits' | 'creditResetDate'>) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            const newUser = { ...prevUser, ...updatedUserData };
            return newUser;
        });
    };
    
    const handlePasswordChange = (newPassword: string): Promise<void> => {
        return new Promise((resolve) => {
             setUser(prevUser => {
                if (!prevUser) return null;
                return { ...prevUser, password: newPassword };
            });
            resolve();
        });
    };


    const handleSaveShift = (shift: Shift) => {
        setShifts(prev => {
            const existing = prev.find(s => s.date === shift.date);
            if(existing) {
                 return prev.map(s => s.date === shift.date ? {...shift, id: existing.id } : s);
            }
            const index = prev.findIndex(s => s.id === shift.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = shift;
                return updated;
            }
            return [...prev, shift];
        });
        setAbsences(prev => prev.filter(a => a.date !== shift.date));
    };

    const handleDeleteShift = (shiftId: string) => {
        setShifts(prev => prev.filter(s => s.id !== shiftId));
    };

    const handleSaveLeavePlan = (plan: LeavePlan) => {
        setLeavePlans(prev => {
            const index = prev.findIndex(p => p.id === plan.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = plan;
                return updated;
            }
            return [...prev, plan];
        });
    };

    const handleDeleteLeavePlan = (planId: string) => {
        setLeavePlans(prev => prev.filter(p => p.id !== planId));
    };

    const handleSaveAbsence = (absence: Absence) => {
        setAbsences(prev => {
            const existing = prev.find(a => a.date === absence.date);
             if(existing) {
                 return prev.map(a => a.date === absence.date ? {...absence, id: existing.id } : a);
            }
            const index = prev.findIndex(a => a.id === absence.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = absence;
                return updated;
            }
            return [...prev, absence];
        });
        setShifts(prev => prev.filter(s => s.date !== absence.date));
    };

    const handleDeleteAbsence = (absenceId: string) => {
        setAbsences(prev => prev.filter(a => a.id !== absenceId));
    };

    const handleLogout = () => {
        window.localStorage.removeItem('gioia_user');
        window.localStorage.removeItem('gioia_payslips');
        window.localStorage.removeItem('gioia_shifts');
        window.localStorage.removeItem('gioia_leave_plans');
        window.localStorage.removeItem('gioia_absences');

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

    const registeredUsers = useMemo(() => {
        const usersMap = new Map<string, User>();
        if (user) {
            const userKey = user.taxId || user.email;
            usersMap.set(userKey, user);
        }
        payslips.forEach(p => {
            const employeeTaxId = p.employee.taxId;
            if (employeeTaxId && !usersMap.has(employeeTaxId)) {
                // This is a partial user object, let's create it carefully
                usersMap.set(employeeTaxId, {
                    firstName: p.employee.firstName,
                    lastName: p.employee.lastName,
                    taxId: employeeTaxId,
                    email: `(non disponibile)`,
                    dateOfBirth: '',
                    placeOfBirth: '',
                    role: 'user',
                    plan: 'free',
                    credits: 0,
                    creditResetDate: new Date().toISOString()
                });
            }
        });
        return Array.from(usersMap.values());
    }, [payslips, user]);


    const renderView = () => {
        switch (currentView) {
            case View.Dashboard:
                return <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} handleCreditConsumption={handleCreditConsumption} />;
            case View.Upload:
                return <Upload onAnalysisComplete={handleAnalysisComplete} handleCreditConsumption={handleCreditConsumption} />;
            case View.Archive:
                return <Archive 
                            payslips={payslips} 
                            onSelectPayslip={handleSelectPayslipForDashboard} 
                            onCompare={handleCompare}
                            onDeletePayslip={handleDeletePayslip}
                        />;
            case View.Compare:
                return <Compare payslips={payslipsToCompare} />;
            case View.Assistant:
                return <Assistant payslips={payslips} mode="general" handleCreditConsumption={handleCreditConsumption} />;
            case View.AdminPanel:
                 return user?.role === 'admin' ? <AdminPanel users={registeredUsers} /> : <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} handleCreditConsumption={handleCreditConsumption} />;
            case View.ShiftPlanner:
                return <ShiftPlanner 
                            shifts={shifts} 
                            onSave={handleSaveShift} 
                            onDelete={handleDeleteShift}
                            absences={absences}
                            onSaveAbsence={handleSaveAbsence}
                            onDeleteAbsence={handleDeleteAbsence}
                        />;
            case View.LeavePlanner:
                return <LeavePlanner leavePlans={leavePlans} onSave={handleSaveLeavePlan} onDelete={handleDeleteLeavePlan} />;
             case View.Subscription:
                return <Subscription user={user!} onPlanChange={handlePlanChange} />;
            case View.Settings:
                return <Settings user={user!} onSave={handleUpdateUser} onPasswordChange={handlePasswordChange} />;
            default:
                return <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} handleCreditConsumption={handleCreditConsumption} />;
        }
    };
    
    if (!user) {
        return <Login onLoginSuccess={setUser} />;
    }

    return (
        <>
            <Layout user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout}>
                {renderView()}
            </Layout>
            {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={() => { setShowUpgradeModal(false); setCurrentView(View.Subscription); }} />}
        </>
    );
};

export default App;