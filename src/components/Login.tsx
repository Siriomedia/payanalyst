import React, { useState } from "react";
import { register, login } from "../services/authService";
import { LogoIcon } from "./common/Icons";

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isSignUp) {
                if (!firstName.trim() || !lastName.trim()) {
                    setError("Inserisci nome e cognome.");
                    setLoading(false);
                    return;
                }
                await register(email, password, { firstName, lastName });
            } else {
                await login(email, password);
            }
            setLoading(false);
        } catch (err: any) {
            if (err.message?.includes('already registered')) {
                setError("Questa email e gia registrata. Prova ad accedere.");
            } else if (err.message?.includes('Invalid login')) {
                setError("Email o password non corretti.");
            } else {
                setError("Errore durante l'accesso. Riprova.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3 text-blue-600 mb-4">
                        <LogoIcon />
                        <span className="font-bold text-2xl sm:text-3xl">GioIA</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {isSignUp ? 'Crea Account' : 'Accedi'}
                    </h2>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimo 6 caratteri</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                {isSignUp ? 'Creazione account...' : 'Accesso in corso...'}
                            </div>
                        ) : (
                            isSignUp ? 'Crea Account' : 'Accedi'
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError("");
                            }}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {isSignUp ? 'Hai gia un account? Accedi' : 'Non hai un account? Registrati'}
                        </button>
                    </div>
                </form>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Accesso Sicuro</h3>
                    <ul className="text-xs text-blue-800 space-y-1 text-left">
                        <li>Autenticazione gestita da Supabase</li>
                        <li>I tuoi dati sono al sicuro e crittografati</li>
                    </ul>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                    <p>Accedendo accetti i nostri Termini di Servizio e la Privacy Policy</p>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Nuovo su GioIA? Riceverai <strong className="text-blue-600">10 crediti gratuiti</strong> alla registrazione!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
