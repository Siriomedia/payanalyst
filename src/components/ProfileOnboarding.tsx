import React, { useState } from 'react';
import { User } from '../types';
import { LogoIcon } from './common/Icons';

interface ProfileOnboardingProps {
    user: User;
    onComplete: (updatedData: { firstName: string; lastName: string; dateOfBirth: string; placeOfBirth: string }) => void;
}

const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ user, onComplete }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateOfBirth: user.dateOfBirth || '',
        placeOfBirth: user.placeOfBirth || '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setError('Nome e cognome sono obbligatori');
            return;
        }

        if (!formData.dateOfBirth.trim()) {
            setError('La data di nascita è obbligatoria');
            return;
        }

        if (!formData.placeOfBirth.trim()) {
            setError('Il luogo di nascita è obbligatorio');
            return;
        }

        onComplete({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            dateOfBirth: formData.dateOfBirth.trim(),
            placeOfBirth: formData.placeOfBirth.trim(),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3 text-blue-600 mb-4">
                        <LogoIcon />
                        <span className="font-bold text-3xl sm:text-4xl">GioIA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Completa il tuo Profilo</h1>
                    <p className="text-gray-600 text-center">
                        Per iniziare ad utilizzare GioIA, abbiamo bisogno di alcuni dati anagrafici che verranno utilizzati per verificare la corrispondenza con le buste paga caricate.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                Cognome <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                            Data di Nascita <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                            Luogo di Nascita <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="placeOfBirth"
                            name="placeOfBirth"
                            value={formData.placeOfBirth}
                            onChange={handleChange}
                            placeholder="Es. Roma, Milano, Napoli..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Perché chiediamo questi dati?</h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Per verificare la corrispondenza con le buste paga che caricherai</li>
                            <li>• Per garantire che analizzi solo i tuoi documenti</li>
                            <li>• I tuoi dati sono al sicuro e protetti</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Completa Profilo
                    </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-6">
                    * Campi obbligatori
                </p>
            </div>
        </div>
    );
};

export default ProfileOnboarding;
