import React, { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { User } from "../types";
import { LogoIcon } from "./common/Icons";
import { PLANS } from "../config/plans";

interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const buildUserObject = (
        email: string,
        firstName: string,
        lastName: string,
        role: "admin" | "user"
    ): User => {
        const now = new Date();
        const resetDate = new Date(now.getFullYear(), now.getMonth(), 27);
        if (now.getDate() >= 27) resetDate.setMonth(resetDate.getMonth() + 1);

        return {
            email,
            firstName,
            lastName,
            role,
            dateOfBirth: "",
            placeOfBirth: "",
            password: undefined,
            plan: role === "admin" ? "professional" : "free",
            credits: PLANS[role === "admin" ? "professional" : "free"].credits,
            creditResetDate: resetDate.toISOString(),
        };
    };

    // -----------------------------------------------------------------
    // GOOGLE LOGIN (Firebase)
    // -----------------------------------------------------------------
    const handleGoogleLogin = async () => {
        setError("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (!user) {
                setError("Accesso non riuscito");
                return;
            }

            const nameParts = user.displayName ? user.displayName.split(" ") : ["", ""];
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            const isAdmin = user.email?.toLowerCase() === "gderosa@ymail.com";

            const newUser = buildUserObject(
                user.email || "",
                firstName,
                lastName,
                isAdmin ? "admin" : "user"
            );

            onLoginSuccess(newUser);

        } catch (err) {
            console.error(err);
            setError("Errore durante l'accesso con Google.");
        }
    };

    // -----------------------------------------------------------------
    // ADMIN LOGIN (Firebase email/password)
    // -----------------------------------------------------------------
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const fbUser = result.user;

            if (!fbUser?.email) {
                setError("Errore autenticazione admin.");
                return;
            }

            const newUser = buildUserObject(
                fbUser.email,
                "Giovanni",
                "De Rosa",
                "admin"
            );

            onLoginSuccess(newUser);
        } catch (err) {
            setError("Credenziali amministratore non valide.");
        }
    };

    // -----------------------------------------------------------------
    // RENDER
    // -----------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center transition-all">
                
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center space-x-2 text-blue-600">
                        <LogoIcon />
                        <span className="font-bold text-3xl">GioIA</span>
                    </div>
                    <h1 className="text-xl text-gray-800 mt-4">Il tuo assistente per le buste paga</h1>
                    <p className="text-gray-500 mt-2">
                        Accedi in modo sicuro per iniziare ad analizzare, archiviare e comprendere i tuoi dati retributivi.
                    </p>
                </div>

                {showAdminLogin ? (
                    <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                        
                        <h2 className="text-center font-semibold text-gray-700">Accesso Amministratore</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-600">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                        <button
                            type="submit"
                            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Accedi
                        </button>

                        <p className="text-center text-xs mt-4">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowAdminLogin(false);
                                    setError("");
                                }}
                                className="text-blue-600"
                            >
                                Torna all'accesso con Google
                            </a>
                        </p>

                    </form>
                ) : (
                    <>
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-2 bg-white border flex items-center justify-center rounded-md shadow-sm hover:bg-gray-50"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt=""
                                className="w-5 h-5 mr-2"
                            />
                            Accedi con Google
                        </button>

                        {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}

                        <p className="text-center text-xs mt-6">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowAdminLogin(true);
                                    setError("");
                                }}
                                className="font-medium text-gray-500 hover:text-blue-600"
                            >
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
