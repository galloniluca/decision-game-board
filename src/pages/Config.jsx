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
      const scelteSnap = await getDocs(collection(db, 'scelte'))
      const batch = writeBatch(db)
      scelteSnap.forEach((d) => batch.delete(d.ref))
      await batch.commit()

      await setDoc(doc(db, 'sessione', 'corrente'), {
        round_attivo: 1,
        stato: 'chiuso',
        timer_avvio: null,
      })

      window.alert('Partita resettata.')
    } catch (err) {
      setErrore(err.message)
    }

    setResetInCorso(false)
  }

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento...</p>

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 900 }}>
      <p>
        <Link to="/">← Home</Link>
      </p>
      <h1>Config</h1>

      {errore && <p style={{ color: 'crimson' }}>❌ {errore}</p>}

      <h2>Timer</h2>
      <label>
        Durata round (minuti):{' '}
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={durataMinuti}
          onChange={(e) => setDurataMinuti(e.target.value)}
          style={{ width: 70 }}
        />
      </label>{' '}
      <button type="button" onClick={salvaDurata}>
        Salva
      </button>{' '}
      <span>{durataStato}</span>

      <h2>Matrice punteggi</h2>
      <table cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
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
                <tr key={chiave} style={{ borderBottom: '1px solid #ddd' }}>
                  <td>{round}</td>
                  <td>{opzione}</td>
                  <td>
                    <input
                      type="text"
                      value={riga.nome ?? ''}
                      onChange={(e) => aggiornaCampoOpzione(round, opzione, 'nome', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  {['shift_q', 'shift_s', 'shift_c', 'shift_p'].map((campo) => (
                    <td key={campo}>
                      <select
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
                  <td>
                    <button type="button" onClick={() => salvaOpzione(round, opzione)}>
                      Salva
                    </button>{' '}
                    <span>{statoRiga[chiave]}</span>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      <h2>Tavoli</h2>
      <table cellPadding="6" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <th>ID</th>
            <th>Nome</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tavoli.map((tavolo) => {
            const chiave = `tavolo-${tavolo.id}`
            return (
              <tr key={tavolo.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{tavolo.id}</td>
                <td>
                  <input
                    type="text"
                    value={tavolo.nome}
                    onChange={(e) => aggiornaNomeTavolo(tavolo.id, e.target.value)}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => salvaTavolo(tavolo.id)}>
                    Salva
                  </button>{' '}
                  <button type="button" onClick={() => rimuoviTavolo(tavolo.id)}>
                    Rimuovi
                  </button>{' '}
                  <span>{statoRiga[chiave]}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button type="button" onClick={aggiungiTavolo}>
        Aggiungi tavolo
      </button>

      <h2>QR tavoli</h2>
      <p>Un QR per tavolo, da stampare prima dell'evento (usa la stampa del browser, Ctrl/Cmd+P).</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {tavoli.map((tavolo) => (
          <div key={tavolo.id} style={{ textAlign: 'center' }}>
            {qrPerTavolo[tavolo.id] && (
              <img src={qrPerTavolo[tavolo.id]} alt={`QR ${tavolo.nome}`} width={150} height={150} />
            )}
            <p>{tavolo.nome}</p>
          </div>
        ))}
      </div>

      <h2>Reset partita</h2>
      <p>Cancella tutte le scelte inviate e riporta la sessione al Round 1 (chiuso).</p>
      <button type="button" onClick={resetPartita} disabled={resetInCorso}>
        {resetInCorso ? 'Reset in corso...' : 'Reset partita'}
      </button>
    </div>
  )
}

export default Config
