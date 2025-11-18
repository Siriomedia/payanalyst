import React from 'react';
import { User } from '../types.ts';

interface AdminPanelProps {
    users: User[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users }) => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Pannello Amministrazione</h1>
            <div className="bg-white p-8 rounded-xl shadow-md">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Utenti Registrati</h2>
                 <p className="text-sm text-gray-500 mb-6">
                    Questo è un elenco di tutti gli utenti presenti nell'applicazione, inclusi l'amministratore e gli utenti derivati dalle buste paga caricate.
                 </p>
                 {users.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nome Completo</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3">Codice Fiscale</th>
                                    <th scope="col" className="px-6 py-3">Ruolo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.taxId || user.email} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4 font-mono">{user.taxId || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                     <p className="text-center text-gray-500 mt-4">Nessun utente trovato. Carica una busta paga per popolare la lista.</p>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;