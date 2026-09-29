import { useEffect, useRef } from 'react'
import { enableNetwork } from 'firebase/firestore'
import { db } from './firebaseClient'

// Su telefono, se lo schermo si blocca o il browser resta a lungo in background, la
// connessione realtime di Firestore puo' restare interrotta in silenzio: onSnapshot smette
// di ricevere aggiornamenti finche' non si ricarica la pagina a mano (es. la regia apre un
// round mentre il telefono e' bloccato, e al risveglio il tavolo resta sulla schermata vecchia).
// Quando la pagina torna visibile (sblocco schermo, cambio scheda/app, ritorno online) si
// prova a far ripartire la connessione e si rilancia il refresh passato come argomento, che
// tipicamente rilegge a mano i documenti agganciati in tempo reale.
export function useAggiornaAlRitorno(aggiorna) {
  const rif = useRef(aggiorna)
  rif.current = aggiorna

  useEffect(() => {
    function alRitorno() {
      if (document.visibilityState === 'hidden') return
      enableNetwork(db).catch(() => {})
      rif.current()
    }
    document.addEventListener('visibilitychange', alRitorno)
    window.addEventListener('focus', alRitorno)
    window.addEventListener('online', alRitorno)
    return () => {
      document.removeEventListener('visibilitychange', alRitorno)
      window.removeEventListener('focus', alRitorno)
      window.removeEventListener('online', alRitorno)
    }
  }, [])
}
