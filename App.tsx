import React, { useState, useEffect, useMemo } from 'react';
import Layout from './src/components/Layout.tsx';
import Dashboard from './src/components/Dashboard.tsx';
import Upload from './src/components/Upload.tsx';
import Archive from './src/components/Archive.tsx';
import Compare from './src/components/Compare.tsx';
import Assistant from './src/components/Assistant.tsx';
import Login from './src/components/Login.tsx';
import Settings from './src/components/Settings.tsx';
import ShiftPlanner from './src/components/ShiftPlanner.tsx';
import LeavePlanner from './src/components/LeavePlanner.tsx';
import AdminPanel from './src/components/AdminPanel.tsx';
import { View, Payslip, User, Shift, LeavePlan, Absence } from './src/types.ts';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    
    const [user, setUser] = useState<User | null>(() => {
        try {
            const item = window.localStorage.getItem('gioia_user');
            const parsedItem = item ? JSON.parse(item) : null;
            if (parsedItem && typeof parsedItem === 'object' && 'firstName' in parsedItem) {
                return parsedItem;
            }
            if(item) window.localStorage.removeItem('gioia_user');
            return null;
        } catch (error) {
            console.error("Error reading user from localStorage", error);
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
            window.localStorage.removeItem('gioia_payslips');
            return [];
        }
    });
    
    const [shifts, setShifts] = useState<Shift[]>(() => {
        try {
            const item = window.localStorage.getItem('gioia_shifts');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading shifts from localStorage", error);
            window.localStorage.removeItem('gioia_shifts');
            return [];
        }
    });

    const [leavePlans, setLeavePlans] = useState<LeavePlan[]>(() => {
        try {
            const item = window.localStorage.getItem('gioia_leave_plans');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading leave plans from localStorage", error);
            window.localStorage.removeItem('gioia_leave_plans');
            return [];
        }
    });

    const [absences, setAbsences] = useState<Absence[]>(() => {
        try {
            const item = window.localStorage.getItem('gioia_absences');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error("Error reading absences from localStorage", error);
            window.localStorage.removeItem('gioia_absences');
            return [];
        }
    });


    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(payslips.length > 0 ? payslips[0] : null);
    const [payslipsToCompare, setPayslipsToCompare] = useState<[Payslip, Payslip] | null>(null);
    const [alert, setAlert] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (user) {
                window.localStorage.setItem('gioia_user', JSON.stringify(user));
            } else {
                 window.localStorage.removeItem('gioia_user');
            }
        } catch (error) {
            console.error("Error saving user to localStorage", error);
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
        setPayslipsToCompare(payslipsForComparison);
        setCurrentView(View.Compare);
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
    
    const handleUpdateUser = (updatedUserData: Omit<User, 'role' | 'email' | 'password'>) => {
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
                usersMap.set(employeeTaxId, {
                    firstName: p.employee.firstName,
                    lastName: p.employee.lastName,
                    taxId: employeeTaxId,
                    email: `(non disponibile)`,
                    dateOfBirth: '',
                    placeOfBirth: '',
                    role: 'user',
                    // FIX: Add missing properties 'plan', 'credits', and 'creditResetDate' to the user object to conform to the updated User type.
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
                return <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} />;
            case View.Upload:
                return <Upload onAnalysisComplete={handleAnalysisComplete} />;
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
                return <Assistant payslips={payslips} mode="general" />;
            case View.AdminPanel:
                 return user?.role === 'admin' ? <AdminPanel users={registeredUsers} /> : <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} />;
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
            case View.Settings:
                return <Settings user={user!} onSave={handleUpdateUser} onPasswordChange={handlePasswordChange} />;
            default:
                return <Dashboard payslip={selectedPayslip} alert={alert} payslips={payslips} />;
        }
    };
    
    if (!user) {
        return <Login onLoginSuccess={setUser} />;
    }

    return (
        <Layout user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout}>
            {renderView()}
        </Layout>
    );
};

export default App;