import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { db, auth } from '../firebase.ts';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc, increment } from 'firebase/firestore';
import { deleteUser as deleteAuthUser } from 'firebase/auth';
import { normalizeTimestamp } from '../utils/timestampHelpers.ts';

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
    const [editMode, setEditMode] = useState<'set' | 'add'>('set'); // 'set' per impostare, 'add' per aggiungere

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
                    createdAt: normalizeTimestamp(data.createdAt, Date.now()),
                });
            });

            // Ordina per data di registrazione (più vecchi prima = ordine cronologico)
            usersData.sort((a, b) => {
                // Se uno dei due non ha createdAt, mettilo in fondo
                if (!a.createdAt && !b.createdAt) return a.email.localeCompare(b.email);
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return a.createdAt - b.createdAt;
            });

            setAllUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error('Errore nel caricamento utenti:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user.role]);

    const handleEditCredits = (userId: string, currentCredits: number, mode: 'set' | 'add') => {
        setEditingUserId(userId);
        setEditMode(mode);
        if (mode === 'set') {
            setNewCredits(currentCredits);
        } else {
            setNewCredits(0); // Per aggiungere, parti da 0
        }
    };

    const handleSaveCredits = async (userId: string, currentCredits: number) => {
        try {
            const userRef = doc(db, 'users', userId);
            
            if (editMode === 'set') {
                // Modalità "Imposta": imposta valore assoluto
                if (newCredits < 0) {
                    alert('⚠️ I crediti non possono essere negativi!');
                    return;
                }
                
                await updateDoc(userRef, { credits: newCredits });
                alert(`✅ Crediti impostati a ${newCredits}!`);
            } else {
                // Modalità "Regala": usa increment atomico per evitare race conditions
                if (newCredits === 0) {
                    alert('⚠️ Inserisci un numero di crediti da aggiungere!');
                    return;
                }
                
                // SOLO aggiunta (positivi) permessa per evitare race conditions con negativi
                // Se vuoi rimuovere crediti, usa "Imposta" per impostare il valore finale
                if (newCredits < 0) {
                    alert('⚠️ Per rimuovere crediti, usa la funzione "Imposta" e imposta il valore finale desiderato.');
                    return;
                }
                
                // Usa increment atomico per operazioni concorrenti sicure (solo aggiunte)
                await updateDoc(userRef, { credits: increment(newCredits) });
                alert(`✅ Aggiunti ${newCredits} crediti!`);
            }
            
            setEditingUserId(null);
            setNewCredits(0);
        } catch (error) {
            console.error('Errore nell\'aggiornamento crediti:', error);
            alert('❌ Errore nell\'aggiornamento dei crediti. Riprova.');
        }
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setNewCredits(0);
        setEditMode('set');
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
        <div className="p-3 sm:p-6">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">🔐 Pannello Amministrazione</h1>
                <p className="text-sm sm:text-base text-gray-500">Gestisci utenti, crediti e permessi del sistema</p>
            </div>

            {loading ? (
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm sm:text-base text-gray-500">Caricamento utenti...</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-blue-700">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">👥 Utenti Registrati</h2>
                        <p className="text-blue-100 text-xs sm:text-sm">
                            Totale: <span className="font-bold">{allUsers.length}</span> | 
                            Admin: <span className="font-bold">{allUsers.filter(u => u.role === 'admin').length}</span> | 
                            Utenti: <span className="font-bold">{allUsers.filter(u => u.role === 'user').length}</span>
                        </p>
                    </div>

                    {allUsers.length > 0 ? (
                        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                            <table className="w-full text-xs sm:text-sm min-w-[800px]">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Utente
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Ruolo
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                                            Piano
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Crediti
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    u.role === 'admin' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {u.role === 'admin' ? '🔐 Admin' : '👤 User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    {u.plan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingUserId === u.uid ? (
                                                    <div className="flex flex-col space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500 font-medium w-16">
                                                                {editMode === 'set' ? 'Imposta:' : 'Aggiungi:'}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={newCredits}
                                                                onChange={(e) => setNewCredits(parseInt(e.target.value) || 0)}
                                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                                min="0"
                                                                placeholder={editMode === 'set' ? 'Totale' : '+Crediti'}
                                                            />
                                                            <button
                                                                onClick={() => handleSaveCredits(u.uid, u.credits)}
                                                                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-semibold"
                                                                title="Salva modifiche"
                                                            >
                                                                ✓ Salva
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold"
                                                                title="Annulla"
                                                            >
                                                                ✗ Annulla
                                                            </button>
                                                        </div>
                                                        {editMode === 'add' && (
                                                            <div className="text-xs text-gray-500 italic">
                                                                Nuovo totale: {u.credits + newCredits} crediti
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-sm font-bold text-gray-900">{u.credits} crediti</span>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleEditCredits(u.uid, u.credits, 'set')}
                                                                className="text-blue-600 hover:text-blue-800 text-xs underline font-semibold"
                                                                title="Imposta un valore assoluto di crediti"
                                                            >
                                                                🔧 Imposta
                                                            </button>
                                                            <span className="text-gray-300">|</span>
                                                            <button
                                                                onClick={() => handleEditCredits(u.uid, u.credits, 'add')}
                                                                className="text-green-600 hover:text-green-800 text-xs underline font-semibold"
                                                                title="Aggiungi crediti (regalo)"
                                                            >
                                                                🎁 Regala
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
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
                        <li>• <strong>🔧 Imposta crediti</strong> - imposta un valore assoluto di crediti</li>
                        <li>• <strong>🎁 Regala crediti</strong> - aggiungi crediti agli utenti (incrementa)</li>
                        <li>• <strong>Cancellazione account</strong> utente (non admin)</li>
                        <li>• <strong>Monitoraggio piani</strong> e statistiche in tempo reale</li>
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
