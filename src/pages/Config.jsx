import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import QRCode from 'qrcode'
import { db } from '../lib/firebaseClient'
import { LETTERE, ROUNDS, SHIFT_VALORI, idOpzione, idScelta } from '../lib/costanti'
import { DURATA_ROUND_MINUTI_DEFAULT } from '../lib/tempo'
import { MATRICE_UFFICIALE } from '../lib/matriceUfficiale'
import { eseguiResetPartita } from '../lib/resetPartita'
import Topbar from '../components/Topbar'

function Config() {
  const [opzioni, setOpzioni] = useState({})
  const [tavoli, setTavoli] = useState([])
  const [statoRiga, setStatoRiga] = useState({})
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(true)
  const [resetInCorso, setResetInCorso] = useState(false)
  const [qrPerTavolo, setQrPerTavolo] = useState({})
  const [durataMinuti, setDurataMinuti] = useState(DURATA_ROUND_MINUTI_DEFAULT)
  const [durataStato, setDurataStato] = useState(null)

  useEffect(() => {
    caricaDati()
  }, [])

  useEffect(() => {
    async function generaQr() {
      const mappa = {}
      for (const tavolo of tavoli) {
        const url = `${window.location.origin}/tavolo/${tavolo.id}`
        mappa[tavolo.id] = await QRCode.toDataURL(url, { width: 220, margin: 1 })
      }
      setQrPerTavolo(mappa)
    }
    if (tavoli.length > 0) generaQr()
  }, [tavoli])

  async function caricaDati() {
    setCaricamento(true)
    setErrore(null)

    try {
      const [opzioniSnap, tavoliSnap, sessioneSnap] = await Promise.all([
        getDocs(collection(db, 'opzioni')),
        getDocs(collection(db, 'tavoli')),
        getDoc(doc(db, 'sessione', 'corrente')),
      ])

      const mappaOpzioni = {}
      opzioniSnap.forEach((d) => {
        mappaOpzioni[d.id] = d.data()
      })
      setOpzioni(mappaOpzioni)

      const listaTavoli = tavoliSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.id) - Number(b.id))
      setTavoli(listaTavoli)

      setDurataMinuti(sessioneSnap.data()?.durata_round_minuti ?? DURATA_ROUND_MINUTI_DEFAULT)
    } catch (err) {
      setErrore(err.message)
    }

    setCaricamento(false)
  }

  function aggiornaCampoOpzione(round, opzione, campo, valore) {
    const chiave = idOpzione(round, opzione)
    setOpzioni((prev) => ({
      ...prev,
      [chiave]: { ...prev[chiave], [campo]: valore },
    }))
  }

  async function salvaOpzione(round, opzione) {
    const chiave = idOpzione(round, opzione)
    const riga = opzioni[chiave]
    setStatoRiga((prev) => ({ ...prev, [chiave]: 'salvataggio' }))

    try {
      await updateDoc(doc(db, 'opzioni', chiave), {
        nome: riga.nome,
        shift_q: riga.shift_q,
        shift_s: riga.shift_s,
        shift_c: riga.shift_c,
        shift_p: riga.shift_p,
      })
      setStatoRiga((prev) => ({ ...prev, [chiave]: 'salvato' }))
    } catch (err) {
      setStatoRiga((prev) => ({ ...prev, [chiave]: `errore: ${err.message}` }))
    }
  }

  function aggiornaNomeTavolo(id, nome) {
    setTavoli((prev) => prev.map((t) => (t.id === id ? { ...t, nome } : t)))
  }

  async function salvaTavolo(id) {
    const tavolo = tavoli.find((t) => t.id === id)
    const chiave = `tavolo-${id}`
    setStatoRiga((prev) => ({ ...prev, [chiave]: 'salvataggio' }))

    try {
      await updateDoc(doc(db, 'tavoli', id), { nome: tavolo.nome })
      setStatoRiga((prev) => ({ ...prev, [chiave]: 'salvato' }))
    } catch (err) {
      setStatoRiga((prev) => ({ ...prev, [chiave]: `errore: ${err.message}` }))
    }
  }

  async function caricaMatriceUfficiale() {
    const confermato = window.confirm(
      'Sovrascrivere la matrice punteggi attuale con i valori ufficiali (V1.7)? Potrai comunque modificarla riga per riga dopo.'
    )
    if (!confermato) return

    setErrore(null)
    try {
      const batch = writeBatch(db)
      for (const round of ROUNDS) {
        for (const opzione of LETTERE) {
          batch.update(doc(db, 'opzioni', idOpzione(round, opzione)), MATRICE_UFFICIALE[round][opzione])
        }
      }
      await batch.commit()
      await caricaDati()
    } catch (err) {
      setErrore(err.message)
    }
  }

  async function salvaDurata() {
    setDurataStato('salvataggio')
    try {
      await updateDoc(doc(db, 'sessione', 'corrente'), { durata_round_minuti: Number(durataMinuti) })
      setDurataStato('salvato')
    } catch (err) {
      setDurataStato(`errore: ${err.message}`)
    }
  }

  async function aggiungiTavolo() {
    setErrore(null)
    const idsEsistenti = tavoli.map((t) => Number(t.id))
    const nuovoId = String((idsEsistenti.length > 0 ? Math.max(...idsEsistenti) : 0) + 1)

    try {
      await setDoc(doc(db, 'tavoli', nuovoId), { nome: `Tavolo ${nuovoId}` })
      await caricaDati()
    } catch (err) {
      setErrore(err.message)
    }
  }

  async function rimuoviTavolo(id) {
    const confermato = window.confirm(
      `Rimuovere il tavolo "${id}"? Verranno cancellate anche le sue scelte inviate.`
    )
    if (!confermato) return

    setErrore(null)
    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, 'tavoli', id))
      for (const round of ROUNDS) {
        batch.delete(doc(db, 'scelte', idScelta(id, round)))
      }
      await batch.commit()
      await caricaDati()
    } catch (err) {
      setErrore(err.message)
    }
  }

  async function resetPartita() {
    const confermato = window.confirm(
      'Reset partita: verranno cancellate tutte le scelte inviate e la sessione tornerà al Round 1 (chiuso). Continuare?'
    )
    if (!confermato) return

    setResetInCorso(true)
    setErrore(null)

    try {
      await eseguiResetPartita()
      window.alert('Partita resettata.')
    } catch (err) {
      setErrore(err.message)
    }

    setResetInCorso(false)
  }

  if (caricamento) {
    return (
      <div className="page">
        <Topbar />
        <div className="page-inner page-inner--wide">
          <p className="status-muted">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Topbar
        right={
          <span className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/regia">Regia</Link>
          </span>
        }
      />
      <div className="page-inner page-inner--wide">
        <h1>Config</h1>

        {errore && <p className="status-error">❌ {errore}</p>}

        <div className="card">
          <h3>Timer</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
            <label htmlFor="durata-round">Durata round (minuti)</label>
            <input
              id="durata-round"
              type="number"
              min="0.5"
              step="0.5"
              className="input"
              value={durataMinuti}
              onChange={(e) => setDurataMinuti(e.target.value)}
              style={{ width: 70 }}
            />
            <button type="button" className="btn btn-primary" onClick={salvaDurata}>
              Salva
            </button>
            <span className="status-muted">{durataStato}</span>
          </div>
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h3 style={{ margin: 0 }}>Matrice punteggi</h3>
            <button type="button" className="btn btn-sm" onClick={caricaMatriceUfficiale}>
              Carica matrice ufficiale (V1.7)
            </button>
          </div>
          <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Opz.</th>
                  <th>Nome opzione</th>
                  <th>Q</th>
                  <th>S</th>
                  <th>C</th>
                  <th>P</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ROUNDS.map((round) =>
                  LETTERE.map((opzione) => {
                    const chiave = idOpzione(round, opzione)
                    const riga = opzioni[chiave]
                    if (!riga) return null
                    return (
                      <tr key={chiave}>
                        <td>{round}</td>
                        <td>{opzione}</td>
                        <td>
                          <input
                            type="text"
                            className="input"
                            value={riga.nome ?? ''}
                            onChange={(e) =>
                              aggiornaCampoOpzione(round, opzione, 'nome', e.target.value)
                            }
                            style={{ width: '100%' }}
                          />
                        </td>
                        {['shift_q', 'shift_s', 'shift_c', 'shift_p'].map((campo) => (
                          <td key={campo}>
                            <select
                              className="input"
                              value={riga[campo]}
                              onChange={(e) =>
                                aggiornaCampoOpzione(round, opzione, campo, Number(e.target.value))
                              }
                            >
                              {SHIFT_VALORI.map((v) => (
                                <option key={v} value={v}>
                                  {v > 0 ? `+${v}` : v}
                                </option>
                              ))}
                            </select>
                          </td>
                        ))}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button type="button" className="btn btn-sm" onClick={() => salvaOpzione(round, opzione)}>
                            Salva
                          </button>{' '}
                          <span className="status-muted">{statoRiga[chiave]}</span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Tavoli</h3>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tavoli.map((tavolo) => {
                const chiave = `tavolo-${tavolo.id}`
                return (
                  <tr key={tavolo.id}>
                    <td>{tavolo.id}</td>
                    <td>
                      <input
                        type="text"
                        className="input"
                        value={tavolo.nome}
                        onChange={(e) => aggiornaNomeTavolo(tavolo.id, e.target.value)}
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-sm" onClick={() => salvaTavolo(tavolo.id)}>
                        Salva
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => rimuoviTavolo(tavolo.id)}
                      >
                        Rimuovi
                      </button>{' '}
                      <span className="status-muted">{statoRiga[chiave]}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <button type="button" className="btn" style={{ marginTop: '0.75rem' }} onClick={aggiungiTavolo}>
            + Aggiungi tavolo
          </button>
        </div>

        <div className="card">
          <h3>QR tavoli</h3>
          <p className="status-muted">
            Un QR per tavolo, da stampare prima dell'evento (usa la stampa del browser, Ctrl/Cmd+P).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.5rem' }}>
            {tavoli.map((tavolo) => (
              <div key={tavolo.id} style={{ textAlign: 'center' }}>
                {qrPerTavolo[tavolo.id] && (
                  <img
                    src={qrPerTavolo[tavolo.id]}
                    alt={`QR ${tavolo.nome}`}
                    width={150}
                    height={150}
                    style={{ borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                )}
                <p style={{ marginTop: '0.4rem', fontWeight: 600 }}>{tavolo.nome}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Reset partita</h3>
          <p className="status-muted">Cancella tutte le scelte inviate e riporta la sessione al Round 1 (chiuso).</p>
          <button type="button" className="btn btn-danger" onClick={resetPartita} disabled={resetInCorso}>
            {resetInCorso ? 'Reset in corso...' : 'Reset partita'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Config
