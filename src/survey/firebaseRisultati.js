import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { appSurvey, dbSurvey, COLLEZIONE_SURVEY } from './firebaseSurvey'
import { EMAIL_RISULTATI } from './accesso'

// Usato solo dalla pagina riservata /survey-risultati (caricata a parte): il codice di
// Firebase Authentication non finisce nel questionario dei partecipanti.
const auth = getAuth(appSurvey)

export function osservaAccesso(callback) {
  return onAuthStateChanged(auth, (utente) => callback(utente?.email === EMAIL_RISULTATI ? utente : null))
}

export function accedi(chiave) {
  return signInWithEmailAndPassword(auth, EMAIL_RISULTATI, chiave)
}

export function esci() {
  return signOut(auth)
}

// Risposte della campagna in tempo reale (il contatore sale durante l'evento).
export function osservaRisposte(campagna, onDati, onErrore) {
  const q = query(collection(dbSurvey, COLLEZIONE_SURVEY), where('campagna', '==', campagna))
  return onSnapshot(
    q,
    (snap) => onDati(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))),
    onErrore
  )
}
