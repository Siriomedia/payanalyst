// src/services/userCreditsService.ts
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getCredits(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data().credits;
}

export async function setCredits(uid: string, credits: number) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { credits }, { merge: true });
}

// Verrà usato da PayPal
export async function addCredits(uid: string, amount: number) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  const current = snap.exists() ? snap.data().credits || 0 : 0;
  const updated = current + amount;

  await setDoc(ref, { credits: updated }, { merge: true });

  return updated;
}
