import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar.tsx';
import { MenuIcon } from './common/Icons.tsx';
import { View, User } from '../types.ts';

interface LayoutProps {
    children: ReactNode;
    user: User | null;
    currentView: View;
    setCurrentView: (view: View) => void;
    onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, setCurrentView, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile overlay
    const [isCollapsed, setIsCollapsed] = useState(false); // For desktop collapse

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar
                user={user}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                currentView={currentView}
                setCurrentView={setCurrentView}
                onLogout={onLogout}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center px-2 sm:px-4 pb-3 sm:pb-4 bg-white border-b border-gray-200 md:justify-end pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-[calc(1rem+env(safe-area-inset-top))] print:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden text-gray-500 hover:text-blue-600 focus:outline-none p-1"
                        aria-label="Apri menu"
                    >
                        <MenuIcon />
                    </button>
                    <div className="flex items-center space-x-1.5 sm:space-x-4">
                        {user && (
                            <div 
                                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setCurrentView(View.Subscription)}
                                title="Clicca per gestire crediti e abbonamenti"
                            >
                                <span className="text-lg sm:text-2xl">💎</span>
                                <div className="text-right">
                                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium">Crediti</div>
                                    <div className="text-sm sm:text-lg font-bold text-blue-600">
                                        {user.role === 'admin' ? '∞' : user.credits}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs sm:text-sm font-semibold text-gray-700">{user ? `${user.firstName} ${user.lastName}` : 'Utente'}</div>
                                {user && user.role === 'admin' && (
                                    <div className="text-[10px] sm:text-xs text-blue-600 font-semibold">🔐 Admin</div>
                                )}
                            </div>
                            <img
                                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-blue-200"
                                src={user ? `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D8ABC&color=fff` : `https://ui-avatars.com/api/?name=?&background=0D8ABC&color=fff`}
                                alt="User avatar"
                            />
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-3 sm:p-4 md:p-8">
                    {children}
                </main>
                 <footer className="text-center px-2 sm:px-4 pt-3 sm:pt-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gray-100 text-[10px] sm:text-xs text-gray-500 print:hidden">
                    <p className="mb-1">© {new Date().getFullYear()} GioIA | Ideato, sviluppato e finanziato da Gennaro Carandente e Giovanni De Rosa.</p>
                    <p className="hidden sm:block">Tutti i diritti sono riservati. È vietata qualsiasi riproduzione, anche parziale.</p>
                </footer>
            </div>
        </div>
    );
};

export default Layout;