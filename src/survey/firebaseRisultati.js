import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
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

// Tutte le risposte, di ogni campagna, in tempo reale (il contatore sale durante l'evento).
// Il filtro per campagna si fa nella pagina, insieme agli altri filtri.
export function osservaRisposte(onDati, onErrore) {
  return onSnapshot(
    collection(dbSurvey, COLLEZIONE_SURVEY),
    (snap) => onDati(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))),
    onErrore
  )
}

// Unioni e nomi delle aziende decisi nella pagina riservata (vedi aziende.js).
const rifConfigAziende = () => doc(dbSurvey, 'survey_config', 'aziende')

export function osservaConfigAziende(onDati, onErrore) {
  return onSnapshot(rifConfigAziende(), (snap) => onDati(snap.exists() ? snap.data() : null), onErrore)
}

export function salvaConfigAziende(config) {
  return setDoc(rifConfigAziende(), {
    unioni: config.unioni ?? {},
    nomi: config.nomi ?? {},
    distinte: config.distinte ?? [],
  })
}

// Cancellazione definitiva (risposte di prova o richieste di cancellazione GDPR).
// Un batch accetta al massimo 500 operazioni.
export async function eliminaRisposte(ids) {
  for (let i = 0; i < ids.length; i += 500) {
    const batch = writeBatch(dbSurvey)
    for (const id of ids.slice(i, i + 500)) batch.delete(doc(dbSurvey, COLLEZIONE_SURVEY, id))
    await batch.commit()
  }
}
