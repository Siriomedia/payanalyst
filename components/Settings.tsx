import React, { useState } from 'react';
import { User } from '../types.ts';
import { InfoIcon } from './common/Icons.tsx';

interface SettingsProps {
    user: User;
    onSave: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onSave }) => {
    const [formData, setFormData] = useState<User>(user);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
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

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Impostazioni</h1>
            <div className="max-w-2xl mx-auto">
                {/* User Data Form */}
                <div className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">I Tuoi Dati Anagrafici</h2>
                    <p className="text-sm text-gray-500 mb-6">Questi dati vengono utilizzati per verificare la corrispondenza con le buste paga caricate.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-600">Nome</label>
                                <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-600">Cognome</label>
                                <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-600">Data di Nascita</label>
                            <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-600">Luogo di Nascita</label>
                            <input type="text" name="placeOfBirth" id="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                Salva Modifiche
                            </button>
                        </div>
                        {successMessage && <p className="text-sm text-green-600 mt-2">{successMessage}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;