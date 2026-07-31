import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './firebaseClient'
import { LETTERE, NUM_TAVOLI, ROUNDS, idOpzione } from './costanti'

// Popola i dati di base al primo avvio (nessuno script da eseguire a mano).
export async function assicuraDatiIniziali() {
  const batch = writeBatch(db)
  let daScrivere = false

  const tavoliSnap = await getDocs(collection(db, 'tavoli'))
  if (tavoliSnap.empty) {
    for (let id = 1; id <= NUM_TAVOLI; id++) {
      batch.set(doc(db, 'tavoli', String(id)), { nome: `Tavolo ${id}` })
    }
    daScrivere = true
  }

  const opzioniSnap = await getDocs(collection(db, 'opzioni'))
  if (opzioniSnap.empty) {
    for (const round of ROUNDS) {
      for (const opzione of LETTERE) {
        batch.set(doc(db, 'opzioni', idOpzione(round, opzione)), {
          round,
          opzione,
          nome: '',
          shift_q: 0,
          shift_s: 0,
          shift_c: 0,
          shift_p: 0,
        })
      }
    }
    daScrivere = true
  }

  const sessioneRef = doc(db, 'sessione', 'corrente')
  const sessioneSnap = await getDoc(sessioneRef)
  if (!sessioneSnap.exists()) {
    batch.set(sessioneRef, { round_attivo: 1, stato: 'chiuso', timer_avvio: null })
    daScrivere = true
  }

  if (daScrivere) {
    await batch.commit()
  }
}
