import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types.ts';
import { LogoIcon, GoogleIcon, LockIcon } from './common/Icons.tsx';
import { jwtDecode } from "jwt-decode";
import { PLANS } from '../config/plans.ts';

interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

declare const google: any;

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [showAdminLogin, setShowAdminLogin] = useState(false);

    // Manual Admin Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleResponse = (response: any) => {
        try {
            const decodedToken: { email: string; given_name: string; family_name: string } = jwtDecode(response.credential);
            
            const isAdmin = decodedToken.email.toLowerCase() === 'gderosa@ymail.com';
            const now = new Date();
            const resetDate = new Date(now.getFullYear(), now.getMonth(), 27);
            if(now.getDate() >= 27) {
                resetDate.setMonth(resetDate.getMonth() + 1);
            }

            const user: User = {
                email: decodedToken.email,
                firstName: decodedToken.given_name,
                lastName: decodedToken.family_name,
                role: isAdmin ? 'admin' : 'user',
                dateOfBirth: '',
                placeOfBirth: '',
                password: isAdmin ? 'password' : undefined,
                plan: isAdmin ? 'professional' : 'free',
                credits: isAdmin ? PLANS['professional'].credits : PLANS['free'].credits,
                creditResetDate: resetDate.toISOString(),
            };

            onLoginSuccess(user);
        } catch (e) {
            console.error("Error decoding Google token", e);
            setError("Errore durante l'accesso con Google.");
        }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (email.toLowerCase() === 'gderosa@ymail.com' && password === 'password') {
             const now = new Date();
             const resetDate = new Date(now.getFullYear(), now.getMonth(), 27);
             if(now.getDate() >= 27) {
                resetDate.setMonth(resetDate.getMonth() + 1);
             }
             const user: User = {
                email: 'gderosa@ymail.com',
                firstName: 'Giovanni',
                lastName: 'De Rosa',
                role: 'admin',
                dateOfBirth: '1990-01-01',
                placeOfBirth: 'Napoli',
                password: 'password',
                plan: 'professional',
                credits: PLANS['professional'].credits,
                creditResetDate: resetDate.toISOString(),
            };
            onLoginSuccess(user);
        } else {
            setError('Credenziali amministratore non valide.');
        }
    };

    useEffect(() => {
        if (!showAdminLogin && typeof google !== 'undefined' && google.accounts && googleButtonRef.current) {
            google.accounts.id.initialize({
                client_id: '641945262103-j86e1g8dssrnrr8fbg88tln5cf06m93g.apps.googleusercontent.com',
                callback: handleGoogleResponse,
            });

            google.accounts.id.renderButton(
                googleButtonRef.current,
                { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', shape: 'pill' }
            );
        }
    }, [showAdminLogin]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
             <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center transition-all">
                 <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center space-x-2 text-blue-600">
                        <LogoIcon />
                        <span className="font-bold text-3xl">GioIA</span>
                    </div>
                     <h1 className="text-xl text-gray-800 mt-4">Il tuo assistente per le buste paga</h1>
                     <p className="text-gray-500 mt-2">Accedi in modo sicuro per iniziare ad analizzare, archiviare e comprendere i tuoi dati retributivi.</p>
                </div>
                
                {showAdminLogin ? (
                    <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                        <h2 className="text-center font-semibold text-gray-700">Accesso Amministratore</h2>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-600">Email</label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-600">Password</label>
                            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                           Accedi
                        </button>
                         <p className="text-center text-xs mt-4">
                            <a href="#" onClick={(e) => { e.preventDefault(); setShowAdminLogin(false); setError(''); }} className="font-medium text-blue-600 hover:text-blue-500">
                                Torna all'accesso con Google
                            </a>
                        </p>
                    </form>
                ) : (
                    <>
                        <div className="flex justify-center mt-8">
                            <div ref={googleButtonRef}></div>
                        </div>
                        <p className="text-center text-xs mt-6">
                            <a href="#" onClick={(e) => { e.preventDefault(); setShowAdminLogin(true); setError(''); }} className="font-medium text-gray-500 hover:text-blue-600">
                                Sei un amministratore? Accedi qui
                            </a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;