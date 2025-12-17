import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { supabase } from '../supabase.ts';

interface AdminPanelProps {
    user: User;
}

interface DatabaseUser extends User {
    uid: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
    const [allUsers, setAllUsers] = useState<DatabaseUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [newCredits, setNewCredits] = useState<number>(0);
    const [editMode, setEditMode] = useState<'set' | 'add'>('set');

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const usersData: DatabaseUser[] = data.map((row: any) => ({
                uid: row.id,
                email: row.email || '',
                firstName: row.first_name || '',
                lastName: row.last_name || '',
                role: row.role || 'user',
                dateOfBirth: row.date_of_birth || '',
                placeOfBirth: row.place_of_birth || '',
                plan: row.plan || 'free',
                credits: row.credits || 0,
                creditResetDate: '',
                taxId: row.tax_id || '',
                createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            }));

            setAllUsers(usersData);
            setLoading(false);
        } catch (error) {
            console.error('Errore nel caricamento utenti:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.role !== 'admin') {
            return;
        }

        loadUsers();

        const interval = setInterval(loadUsers, 5000);

        return () => clearInterval(interval);
    }, [user.role]);

    const handleEditCredits = (userId: string, currentCredits: number, mode: 'set' | 'add') => {
        setEditingUserId(userId);
        setEditMode(mode);
        if (mode === 'set') {
            setNewCredits(currentCredits);
        } else {
            setNewCredits(0);
        }
    };

    const handleSaveCredits = async (userId: string, currentCredits: number) => {
        try {
            const finalCredits = editMode === 'add' ? currentCredits + newCredits : newCredits;

            const { error } = await supabase
                .from('users')
                .update({ credits: finalCredits, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            setEditingUserId(null);
            await loadUsers();
        } catch (error) {
            console.error('Errore nel salvataggio crediti:', error);
            alert('Errore nel salvataggio crediti');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo utente? Questa azione NON può essere annullata.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            await loadUsers();
            alert('Utente eliminato con successo');
        } catch (error) {
            console.error('Errore nell\'eliminazione dell\'utente:', error);
            alert('Errore nell\'eliminazione dell\'utente. Nota: l\'utente auth deve essere eliminato manualmente da Supabase Dashboard.');
        }
    };

    const handleChangePlan = async (userId: string, newPlan: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ plan: newPlan, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            await loadUsers();
        } catch (error) {
            console.error('Errore nel cambio piano:', error);
            alert('Errore nel cambio piano');
        }
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            await loadUsers();
        } catch (error) {
            console.error('Errore nel cambio ruolo:', error);
            alert('Errore nel cambio ruolo');
        }
    };

    if (user.role !== 'admin') {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Non hai i permessi per accedere a questa pagina.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="ml-4 text-gray-600">Caricamento utenti...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Pannello Admin</h1>
                <p className="text-gray-600 mt-2">Gestione utenti e crediti</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="font-semibold text-blue-900 mb-2">Statistiche</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-blue-700">Totale Utenti</p>
                        <p className="text-2xl font-bold text-blue-900">{allUsers.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700">Utenti Admin</p>
                        <p className="text-2xl font-bold text-blue-900">
                            {allUsers.filter(u => u.role === 'admin').length}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700">Crediti Totali</p>
                        <p className="text-2xl font-bold text-blue-900">
                            {allUsers.reduce((sum, u) => sum + (u.credits || 0), 0)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utente
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Piano
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ruolo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Crediti
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Azioni
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allUsers.map((u) => (
                                <tr key={u.uid} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {u.firstName || u.lastName ? `${u.firstName} ${u.lastName}` : 'N/D'}
                                        </div>
                                        <div className="text-xs text-gray-500">{u.uid.substring(0, 8)}...</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{u.email}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <select
                                            value={u.plan}
                                            onChange={(e) => handleChangePlan(u.uid, e.target.value)}
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="free">Free</option>
                                            <option value="basic">Basic</option>
                                            <option value="medium">Medium</option>
                                            <option value="premium">Premium</option>
                                            <option value="professional">Professional</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleChangeRole(u.uid, e.target.value)}
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
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
                                                    onClick={() => handleSaveCredits(u.uid, u.credits)}
                                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                >
                                                    {editMode === 'set' ? 'Imposta' : 'Aggiungi'}
                                                </button>
                                                <button
                                                    onClick={() => setEditingUserId(null)}
                                                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                                >
                                                    Annulla
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-gray-900">{u.credits}</span>
                                                <button
                                                    onClick={() => handleEditCredits(u.uid, u.credits, 'set')}
                                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                >
                                                    Modifica
                                                </button>
                                                <button
                                                    onClick={() => handleEditCredits(u.uid, u.credits, 'add')}
                                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                >
                                                    Regala
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleDeleteUser(u.uid)}
                                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            Elimina
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {allUsers.length === 0 && !loading && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mt-6">
                    <p className="text-gray-600">Nessun utente trovato</p>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
