import { useEffect, useRef, useState } from 'react'
import { CAMPI_ANAGRAFICA, DIMENSIONI } from './content'
import { risposteComplete } from './scoring'
import { inviaRisposta, nuovoIdRisposta } from './firebaseSurvey'
import { leggiStato, salvaStato } from './storage'
import { anagraficaValida, consensiValidi } from './validazione'
import SurveyHeader from './SurveyHeader'
import SchermataConsenso from './SchermataConsenso'
import SchermataAnagrafica from './SchermataAnagrafica'
import SchermataDimensione from './SchermataDimensione'
import SchermataInvio from './SchermataInvio'
import Risultato from './Risultato'

// Pagina pubblica /survey: consenso → anagrafica → 7 dimensioni → invio → risultato.
// Non è linkata da nessuna vista del game; si apre dal QR code dell'evento.

const STATO_INIZIALE = {
  passo: 'consenso', // consenso | anagrafica | domande | invio
  indiceDimensione: 0,
  consenso: { privacy: false, benchmark_aggregato: false, contatto_bpr: false },
  anagrafica: Object.fromEntries(CAMPI_ANAGRAFICA.map((c) => [c.id, ''])),
  risposte: {},
  idRisposta: null,
  invioTentato: false,
  completato: false,
}

function statoIniziale() {
  const salvato = leggiStato()
  if (!salvato) return STATO_INIZIALE
  return {
    ...STATO_INIZIALE,
    ...salvato,
    consenso: { ...STATO_INIZIALE.consenso, ...salvato.consenso },
    anagrafica: { ...STATO_INIZIALE.anagrafica, ...salvato.anagrafica },
    risposte: { ...salvato.risposte },
  }
}

function messaggioErrore(err) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  if (offline || err?.code === 'timeout' || err?.code === 'unavailable') {
    return 'Connessione assente o troppo debole. Le tue risposte sono salvate su questo dispositivo: controlla la connessione e premi "Riprova".'
  }
  return "Non è stato possibile inviare le risposte. Le tue risposte sono salvate su questo dispositivo: premi \"Riprova\" tra qualche istante."
}

function Survey() {
  const [stato, setStato] = useState(statoIniziale)
  const [invio, setInvio] = useState({ inCorso: false, errore: null })
  // Vero se un invio era già partito prima di questo caricamento della pagina (vedi invia()).
  const tentatoPrimaDelCaricamento = useRef(stato.invioTentato)

  useEffect(() => {
    salvaStato(stato)
  }, [stato])

  // A ogni cambio di schermata si riparte dall'alto (importante su smartphone).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stato.passo, stato.indiceDimensione, stato.completato])

  function aggiorna(parziale) {
    setStato((s) => ({ ...s, ...parziale }))
  }

  async function invia() {
    // Controllo di sicurezza: normalmente le schermate non lasciano arrivare qui dati incompleti.
    if (!consensiValidi(stato.consenso)) return aggiorna({ passo: 'consenso' })
    if (!anagraficaValida(stato.anagrafica)) return aggiorna({ passo: 'anagrafica' })
    if (!risposteComplete(stato.risposte)) return aggiorna({ passo: 'domande' })
    const idRisposta = stato.idRisposta ?? nuovoIdRisposta()
    aggiorna({ passo: 'invio', idRisposta, invioTentato: true })
    setInvio({ inCorso: true, errore: null })
    try {
      await inviaRisposta(idRisposta, stato)
      aggiorna({ completato: true, passo: 'invio' })
      setInvio({ inCorso: false, errore: null })
    } catch (err) {
      // Le regole permettono solo la creazione: se un invio con questo id era già partito
      // prima di un ricaricamento ed era arrivato al server, riscriverlo viene rifiutato.
      // I dati sono validati prima dell'invio, quindi in quel caso la risposta è già salvata.
      if (err?.code === 'permission-denied' && tentatoPrimaDelCaricamento.current) {
        aggiorna({ completato: true })
        setInvio({ inCorso: false, errore: null })
        return
      }
      console.error('Invio survey fallito', err)
      setInvio({ inCorso: false, errore: messaggioErrore(err) })
    }
  }

  let contenuto
  if (stato.completato) {
    contenuto = <Risultato anagrafica={stato.anagrafica} risposte={stato.risposte} />
  } else if (stato.passo === 'anagrafica') {
    contenuto = (
      <SchermataAnagrafica
        valori={stato.anagrafica}
        onChange={(anagrafica) => aggiorna({ anagrafica })}
        onIndietro={() => aggiorna({ passo: 'consenso' })}
        onAvanti={() => aggiorna({ passo: 'domande' })}
      />
    )
  } else if (stato.passo === 'domande') {
    const i = Math.min(stato.indiceDimensione, DIMENSIONI.length - 1)
    contenuto = (
      <SchermataDimensione
        indice={i}
        risposte={stato.risposte}
        onRisposta={(id, valore) =>
          setStato((s) => ({ ...s, risposte: { ...s.risposte, [id]: valore } }))
        }
        onIndietro={() =>
          i === 0 ? aggiorna({ passo: 'anagrafica' }) : aggiorna({ indiceDimensione: i - 1 })
        }
        onAvanti={() =>
          i === DIMENSIONI.length - 1 ? invia() : aggiorna({ indiceDimensione: i + 1 })
        }
      />
    )
  } else if (stato.passo === 'invio') {
    contenuto = (
      <SchermataInvio
        inCorso={invio.inCorso}
        errore={invio.errore}
        onRiprova={invia}
        onIndietro={() => {
          setInvio({ inCorso: false, errore: null })
          aggiorna({ passo: 'domande', indiceDimensione: DIMENSIONI.length - 1 })
        }}
      />
    )
  } else {
    contenuto = (
      <SchermataConsenso
        valori={stato.consenso}
        onChange={(consenso) => aggiorna({ consenso })}
        onAvanti={() => aggiorna({ passo: 'anagrafica' })}
      />
    )
  }

  return (
    <div className="page survey">
      <SurveyHeader />
      <main className="page-inner survey-inner">{contenuto}</main>
    </div>
  )
}

export default Survey
