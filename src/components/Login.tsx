import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LogoIcon } from "./common/Icons";
import { PLANS } from "../config/plans";

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const fbUser = result.user;

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
                });
            } else {
                const nameParts = fbUser.displayName ? fbUser.displayName.split(" ") : ["", ""];
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";

                const newUserData = {
                    email: fbUser.email,
                    firstName,
                    lastName,
                    role: 'user',
                    dateOfBirth: "",
                    placeOfBirth: "",
                    plan: 'free',
                    credits: PLANS.free.credits,
                    creditResetDate: "",
                };

                await setDoc(userRef, newUserData);

                onLoginSuccess(newUserData);
            }

            setLoading(false);

        } catch (err: any) {
            console.error("Errore login:", err);
            
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center space-x-3 text-blue-600 mb-4">
                        <LogoIcon />
                        <span className="font-bold text-4xl">GioIA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Benvenuto!</h1>
                    <p className="text-gray-600">
                        Il tuo assistente intelligente per l'analisi delle buste paga
                    </p>
                </div>

                <div className="mb-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 bg-white border-2 border-gray-300 flex items-center justify-center rounded-lg shadow-sm hover:bg-gray-50 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                                <span className="text-gray-700 font-medium">Accesso in corso...</span>
                            </>
                        ) : (
                            <>
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    className="w-5 h-5 mr-3"
                                />
                                <span className="text-gray-700 font-medium">Accedi con Google</span>
                            </>
                        )}
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
                        <li>• Nessuna password da ricordare</li>
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
