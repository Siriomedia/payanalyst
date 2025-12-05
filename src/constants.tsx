import React from 'react';
import { View, User } from './types.ts';
import { HomeIcon, UploadIcon, ArchiveIcon, CompareIcon, AssistantIcon, SettingsIcon, ShiftIcon, LeaveIcon, AdminIcon, SubscriptionIcon } from './components/common/Icons.tsx';

const baseItems = [
    { id: View.Dashboard, label: 'Dashboard', icon: <HomeIcon /> },
    { id: View.Upload, label: 'Carica Busta Paga', icon: <UploadIcon /> },
    { id: View.Archive, label: 'Archivio', icon: <ArchiveIcon /> },
    { id: View.Compare, label: 'Confronta', icon: <CompareIcon /> },
    { id: View.Assistant, label: 'Assistente AI', icon: <AssistantIcon /> },
    { id: View.ShiftPlanner, label: 'Pianifica Turni', icon: <ShiftIcon /> },
    { id: View.LeavePlanner, label: 'Pianifica Ferie/ROL', icon: <LeaveIcon /> },
];

const bottomItems = [
    { id: View.Subscription, label: 'Crediti', icon: <SubscriptionIcon /> },
    { id: View.Settings, label: 'Profilo Utente', icon: <SettingsIcon /> },
]

export const getNavItems = (user: User | null) => {
    let finalItems = [...baseItems];
    
    if (user?.role === 'admin') {
        const adminItem = { id: View.AdminPanel, label: 'Pannello Admin', icon: <AdminIcon /> };
        finalItems.push(adminItem);
    }

    finalItems = [...finalItems, ...bottomItems];
    
    return finalItems;
};