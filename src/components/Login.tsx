import React, { useState } from "react";
import { 
    signInWithPopup, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    OAuthProvider
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { LogoIcon } from "./common/Icons";
import { PLANS } from "../config/plans";
import { normalizeTimestamp } from "../utils/timestampHelpers";

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleUserLogin = async (fbUser: any, isNewUser = false, customFirstName?: string, customLastName?: string) => {
        if (!fbUser || !fbUser.email) {
            setError("Accesso non riuscito. Riprova.");
            setLoading(false);
            return;
        }

        const userRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            onLoginSuccess({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role || 'user',
                dateOfBirth: userData.dateOfBirth || "",
                placeOfBirth: userData.placeOfBirth || "",
                plan: userData.plan || 'free',
                credits: userData.credits ?? 10,
                creditResetDate: userData.creditResetDate || "",
                createdAt: normalizeTimestamp(userData.createdAt, Date.now()),
            });
        } else {
            let fName = customFirstName || "";
            let lName = customLastName || "";

            if (!fName && fbUser.displayName) {
                const nameParts = fbUser.displayName.split(" ");
                fName = nameParts[0] || "";
                lName = nameParts.slice(1).join(" ") || "";
            }

            // Crea documento base senza createdAt (verrà aggiunto solo in Firestore)
            const newUserData = {
                email: fbUser.email,
                firstName: fName,
                lastName: lName,
                role: 'user',
                dateOfBirth: "",
                placeOfBirth: "",
                plan: 'free',
                credits: PLANS.free.credits,
                creditResetDate: "",
            };

            // Salva in Firestore con serverTimestamp (solo per Firestore, non nello stato locale)
            await setDoc(userRef, {
                ...newUserData,
                createdAt: serverTimestamp(),
            });
            
            // Rileggi il documento per ottenere il timestamp server-side effettivo
            const savedSnap = await getDoc(userRef);
            if (savedSnap.exists()) {
                const savedData = savedSnap.data();
                onLoginSuccess({
                    email: savedData.email,
                    firstName: savedData.firstName,
                    lastName: savedData.lastName,
                    role: savedData.role || 'user',
                    dateOfBirth: savedData.dateOfBirth || "",
                    placeOfBirth: savedData.placeOfBirth || "",
                    plan: savedData.plan || 'free',
                    credits: savedData.credits ?? PLANS.free.credits,
                    creditResetDate: savedData.creditResetDate || "",
                    createdAt: normalizeTimestamp(savedData.createdAt, Date.now()),
                });
            } else {
                // Fallback se la rilettura fallisce (non dovrebbe succedere)
                onLoginSuccess({
                    email: fbUser.email,
                    firstName: fName,
                    lastName: lName,
                    role: 'user',
                    dateOfBirth: "",
                    placeOfBirth: "",
                    plan: 'free',
                    credits: PLANS.free.credits,
                    creditResetDate: "",
                    createdAt: Date.now(), // Fallback timestamp
                });
            }
        }

        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            await handleUserLogin(result.user);
        } catch (err: any) {
            console.error("Errore login Google:", err);
            
            if (err.code === 'auth/unauthorized-domain') {
                setError("Dominio non autorizzato. Aggiungi questo dominio alle authorized domains in Firebase Console.");
            } else if (err.code === 'auth/popup-blocked') {
                setError("Popup bloccato dal browser. Abilita i popup per questo sito.");
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError("Accesso annullato.");
            } else {
                setError("Errore durante l'accesso con Google. Riprova.");
            }
            
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const appleProvider = new OAuthProvider('apple.com');
            appleProvider.addScope('email');
            appleProvider.addScope('name');
            
            const result = await signInWithPopup(auth, appleProvider);
            await handleUserLogin(result.user);
        } catch (err: any) {
            console.error("Errore login Apple:", err);
            
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Accesso annullato.");
            } else {
                setError("Errore durante l'accesso con Apple. Riprova.");
            }
            
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
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

                const result = await createUserWithEmailAndPassword(auth, email, password);
                await handleUserLogin(result.user, true, firstName, lastName);
            } else {
                const result = await signInWithEmailAndPassword(auth, email, password);
                await handleUserLogin(result.user);
            }
        } catch (err: any) {
            console.error("Errore login email:", err);
            
            if (err.code === 'auth/email-already-in-use') {
                setError("Questa email è già registrata. Prova ad accedere.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Email non valida.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password troppo debole. Usa almeno 6 caratteri.");
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("Email o password non corretti.");
            } else if (err.code === 'auth/invalid-credential') {
                setError("Credenziali non valide.");
            } else {
                setError("Errore durante l'accesso. Riprova.");
            }
            
            setLoading(false);
        }
    };

    if (showEmailLogin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                    
                    <div className="flex flex-col items-center mb-6">
                        <div className="flex items-center space-x-2 sm:space-x-3 text-blue-600 mb-4">
                            <LogoIcon />
                            <span className="font-bold text-2xl sm:text-3xl">GioIA</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {isSignUp ? 'Crea Account' : 'Accedi con Email'}
                        </h2>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
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
                                {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
                            </button>
                        </div>

                        <div className="text-center pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEmailLogin(false);
                                    setError("");
                                    setEmail("");
                                    setPassword("");
                                    setFirstName("");
                                    setLastName("");
                                }}
                                className="text-sm text-gray-600 hover:text-blue-600"
                            >
                                ← Torna ai metodi di accesso
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center space-x-2 sm:space-x-3 text-blue-600 mb-4">
                        <LogoIcon />
                        <span className="font-bold text-3xl sm:text-4xl">GioIA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Benvenuto!</h1>
                    <p className="text-gray-600">
                        Il tuo assistente intelligente per l'analisi delle buste paga
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 bg-white border-2 border-gray-300 flex items-center justify-center rounded-lg shadow-sm hover:bg-gray-50 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            className="w-5 h-5 mr-3"
                        />
                        <span className="text-gray-700 font-medium">Continua con Google</span>
                    </button>

                    <button
                        onClick={handleAppleLogin}
                        disabled={loading}
                        className="w-full py-3 bg-black text-white flex items-center justify-center rounded-lg shadow-sm hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        <span className="font-medium">Continua con Apple</span>
                    </button>

                    <button
                        onClick={() => setShowEmailLogin(true)}
                        disabled={loading}
                        className="w-full py-3 bg-white border-2 border-gray-300 flex items-center justify-center rounded-lg shadow-sm hover:bg-gray-50 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Continua con Email</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">🔐 Accesso Sicuro</h3>
                    <ul className="text-xs text-blue-800 space-y-1 text-left">
                        <li>• Autenticazione gestita da Google Firebase</li>
                        <li>• I tuoi dati sono al sicuro e crittografati</li>
                        <li>• Scegli il metodo che preferisci</li>
                    </ul>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                    <p>Accedendo accetti i nostri Termini di Servizio e la Privacy Policy</p>
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Nuovo su GioIA? Riceverai <strong className="text-blue-600">10 crediti gratuiti</strong> alla registrazione!
                </p>
            </div>
        </div>
    );
};

export default Login;
