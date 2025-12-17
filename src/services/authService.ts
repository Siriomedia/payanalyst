// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from "firebase/auth";
import { auth } from "../firebase";
import {
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";

// Carica i dati utente da Firestore
export async function loadUserData(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : null;
}

// Salva nuovi dati utente su Firestore
export async function saveUserData(uid: string, data: any) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true });
}

export async function register(email: string, password: string) {
  const cred: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

export async function logoutFirebase() {
  await signOut(auth);
}
