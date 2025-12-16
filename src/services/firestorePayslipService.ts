import {
    getFirestore,
    collection,
    doc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { Payslip } from '../types.ts';

export async function savePayslipToFirestore(userId: string, payslip: Payslip): Promise<void> {
    const db = getFirestore();

    const payslipId = payslip.id || `payslip-${Date.now()}-${Math.random()}`;

    const payslipDoc = {
        userId: userId,
        year: payslip.year,
        month: payslip.month,
        status: 'done',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sourceTextPreview: `Busta paga ${payslip.month}/${payslip.year} - Netto: €${payslip.netSalary.toFixed(2)}`
    };

    const analysisDoc = {
        extracted: {
            year: payslip.year,
            month: payslip.month,
            paga_base: extractPagaBase(payslip),
            ferie: {
                maturate: payslip.leaveData?.vacation?.accrued || null,
                godute: payslip.leaveData?.vacation?.used || null,
                residue: payslip.leaveData?.vacation?.balance || null
            },
            permessi: {
                maturati: payslip.leaveData?.personalLeave?.accrued || null,
                goduti: payslip.leaveData?.personalLeave?.used || null,
                residui: payslip.leaveData?.personalLeave?.balance || null
            },
            rol: {
                maturati: payslip.leaveData?.rol?.accrued || null,
                goduti: payslip.leaveData?.rol?.used || null,
                residui: payslip.leaveData?.rol?.balance || null
            },
            tfr: {
                quota_mese: payslip.tfr?.monthlyAccrual || null,
                progressivo: payslip.tfr?.totalFund || null
            },
            malattia: {
                giorni: null,
                ore: null,
                trattenute: null
            },
            confidence: 0.9,
            warnings: []
        },
        rawModelOutput: JSON.stringify(payslip),
        confidence: 0.9,
        warnings: [],
        createdAt: serverTimestamp()
    };

    const monthKey = `${payslip.year}-${payslip.month.toString().padStart(2, '0')}`;
    const monthlyDoc = {
        year: payslip.year,
        month: payslip.month,
        paga_base: extractPagaBase(payslip),
        ferie: {
            maturate: payslip.leaveData?.vacation?.accrued || null,
            godute: payslip.leaveData?.vacation?.used || null,
            residue: payslip.leaveData?.vacation?.balance || null
        },
        permessi: {
            maturati: payslip.leaveData?.personalLeave?.accrued || null,
            goduti: payslip.leaveData?.personalLeave?.used || null,
            residui: payslip.leaveData?.personalLeave?.balance || null
        },
        rol: {
            maturati: payslip.leaveData?.rol?.accrued || null,
            goduti: payslip.leaveData?.rol?.used || null,
            residui: payslip.leaveData?.rol?.balance || null
        },
        tfr: {
            quota_mese: payslip.tfr?.monthlyAccrual || null,
            progressivo: payslip.tfr?.totalFund || null
        },
        malattia: {
            giorni: null,
            ore: null,
            trattenute: null
        },
        sourcePayslipId: payslipId,
        updatedAt: serverTimestamp()
    };

    try {
        console.log('💾 Salvando busta paga in Firestore...');
        console.log('   - Payslip ID:', payslipId);
        console.log('   - User ID:', userId);
        console.log('   - Periodo:', `${payslip.month}/${payslip.year}`);

        await setDoc(doc(db, 'payslips', payslipId), payslipDoc);
        console.log('✅ Documento payslip salvato');

        await setDoc(doc(db, 'payslips', payslipId, 'analysis', 'result'), analysisDoc);
        console.log('✅ Analisi salvata');

        await setDoc(doc(db, 'users', userId, 'monthly', monthKey), monthlyDoc);
        console.log('✅ Dati mensili salvati');

        console.log('🎉 Busta paga salvata con successo nel Database Storico!');
    } catch (error) {
        console.error('❌ Errore salvando busta paga in Firestore:', error);
        throw error;
    }
}

function extractPagaBase(payslip: Payslip): number | null {
    if (!payslip.remunerationElements || payslip.remunerationElements.length === 0) {
        return null;
    }

    const pagaBaseItem = payslip.remunerationElements.find(item =>
        item.description.toLowerCase().includes('paga base') ||
        item.description.toLowerCase().includes('retribuzione')
    );

    return pagaBaseItem ? pagaBaseItem.value : payslip.remunerationElements[0].value;
}
