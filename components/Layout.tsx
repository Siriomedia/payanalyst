import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar.tsx';
import { MenuIcon } from './common/Icons.tsx';
import { View, User } from '../types.ts';

interface LayoutProps {
    children: ReactNode;
    user: User | null;
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, setCurrentView }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile overlay
    const [isCollapsed, setIsCollapsed] = useState(false); // For desktop collapse

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar
                isOpen={sidebarOpen}
                // FIX: Passed the correct state setter 'setSidebarOpen' to the 'setIsOpen' prop.
                setIsOpen={setSidebarOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                currentView={currentView}
                setCurrentView={setCurrentView}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center px-4 pb-4 bg-white border-b border-gray-200 md:justify-end pt-[calc(1rem+env(safe-area-inset-top))] print:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden text-gray-500 hover:text-blue-600 focus:outline-none"
                        aria-label="Apri menu"
                    >
                        <MenuIcon />
                    </button>
                    <div className="flex items-center">
                        <span className="text-gray-600 font-semibold">{user ? `${user.firstName} ${user.lastName}` : 'Utente'}</span>
                        <img
                            className="h-10 w-10 rounded-full object-cover ml-4"
                            src={user ? `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D8ABC&color=fff` : `https://ui-avatars.com/api/?name=?&background=0D8ABC&color=fff`}
                            alt="User avatar"
                        />
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
                    {children}
                </main>
                 <footer className="text-center p-4 bg-gray-100 text-xs text-gray-500 print:hidden">
                    <p>© {new Date().getFullYear()} GioIA | Ideato, sviluppato e finanziato da Gennaro Carandente e Giovanni De Rosa.</p>
                    <p>Tutti i diritti sono riservati. È vietata qualsiasi riproduzione, anche parziale.</p>
                </footer>
            </div>
        </div>
    );
};

export default Layout;