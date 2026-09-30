import { useEffect, useState } from 'react'

// Su telefono, se lo schermo si blocca o il browser resta a lungo in background, i listener
// realtime di Firestore possono restare fermi finche' non si ricarica la pagina. Questo hook
// restituisce un contatore che aumenta quando la pagina torna visibile o la rete torna: va
// messo nelle dipendenze degli useEffect che creano gli onSnapshot, cosi i listener vengono
// ricreati da zero invece di affiancare letture manuali agli stessi dati (che in passato
// mandava in errore interno l'SDK).
export function useRiconnessione() {
  const [versione, setVersione] = useState(0)

  useEffect(() => {
    let nascosta = false
    function cambioVisibilita() {
      if (document.visibilityState === 'hidden') {
        nascosta = true
      } else if (nascosta) {
        nascosta = false
        setVersione((v) => v + 1)
      }
    }
    function tornaOnline() {
      setVersione((v) => v + 1)
    }
    document.addEventListener('visibilitychange', cambioVisibilita)
    window.addEventListener('online', tornaOnline)
    return () => {
      document.removeEventListener('visibilitychange', cambioVisibilita)
      window.removeEventListener('online', tornaOnline)
    }
  }, [])

  return versione
}

const CHIAVE_RICARICA = 'firestore-ricarica-at'
const MS_TRA_RICARICHE = 30000

// Dopo un "INTERNAL ASSERTION FAILED" il client Firestore della pagina resta rotto per sempre:
// l'unico rimedio e' ricaricare. Lo si fa in automatico, al massimo una volta ogni 30 secondi
// per non entrare in un ciclo di ricariche se l'errore si ripresentasse subito.
export function gestisciErroreFirestore(err, setErrore) {
  const messaggio = String(err?.message ?? err)
  if (!messaggio.includes('INTERNAL ASSERTION FAILED')) {
    setErrore(messaggio)
    return
  }
  let ultima = 0
  try {
    ultima = Number(sessionStorage.getItem(CHIAVE_RICARICA)) || 0
  } catch {
    // sessionStorage non disponibile: si ricarica comunque una volta
  }
  if (Date.now() - ultima > MS_TRA_RICARICHE) {
    try {
      sessionStorage.setItem(CHIAVE_RICARICA, String(Date.now()))
    } catch {
      // ignorato
    }
    window.location.reload()
    return
  }
  setErrore('Connessione al gioco interrotta. Ricarica la pagina.')
}
