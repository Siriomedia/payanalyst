# Integrazione Frontend → Cloud Functions

Questo documento mostra come il frontend React deve integrare il sistema automatico di elaborazione buste paga.

## Workflow completo

1. **Frontend**: Utente seleziona PDF
2. **Frontend**: Upload PDF su Firebase Storage
3. **Frontend**: Crea documento in Firestore `payslips/{payslipId}` con status="uploaded"
4. **Backend**: Cloud Function si attiva automaticamente (trigger onCreate)
5. **Backend**: Elabora PDF, analizza con Gemini, salva risultati
6. **Frontend**: Ascolta cambio status tramite snapshot listener

---

## Codice Frontend (React + Firebase)

### 1. Upload PDF e creazione documento Firestore

```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface UploadPayslipParams {
  userId: string;
  year: number;
  month: number;
  pdfFile: File;
}

/**
 * Upload PDF su Storage e crea documento su Firestore per trigger backend
 */
async function uploadPayslip({ userId, year, month, pdfFile }: UploadPayslipParams) {
  const storage = getStorage();
  const db = getFirestore();

  // 1. Upload PDF su Storage
  const timestamp = Date.now();
  const storagePath = `payslips/${userId}/${year}/${month}/${timestamp}_${pdfFile.name}`;
  const storageRef = ref(storage, storagePath);

  console.log('📤 Upload PDF...');
  await uploadBytes(storageRef, pdfFile);
  console.log('✅ PDF caricato su:', storagePath);

  // 2. Crea documento su Firestore (questo triggera la Cloud Function)
  const payslipDoc = {
    userId,
    year,
    month,
    storagePath,
    status: 'uploaded',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'payslips'), payslipDoc);
  console.log('✅ Documento Firestore creato:', docRef.id);

  return docRef.id;
}
```

### 2. Listener real-time per monitorare elaborazione

```typescript
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Ascolta i cambiamenti dello status del documento payslip
 */
function listenToPayslipStatus(
  payslipId: string,
  onStatusChange: (status: string, data: any) => void
) {
  const db = getFirestore();
  const payslipRef = doc(db, 'payslips', payslipId);

  const unsubscribe = onSnapshot(payslipRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log('📊 Status aggiornato:', data.status);
      onStatusChange(data.status, data);
    }
  });

  return unsubscribe; // Chiama per fermare il listener
}
```

### 3. Recupero analisi completata

```typescript
import { doc, getDoc } from 'firebase/firestore';

/**
 * Recupera l'analisi completata dalla subcollection
 */
async function getPayslipAnalysis(payslipId: string) {
  const db = getFirestore();
  const analysisRef = doc(db, 'payslips', payslipId, 'analysis', 'result');

  const snapshot = await getDoc(analysisRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  return null;
}
```

### 4. Recupero dati mensili aggregati

```typescript
import { doc, getDoc } from 'firebase/firestore';

/**
 * Recupera i dati mensili aggregati per un utente
 */
async function getMonthlyData(userId: string, year: number, month: number) {
  const db = getFirestore();
  const monthKey = `${year}-${month.toString().padStart(2, '0')}`; // es. "2025-03"
  const monthlyRef = doc(db, 'users', userId, 'monthly', monthKey);

  const snapshot = await getDoc(monthlyRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  return null;
}
```

---

## Esempio Componente React Completo

```typescript
import React, { useState } from 'react';
import { uploadPayslip, listenToPayslipStatus, getPayslipAnalysis } from './payslipService';

function PayslipUploader({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(3);
  const [status, setStatus] = useState<string>('idle');
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      // Upload e crea documento
      const payslipId = await uploadPayslip({ userId, year, month, pdfFile: file });

      // Ascolta cambio status
      const unsubscribe = listenToPayslipStatus(payslipId, async (newStatus, data) => {
        setStatus(newStatus);

        if (newStatus === 'done') {
          // Recupera analisi
          const result = await getPayslipAnalysis(payslipId);
          setAnalysis(result);
          unsubscribe(); // Stop listening
        } else if (newStatus === 'error') {
          setError(data.errorMessage || 'Errore sconosciuto');
          unsubscribe();
        }
      });

    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div>
      <h2>Carica Busta Paga</h2>

      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      <input type="number" value={month} min="1" max="12" onChange={(e) => setMonth(Number(e.target.value))} />

      <button onClick={handleUpload} disabled={!file || status === 'uploading' || status === 'processing'}>
        Carica e Analizza
      </button>

      {status === 'uploading' && <p>📤 Caricamento PDF...</p>}
      {status === 'uploaded' && <p>⏳ In attesa elaborazione...</p>}
      {status === 'processing' && <p>🤖 Elaborazione in corso...</p>}
      {status === 'done' && <p>✅ Analisi completata!</p>}
      {status === 'error' && <p>❌ Errore: {error}</p>}

      {analysis && (
        <div>
          <h3>Risultati Analisi</h3>
          <pre>{JSON.stringify(analysis.extracted, null, 2)}</pre>
          <p>Confidence: {(analysis.confidence * 100).toFixed(0)}%</p>
          {analysis.warnings.length > 0 && (
            <div>
              <strong>Avvisi:</strong>
              <ul>
                {analysis.warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PayslipUploader;
```

---

## Security Rules Firestore (esempio)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Payslips: solo owner può creare/leggere
    match /payslips/{payslipId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow update: if false; // Solo Cloud Functions possono aggiornare

      // Analysis subcollection: solo owner può leggere
      match /analysis/{docId} {
        allow read: if request.auth != null && get(/databases/$(database)/documents/payslips/$(payslipId)).data.userId == request.auth.uid;
        allow write: if false; // Solo Cloud Functions
      }
    }

    // Monthly data: solo owner può leggere
    match /users/{userId}/monthly/{monthId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Solo Cloud Functions
    }
  }
}
```

---

## Storage Rules (esempio)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /payslips/{userId}/{year}/{month}/{fileName} {
      // Upload solo se autenticato e userId match
      allow write: if request.auth != null && request.auth.uid == userId;
      // Read: solo owner (Cloud Functions hanno accesso automatico)
      allow read: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Testing Flow

1. Crea un PDF di test con busta paga
2. Esegui l'upload dal frontend
3. Monitora i logs della Cloud Function:
   ```bash
   firebase functions:log --only onPayslipCreated
   ```
4. Verifica i documenti creati su Firestore Console
5. Controlla che il documento mensile sia stato creato/aggiornato

---

## Note Importanti

- La Cloud Function si attiva **automaticamente** quando crei il documento
- Non servono chiamate HTTP manuali
- Il frontend deve solo creare il documento con `status: "uploaded"`
- Il backend gestisce tutto il resto
- Usa **listener real-time** per UX migliore (no polling)
