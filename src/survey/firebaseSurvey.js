import { initializeApp } from 'firebase/app'
import { doc, collection, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { CAMPAGNA, VERSIONE_TESTO_CONSENSO } from './content'
import { calcolaPunteggi } from './scoring'

// Istanza Firebase dedicata al survey (nome 'survey'), separata da quella del game.
// Se VITE_SURVEY_FIREBASE_PROJECT_ID è valorizzata si usano tutte le VITE_SURVEY_FIREBASE_*,
// altrimenti si ricade sulla config del game (VITE_FIREBASE_*). Si sceglie in blocco, non
// campo per campo, per non mescolare chiavi di due progetti diversi.
const env = import.meta.env
const usaProgettoSurvey = Boolean(env.VITE_SURVEY_FIREBASE_PROJECT_ID)
const prefisso = usaProgettoSurvey ? 'VITE_SURVEY_FIREBASE_' : 'VITE_FIREBASE_'

const config = {
  apiKey: env[`${prefisso}API_KEY`],
  authDomain: env[`${prefisso}AUTH_DOMAIN`],
  projectId: env[`${prefisso}PROJECT_ID`],
  storageBucket: env[`${prefisso}STORAGE_BUCKET`],
  messagingSenderId: env[`${prefisso}MESSAGING_SENDER_ID`],
  appId: env[`${prefisso}APP_ID`],
}

if (!config.apiKey || !config.projectId) {
  console.error(`Configurazione Firebase del survey mancante: verifica le variabili ${prefisso}*`)
}

const app = initializeApp(config, 'survey')
const db = getFirestore(app)

export const COLLEZIONE_SURVEY = 'survey_risposte'

// Id documento generato sul client: resta lo stesso nei tentativi successivi ("Riprova"),
// così un invio già arrivato al server non viene duplicato.
export function nuovoIdRisposta() {
  return doc(collection(db, COLLEZIONE_SURVEY)).id
}

const TIMEOUT_INVIO_MS = 20000

// Senza rete l'SDK non rifiuta la scrittura ma la tiene in coda: dopo il timeout
// mostriamo l'errore, la scrittura in coda può comunque partire quando torna la rete.
function conTimeout(promessa) {
  let timer
  const scadenza = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('Tempo scaduto')
      err.code = 'timeout'
      reject(err)
    }, TIMEOUT_INVIO_MS)
  })
  return Promise.race([promessa, scadenza]).finally(() => clearTimeout(timer))
}

export function costruisciDocumento({ consenso, anagrafica, risposte }) {
  const pulisci = (s) => String(s ?? '').trim()
  return {
    campagna: CAMPAGNA,
    creato_at: serverTimestamp(),
    consenso: {
      privacy: consenso.privacy === true,
      benchmark_aggregato: consenso.benchmark_aggregato === true,
      contatto_bpr: consenso.contatto_bpr === true,
      versione_testo: VERSIONE_TESTO_CONSENSO,
    },
    anagrafica: {
      nome: pulisci(anagrafica.nome),
      azienda: pulisci(anagrafica.azienda),
      email: pulisci(anagrafica.email),
      ruolo: pulisci(anagrafica.ruolo),
      settore: anagrafica.settore,
      dimensione: anagrafica.dimensione,
    },
    risposte: { ...risposte },
    punteggi: calcolaPunteggi(risposte),
  }
}

// Scrive l'unico documento del questionario. Restituisce una promessa che si risolve
// quando il server ha confermato la scrittura.
let invioInCorso = null

export function inviaRisposta(id, dati) {
  if (!invioInCorso || invioInCorso.id !== id) {
    const promessa = setDoc(doc(db, COLLEZIONE_SURVEY, id), costruisciDocumento(dati))
    invioInCorso = { id, promessa }
    promessa.catch(() => {
      // Se la scrittura è stata rifiutata, il prossimo tentativo ne crea una nuova.
      if (invioInCorso?.promessa === promessa) invioInCorso = null
    })
  }
  // Se una scrittura con lo stesso id è ancora in coda (es. rete assente),
  // "Riprova" aspetta quella invece di accodarne un'altra.
  return conTimeout(invioInCorso.promessa)
}
