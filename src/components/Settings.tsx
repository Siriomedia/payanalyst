import React, { useState } from 'react';
import { User } from '../types.ts';
import { InfoIcon, LockIcon } from './common/Icons.tsx';

interface SettingsProps {
    user: User;
    onSave: (user: Omit<User, 'role' | 'email' | 'password'>) => void;
    onPasswordChange: (newPassword: string) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ user, onSave, onPasswordChange }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        placeOfBirth: user.placeOfBirth,
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Password change state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);


    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleDataSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
             firstName: formData.firstName.trim(),
             lastName: formData.lastName.trim(),
             dateOfBirth: formData.dateOfBirth.trim(),
             placeOfBirth: formData.placeOfBirth.trim(),
        });
        setSuccessMessage('Dati aggiornati con successo!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (user.password !== oldPassword) {
            setPasswordError('La vecchia password non è corretta.');
            return;
        }
        if (newPassword.length < 6) {
             setPasswordError('La nuova password deve essere di almeno 6 caratteri.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('La nuova password e la conferma non coincidono.');
            return;
        }

        try {
            await onPasswordChange(newPassword);
            setPasswordSuccess('Password aggiornata con successo!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(null), 3000);
        } catch (error) {
             setPasswordError("Si è verificato un errore durante l'aggiornamento della password.");
        }
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Impostazioni</h1>
            <div className="max-w-2xl mx-auto space-y-8">
                {/* User Data Form */}
                <div className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">I Tuoi Dati Anagrafici</h2>
                    <p className="text-sm text-gray-500 mb-6">Questi dati vengono utilizzati per verificare la corrispondenza con le buste paga caricate.</p>
                    <form onSubmit={handleDataSubmit} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-600">Nome</label>
                                <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-600">Cognome</label>
                                <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-600">Data di Nascita</label>
                            <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-600">Luogo di Nascita</label>
                            <input type="text" name="placeOfBirth" id="placeOfBirth" value={formData.placeOfBirth} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                Salva Modifiche
                            </button>
                        </div>
                        {successMessage && <p className="text-sm text-green-600 mt-2">{successMessage}</p>}
                    </form>
                </div>

                {/* Password Change Form - only for admin with manual login */}
                {user.role === 'admin' && user.password && (
                    <div className="bg-white p-8 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><LockIcon className="mr-2"/> Sicurezza e Password</h2>
                        <p className="text-sm text-gray-500 mb-6">Modifica la password per l'accesso manuale come amministratore.</p>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="oldPassword"  className="block text-sm font-medium text-gray-600">Vecchia Password</label>
                                <input type="password" id="oldPassword" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                             <div>
                                <label htmlFor="newPassword"  className="block text-sm font-medium text-gray-600">Nuova Password</label>
                                <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                             <div>
                                <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-600">Conferma Nuova Password</label>
                                <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            
                            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                            {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}

                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                    Cambia Password
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;