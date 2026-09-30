import { Fragment, useEffect, useMemo, useState } from 'react'
import Topbar from '../components/Topbar'
import NavGioco from '../components/NavGioco'
import { CAMPAGNA, DIMENSIONI, DIMENSIONI_AZIENDA, SETTORI } from './content'
import { arrotonda, livello } from './scoring'
import {
  FILTRI_VUOTI,
  benchmarkPer,
  conteggioPer,
  creaCsv,
  creaJson,
  elencoCampagne,
  filtraRisposte,
  filtriAttivi,
  medie,
  millisecondi,
  periodoRapido,
  preparaRisposte,
} from './risultati'
import { accedi, eliminaRisposte, esci, osservaAccesso, osservaRisposte } from './firebaseRisultati'
import Radar from './Radar'
import ReportPersonale from './ReportPersonale'
import { creaZipReport, scaricaBlob } from './pdfReport'

// Pagina riservata: chi ha risposto, risultati di ciascuno, benchmark e download.
// Si apre con il link riservato …/survey-risultati#chiave=<password> oppure inserendo la
// chiave a mano; l'accesso resta attivo su quel browser finché non si preme "Esci".

const ASSI = DIMENSIONI.map((d) => ({ id: d.id, etichetta: d.breve }))
const MIN_CAMPIONE = 3 // sotto questa soglia la media di un gruppo è poco indicativa

function messaggioAccesso(err) {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Chiave non valida.'
    case 'auth/operation-not-allowed':
      return 'Accesso Email/Password non attivo nel progetto Firebase (vedi README).'
    case 'auth/too-many-requests':
      return 'Troppi tentativi: riprova tra qualche minuto.'
    case 'auth/network-request-failed':
      return 'Connessione assente: riprova.'
    default:
      return `Accesso non riuscito (${err?.code ?? err?.message ?? 'errore sconosciuto'}).`
  }
}

function messaggioLettura(err) {
  if (err?.code === 'permission-denied') {
    return 'Firestore non permette la lettura: pubblica dalla console la versione aggiornata di firestore.rules (vedi README).'
  }
  return `Impossibile leggere le risposte (${err?.code ?? err?.message}).`
}

function formattaData(valore) {
  const d = typeof valore?.toDate === 'function' ? valore.toDate() : valore ? new Date(valore) : null
  if (!d || Number.isNaN(d.getTime())) return '–'
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function pct(valore) {
  return valore === null || valore === undefined ? '–' : `${arrotonda(valore)}%`
}

function scarica(nomeFile, contenuto, tipo) {
  const url = URL.createObjectURL(new Blob([contenuto], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Legenda({ voci }) {
  return (
    <div className="risultati-legenda">
      {voci.map((v) => (
        <span key={v.nome} className={`risultati-legenda__voce ${v.classe}`}>
          <span className={`risultati-legenda__segno${v.forma === 'quadrato' ? ' quadrato' : ''}`} />
          {v.nome}
        </span>
      ))}
    </div>
  )
}

function Accesso({ onAccedi, errore, inCorso }) {
  const [chiave, setChiave] = useState('')
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault()
        if (chiave) onAccedi(chiave)
      }}
    >
      <h2>Accesso riservato</h2>
      <p className="status-muted">
        Apri il link riservato oppure inserisci la chiave di accesso. Su questo browser l&apos;accesso
        resta attivo finché non premi &quot;Esci&quot;.
      </p>
      <div className="survey-campo">
        <label htmlFor="chiave-risultati">Chiave di accesso</label>
        <input
          id="chiave-risultati"
          className="input"
          type="password"
          autoComplete="current-password"
          value={chiave}
          onChange={(e) => setChiave(e.target.value)}
        />
      </div>
      {errore && <p className="status-error">{errore}</p>}
      <div className="survey-nav">
        <span />
        <button type="submit" className="btn btn-primary" disabled={!chiave || inCorso}>
          {inCorso ? 'Accesso...' : 'Entra'}
        </button>
      </div>
    </form>
  )
}

function DettaglioPartecipante({ risposta, mediaConfronto, nomeConfronto, onApriReport }) {
  const a = risposta.anagrafica ?? {}
  return (
    <div className="risultati-dettaglio">
      <div className="risultati-dettaglio__dati">
        <p>
          <strong>{a.nome}</strong> · {a.ruolo} · {a.azienda}
        </p>
        <p className="status-muted">
          {a.email} · {a.settore} · {a.dimensione} · contatto BPR:{' '}
          {risposta.consenso?.contatto_bpr ? 'sì' : 'no'}
        </p>
        {risposta.valida ? (
          <table className="table risultati-tabella-dimensioni">
            <thead>
              <tr>
                <th>Dimensione</th>
                <th>Punteggio</th>
                <th>Fascia</th>
                <th>{nomeConfronto}</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONI.map((d) => (
                <tr key={d.id}>
                  <td>{d.titolo}</td>
                  <td>{pct(risposta.punteggi[d.id])}</td>
                  <td>{livello(risposta.punteggi[d.id]).nome}</td>
                  <td className="status-muted">{pct(mediaConfronto?.[d.id])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="status-error">Risposte incomplete: esclusa dai calcoli.</p>
        )}
        {risposta.valida && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onApriReport}>
            Report personale (PDF)
          </button>
        )}
      </div>
      {risposta.valida && (
        <div className="risultati-dettaglio__radar">
          <Radar
            assi={ASSI}
            serie={[
              ...(mediaConfronto
                ? [{ id: 'media', valori: mediaConfronto, classe: 'serie-b', forma: 'quadrato' }]
                : []),
              { id: 'persona', valori: risposta.punteggi, classe: 'serie-a' },
            ]}
          />
          <Legenda
            voci={[
              { nome: a.azienda || 'Partecipante', classe: 'serie-a' },
              ...(mediaConfronto ? [{ nome: nomeConfronto, classe: 'serie-b', forma: 'quadrato' }] : []),
            ]}
          />
        </div>
      )}
    </div>
  )
}

function Filtri({ filtri, onCambia, campagne, trovate, totali }) {
  const imposta = (campo) => (e) => onCambia({ ...filtri, [campo]: e.target.value })
  return (
    <section className="card risultati-filtri">
      <div className="risultati-filtri__testa">
        <h2>Filtri</h2>
        <span className="status-muted">
          {trovate} di {totali} risposte
        </span>
      </div>
      <div className="risultati-filtri__griglia">
        <div className="survey-campo">
          <label htmlFor="filtro-campagna">Campagna</label>
          <select id="filtro-campagna" className="input" value={filtri.campagna} onChange={imposta('campagna')}>
            <option value="">Tutte</option>
            {campagne.map((c) => (
              <option key={c} value={c}>
                {c || '(senza campagna)'}
              </option>
            ))}
          </select>
        </div>
        <div className="survey-campo">
          <label htmlFor="filtro-da">Dal</label>
          <input id="filtro-da" className="input" type="date" value={filtri.da} onChange={imposta('da')} />
        </div>
        <div className="survey-campo">
          <label htmlFor="filtro-a">Al</label>
          <input id="filtro-a" className="input" type="date" value={filtri.a} onChange={imposta('a')} />
        </div>
        <div className="survey-campo">
          <label htmlFor="filtro-settore">Settore</label>
          <select id="filtro-settore" className="input" value={filtri.settore} onChange={imposta('settore')}>
            <option value="">Tutti</option>
            {SETTORI.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="survey-campo">
          <label htmlFor="filtro-dimensione">Dimensione aziendale</label>
          <select id="filtro-dimensione" className="input" value={filtri.dimensione} onChange={imposta('dimensione')}>
            <option value="">Tutte</option>
            {DIMENSIONI_AZIENDA.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="survey-campo">
          <label htmlFor="filtro-testo">Cerca</label>
          <input
            id="filtro-testo"
            className="input"
            type="search"
            placeholder="nome, azienda, email, ruolo"
            value={filtri.testo}
            onChange={imposta('testo')}
          />
        </div>
      </div>
      <div className="risultati-filtri__rapidi">
        <span className="status-muted">Periodo:</span>
        <button type="button" className="btn btn-sm" onClick={() => onCambia({ ...filtri, ...periodoRapido(30) })}>
          Ultimi 30 giorni
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onCambia({ ...filtri, ...periodoRapido(365) })}>
          Ultimo anno
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onCambia({ ...filtri, da: '', a: '' })}>
          Sempre
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!filtriAttivi(filtri)}
          onClick={() => onCambia(FILTRI_VUOTI)}
        >
          Azzera filtri
        </button>
      </div>
    </section>
  )
}

function Contenuto({ tutte, onApriReport }) {
  const campagne = useMemo(() => elencoCampagne(tutte), [tutte])
  const [filtri, setFiltri] = useState(() => ({
    ...FILTRI_VUOTI,
    campagna: tutte.some((r) => r.campagna === CAMPAGNA) ? CAMPAGNA : '',
  }))
  const [settoreScelto, setSettoreScelto] = useState('')
  const [aperto, setAperto] = useState(null)
  const [statoZip, setStatoZip] = useState(null)
  const [selezionati, setSelezionati] = useState(() => new Set())
  const [eliminazione, setEliminazione] = useState(null)

  const risposte = filtraRisposte(tutte, filtri)
  const mediaTutte = medie(risposte)
  const perSettore = benchmarkPer(risposte, 'settore', SETTORI)
  const perDimensione = benchmarkPer(risposte, 'dimensione', DIMENSIONI_AZIENDA)
  const conteggiSettore = conteggioPer(risposte, 'settore', SETTORI)
  const conteggiDimensione = conteggioPer(risposte, 'dimensione', DIMENSIONI_AZIENDA)
  const gruppoScelto = perSettore.find((g) => g.valore === settoreScelto)
  const contatti = risposte.filter((r) => r.consenso?.contatto_bpr).length
  const incomplete = risposte.filter((r) => !r.valida).length

  const visibili = [...risposte].sort(
    (x, y) => (millisecondi(y.creato_at) ?? 0) - (millisecondi(x.creato_at) ?? 0)
  )
  const valide = visibili.filter((r) => r.valida)
  // Si cancellano solo le righe selezionate ancora visibili con i filtri attuali.
  const daEliminare = visibili.filter((r) => selezionati.has(r.id))
  const tutteSelezionate = visibili.length > 0 && daEliminare.length === visibili.length

  const oggi = new Date().toISOString().slice(0, 10)
  const nomeBase = `survey_${filtri.campagna || 'tutte'}${filtriAttivi({ ...filtri, campagna: '' }) ? '_filtrato' : ''}_${oggi}`

  function cambiaFiltri(nuovi) {
    setFiltri(nuovi)
    setAperto(null)
  }

  function selezionaTutte() {
    setSelezionati(tutteSelezionate ? new Set() : new Set(visibili.map((r) => r.id)))
  }

  function commuta(id) {
    setSelezionati((prima) => {
      const dopo = new Set(prima)
      if (dopo.has(id)) dopo.delete(id)
      else dopo.add(id)
      return dopo
    })
  }

  async function eliminaSelezionate() {
    const nomi = daEliminare.map((r) => `- ${r.anagrafica?.nome ?? '?'} (${r.anagrafica?.azienda ?? ''})`)
    const elenco = nomi.length > 12 ? [...nomi.slice(0, 12), `... e altre ${nomi.length - 12}`] : nomi
    const ok = window.confirm(
      `Eliminare DEFINITIVAMENTE ${daEliminare.length} risposte?\n\n${elenco.join('\n')}\n\nL'operazione non si può annullare.`
    )
    if (!ok) return
    setEliminazione({ inCorso: true })
    try {
      await eliminaRisposte(daEliminare.map((r) => r.id))
      setSelezionati(new Set())
      setAperto(null)
      setEliminazione(null)
    } catch (err) {
      setEliminazione({
        errore:
          err?.code === 'permission-denied'
            ? 'Firestore non permette la cancellazione: pubblica dalla console la versione aggiornata di firestore.rules.'
            : err.message,
      })
    }
  }

  async function scaricaTuttiReport() {
    setStatoZip({ fatti: 0, totale: valide.length })
    try {
      const zip = await creaZipReport(valide, tutte, (fatti, totale) => setStatoZip({ fatti, totale }))
      scaricaBlob(`report_${nomeBase}.zip`, zip)
      setStatoZip(null)
    } catch (err) {
      setStatoZip({ errore: err.message })
    }
  }

  return (
    <>
      <Filtri
        filtri={filtri}
        onCambia={cambiaFiltri}
        campagne={campagne}
        trovate={risposte.length}
        totali={tutte.length}
      />

      <div className="risultati-azioni">
        <button
          className="btn"
          disabled={visibili.length === 0}
          onClick={() => scarica(`${nomeBase}.csv`, creaCsv(visibili), 'text/csv;charset=utf-8')}
        >
          Scarica CSV (Excel) ({visibili.length})
        </button>
        <button
          className="btn"
          disabled={visibili.length === 0}
          onClick={() =>
            scarica(`${nomeBase}.json`, creaJson(visibili, filtri.campagna || 'tutte'), 'application/json')
          }
        >
          Scarica JSON
        </button>
        <button
          className="btn btn-primary"
          disabled={valide.length === 0 || (statoZip !== null && !statoZip.errore)}
          onClick={scaricaTuttiReport}
        >
          Scarica i report PDF ({valide.length})
        </button>
        {statoZip && !statoZip.errore && (
          <span className="status-muted">
            Generazione report {statoZip.fatti}/{statoZip.totale}... non chiudere la pagina
          </span>
        )}
        {statoZip?.errore && <span className="status-error">Errore: {statoZip.errore}</span>}
      </div>
      <p className="status-muted risultati-nota">
        I download contengono solo le risposte che corrispondono ai filtri. Nei report PDF il confronto usa
        sempre tutte le risposte della campagna della persona, così il report non cambia con i filtri.
      </p>

      <div className="risultati-kpi">
        <div className="card risultati-kpi__tile">
          <div className="section-label">Risposte</div>
          <div className="risultati-kpi__valore">{risposte.length}</div>
          {incomplete > 0 && <div className="status-error">{incomplete} incomplete</div>}
        </div>
        <div className="card risultati-kpi__tile">
          <div className="section-label">Maturità media</div>
          <div className="risultati-kpi__valore">{pct(mediaTutte?.totale)}</div>
          <div className="status-muted">{mediaTutte ? livello(mediaTutte.totale).nome : '–'}</div>
        </div>
        <div className="card risultati-kpi__tile">
          <div className="section-label">Vogliono essere contattati</div>
          <div className="risultati-kpi__valore">{contatti}</div>
        </div>
      </div>

      {risposte.length === 0 ? (
        <div className="card">
          <p className="status-muted">Nessuna risposta corrisponde ai filtri.</p>
        </div>
      ) : (
        <>
          <section className="card">
            <h2>Benchmark</h2>
            <div className="survey-campo risultati-filtro">
              <label htmlFor="settore-benchmark">Confronta con un settore</label>
              <select
                id="settore-benchmark"
                className="input"
                value={settoreScelto}
                onChange={(e) => setSettoreScelto(e.target.value)}
              >
                <option value="">Solo media di tutte le aziende</option>
                {perSettore.map((g) => (
                  <option key={g.valore} value={g.valore} disabled={g.n === 0}>
                    {g.valore} ({g.n})
                  </option>
                ))}
              </select>
            </div>
            {gruppoScelto && gruppoScelto.n < MIN_CAMPIONE && (
              <p className="status-muted">
                Attenzione: solo {gruppoScelto.n} risposte in questo settore, media poco indicativa.
              </p>
            )}
            <div className="risultati-benchmark">
              <div className="risultati-benchmark__radar">
                <Radar
                  assi={ASSI}
                  serie={[
                    ...(gruppoScelto?.medie
                      ? [{ id: 'settore', valori: gruppoScelto.medie, classe: 'serie-b', forma: 'quadrato' }]
                      : []),
                    { id: 'tutte', valori: mediaTutte ?? {}, classe: 'serie-a' },
                  ]}
                />
                <Legenda
                  voci={[
                    { nome: `Tutte le aziende (${risposte.length - incomplete})`, classe: 'serie-a' },
                    ...(gruppoScelto?.medie
                      ? [{ nome: `${gruppoScelto.valore} (${gruppoScelto.n})`, classe: 'serie-b', forma: 'quadrato' }]
                      : []),
                  ]}
                />
              </div>
              <div className="risultati-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Dimensione</th>
                      <th>Tutte</th>
                      {gruppoScelto && <th>{gruppoScelto.valore}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSIONI.map((d) => (
                      <tr key={d.id}>
                        <td>{d.titolo}</td>
                        <td>{pct(mediaTutte?.[d.id])}</td>
                        {gruppoScelto && <td>{pct(gruppoScelto.medie?.[d.id])}</td>}
                      </tr>
                    ))}
                    <tr className="risultati-riga-totale">
                      <td>Complessivo</td>
                      <td>{pct(mediaTutte?.totale)}</td>
                      {gruppoScelto && <td>{pct(gruppoScelto.medie?.totale)}</td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <div className="risultati-gruppi">
            {[
              ['Per settore', conteggiSettore, perSettore],
              ['Per dimensione aziendale', conteggiDimensione, perDimensione],
            ].map(([titolo, conteggi, gruppi]) => (
              <section key={titolo} className="card">
                <h2>{titolo}</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Gruppo</th>
                      <th>Risposte</th>
                      <th>Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conteggi.map((c) => (
                      <tr key={c.valore}>
                        <td>{c.valore}</td>
                        <td>{c.n}</td>
                        <td>{pct(gruppi.find((g) => g.valore === c.valore)?.medie?.totale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          <section className="card">
            <h2>Partecipanti ({visibili.length})</h2>
            <div className="risultati-selezione">
              <span className="status-muted">
                Seleziona le risposte di prova da eliminare. Selezionate: {daEliminare.length}
              </span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={daEliminare.length === 0 || eliminazione?.inCorso}
                onClick={eliminaSelezionate}
              >
                {eliminazione?.inCorso ? 'Eliminazione...' : `Elimina selezionate (${daEliminare.length})`}
              </button>
              {eliminazione?.errore && <span className="status-error">{eliminazione.errore}</span>}
            </div>
            <div className="risultati-scroll">
              <table className="table risultati-partecipanti">
                <thead>
                  <tr>
                    <th className="risultati-spunta">
                      <input
                        type="checkbox"
                        aria-label="Seleziona tutte le risposte visibili"
                        checked={tutteSelezionate}
                        onChange={selezionaTutte}
                      />
                    </th>
                    <th>Data</th>
                    <th>Nome</th>
                    <th>Azienda</th>
                    <th>Settore</th>
                    <th>Totale</th>
                    <th>Livello</th>
                    <th>Contatto</th>
                  </tr>
                </thead>
                <tbody>
                  {visibili.map((r) => {
                    const espanso = aperto === r.id
                    const gruppo = perSettore.find((g) => g.valore === r.anagrafica?.settore)
                    const confronto = gruppo?.medie && gruppo.n > 1 ? gruppo : null
                    return (
                      <Fragment key={r.id}>
                        <tr
                          className={`risultati-riga${espanso ? ' aperta' : ''}`}
                          onClick={() => setAperto(espanso ? null : r.id)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setAperto(espanso ? null : r.id)
                            }
                          }}
                          aria-expanded={espanso}
                        >
                          <td className="risultati-spunta" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Seleziona ${r.anagrafica?.nome ?? 'risposta'}`}
                              checked={selezionati.has(r.id)}
                              onChange={() => commuta(r.id)}
                            />
                          </td>
                          <td>{formattaData(r.creato_at)}</td>
                          <td>{r.anagrafica?.nome}</td>
                          <td>{r.anagrafica?.azienda}</td>
                          <td>{r.anagrafica?.settore}</td>
                          <td>{r.valida ? pct(r.punteggi.totale) : '–'}</td>
                          <td>{r.valida ? livello(r.punteggi.totale).nome : 'incompleta'}</td>
                          <td>{r.consenso?.contatto_bpr ? 'sì' : 'no'}</td>
                        </tr>
                        {espanso && (
                          <tr className="risultati-riga-dettaglio">
                            <td colSpan={8}>
                              <DettaglioPartecipante
                                risposta={r}
                                mediaConfronto={confronto ? confronto.medie : mediaTutte}
                                nomeConfronto={confronto ? `Media ${confronto.valore}` : 'Media tutte'}
                                onApriReport={() => onApriReport(r.id)}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {visibili.length === 0 && <p className="status-muted">Nessun partecipante corrisponde.</p>}
          </section>
        </>
      )}
    </>
  )
}

function SurveyRisultati() {
  const [utente, setUtente] = useState(undefined) // undefined = verifica in corso
  const [accesso, setAccesso] = useState({ inCorso: false, errore: null })
  const [documenti, setDocumenti] = useState(null)
  const [erroreLettura, setErroreLettura] = useState(null)
  const [reportId, setReportId] = useState(null)
  const [scrollLista, setScrollLista] = useState(0)
  const risposte = useMemo(() => (documenti ? preparaRisposte(documenti) : []), [documenti])
  const rispostaReport = reportId ? risposte.find((r) => r.id === reportId) : null

  function apriReport(id) {
    setScrollLista(window.scrollY)
    setReportId(id)
  }

  function chiudiReport() {
    setReportId(null)
    requestAnimationFrame(() => window.scrollTo(0, scrollLista))
  }

  async function entra(chiave) {
    setAccesso({ inCorso: true, errore: null })
    try {
      await accedi(chiave)
      setAccesso({ inCorso: false, errore: null })
    } catch (err) {
      setAccesso({ inCorso: false, errore: messaggioAccesso(err) })
    }
  }

  useEffect(() => osservaAccesso(setUtente), [])

  // Chiave nel link (#chiave=...): la si usa per accedere e la si toglie subito dall'indirizzo.
  // Si ascolta anche hashchange: incollando il link in una scheda già aperta sulla pagina il
  // browser non la ricarica.
  useEffect(() => {
    function leggiChiave() {
      const chiave = new URLSearchParams(window.location.hash.slice(1)).get('chiave')
      if (!chiave) return
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      entra(chiave)
    }
    leggiChiave()
    window.addEventListener('hashchange', leggiChiave)
    return () => window.removeEventListener('hashchange', leggiChiave)
  }, [])

  useEffect(() => {
    if (!utente) return undefined
    setErroreLettura(null)
    return osservaRisposte(
      (dati) => setDocumenti(dati),
      (err) => setErroreLettura(messaggioLettura(err))
    )
  }, [utente])

  let corpo
  if (utente === undefined || (accesso.inCorso && !utente)) {
    corpo = <p className="status-muted">Verifica accesso...</p>
  } else if (!utente) {
    corpo = <Accesso onAccedi={entra} errore={accesso.errore} inCorso={accesso.inCorso} />
  } else if (erroreLettura) {
    corpo = <p className="status-error">{erroreLettura}</p>
  } else if (!documenti) {
    corpo = <p className="status-muted">Caricamento risposte...</p>
  } else {
    corpo = <Contenuto tutte={risposte} onApriReport={apriReport} />
  }

  return (
    <>
      {rispostaReport && (
        <ReportPersonale risposta={rispostaReport} risposte={risposte} onChiudi={chiudiReport} />
      )}
      {/* Nascosta ma montata mentre il report e' aperto: al ritorno ricerca e righe aperte restano. */}
      <div className="page" style={rispostaReport ? { display: 'none' } : undefined}>
        <Topbar right={<NavGioco corrente="/survey-risultati" />} />
        <div className="page-inner page-inner--wide">
          <div className="risultati-intestazione">
            <div>
              <h1>Risultati survey</h1>
              <p className="status-muted">Aggiornamento in tempo reale</p>
            </div>
            {utente && (
              <button
                className="btn btn-sm"
                onClick={() => {
                  setDocumenti(null)
                  esci()
                }}
              >
                Esci
              </button>
            )}
          </div>
          {corpo}
        </div>
      </div>
    </>
  )
}

export default SurveyRisultati
