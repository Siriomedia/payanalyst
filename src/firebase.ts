import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";

// ================================
//  CONFIGURAZIONE FIREBASE
// ================================
const firebaseConfig = {
  apiKey: "AIzaSyCqDyPwhqUQ6kqcbyBdXSrq0D09S7aEw5c",
  authDomain: "gioia-e1f29.firebaseapp.com",
  projectId: "gioia-e1f29",
  storageBucket: "gioia-e1f29.firebasestorage.app",
  messagingSenderId: "861462463075",
  appId: "1:861462463075:web:39be7494eb9c85d9342e56",
  measurementId: "G-VXNW8SJF41"
};

// Inizializza l’app Firebase
const app = initializeApp(firebaseConfig);

// ================================
//  AUTHENTICATION
// ================================
export const auth = getAuth(app);

// Persistenza sessione permanente (anche dopo chiusura browser)
setPersistence(auth, browserLocalPersistence);

// Provider Google (login con popup)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: "select_account"   // evita auto-login indesiderati
});

// ================================
//  FIRESTORE DATABASE
// ================================
export const db = getFirestore(app);
