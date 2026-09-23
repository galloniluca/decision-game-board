import { serverTimestamp } from 'firebase/firestore'
import { CAMPAGNA, VERSIONE_TESTO_CONSENSO } from './content.js'
import { calcolaPunteggi } from './scoring.js'

// Documento scritto in survey_risposte (SURVEY_SPEC.md, sezione 6). Deve rispettare
// esattamente le regole in firestore.rules: il test delle regole usa questa funzione.
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
    risposte: Object.fromEntries(Object.entries(risposte).filter(([id]) => /^d[1-7]q[1-3]$/.test(id))),
    punteggi: calcolaPunteggi(risposte),
  }
}
