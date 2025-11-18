import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { db, auth } from '../firebase.ts';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser as deleteAuthUser } from 'firebase/auth';

interface AdminPanelProps {
    user: User;
}

interface FirebaseUser extends User {
    uid: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
    const [allUsers, setAllUsers] = useState<FirebaseUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [newCredits, setNewCredits] = useState<number>(0);

    useEffect(() => {
        if (user.role !== 'admin') {
            return;
        }

        const usersCollection = collection(db, 'users');
        const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
            const usersData: FirebaseUser[] = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                usersData.push({
                    uid: doc.id,
                    email: data.email || '',
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    role: data.role || 'user',
                    dateOfBirth: data.dateOfBirth || '',
                    placeOfBirth: data.placeOfBirth || '',
                    plan: data.plan || 'free',
                    credits: data.credits || 0,
                    creditResetDate: data.creditResetDate || '',
                    taxId: data.taxId || '',
                });
            });

            usersData.sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return a.email.localeCompare(b.email);
            });

            setAllUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error('Errore nel caricamento utenti:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user.role]);

    const handleEditCredits = (userId: string, currentCredits: number) => {
        setEditingUserId(userId);
        setNewCredits(currentCredits);
    };

    const handleSaveCredits = async (userId: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { credits: newCredits });
            
            setEditingUserId(null);
            alert('✅ Crediti aggiornati con successo!');
        } catch (error) {
            console.error('Errore nell\'aggiornamento crediti:', error);
            alert('❌ Errore nell\'aggiornamento dei crediti. Riprova.');
        }
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setNewCredits(0);
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        const confirmDelete = window.confirm(
            `⚠️ ATTENZIONE!\n\nSei sicuro di voler cancellare l'account di:\n${userEmail}\n\nQuesta azione è IRREVERSIBILE e cancellerà:\n- L'account utente\n- Tutti i dati associati\n- L'accesso all'app\n\nConfermi la cancellazione?`
        );

        if (!confirmDelete) return;

        try {
            const userRef = doc(db, 'users', userId);
            await deleteDoc(userRef);
            
            alert(`✅ Account di ${userEmail} cancellato con successo.`);
        } catch (error) {
            console.error('Errore nella cancellazione utente:', error);
            alert('❌ Errore nella cancellazione dell\'account. Riprova.');
        }
    };

    if (user.role !== 'admin') {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-red-800 mb-2">⛔ Accesso Negato</h2>
                    <p className="text-red-600">Solo gli amministratori possono accedere a questa sezione.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">🔐 Pannello Amministrazione</h1>
                <p className="text-gray-500">Gestisci utenti, crediti e permessi del sistema</p>
            </div>

            {loading ? (
                <div className="bg-white p-12 rounded-xl shadow-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Caricamento utenti...</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
                        <h2 className="text-2xl font-bold text-white mb-1">👥 Utenti Registrati</h2>
                        <p className="text-blue-100 text-sm">
                            Totale utenti: <span className="font-bold">{allUsers.length}</span> | 
                            Admin: <span className="font-bold">{allUsers.filter(u => u.role === 'admin').length}</span> | 
                            Utenti: <span className="font-bold">{allUsers.filter(u => u.role === 'user').length}</span>
                        </p>
                    </div>

                    {allUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Utente
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Piano
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Crediti
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Ruolo
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Azioni
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allUsers.map((u) => (
                                        <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-bold text-lg">
                                                            {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {u.firstName} {u.lastName}
                                                        </div>
                                                        {u.taxId && (
                                                            <div className="text-xs text-gray-500 font-mono">
                                                                CF: {u.taxId}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    {u.plan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingUserId === u.uid ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            value={newCredits}
                                                            onChange={(e) => setNewCredits(parseInt(e.target.value) || 0)}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                            min="0"
                                                        />
                                                        <button
                                                            onClick={() => handleSaveCredits(u.uid)}
                                                            className="text-green-600 hover:text-green-800 font-semibold text-xs"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="text-red-600 hover:text-red-800 font-semibold text-xs"
                                                        >
                                                            ✗
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-bold text-gray-900">{u.credits}</span>
                                                        <button
                                                            onClick={() => handleEditCredits(u.uid, u.credits)}
                                                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                                                        >
                                                            modifica
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    u.role === 'admin' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {u.role === 'admin' ? '🔐 Admin' : '👤 User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {u.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.uid, u.email)}
                                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors text-sm font-semibold"
                                                    >
                                                        🗑️ Elimina
                                                    </button>
                                                )}
                                                {u.role === 'admin' && (
                                                    <span className="text-gray-400 text-xs italic">Protetto</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">👥</div>
                            <p className="text-gray-500 text-lg">Nessun utente trovato nel database.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                        <span className="mr-2">ℹ️</span> Funzionalità Admin
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li>• <strong>Visualizzazione in tempo reale</strong> di tutti gli utenti</li>
                        <li>• <strong>Modifica crediti</strong> di qualsiasi utente</li>
                        <li>• <strong>Cancellazione account</strong> utente (non admin)</li>
                        <li>• <strong>Monitoraggio piani</strong> e statistiche</li>
                    </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="font-bold text-yellow-900 mb-3 flex items-center">
                        <span className="mr-2">⚠️</span> Attenzione
                    </h3>
                    <ul className="text-sm text-yellow-800 space-y-2">
                        <li>• Gli account <strong>admin sono protetti</strong> dalla cancellazione</li>
                        <li>• Le modifiche ai crediti sono <strong>permanenti</strong></li>
                        <li>• La cancellazione di un account è <strong>irreversibile</strong></li>
                        <li>• Usa queste funzioni con <strong>cautela</strong></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
